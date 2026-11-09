import { type ClubeDados, criarClube } from "../clube";
import { estatisticasZeradas } from "../jogador";
import { recuperarEntreRodadas } from "../liga";
import { type Rng, criarRng } from "../rng";
import { estatisticasRapidas, placarRapido } from "../simulacaoRapida";
import type { Clube } from "../tipos";
import {
  DESCANSO_MINIMO,
  conflitosDeCalendario,
  dataDoJogo,
  diasEntre,
  horarioDaData,
  ultimaSemanaAgendada,
} from "./calendario";
import { type EstadoCopa, abrirFaseDaCopa, fecharRodadaDaCopa, montarCopa } from "./copa";
import { type ContextoCompeticao, faseDoEstado, fecharRodadaDaDivisao, iniciarDivisao } from "./divisao";
import { registrarNaLiga } from "./fases";
import { FORMATOS_2026 } from "./formatos2026";
import {
  DIVISOES,
  type Divisao,
  type EstadoDivisao,
  type FormatoDivisao,
  type IdCompeticao,
  type JogoAgendado,
} from "./tipos";

export const RODADAS_POR_TEMPORADA = 38;

export interface ResumoTemporada {
  temporada: number;
  campeoes: Record<Divisao, string> & { copa: string };
  acesso: Record<Divisao, string[]>;
  rebaixados: Record<Divisao, string[]>;
}

/**
 * Estado completo e serializável de um jogo salvo: clubes, competições e
 * calendário. O gerador aleatório é guardado como um número (`rng`), então
 * o mesmo save sempre continua do mesmo jeito.
 */
export interface EstadoTemporada {
  versao: 1;
  rng: number;
  temporada: number;
  /** Próxima rodada a ser jogada (0 a 37); 38 = temporada terminada. */
  rodada: number;
  clubes: Record<string, Clube>;
  jogos: Record<string, JogoAgendado>;
  divisoes: Record<Divisao, EstadoDivisao>;
  copa: EstadoCopa;
  /** Clubes com vaga direta na 3ª fase da próxima Copa do Brasil. */
  vagasDiretasCopa: string[];
  usuarioId: string | null;
  historico: ResumoTemporada[];
  /** Formatos próprios do pacote (ligas estrangeiras); ausente = Séries A–D de 2026. */
  formatos?: Partial<Record<Divisao, FormatoDivisao>>;
  /** Pacote sem Copa do Brasil. */
  semCopa?: boolean;
  /** Estaduais da temporada, por UF (competição "est-UF"). */
  estaduais?: Record<string, EstadoDivisao>;
  formatosEstaduais?: Record<string, FormatoDivisao>;
}

export interface OpcoesNovaTemporada {
  semente: number;
  temporada: number;
  divisoes: Record<Divisao, ClubeDados[]>;
  vagasDiretasCopa: string[];
  usuarioId?: string | null;
  formatos?: Partial<Record<Divisao, FormatoDivisao>>;
  semCopa?: boolean;
  /** Estaduais (formato com a tabela real) e clubes que só disputam estadual. */
  estaduais?: { uf: string; formato: FormatoDivisao; clubes: string[] }[];
  clubesExtras?: ClubeDados[];
}

const FORMATOS: Record<Divisao, FormatoDivisao> = FORMATOS_2026;

/** Formato da divisão nesta temporada; divisão que o pacote não usa vira vazia. */
export function formatoDe(estado: Pick<EstadoTemporada, "formatos">, d: Divisao): FormatoDivisao {
  if (!estado.formatos) return FORMATOS[d];
  return (
    estado.formatos[d] ?? {
      divisao: d,
      nome: `Divisão ${d}`,
      clubes: 0,
      fases: [],
      acesso: [],
      rebaixamento: [],
    }
  );
}

function divisaoVazia(d: Divisao): EstadoDivisao {
  return { divisao: d, clubes: [], fases: [], campeao: null, acesso: [], rebaixados: [], encerrada: true };
}

/** Roda `f` com o gerador do estado e guarda onde a sequência parou. */
function comRng<T>(estado: EstadoTemporada, f: (rng: Rng) => T): T {
  const rng = criarRng(estado.rng);
  const r = f(rng);
  estado.rng = rng.estado();
  return r;
}

function contexto(estado: EstadoTemporada, rng: Rng): ContextoCompeticao {
  return { jogos: estado.jogos, rng, forca: (id) => estado.clubes[id]?.forca ?? 50 };
}

const ORDEM_DIVISAO: Record<Divisao, number> = { A: 0, B: 1, C: 2, D: 3 };

export function divisaoDo(estado: EstadoTemporada, clubeId: string): Divisao | null {
  return DIVISOES.find((d) => estado.divisoes[d].clubes.includes(clubeId)) ?? null;
}

/** Ranking aproximado (no lugar do RNC da CBF): divisão, depois força. */
export function ranquear(estado: EstadoTemporada, ids: string[]): string[] {
  const nivel = (id: string) => ORDEM_DIVISAO[divisaoDo(estado, id) ?? "D"];
  return ids.slice().sort((a, b) => nivel(a) - nivel(b) || estado.clubes[b]!.forca - estado.clubes[a]!.forca);
}

function montarCompeticoes(estado: EstadoTemporada, ordem: Record<Divisao, string[]>, rng: Rng) {
  estado.jogos = {};
  const ctx = contexto(estado, rng);
  for (const d of DIVISOES) {
    const f = formatoDe(estado, d);
    estado.divisoes[d] = f.clubes === 0 ? divisaoVazia(d) : iniciarDivisao(f, ordem[d], ctx);
  }
  if (estado.formatosEstaduais) {
    estado.estaduais = {};
    for (const [uf, f] of Object.entries(estado.formatosEstaduais)) {
      const participantes = (f.fases[0]?.tipo === "liga" ? (f.fases[0].jogos ?? []) : []).flatMap((j) => [
        j.casa,
        j.fora,
      ]);
      const ids = [...new Set(participantes)].filter((id) => estado.clubes[id]);
      if (ids.length >= 2) estado.estaduais[uf] = iniciarDivisao(f, ids, ctx);
    }
  }
  if (estado.semCopa) {
    resolverConflitos(estado);
    return;
  }
  const ids = (d: Divisao) => estado.divisoes[d].clubes;
  estado.copa = montarCopa({
    serieA: ids("A"),
    vagasDiretas: estado.vagasDiretasCopa,
    demais: ranquear(estado, [...ids("B"), ...ids("C"), ...ids("D")]),
    usuarioId: estado.usuarioId,
  });
  abrirFaseDaCopa(estado.copa, 0, estado.jogos, rng, (x) => ranquear(estado, x));
  resolverConflitos(estado);
}

export function novaTemporada(opcoes: OpcoesNovaTemporada): EstadoTemporada {
  const rng = criarRng(opcoes.semente);
  const clubes: Record<string, Clube> = {};
  const ordem = {} as Record<Divisao, string[]>;
  for (const d of DIVISOES) {
    const lista = opcoes.divisoes[d] ?? [];
    const f = formatoDe(opcoes, d);
    if (lista.length !== f.clubes) {
      throw new Error(`${f.nome} precisa de ${f.clubes} clubes; o pacote tem ${lista.length}`);
    }
    ordem[d] = lista.map((c) => c.id);
    for (const c of lista) clubes[c.id] = criarClube(c, rng);
  }
  for (const c of opcoes.clubesExtras ?? []) clubes[c.id] ??= criarClube(c, rng);
  const estado: EstadoTemporada = {
    versao: 1,
    rng: 0,
    temporada: opcoes.temporada,
    rodada: 0,
    clubes,
    jogos: {},
    divisoes: {} as Record<Divisao, EstadoDivisao>,
    copa: { entram: {}, fases: [], campeao: null, vice: null },
    vagasDiretasCopa: opcoes.vagasDiretasCopa,
    usuarioId: opcoes.usuarioId ?? null,
    historico: [],
    ...(opcoes.formatos ? { formatos: opcoes.formatos } : {}),
    ...(opcoes.semCopa ? { semCopa: true } : {}),
    ...(opcoes.estaduais?.length
      ? { formatosEstaduais: Object.fromEntries(opcoes.estaduais.map((e) => [e.uf, e.formato])) }
      : {}),
  };
  montarCompeticoes(estado, ordem, rng);
  estado.rng = rng.estado();
  return estado;
}

/** Jogos da rodada: os de Copa (meio de semana) primeiro, depois os da liga. */
export function jogosDaRodada(estado: EstadoTemporada, rodada = estado.rodada): JogoAgendado[] {
  return Object.values(estado.jogos)
    .filter((j) => j.rodada === rodada)
    .sort((a, b) => dataDoJogo(a).localeCompare(dataDoJogo(b)));
}

export function proximoJogoDo(estado: EstadoTemporada, clubeId: string): JogoAgendado | null {
  return (
    jogosDaRodada(estado).find((j) => !j.placar && (j.casa === clubeId || j.visitante === clubeId)) ?? null
  );
}

/** Grava o placar (de um jogo assistido ou simulado) e atualiza a tabela da fase. */
export function registrarPlacar(estado: EstadoTemporada, jogoId: string, placar: [number, number]): void {
  const jogo = estado.jogos[jogoId];
  if (!jogo) throw new Error(`Jogo ${jogoId} não existe`);
  if (jogo.placar) throw new Error(`Jogo ${jogoId} já tem placar`);
  jogo.placar = placar;
  if (jogo.competicao === "copa") return;
  const divisao = divisaoDaCompeticao(estado, jogo.competicao);
  if (!divisao) return;
  const fase = faseDoEstado(divisao, jogo.fase);
  if (fase?.tipo === "liga") registrarNaLiga(fase, jogo);
}

/**
 * Simula pelo placar rápido todos os jogos da rodada que ainda não têm placar,
 * menos os de `exceto` (o jogo que o usuário vai assistir), e fecha a rodada
 * quando não sobrar nenhum.
 */
export function simularRodada(estado: EstadoTemporada, exceto: readonly string[] = []): void {
  comRng(estado, (rng) => {
    for (const j of jogosDaRodada(estado)) {
      if (j.placar || exceto.includes(j.id)) continue;
      const casa = estado.clubes[j.casa]!;
      const visitante = estado.clubes[j.visitante]!;
      const placar = placarRapido(rng, casa, visitante, j.neutro);
      registrarPlacar(estado, j.id, placar);
      const copa = j.competicao === "copa";
      estatisticasRapidas(rng, casa, placar[0], placar[1], copa);
      estatisticasRapidas(rng, visitante, placar[1], placar[0], copa);
    }
  });
  if (jogosDaRodada(estado).every((j) => j.placar)) fecharRodada(estado);
}

function fecharRodada(estado: EstadoTemporada): void {
  const rodada = estado.rodada;
  comRng(estado, (rng) => {
    const ctx = contexto(estado, rng);
    if (!estado.semCopa) {
      fecharRodadaDaCopa(estado.copa, rodada, estado.jogos, rng, ctx.forca, (x) => ranquear(estado, x));
    }
    for (const d of DIVISOES) fecharRodadaDaDivisao(formatoDe(estado, d), estado.divisoes[d], rodada, ctx);
    for (const [uf, div] of Object.entries(estado.estaduais ?? {})) {
      fecharRodadaDaDivisao(estado.formatosEstaduais![uf]!, div, rodada, ctx);
    }
  });
  resolverConflitos(estado);
  recuperarEntreRodadas(Object.values(estado.clubes));
  estado.rodada++;
}

/** Acabou quando todas as competições fecharam e não sobra jogo no calendário. */
export function temporadaEncerrada(estado: EstadoTemporada): boolean {
  return (
    estado.rodada > ultimaSemanaAgendada(estado.jogos) &&
    DIVISOES.every((d) => estado.divisoes[d].encerrada) &&
    Object.values(estado.estaduais ?? {}).every((e) => e.encerrada) &&
    (!!estado.semCopa || !!estado.copa.campeao)
  );
}

/** Semanas da temporada até agora (cresce quando fases de mata-mata são agendadas). */
export function semanasDaTemporada(estado: EstadoTemporada): number {
  return Math.max(ultimaSemanaAgendada(estado.jogos) + 1, estado.rodada);
}

/** Acesso e rebaixamento, nova tabela e calendário. Devolve o resumo da temporada que acabou. */
export function virarTemporada(estado: EstadoTemporada): ResumoTemporada {
  if (!temporadaEncerrada(estado)) throw new Error("A temporada ainda não terminou");
  const div = estado.divisoes;
  const resumo: ResumoTemporada = {
    temporada: estado.temporada,
    campeoes: {
      A: div.A.campeao!,
      B: div.B.campeao!,
      C: div.C.campeao!,
      D: div.D.campeao!,
      copa: estado.copa.campeao!,
    },
    acesso: { A: [], B: div.B.acesso, C: div.C.acesso, D: div.D.acesso },
    rebaixados: { A: div.A.rebaixados, B: div.B.rebaixados, C: div.C.rebaixados, D: [] },
  };
  const fica = (d: Divisao) =>
    div[d].clubes.filter((id) => !div[d].acesso.includes(id) && !div[d].rebaixados.includes(id));
  // Quem desceu entra no começo da lista (ordem de entrada da divisão nova).
  const ordem: Record<Divisao, string[]> = {
    A: [...fica("A"), ...div.B.acesso],
    B: [...div.A.rebaixados, ...fica("B"), ...div.C.acesso],
    C: [...div.B.rebaixados, ...fica("C"), ...div.D.acesso],
    D: [...div.C.rebaixados, ...fica("D")],
  };
  for (const d of DIVISOES) {
    if (ordem[d].length !== formatoDe(estado, d).clubes) {
      throw new Error(`${formatoDe(estado, d).nome} ficaria com ${ordem[d].length} clubes`);
    }
  }
  // Vagas diretas na 3ª fase da próxima Copa: campeões e vices das Séries C e D.
  const vice = (d: "C" | "D") => {
    const final = faseDoEstado(div[d], "Final");
    if (final?.tipo !== "mataMata") return null;
    const c = final.confrontos[0]!;
    return c.vencedor === c.a ? c.b : c.a;
  };
  estado.vagasDiretasCopa = [div.C.campeao!, div.D.campeao!, vice("C"), vice("D")].filter(
    (x): x is string => !!x,
  );
  estado.historico.push(resumo);
  estado.temporada++;
  estado.rodada = 0;
  for (const clube of Object.values(estado.clubes)) {
    for (const j of clube.jogadores) {
      j.temporada = estatisticasZeradas();
      if (j.idade !== undefined) {
        j.idade++;
        // A partir dos 32, o físico cai um pouco a cada ano.
        if (j.idade >= 32) {
          j.at.VEL = Math.max(20, j.at.VEL - 2);
          j.at.RES = Math.max(20, j.at.RES - 1);
          j.ovrBase = (j.ovrBase ?? j.ovr) - 1;
          j.ovr = Math.max(40, j.ovr - 1);
        }
      }
      j.cond = 100;
      j.lesao = 0;
      j.recemLesionado = false;
      j.susp = 0;
      j.cumprindoSuspensao = false;
      j.amarelos = 0;
      j.semJogar = 0;
    }
  }
  comRng(estado, (rng) => montarCompeticoes(estado, ordem, rng));
  return resumo;
}

/** Estado da competição de liga dona do jogo (Série ou estadual). */
export function divisaoDaCompeticao(estado: EstadoTemporada, c: IdCompeticao): EstadoDivisao | null {
  if (c === "copa") return null;
  if (c.startsWith("est-")) return estado.estaduais?.[c.slice(4)] ?? null;
  return estado.divisoes[c as Divisao] ?? null;
}

/** Prioridade para manter a data: quem tem prioridade menor é que muda de dia. */
function prioridade(c: IdCompeticao): number {
  return c === "copa" ? 3 : c.startsWith("est-") ? 1 : 2;
}

function somarDias(data: string, n: number): string {
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * Reagenda jogos ainda não disputados que deixam um clube com dois jogos no mesmo horário ou sem
 * DESCANSO_MINIMO dias: move o de menor prioridade (estadual, depois Série, por último Copa) para o
 * próximo dia livre para os dois clubes, guardando a data original em `adiadoDe`.
 */
export function resolverConflitos(estado: EstadoTemporada): number {
  let movidos = 0;
  for (let volta = 0; volta < 50; volta++) {
    const conflito = conflitosDeCalendario(estado.jogos).find((c) =>
      c.jogos.some((id) => !estado.jogos[id]!.placar && estado.jogos[id]!.rodada >= estado.rodada),
    );
    if (!conflito) break;
    const [a, b] = conflito.jogos.map((id) => estado.jogos[id]!) as [JogoAgendado, JogoAgendado];
    const candidatos = [a, b].filter((j) => !j.placar && j.rodada >= estado.rodada);
    const mover = candidatos.sort(
      (x, y) => prioridade(x.competicao) - prioridade(y.competicao) || y.rodada - x.rodada,
    )[0]!;
    adiarParaDiaLivre(estado, mover);
    movidos++;
  }
  return movidos;
}

function adiarParaDiaLivre(estado: EstadoTemporada, jogo: JogoAgendado): void {
  const original = dataDoJogo(jogo);
  const outros = Object.values(estado.jogos).filter(
    (j) => j.id !== jogo.id && [j.casa, j.visitante].some((c) => c === jogo.casa || c === jogo.visitante),
  );
  for (let n = 1; n <= 28; n++) {
    const data = somarDias(original, n);
    const h = horarioDaData(data);
    if (h.semana < estado.rodada) continue;
    const livre = outros.every(
      (j) =>
        diasEntre(dataDoJogo(j), data) >= DESCANSO_MINIMO &&
        !(j.rodada === h.semana && j.meioDeSemana === h.meio),
    );
    if (!livre) continue;
    adiar(estado, jogo.id, data);
    return;
  }
}

/** Muda a data de um jogo (adiamento/reagendamento), mantendo o histórico e a fase coerente. */
export function adiar(estado: EstadoTemporada, jogoId: string, novaData: string): void {
  const j = estado.jogos[jogoId];
  if (!j || j.placar) throw new Error(`Jogo ${jogoId} não pode ser adiado`);
  const h = horarioDaData(novaData);
  j.adiadoDe = [...(j.adiadoDe ?? []), dataDoJogo(j)];
  j.rodada = h.semana;
  j.meioDeSemana = h.meio;
  j.data = novaData;
  const fase =
    j.competicao === "copa"
      ? estado.copa.fases.find((f) => f.nome === j.fase)
      : divisaoDaCompeticao(estado, j.competicao)?.fases.find((f) => f.nome === j.fase);
  if (fase && fase.rodadaFinal < h.semana) fase.rodadaFinal = h.semana;
}

/** Nome da competição para a interface: "Série A" no Brasil, nome da liga nos pacotes estrangeiros. */
export function nomeDaCompeticao(
  estado: Pick<EstadoTemporada, "formatos" | "formatosEstaduais">,
  c: IdCompeticao,
): string {
  if (c === "copa") return "Copa do Brasil";
  if (c.startsWith("est-")) return estado.formatosEstaduais?.[c.slice(4)]?.nome ?? `Estadual ${c.slice(4)}`;
  return estado.formatos ? formatoDe(estado, c as Divisao).nome : `Série ${c}`;
}

/** Chave do logo: ID permanente da liga estrangeira, ou a própria competição do motor. */
export function chaveDoLogo(
  estado: Pick<EstadoTemporada, "formatos" | "formatosEstaduais">,
  c: IdCompeticao,
): string {
  if (c.startsWith("est-")) return estado.formatosEstaduais?.[c.slice(4)]?.id ?? c;
  return (c !== "copa" && estado.formatos?.[c as Divisao]?.id) || c;
}

/** Competições que existem nesta temporada (divisões com clubes e, se houver, a Copa). */
export function competicoesAtivas(estado: EstadoTemporada): (Divisao | "copa")[] {
  const lista: (Divisao | "copa")[] = (["A", "B", "C", "D"] as const).filter(
    (d) => estado.divisoes[d].clubes.length > 0,
  );
  if (!estado.semCopa) lista.push("copa");
  return lista;
}
