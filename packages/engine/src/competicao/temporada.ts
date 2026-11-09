import { type ClubeDados, criarClube, escalarAutomatico, forcaDoClube, gerarElenco } from "../clube";
import { criarJogador, estatisticasZeradas } from "../jogador";
import { recuperarEntreRodadas } from "../liga";
import { type Rng, criarRng, inteiroEntre } from "../rng";
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
import { proximasContinentais } from "./classificacaoContinental";
import {
  type EstadoContinental,
  type FormatoContinental,
  fecharRodadaContinental,
  iniciarContinental,
  participantesContinental,
} from "./continental";
import { type EstadoCopa, abrirFaseDaCopa, fecharRodadaDaCopa, montarCopa } from "./copa";
import { type ContextoCompeticao, faseDoEstado, fecharRodadaDaDivisao, iniciarDivisao } from "./divisao";
import { classificacaoDoGrupo, registrarNaLiga } from "./fases";
import { FORMATOS_2026 } from "./formatos2026";
import type { EstadoFase } from "./tipos";
import {
  DIVISOES,
  type Divisao,
  type EstadoDivisao,
  type FormatoDivisao,
  type IdCompeticao,
  type JogoAgendado,
} from "./tipos";

export const RODADAS_POR_TEMPORADA = 38;

export interface DestaqueDaCompeticao {
  jogadorId: string;
  nome: string;
  clubeId: string;
  valor: number;
}

/** Registro de uma competição numa temporada (histórico de campeões e destaques). */
export interface RegistroDeCompeticao {
  id: IdCompeticao;
  nome: string;
  campeao: string | null;
  vice: string | null;
  artilheiro: DestaqueDaCompeticao | null;
  assistencias: DestaqueDaCompeticao | null;
  /** Classificação final da fase de liga principal (do 1º ao último). */
  classificacao?: string[];
  acesso?: string[];
  rebaixados?: string[];
}

export interface ResumoTemporada {
  temporada: number;
  campeoes: Record<Divisao, string> & { copa: string };
  acesso: Record<Divisao, string[]>;
  rebaixados: Record<Divisao, string[]>;
  /** Todas as competições da temporada, com campeão, vice, destaques e classificação. */
  competicoes?: RegistroDeCompeticao[];
  /** Quem pendurou as chuteiras e quem subiu para repor (geração procedural, só da 2ª temporada em diante). */
  aposentados?: { jogadorId: string; nome: string; clubeId: string; idade: number }[];
  novatos?: { jogadorId: string; nome: string; clubeId: string }[];
  /** Brasileiros classificados para as copas continentais do ano seguinte. */
  vagasContinentais?: { libertadores: string[]; sulAmericana: string[] };
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
  /** Libertadores e Sul-Americana (competições "cont-…"), na ordem em que fecham. */
  continentais?: Record<string, EstadoContinental>;
  formatosContinentais?: FormatoContinental[];
  /** Tabela-base de 2026 (datas e vagas estrangeiras) para montar as copas dos anos seguintes. */
  formatosContinentaisBase?: FormatoContinental[];
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
  continentais?: FormatoContinental[];
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
  if (estado.formatosContinentais) {
    estado.continentais = {};
    for (const f of estado.formatosContinentais) {
      if (!participantesContinental(f).every((id) => estado.clubes[id])) continue;
      estado.continentais[f.id] = iniciarContinental(f, { ...ctx, outras: estado.continentais });
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
    ...(opcoes.continentais?.length ? { formatosContinentais: opcoes.continentais } : {}),
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
  const fase = fasesDaCompeticao(estado, jogo.competicao).find((f) => f.nome === jogo.fase);
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
      estatisticasRapidas(rng, casa, placar[0], placar[1], copa, j.competicao);
      estatisticasRapidas(rng, visitante, placar[1], placar[0], copa, j.competicao);
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
    for (const f of estado.formatosContinentais ?? []) {
      const est = estado.continentais?.[f.id];
      if (est) fecharRodadaContinental(f, est, rodada, { ...ctx, outras: estado.continentais! });
    }
  });
  resolverConflitos(estado, rodada + 1);
  recuperarEntreRodadas(Object.values(estado.clubes));
  estado.rodada++;
}

/** Acabou quando todas as competições fecharam e não sobra jogo no calendário. */
export function temporadaEncerrada(estado: EstadoTemporada): boolean {
  return (
    estado.rodada > ultimaSemanaAgendada(estado.jogos) &&
    DIVISOES.every((d) => estado.divisoes[d].encerrada) &&
    Object.values(estado.estaduais ?? {}).every((e) => e.encerrada) &&
    Object.values(estado.continentais ?? {}).every((e) => e.encerrada) &&
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
    competicoes: registrosDaTemporada(estado),
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
  resumo.aposentados = [];
  resumo.novatos = [];
  comRng(estado, (rng) => evoluirElencos(estado, rng, resumo));
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
  if (estado.formatosContinentais) {
    estado.formatosContinentaisBase ??= estado.formatosContinentais;
    const ligaA = div.A.fases.find((f) => f.tipo === "liga");
    const resultado = {
      serieA: ligaA?.tipo === "liga" ? classificacaoDoGrupo(ligaA, 0) : div.A.clubes,
      campeaoCopa: estado.semCopa ? null : estado.copa.campeao,
      campeaoLibertadores: estado.continentais?.["cont-LIB"]?.campeao ?? null,
      campeaoSulAmericana: estado.continentais?.["cont-SUL"]?.campeao ?? null,
      brasileiros: new Set(DIVISOES.flatMap((d) => div[d].clubes)),
    };
    estado.formatosContinentais = comRng(estado, (rng) =>
      proximasContinentais(estado.formatosContinentaisBase!, resultado, rng),
    );
    const brasileirosEm = (id: string) =>
      participantesContinental(estado.formatosContinentais!.find((f) => f.id === id)!).filter((x) =>
        resultado.brasileiros.has(x),
      );
    resumo.vagasContinentais = {
      libertadores: brasileirosEm("cont-LIB"),
      sulAmericana: brasileirosEm("cont-SUL"),
    };
  }
  comRng(estado, (rng) => montarCompeticoes(estado, ordem, rng));
  return resumo;
}

/** Estado da competição de liga dona do jogo (Série ou estadual). */
export function divisaoDaCompeticao(estado: EstadoTemporada, c: IdCompeticao): EstadoDivisao | null {
  if (c === "copa" || c.startsWith("cont-")) return null;
  if (c.startsWith("est-")) return estado.estaduais?.[c.slice(4)] ?? null;
  return estado.divisoes[c as Divisao] ?? null;
}

/** Fases de qualquer competição (Série, estadual, Copa ou continental). */
export function fasesDaCompeticao(estado: EstadoTemporada, c: IdCompeticao): EstadoFase[] {
  if (c === "copa") return estado.copa.fases;
  if (c.startsWith("cont-")) return estado.continentais?.[c]?.fases ?? [];
  return divisaoDaCompeticao(estado, c)?.fases ?? [];
}

/**
 * Prioridade para manter a data (quem tem menos é que muda): continental > Copa > mata-mata de estadual >
 * Série > 1ª fase de estadual.
 */
function prioridade(j: JogoAgendado): number {
  const c = j.competicao;
  if (c.startsWith("cont-")) return 5;
  if (c === "copa") return 4;
  if (c.startsWith("est-")) return j.fase === "1ª fase" ? 1 : 3;
  return 2;
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
export function resolverConflitos(estado: EstadoTemporada, aPartirDe = estado.rodada): number {
  let movidos = 0;
  const semSolucao = new Set<string>();
  for (let volta = 0; volta < 2000; volta++) {
    const conflito = conflitosDeCalendario(estado.jogos).find(
      (c) =>
        !semSolucao.has(c.jogos.join("|")) &&
        c.jogos.some((id) => !estado.jogos[id]!.placar && estado.jogos[id]!.rodada >= aPartirDe),
    );
    if (!conflito) break;
    const candidatos = conflito.jogos
      .map((id) => estado.jogos[id]!)
      .filter((j) => !j.placar && j.rodada >= aPartirDe)
      .sort((x, y) => prioridade(x) - prioridade(y) || y.rodada - x.rodada);
    if (candidatos.some((j) => adiarParaDiaLivre(estado, j, aPartirDe))) movidos++;
    else semSolucao.add(conflito.jogos.join("|"));
  }
  return movidos;
}

function adiarParaDiaLivre(
  estado: EstadoTemporada,
  jogo: JogoAgendado,
  aPartirDe: number,
  tentativa = 0,
): boolean {
  const original = dataDoJogo(jogo);
  const outros = Object.values(estado.jogos).filter(
    (j) => j.id !== jogo.id && [j.casa, j.visitante].some((c) => c === jogo.casa || c === jogo.visitante),
  );
  // Mata-mata: a ida não passa da volta; se precisar, a volta é empurrada antes.
  const fase = fasesDaCompeticao(estado, jogo.competicao).find((f) => f.nome === jogo.fase);
  const volta =
    fase?.tipo === "mataMata"
      ? outros.find(
          (j) =>
            j.competicao === jogo.competicao &&
            j.fase === jogo.fase &&
            j.casa === jogo.visitante &&
            j.visitante === jogo.casa &&
            dataDoJogo(j) > original &&
            !j.placar,
        )
      : undefined;
  for (let n = 1; n <= 60; n++) {
    const data = somarDias(original, n);
    if (volta && diasEntre(data, dataDoJogo(volta)) < DESCANSO_MINIMO + 1 && data <= dataDoJogo(volta)) {
      if (tentativa < 2 && adiarParaDiaLivre(estado, volta, tentativa + 1))
        return adiarParaDiaLivre(estado, jogo, tentativa + 1);
      return false;
    }
    if (volta && data > dataDoJogo(volta)) return false;
    const h = horarioDaData(data);
    if (h.semana < aPartirDe) continue;
    const livre = outros.every((j) => diasEntre(dataDoJogo(j), data) >= DESCANSO_MINIMO);
    if (!livre) continue;
    adiar(estado, jogo.id, data);
    return true;
  }
  return false;
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
  const fase = fasesDaCompeticao(estado, j.competicao).find((f) => f.nome === j.fase);
  if (fase && fase.rodadaFinal < h.semana) fase.rodadaFinal = h.semana;
}

/** Nome da competição para a interface: "Série A" no Brasil, nome da liga nos pacotes estrangeiros. */
export function nomeDaCompeticao(
  estado: Pick<EstadoTemporada, "formatos" | "formatosEstaduais" | "formatosContinentais">,
  c: IdCompeticao,
): string {
  if (c === "copa") return "Copa do Brasil";
  if (c.startsWith("cont-")) return estado.formatosContinentais?.find((f) => f.id === c)?.nome ?? c;
  if (c.startsWith("est-")) return estado.formatosEstaduais?.[c.slice(4)]?.nome ?? `Estadual ${c.slice(4)}`;
  return estado.formatos ? formatoDe(estado, c as Divisao).nome : `Série ${c}`;
}

/** Chave do logo: ID permanente da liga estrangeira, ou a própria competição do motor. */
export function chaveDoLogo(
  estado: Pick<EstadoTemporada, "formatos" | "formatosEstaduais" | "formatosContinentais">,
  c: IdCompeticao,
): string {
  if (c.startsWith("cont-")) return estado.formatosContinentais?.find((f) => f.id === c)?.logo ?? c;
  if (c.startsWith("est-")) return estado.formatosEstaduais?.[c.slice(4)]?.id ?? c;
  return (c !== "copa" && estado.formatos?.[c as Divisao]?.id) || c;
}

/** Competições que existem nesta temporada (divisões com clubes e, se houver, a Copa). */
export function competicoesAtivas(estado: EstadoTemporada): IdCompeticao[] {
  const lista: IdCompeticao[] = (["A", "B", "C", "D"] as const).filter(
    (d) => estado.divisoes[d].clubes.length > 0,
  );
  if (!estado.semCopa) lista.push("copa");
  for (const id of Object.keys(estado.continentais ?? {})) lista.push(id as IdCompeticao);
  for (const uf of Object.keys(estado.estaduais ?? {}).sort()) lista.push(`est-${uf}`);
  return lista;
}

function destaque(
  estado: EstadoTemporada,
  c: IdCompeticao,
  campo: "gols" | "assist",
): DestaqueDaCompeticao | null {
  let melhor: DestaqueDaCompeticao | null = null;
  for (const clube of Object.values(estado.clubes)) {
    for (const j of clube.jogadores) {
      const v = j.temporada.porCompeticao?.[c]?.[campo] ?? 0;
      if (v > 0 && (!melhor || v > melhor.valor))
        melhor = { jogadorId: j.id, nome: j.nome, clubeId: clube.id, valor: v };
    }
  }
  return melhor;
}

function campeaoEVice(fases: EstadoFase[]): [string | null, string | null] {
  const ultima = fases.at(-1);
  if (!ultima) return [null, null];
  if (ultima.tipo === "mataMata") {
    const c = ultima.confrontos[0];
    if (!c?.vencedor) return [null, null];
    return [c.vencedor, c.vencedor === c.a ? c.b : c.a];
  }
  const t = classificacaoDoGrupo(ultima, 0);
  return [t[0] ?? null, t[1] ?? null];
}

/** Monta o registro de cada competição disputada (antes de zerar as estatísticas da temporada). */
export function registrosDaTemporada(estado: EstadoTemporada): RegistroDeCompeticao[] {
  return competicoesAtivas(estado).map((c) => {
    const fases = fasesDaCompeticao(estado, c);
    const div = divisaoDaCompeticao(estado, c);
    const liga = fases.find((f) => f.tipo === "liga");
    const [campeaoFase, viceFase] = campeaoEVice(fases);
    const campeao =
      c === "copa"
        ? estado.copa.campeao
        : c.startsWith("cont-")
          ? (estado.continentais?.[c]?.campeao ?? null)
          : (div?.campeao ?? campeaoFase);
    const vice =
      c === "copa"
        ? estado.copa.vice
        : c.startsWith("cont-")
          ? (estado.continentais?.[c]?.vice ?? null)
          : viceFase;
    return {
      id: c,
      nome: nomeDaCompeticao(estado, c),
      campeao,
      vice,
      artilheiro: destaque(estado, c, "gols"),
      assistencias: destaque(estado, c, "assist"),
      ...(liga?.tipo === "liga" && liga.grupos.length === 1
        ? { classificacao: classificacaoDoGrupo(liga, 0) }
        : {}),
      ...(div && !c.startsWith("est-") ? { acesso: div.acesso, rebaixados: div.rebaixados } : {}),
    };
  });
}

const ELENCO_MINIMO = 23;

/**
 * Virada do ano para todos os clubes: envelhece, evolui os jovens (até o potencial), faz os veteranos caírem,
 * aposenta quem chegou ao fim da carreira e repõe o elenco com garotos gerados (só jogadores novos; os
 * reais da base de 2026 nunca são inventados).
 */
function evoluirElencos(estado: EstadoTemporada, rng: Rng, resumo: ResumoTemporada): void {
  for (const clube of Object.values(estado.clubes)) {
    const saem: string[] = [];
    for (const j of clube.jogadores) {
      if (j.idade === undefined) continue;
      j.idade++;
      const teto = j.potencial ?? (j.ovrBase ?? j.ovr) + 6;
      const ganho = j.idade <= 21 ? inteiroEntre(rng, 1, 3) : j.idade <= 24 ? inteiroEntre(rng, 0, 2) : 0;
      if (ganho > 0 && j.ovr < teto) {
        const g = Math.min(ganho, teto - j.ovr);
        j.ovrBase = (j.ovrBase ?? j.ovr) + g;
        j.ovr = Math.min(92, j.ovr + g);
        for (const a of ["CTL", "PAS", "FIN", "DEF"] as const) j.at[a] = Math.min(95, j.at[a] + g);
      }
      if (j.idade >= 32) {
        j.at.VEL = Math.max(20, j.at.VEL - 2);
        j.at.RES = Math.max(20, j.at.RES - 1);
        j.ovrBase = (j.ovrBase ?? j.ovr) - 1;
        j.ovr = Math.max(40, j.ovr - 1);
      }
      const chance =
        j.idade >= 38
          ? 0.95
          : j.idade >= 35
            ? 0.3 + 0.2 * (j.idade - 35)
            : j.idade >= 33 && j.ovr < 62
              ? 0.3
              : 0;
      if (rng.proximo() < chance) saem.push(j.id);
    }
    for (const id of saem) {
      const j = clube.jogadores.find((x) => x.id === id)!;
      resumo.aposentados!.push({ jogadorId: id, nome: j.nome, clubeId: clube.id, idade: j.idade! });
    }
    if (!saem.length && clube.jogadores.length >= ELENCO_MINIMO) continue;
    const posicoes = clube.jogadores.filter((x) => saem.includes(x.id)).map((x) => x.pos);
    const alvo = Math.max(ELENCO_MINIMO, clube.jogadores.length);
    clube.jogadores = clube.jogadores.filter((x) => !saem.includes(x.id));
    const nivel =
      Math.round(clube.jogadores.reduce((s, x) => s + x.ovr, 0) / Math.max(1, clube.jogadores.length)) - 6;
    const gerados = gerarElenco(rng, nivel);
    let k = 0;
    while (clube.jogadores.length < alvo && k <= 40) {
      const pos = posicoes.shift();
      const modelo = gerados.find((g) => !pos || g[1] === pos) ?? gerados[k % gerados.length]!;
      const indice = 9000 + estado.temporada * 10 + k++;
      const novo = criarJogador(
        [modelo[0], modelo[1], Math.max(45, nivel), { perso: "jovem" }],
        clube.id,
        indice,
      );
      novo.idade = inteiroEntre(rng, 17, 19);
      novo.potencial = Math.min(88, novo.ovr + inteiroEntre(rng, 6, 16));
      clube.jogadores.push(novo);
      resumo.novatos!.push({ jogadorId: novo.id, nome: novo.nome, clubeId: clube.id });
    }
    clube.titulares = escalarAutomatico(
      clube,
      clube.esquema,
      clube.titulares.filter((id) => !saem.includes(id)),
    );
    if (clube.reservas) clube.reservas = clube.reservas.filter((id) => !saem.includes(id));
    clube.forca = forcaDoClube(clube);
  }
}
