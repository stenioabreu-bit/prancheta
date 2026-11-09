export const POSICOES = ["GOL", "ZAG", "LD", "LE", "VOL", "MC", "MEI", "PD", "PE", "ATA"] as const;
export type Posicao = (typeof POSICOES)[number];

export const ATRIBUTOS = ["ATQ", "FIN", "CTL", "PAS", "VEL", "FIS", "RES", "DEF", "CAB", "GOL"] as const;
export type Atributo = (typeof ATRIBUTOS)[number];
export type Atributos = Record<Atributo, number>;

export const PERSONALIDADES = [
  "profissional",
  "temperamental",
  "lider",
  "jovem",
  "veterano",
  "tranquilo",
] as const;
export type Personalidade = (typeof PERSONALIDADES)[number];

export const ESQUEMAS = ["4-2-3-1", "4-3-3", "4-4-2", "4-1-4-1", "3-5-2", "5-3-2", "3-4-3"] as const;
export type Esquema = (typeof ESQUEMAS)[number];

export const ESTILOS = ["equilibrado", "defensivo", "contra-ataque", "intenso", "ofensivo", "posse"] as const;
export type Estilo = (typeof ESTILOS)[number];

/** Nível 0, 1 ou 2 (menos, normal, mais). */
export type Nivel = 0 | 1 | 2;

export interface Tatica {
  /** -2 a 2 */
  mentalidade: number;
  pressao: Nivel;
  linha: Nivel;
  largura: Nivel;
  ritmo: Nivel;
  contra: boolean;
}

/** Instruções individuais: -1, 0 ou 1. `alvo` só vem da função Pivô. */
export interface Instrucao {
  apoio: number;
  cruz: number;
  chute: number;
  drible: number;
  passe: number;
  desarme: number;
  pressao: number;
  alvo: number;
  funcao: string | null;
}

export interface EstatisticasTemporada {
  jogos: number;
  gols: number;
  assist: number;
  somaNotas: number;
  qtdNotas: number;
  golsSofridos: number;
  jogosNoGol: number;
  semSofrer: number;
  golsCopa: number;
  /** Jogos, gols e assistências por competição (id do motor: "A", "copa", "est-SP", "cont-LIB"...). */
  porCompeticao?: Record<string, { jogos: number; gols: number; assist: number }>;
}

export interface Jogador {
  id: string;
  nome: string;
  pos: Posicao;
  ovr: number;
  alt: Posicao[];
  perso: Personalidade;
  at: Atributos;
  cond: number;
  moral: number;
  /** Rodadas fora por lesão. */
  lesao: number;
  /** Lesionou no último jogo: a contagem só começa a cair na rodada seguinte. */
  recemLesionado: boolean;
  /** Rodadas de suspensão. */
  susp: number;
  /** Já está cumprindo a suspensão nesta rodada. */
  cumprindoSuspensao: boolean;
  amarelos: number;
  semJogar: number;
  /** Últimas 8 notas. */
  notas: number[];
  temporada: EstatisticasTemporada;
  /** Overall de partida para a evolução no treino (o overall atual = base + evolução/3). */
  ovrBase?: number;
  /** Pontos de atributo ganhos no treino. */
  evolucao?: number;
  /** Teto de overall (garotos da base). */
  potencial?: number;
  idade?: number;
  /** Veio da base do clube do usuário. */
  daBase?: boolean;
  /** Rodada do último pedido de minutos (para não repetir toda semana). */
  ultimoPedido?: number;
}

export interface Cores {
  principal: string;
  secundaria: string;
}

export interface Clube {
  id: string;
  nome: string;
  sigla: string;
  cores: Cores;
  esquema: Esquema;
  estilo: Estilo;
  jogadores: Jogador[];
  /** Ids dos titulares, na ordem das posições do esquema. */
  titulares: string[];
  /** Banco escolhido pelo técnico (até 12); sem lista, todos os disponíveis ficam no banco. */
  reservas?: string[];
  tatica: Tatica;
  instrucoes: Record<string, Partial<Instrucao>>;
  /** Média de overall dos titulares; usada nas expectativas e na simulação rápida. */
  forca: number;
}

/** Bônus de treino/entrosamento aplicado às linhas (só o time do usuário recebe). */
export interface Bonus {
  A: number;
  D: number;
  M: number;
  parada: number;
}

export const BONUS_ZERO: Bonus = { A: 0, D: 0, M: 0, parada: 0 };
