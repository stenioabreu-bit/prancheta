import { type ClubeDados, criarClube } from "../clube";
import { estatisticasZeradas } from "../jogador";
import { recuperarEntreRodadas } from "../liga";
import { type Rng, criarRng } from "../rng";
import { estatisticasRapidas, placarRapido } from "../simulacaoRapida";
import type { Clube } from "../tipos";
import { type EstadoCopa, abrirFaseDaCopa, fecharRodadaDaCopa, montarCopa } from "./copa";
import { type ContextoCompeticao, faseDoEstado, fecharRodadaDaDivisao, iniciarDivisao } from "./divisao";
import { registrarNaLiga } from "./fases";
import { FORMATOS_2026 } from "./formatos2026";
import { DIVISOES, type Divisao, type EstadoDivisao, type FormatoDivisao, type JogoAgendado } from "./tipos";

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
}

export interface OpcoesNovaTemporada {
  semente: number;
  temporada: number;
  divisoes: Record<Divisao, ClubeDados[]>;
  vagasDiretasCopa: string[];
  usuarioId?: string | null;
}

const FORMATOS: Record<Divisao, FormatoDivisao> = FORMATOS_2026;

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
  for (const d of DIVISOES) estado.divisoes[d] = iniciarDivisao(FORMATOS[d], ordem[d], ctx);
  const ids = (d: Divisao) => estado.divisoes[d].clubes;
  estado.copa = montarCopa({
    serieA: ids("A"),
    vagasDiretas: estado.vagasDiretasCopa,
    demais: ranquear(estado, [...ids("B"), ...ids("C"), ...ids("D")]),
    usuarioId: estado.usuarioId,
  });
  abrirFaseDaCopa(estado.copa, 0, estado.jogos, rng, (x) => ranquear(estado, x));
}

export function novaTemporada(opcoes: OpcoesNovaTemporada): EstadoTemporada {
  const rng = criarRng(opcoes.semente);
  const clubes: Record<string, Clube> = {};
  const ordem = {} as Record<Divisao, string[]>;
  for (const d of DIVISOES) {
    const lista = opcoes.divisoes[d];
    if (lista.length !== FORMATOS[d].clubes) {
      throw new Error(
        `${FORMATOS[d].nome} precisa de ${FORMATOS[d].clubes} clubes; o pacote tem ${lista.length}`,
      );
    }
    ordem[d] = lista.map((c) => c.id);
    for (const c of lista) clubes[c.id] = criarClube(c, rng);
  }
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
  };
  montarCompeticoes(estado, ordem, rng);
  estado.rng = rng.estado();
  return estado;
}

/** Jogos da rodada: os de Copa (meio de semana) primeiro, depois os da liga. */
export function jogosDaRodada(estado: EstadoTemporada, rodada = estado.rodada): JogoAgendado[] {
  return Object.values(estado.jogos)
    .filter((j) => j.rodada === rodada)
    .sort((a, b) => Number(b.meioDeSemana) - Number(a.meioDeSemana));
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
  const fase = faseDoEstado(estado.divisoes[jogo.competicao], jogo.fase);
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
    fecharRodadaDaCopa(estado.copa, rodada, estado.jogos, rng, ctx.forca, (x) => ranquear(estado, x));
    for (const d of DIVISOES) fecharRodadaDaDivisao(FORMATOS[d], estado.divisoes[d], rodada, ctx);
  });
  recuperarEntreRodadas(Object.values(estado.clubes));
  estado.rodada++;
}

export function temporadaEncerrada(estado: EstadoTemporada): boolean {
  return estado.rodada >= RODADAS_POR_TEMPORADA && DIVISOES.every((d) => estado.divisoes[d].encerrada);
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
    if (ordem[d].length !== FORMATOS[d].clubes) {
      throw new Error(`${FORMATOS[d].nome} ficaria com ${ordem[d].length} clubes`);
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
