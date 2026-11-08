/**
 * Save do jogo: JSON versionado, comprimido com gzip (CompressionStream, que
 * existe no navegador e no Node) e gravado alternando dois slots, para que uma
 * gravação interrompida nunca estrague o último save bom.
 */
import type { EstadoJogo } from "@prancheta/engine";

/** Versão atual do formato. Toda mudança no EstadoJogo que quebre saves antigos sobe este número. */
export const VERSAO_DO_SAVE = 1;

export interface Save {
  versao: number;
  /** Momento da gravação (ms desde 1970), para escolher o slot mais novo. */
  salvoEm: number;
  /** Resumo para a tela de continuar. */
  resumo: { tecnico: string; clube: string | null; temporada: number; rodada: number };
  dados: Uint8Array;
}

type Migracao = (dados: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migrações por versão: `MIGRACOES[n]` leva um save da versão n para n + 1.
 * Ainda não há nenhuma (estamos na versão 1).
 */
const MIGRACOES: Record<number, Migracao> = {};

async function transformar(
  bytes: Uint8Array,
  fluxo: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const saida = new Blob([bytes]).stream().pipeThrough(fluxo);
  return new Uint8Array(await new Response(saida).arrayBuffer());
}

export async function comprimir(texto: string): Promise<Uint8Array> {
  return transformar(new TextEncoder().encode(texto), new CompressionStream("gzip"));
}

export async function descomprimir(bytes: Uint8Array): Promise<string> {
  return new TextDecoder().decode(await transformar(bytes, new DecompressionStream("gzip")));
}

export async function criarSave(estado: EstadoJogo, agora = Date.now()): Promise<Save> {
  const clubeId = estado.carreira.clubeId;
  const clube = clubeId ? (estado.temporada.clubes[clubeId]?.nome ?? null) : null;
  return {
    versao: VERSAO_DO_SAVE,
    salvoEm: agora,
    resumo: {
      tecnico: estado.carreira.tecnico,
      clube,
      temporada: estado.temporada.temporada,
      rodada: estado.temporada.rodada,
    },
    dados: await comprimir(JSON.stringify(estado)),
  };
}

/** Abre um save, aplicando as migrações até a versão atual. */
export async function abrirSave(save: Save): Promise<EstadoJogo> {
  if (save.versao > VERSAO_DO_SAVE) {
    throw new Error(`Este save é de uma versão mais nova do jogo (${save.versao}). Atualize o jogo.`);
  }
  let dados = JSON.parse(await descomprimir(save.dados)) as Record<string, unknown>;
  for (let v = save.versao; v < VERSAO_DO_SAVE; v++) {
    const migrar = MIGRACOES[v];
    if (!migrar) throw new Error(`Falta a migração do save da versão ${v} para ${v + 1}`);
    dados = migrar(dados);
  }
  return dados as unknown as EstadoJogo;
}

/** Os dois slots alternam: o próximo save sobrescreve o mais antigo. */
export type Slot = "A" | "B";

export interface Armazenamento {
  ler(slot: Slot): Promise<Save | undefined>;
  gravar(slot: Slot, save: Save): Promise<void>;
  apagar(slot: Slot): Promise<void>;
}

export async function saveMaisRecente(arm: Armazenamento): Promise<{ slot: Slot; save: Save } | null> {
  const [a, b] = await Promise.all([arm.ler("A"), arm.ler("B")]);
  if (!a && !b) return null;
  if (a && (!b || a.salvoEm >= b.salvoEm)) return { slot: "A", save: a };
  return { slot: "B", save: b! };
}

/** Grava no slot que não tem o save mais recente. */
export async function salvar(arm: Armazenamento, estado: EstadoJogo, agora = Date.now()): Promise<Slot> {
  const atual = await saveMaisRecente(arm);
  const slot: Slot = atual?.slot === "A" ? "B" : "A";
  await arm.gravar(slot, await criarSave(estado, agora));
  return slot;
}

/** Carrega o save mais recente que abrir sem erro (se o mais novo estiver corrompido, usa o outro). */
export async function carregar(arm: Armazenamento): Promise<EstadoJogo | null> {
  const [a, b] = await Promise.all([arm.ler("A"), arm.ler("B")]);
  const ordem = [a, b].filter((s): s is Save => !!s).sort((x, y) => y.salvoEm - x.salvoEm);
  for (const s of ordem) {
    try {
      return await abrirSave(s);
    } catch {
      // segue para o slot anterior
    }
  }
  return null;
}

export async function apagarTudo(arm: Armazenamento): Promise<void> {
  await Promise.all([arm.apagar("A"), arm.apagar("B")]);
}

/** Armazenamento em memória (testes, ou quando o navegador bloqueia o IndexedDB). */
export function armazenamentoEmMemoria(): Armazenamento {
  const slots = new Map<Slot, Save>();
  return {
    async ler(slot) {
      return slots.get(slot);
    },
    async gravar(slot, save) {
      slots.set(slot, save);
    },
    async apagar(slot) {
      slots.delete(slot);
    },
  };
}
