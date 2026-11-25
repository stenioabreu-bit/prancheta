import { publicarNoticia } from "../carreira/efeitos";
/**
 * Motor de eventos do atleta: eventos declarativos (conteudo/atleta.ts) com gatilho, texto e opções.
 * Cada opção aplica efeitos imediatos e agenda consequências (evento + prazo + chance) que disparam
 * semanas ou temporadas depois. Cadeias = eventos que exigem marcas deixadas por eventos anteriores.
 * Todo sorteio usa o RNG do save, então a carreira é reproduzível.
 */
import type { EstadoJogo } from "../carreira/jogo";
import { formatarDinheiro } from "../mercado/valores";
import { type Rng, inteiroEntre, limitar, sortearComPeso } from "../rng";
import type { Clube, Jogador } from "../tipos";
import type { CampoVida, CategoriaEvento, DilemaAtleta, EstadoAtleta, Relacionamento } from "./tipos";

export interface ContextoAtleta {
  estado: EstadoJogo;
  a: EstadoAtleta;
  j: Jogador;
  clube: Clube;
  rng: Rng;
}

export type AcaoEspecial =
  | "aceitarProposta"
  | "pedirMais"
  | "renovar"
  | "pedirAumento"
  | "recusarRenovacao"
  | "assinarLivre"
  | "convocacao"
  | "aposentar"
  | "adiarAposentadoria"
  | "reconciliar";

export interface EfeitoAtleta {
  vida?: Partial<Record<CampoVida, number>>;
  /** Meses de salário (negativo = gasto). */
  meses?: number;
  /** Dinheiro direto (€ mi). */
  dinheiro?: number;
  /** Fração do patrimônio (ex.: -0.4 no divórcio). */
  patrimonio?: number;
  /** Marca com duração em semanas (ausente = a carreira toda). */
  marcar?: Record<string, number | null>;
  desmarcar?: string[];
  agendar?: { evento: string; em: [number, number]; chance: number }[];
  relacionamento?: Relacionamento;
  filho?: boolean;
  /** Gasto fixo em fração do salário semanal, por `semanas` (ausente = para sempre). */
  gastoFixo?: { motivo: string; fracao: number; semanas?: number };
  lesao?: number;
  treino?: number;
  acao?: AcaoEspecial;
  /** Opção (0, 1, 2) para ações que escolhem entre clubes. */
  indice?: number;
  noticia?: { texto: string; tipo: "bom" | "ruim" | "info" };
}

export interface DefOpcao {
  texto: string;
  dica?: string;
  efeito: EfeitoAtleta;
  resultado: string;
  /** Escolha que o jogo faz sozinho nos ritmos rápidos. */
  auto?: boolean;
  /** Opção arriscada: com chance `p` vale o efeito; senão, `senao`. */
  sorte?: { p: number | ((c: ContextoAtleta) => number); senao: { efeito: EfeitoAtleta; resultado: string } };
  /** Some quando a condição não vale. */
  so?: (c: ContextoAtleta) => boolean;
}

export interface CondicaoEvento {
  marcas?: string[];
  semMarcas?: string[];
  min?: Partial<Record<CampoVida, number>>;
  max?: Partial<Record<CampoVida, number>>;
  relacionamento?: Relacionamento[];
  idade?: [number, number];
  ovrMin?: number;
  filhos?: boolean;
  /** Patrimônio mínimo em meses de salário. */
  mesesMin?: number;
  teste?: (c: ContextoAtleta) => boolean;
}

export interface DefEvento {
  id: string;
  categoria: CategoriaEvento;
  titulo: string;
  texto: string;
  /** Peso no sorteio semanal (0 ou ausente com `agendado` = só dispara como consequência). */
  peso?: number;
  agendado?: boolean;
  capital?: boolean;
  /** Semanas mínimas entre duas aparições. */
  intervalo?: number;
  unico?: boolean;
  requer?: CondicaoEvento;
  /** Preenche dados do texto ({chave}); `null` cancela o evento. */
  montar?: (c: ContextoAtleta) => Record<string, string | number> | null;
  opcoes: DefOpcao[];
}

const PARA_SEMPRE = 1e9;

export function marcaAtiva(a: EstadoAtleta, marca: string): boolean {
  return (a.marcas[marca] ?? -1) >= a.semana;
}

export function clubeDoAtleta(estado: EstadoJogo): Clube {
  const a = estado.atleta!;
  const clube = estado.temporada.clubes[a.contrato.clubeId];
  if (clube?.jogadores.some((j) => j.id === a.jogadorId)) return clube;
  for (const c of Object.values(estado.temporada.clubes)) {
    if (c.jogadores.some((j) => j.id === a.jogadorId)) {
      a.contrato.clubeId = c.id;
      return c;
    }
  }
  throw new Error("O atleta não está em nenhum clube");
}

export function jogadorDoAtleta(estado: EstadoJogo): Jogador {
  const a = estado.atleta!;
  return clubeDoAtleta(estado).jogadores.find((j) => j.id === a.jogadorId)!;
}

export function salarioSemanal(a: EstadoAtleta): number {
  return a.contrato.salario / 52;
}

export function mexerVida(a: EstadoAtleta, campo: CampoVida, delta: number): void {
  a.vida[campo] = limitar(Math.round((a.vida[campo] + delta) * 10) / 10, 0, 100);
}

export function noFeed(a: EstadoAtleta, texto: string, tipo: "bom" | "ruim" | "info" = "info"): void {
  a.feed.unshift({ semana: a.semana, texto, tipo });
  if (a.feed.length > 120) a.feed.pop();
}

function vale(c: ContextoAtleta, r: CondicaoEvento | undefined): boolean {
  if (!r) return true;
  const { a, j } = c;
  if (r.marcas?.some((m) => !marcaAtiva(a, m))) return false;
  if (r.semMarcas?.some((m) => marcaAtiva(a, m))) return false;
  for (const [k, v] of Object.entries(r.min ?? {})) if (a.vida[k as CampoVida] < v!) return false;
  for (const [k, v] of Object.entries(r.max ?? {})) if (a.vida[k as CampoVida] > v!) return false;
  if (r.relacionamento && !r.relacionamento.includes(a.relacionamento)) return false;
  if (r.idade && (a.idade < r.idade[0] || a.idade > r.idade[1])) return false;
  if (r.ovrMin !== undefined && j.ovr < r.ovrMin) return false;
  if (r.filhos !== undefined && r.filhos !== a.filhos > 0) return false;
  if (r.mesesMin !== undefined && a.dinheiro < (a.contrato.salario / 12) * r.mesesMin) return false;
  if (r.teste && !r.teste(c)) return false;
  return true;
}

function preencher(texto: string, dados: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => String(dados[k] ?? `{${k}}`));
}

function dadosBase(c: ContextoAtleta): Record<string, string | number> {
  const tecnico = c.estado.mercado.tecnicos[c.clube.id] ?? "o técnico";
  return {
    nome: c.a.nome.split(" ")[0]!,
    clube: c.clube.nome,
    tecnico,
    mesada: formatarDinheiro((c.a.contrato.salario / 12) * 2),
  };
}

let EVENTOS: Record<string, DefEvento> = {};

/** Registra o conteúdo (chamado pelo conteudo/atleta.ts). */
export function registrarEventos(lista: readonly DefEvento[]): void {
  EVENTOS = {};
  for (const e of lista) {
    if (EVENTOS[e.id]) throw new Error(`Evento repetido: ${e.id}`);
    EVENTOS[e.id] = e;
  }
}

export function eventoAtleta(id: string): DefEvento | undefined {
  return EVENTOS[id];
}

export function todosOsEventos(): DefEvento[] {
  return Object.values(EVENTOS);
}

/** Cria o dilema do evento (ou nada, se não couber agora). */
export function criarDilema(c: ContextoAtleta, def: DefEvento): DilemaAtleta | null {
  if (!vale(c, def.requer)) return null;
  const extra = def.montar ? def.montar(c) : {};
  if (extra === null) return null;
  const dados = { ...dadosBase(c), ...extra };
  const opcoes = def.opcoes.filter((o) => !o.so || o.so(c));
  if (!opcoes.length) return null;
  const a = c.a;
  return {
    id: `d${a.proximoId++}`,
    evento: def.id,
    semana: a.semana,
    titulo: preencher(def.titulo, dados),
    texto: preencher(def.texto, dados),
    categoria: def.categoria,
    capital: !!def.capital,
    opcoes: opcoes.map((o) => ({
      texto: preencher(o.texto, dados),
      ...(o.dica ? { dica: preencher(o.dica, dados) } : {}),
    })),
    dados,
  };
}

/**
 * Eventos da semana: primeiro as consequências agendadas que venceram (cada uma rola a sua chance);
 * depois, com ~55% de chance, um evento comum sorteado por peso entre os que valem agora.
 */
export function sortearEventosDaSemana(c: ContextoAtleta, maximo = 2): DilemaAtleta[] {
  const { a, rng } = c;
  const novos: DilemaAtleta[] = [];
  const restantes = [];
  for (const ag of a.agendadas) {
    if (ag.semana > a.semana) {
      restantes.push(ag);
      continue;
    }
    if (novos.length >= maximo) {
      restantes.push({ ...ag, semana: a.semana + 1 });
      continue;
    }
    if (rng.proximo() >= ag.chance) continue;
    const def = EVENTOS[ag.evento];
    if (!def || a.dilemas.some((d) => d.evento === def.id)) continue;
    const d = criarDilema(c, def);
    if (d) {
      novos.push(d);
      a.ultimaVez[def.id] = a.semana;
    }
  }
  a.agendadas = restantes;
  if (novos.length < maximo && rng.proximo() < 0.55) {
    const candidatos = Object.values(EVENTOS).filter(
      (e) =>
        !e.agendado &&
        (e.peso ?? 0) > 0 &&
        !(e.unico && a.ultimaVez[e.id] !== undefined) &&
        a.semana - (a.ultimaVez[e.id] ?? -PARA_SEMPRE) >= (e.intervalo ?? 10) &&
        !a.dilemas.some((d) => d.evento === e.id) &&
        !novos.some((d) => d.evento === e.id) &&
        vale(c, e.requer),
    );
    if (candidatos.length) {
      const def = sortearComPeso(rng, candidatos, (e) => e.peso ?? 0);
      const d = criarDilema(c, def);
      if (d) {
        novos.push(d);
        a.ultimaVez[def.id] = a.semana;
      }
    }
  }
  return novos;
}

/** Opção que o jogo escolhe sozinho: a marcada como `auto`, senão a primeira. */
export function escolhaAutomatica(dilema: DilemaAtleta, c: ContextoAtleta): number {
  const def = EVENTOS[dilema.evento];
  if (!def) return 0;
  const opcoes = def.opcoes.filter((o) => !o.so || o.so(c));
  const i = opcoes.findIndex((o) => o.auto);
  return i >= 0 ? i : 0;
}

export type ExecutarAcao = (c: ContextoAtleta, ef: EfeitoAtleta, dilema: DilemaAtleta) => string | null;

/** Aplica um efeito: vida, dinheiro, marcas, consequências agendadas, família, lesão e treino. */
export function aplicarEfeito(c: ContextoAtleta, ef: EfeitoAtleta): void {
  const { a, j, rng } = c;
  for (const [k, v] of Object.entries(ef.vida ?? {})) mexerVida(a, k as CampoVida, v!);
  if (ef.meses) a.dinheiro += (a.contrato.salario / 12) * ef.meses;
  if (ef.dinheiro) a.dinheiro += ef.dinheiro;
  if (ef.patrimonio && a.dinheiro > 0) a.dinheiro += a.dinheiro * ef.patrimonio;
  for (const [m, dur] of Object.entries(ef.marcar ?? {})) {
    a.marcas[m] = dur === null ? PARA_SEMPRE : a.semana + dur;
  }
  for (const m of ef.desmarcar ?? []) delete a.marcas[m];
  for (const ag of ef.agendar ?? []) {
    a.agendadas.push({
      evento: ag.evento,
      semana: a.semana + inteiroEntre(rng, ag.em[0], ag.em[1]),
      chance: ag.chance,
      origem: "",
    });
  }
  if (ef.relacionamento) a.relacionamento = ef.relacionamento;
  if (ef.filho) a.filhos++;
  if (ef.gastoFixo) {
    a.gastosFixos.push({
      motivo: ef.gastoFixo.motivo,
      porSemana: salarioSemanal(a) * ef.gastoFixo.fracao,
      ...(ef.gastoFixo.semanas ? { ate: a.semana + ef.gastoFixo.semanas } : {}),
    });
  }
  if (ef.lesao) {
    j.lesao = Math.max(j.lesao, ef.lesao);
    j.recemLesionado = true;
  }
  if (ef.treino) a.treinoAcumulado = Math.max(0, a.treinoAcumulado + ef.treino);
  if (ef.noticia) {
    publicarNoticia(
      c.estado.carreira,
      c.estado.temporada.rodada,
      "Imprensa",
      preencher(ef.noticia.texto, dadosBase(c)),
      ef.noticia.tipo,
    );
  }
}

/** Responde um dilema. Devolve o texto do resultado. */
export function resolverDilema(
  c: ContextoAtleta,
  dilemaId: string,
  opcao: number,
  executar: ExecutarAcao,
): string | null {
  const { a } = c;
  const dilema = a.dilemas.find((d) => d.id === dilemaId);
  const def = dilema ? EVENTOS[dilema.evento] : undefined;
  if (!dilema || !def) return null;
  const opcoes = def.opcoes.filter((o) => !o.so || o.so(c));
  const o = opcoes[opcao];
  if (!o) return null;
  let efeito = o.efeito;
  let resultado = o.resultado;
  if (o.sorte) {
    const p = typeof o.sorte.p === "number" ? o.sorte.p : o.sorte.p(c);
    if (c.rng.proximo() >= p) {
      efeito = o.sorte.senao.efeito;
      resultado = o.sorte.senao.resultado;
    }
  }
  a.dilemas = a.dilemas.filter((d) => d.id !== dilemaId);
  aplicarEfeito(c, efeito);
  const extra = efeito.acao ? executar(c, efeito, dilema) : null;
  const texto = preencher(extra ?? resultado, dilema.dados ?? {});
  a.escolhas.unshift({
    semana: a.semana,
    temporada: c.estado.temporada.temporada,
    titulo: dilema.titulo,
    escolha: dilema.opcoes[opcao]?.texto ?? o.texto,
    resultado: texto,
    capital: dilema.capital,
  });
  if (a.escolhas.length > 400) a.escolhas.pop();
  noFeed(a, `${dilema.titulo}: ${texto}`, efeitoBom(efeito) ? "bom" : efeitoRuim(efeito) ? "ruim" : "info");
  return texto;
}

function efeitoBom(ef: EfeitoAtleta): boolean {
  const v = ef.vida ?? {};
  return (v.moral ?? 0) + (v.reputacao ?? 0) + (v.tecnico ?? 0) + (v.familia ?? 0) - (v.vicios ?? 0) >= 8;
}
function efeitoRuim(ef: EfeitoAtleta): boolean {
  const v = ef.vida ?? {};
  return (v.moral ?? 0) + (v.reputacao ?? 0) + (v.tecnico ?? 0) + (v.familia ?? 0) - (v.vicios ?? 0) <= -8;
}
