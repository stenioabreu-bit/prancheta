export type SituacaoFinanceira = "healthy" | "stable" | "pressured" | "indebted";

/** Lançamento no histórico financeiro do clube (€ mi; positivo entra, negativo sai). */
export interface Movimento {
  temporada: number;
  rodada: number;
  descricao: string;
  valor: number;
}

/**
 * Finanças do clube do técnico, em € milhões. Valor do elenco e orçamento inicial vêm da base de 2026;
 * caixa, dívida e receita são estimativas internas do jogo (não são dados oficiais dos clubes).
 */
export interface Financas {
  /** Verba liberada para contratações (separada do caixa). */
  orcamento: number;
  divida: "moderada" | "alta" | "muito alta";
  caixa?: number;
  /** Dívida total estimada. */
  dividaTotal?: number;
  /** Receita anual estimada (TV, bilheteria, sócios, patrocínios, comercial). */
  receitaAnual?: number;
  situacao?: SituacaoFinanceira;
  /** Valor de referência do elenco no início (independente dos valores dos jogadores). */
  valorElenco?: number;
  fonteValorElenco?: "transfermarkt" | "other_market_reference" | "estimated";
  fonteOrcamento?: "gameplay_estimate";
  /** Orçamento do início da carreira no clube (referência). */
  orcamentoInicial?: number;
  atualizadoEm?: string;
  /** Caixa no início da temporada (para o resultado do ano). */
  caixaNoInicio?: number;
  prejuizosSeguidos?: number;
  /** Receitas e despesas da semana ainda não lançadas no histórico (lançadas a cada 4 semanas). */
  acumulado?: { receitas: number; salarios: number; despesas: number; juros: number; semanas: number };
  movimentos?: Movimento[];
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
  /** Jogadores do elenco que o técnico pediu para a diretoria negociar. */
  vendasIndicadas?: string[];
  /** Pedidos do técnico para segurar jogador: a diretoria responde algumas rodadas depois. */
  decisoesPendentes?: DecisaoPendente[];
  /** Base financeira de 2026 por clube (valor do elenco e orçamento inicial, € mi). */
  basesFinanceiras?: Record<string, { valorElenco: number; orcamento: number }>;
  /** Buscas pedidas ao olheiro: ficam prontas numa rodada e viram relatório. */
  olheiro?: PedidoAoOlheiro[];
}

export interface PedidoAoOlheiro {
  id: number;
  descricao: string;
  filtro: import("./transferencias").FiltroDoMercado;
  pronto: number;
  /** Ids dos jogadores encontrados (preenchido quando fica pronto). */
  resultado?: string[];
}

export interface DecisaoPendente {
  jogadorId: string;
  valor: number;
  comprador: string;
  tendeAVender: boolean;
  /** Rodada em que a diretoria dá a resposta. */
  rodada: number;
}

/** O que uma resposta pode mexer no mercado (além do Efeito da carreira). */
export interface EfeitoDeMercado {
  contratar?: { jogadorId: string; custo: number };
  vender?: { jogadorId: string; valor: number; comprador: string };
  segurar?: { jogadorId: string; valor: number; comprador: string; tendeAVender: boolean };
  assumir?: string;
  ouvir?: number;
}
