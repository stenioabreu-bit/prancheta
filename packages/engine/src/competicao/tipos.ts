import type { Tabela } from "../liga";

export type Divisao = "A" | "B" | "C" | "D";
export const DIVISOES: readonly Divisao[] = ["A", "B", "C", "D"];

/* ---------- formato (configuração declarativa) ---------- */

/** Como os clubes de uma fase de liga são distribuídos nos grupos. */
export type Distribuicao =
  /** Um grupo só, com todos. */
  | "unico"
  /** Clube i vai para o grupo i % n (a ordem de entrada decide). */
  | "alternada"
  /** Pela classificação de entrada, em serpentina: 1-4-5-8 / 2-3-6-7. */
  | "serpentina";

/** Como os confrontos de um mata-mata são montados. */
export type Chaveamento =
  /** Melhor campanha contra a pior, segunda contra a penúltima... */
  | "melhorContraPior"
  /** Grupos lado a lado: 1º do grupo g contra 4º do grupo g+1, 2º contra 3º (Série D, 2ª fase). */
  | "cruzamentoDeGrupos"
  /** Segue a chave: vencedor do confronto 2k pega o vencedor do 2k+1. */
  | "chave"
  /** Sorteio livre. */
  | "sorteio";

export interface FaseLiga {
  tipo: "liga";
  nome: string;
  grupos: number;
  distribuicao: Distribuicao;
  turnos: 1 | 2;
  /** Quantos de cada grupo seguem para a próxima fase. */
  avancamPorGrupo: number;
}

export interface FaseMataMata {
  tipo: "mataMata";
  nome: string;
  idaEVolta: boolean;
  chaveamento: Chaveamento;
  /**
   * De onde vêm os clubes: os que avançaram da fase anterior (padrão) ou os
   * perdedores de outra fase (playoffs da Série D).
   */
  origem?: { perdedoresDe: string };
  /**
   * Fase terminal: não alimenta a fase seguinte (playoffs de acesso). Ela abre junto
   * com a fase seguinte da mesma origem, então as duas correm nas mesmas rodadas.
   */
  terminal?: boolean;
}

export type Fase = FaseLiga | FaseMataMata;

/** Quem sobe ou cai, descrito pela fase em que isso se decide. */
export type RegraDeMovimento =
  /** Os N primeiros (ou últimos) da classificação de uma fase de liga com grupo único. */
  | { fase: string; posicao: "primeiros" | "ultimos"; quantidade: number }
  /** Os N primeiros de cada grupo de uma fase de liga. */
  | { fase: string; posicao: "primeirosDeCadaGrupo"; quantidade: number }
  /** Todos os clubes que disputaram uma fase de mata-mata. */
  | { fase: string; posicao: "participantes" }
  /** Os vencedores de uma fase de mata-mata. */
  | { fase: string; posicao: "vencedores" };

export interface FormatoDivisao {
  divisao: Divisao;
  /** ID permanente da competição (catálogo/logos), quando não for uma Série do Brasil. */
  id?: string;
  nome: string;
  clubes: number;
  fases: Fase[];
  acesso: RegraDeMovimento[];
  rebaixamento: RegraDeMovimento[];
}

/* ---------- estado ---------- */

export interface JogoAgendado {
  id: string;
  /** Rodada (semana) da temporada, de 0 a 37. */
  rodada: number;
  /** Jogo de Copa acontece no meio da semana, antes da rodada da liga. */
  meioDeSemana: boolean;
  competicao: Divisao | "copa";
  fase: string;
  /** Grupo da fase de liga ou índice do confronto do mata-mata. */
  grupo: number;
  casa: string;
  visitante: string;
  /** Campo neutro (final da Copa): ninguém tem vantagem de mando. */
  neutro?: boolean;
  placar: [number, number] | null;
}

export interface Confronto {
  a: string;
  b: string;
  jogos: string[];
  /** Clube com o mando da volta (ou do jogo único). */
  mandoFinal: string;
  vencedor: string | null;
  agregado?: [number, number];
  penaltis?: [number, number];
}

export interface EstadoFaseLiga {
  tipo: "liga";
  nome: string;
  grupos: string[][];
  tabelas: Tabela[];
  rodadaInicial: number;
  rodadaFinal: number;
  encerrada: boolean;
}

export interface EstadoFaseMataMata {
  tipo: "mataMata";
  nome: string;
  confrontos: Confronto[];
  rodadaInicial: number;
  rodadaFinal: number;
  encerrada: boolean;
}

export type EstadoFase = EstadoFaseLiga | EstadoFaseMataMata;

export interface EstadoDivisao {
  divisao: Divisao;
  clubes: string[];
  /** Fases já montadas, na ordem do formato. */
  fases: EstadoFase[];
  campeao: string | null;
  acesso: string[];
  rebaixados: string[];
  encerrada: boolean;
}
