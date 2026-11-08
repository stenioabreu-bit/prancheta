/** Valores em R$ milhões. São do jogo (estimativas), não números reais dos clubes. */
export interface Financas {
  /** Verba para contratações. */
  orcamento: number;
  divida: "moderada" | "alta" | "muito alta";
  /** Presidente econômico corta custos, contrata barato por conta própria e vende mais fácil. */
  perfil: "economico" | "normal";
  /** Quanto a diretoria ouve o técnico (0–100). */
  ouvir: number;
}

export type StatusIndicacao = "pendente" | "contratado" | "recusada" | "indisponivel";

export interface Indicacao {
  jogadorId: string;
  nome: string;
  clubeId: string;
  /** Rodada a partir da qual a diretoria analisa. */
  rodada: number;
  valor: number;
  status: StatusIndicacao;
}

export interface Vaga {
  clubeId: string;
  desde: number;
  /** Rodada em que a vaga é preenchida por alguém da IA. */
  ate: number;
  /** Já sondou o usuário. */
  sondou: boolean;
}

export interface Candidatura {
  clubeId: string;
  rodada: number;
  status: "aguardando" | "aceita" | "recusada";
}

export interface Passagem {
  clubeId: string;
  temporada: number;
  rodada: number;
}

export interface EstadoMercado {
  financas: Financas;
  indicacoes: Indicacao[];
  /** Técnico de cada clube (null = sem técnico/desconhecido). */
  tecnicos: Record<string, string | null>;
  /** Clubes de massa: pagam mais, exigem mais e atraem mais. */
  grandes: string[];
  vagas: Vaga[];
  candidaturas: Candidatura[];
  passagens: Passagem[];
}

/** O que uma resposta pode mexer no mercado (além do Efeito da carreira). */
export interface EfeitoDeMercado {
  contratar?: { jogadorId: string; custo: number };
  vender?: { jogadorId: string; valor: number; comprador: string };
  segurar?: { jogadorId: string; valor: number; comprador: string; tendeAVender: boolean };
  assumir?: string;
  ouvir?: number;
}
