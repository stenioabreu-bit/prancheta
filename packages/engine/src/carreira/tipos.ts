import type { EfeitoDeMercado } from "../mercado/tipos";
import type { Bonus, Esquema, Jogador } from "../tipos";

export type FuncaoComissao = "auxiliar" | "goleiros" | "ataque" | "defesa" | "fisico" | "base";
export type AtributoComissao =
  | "tatico"
  | "motivacao"
  | "goleiros"
  | "ataque"
  | "defesa"
  | "fisico"
  | "juventude";

export interface MembroComissao {
  id: string;
  nome: string;
  /** Atributos de 1 a 20. */
  at: Record<AtributoComissao, number>;
}

export type FocoTreino =
  | "equilibrado"
  | "tatico"
  | "ataque"
  | "defesa"
  | "bolaParada"
  | "fisico"
  | "recuperacao";

export interface Treino {
  foco: FocoTreino;
  /** 0 leve, 1 normal, 2 forte. */
  intensidade: 0 | 1 | 2;
}

export type TomDeConversa = "calmo" | "motivar" | "cobrar" | "elogiar" | "semPressao" | "agressivo";

export interface Meta {
  texto: string;
  /** Posição máxima aceita na tabela (da fase em que o clube está). */
  posicao: number;
}

export type TipoPromessa = "minutos" | "titular" | "base";

export interface Promessa {
  tipo: TipoPromessa;
  /** Jogador (ausente na promessa à diretoria de usar a base). */
  jogadorId?: string;
  nome: string;
  /** Quantas vezes precisa acontecer. */
  meta: number;
  /** Rodada-limite (exclusiva). */
  ate: number;
  feitos: number;
  status: "aberta" | "cumprida" | "quebrada";
}

/** O que uma decisão (resposta, conversa, coletiva) mexe. */
export interface Efeito {
  diretoria?: number;
  torcida?: number;
  /** Moral de todo o elenco. */
  elenco?: number;
  jogador?: { id: string; moral: number };
  promessa?: { tipo: TipoPromessa; jogadorId?: string; nome: string; meta: number; prazo: number };
  intensidade?: Treino["intensidade"];
  /** Marca algo para cobrar depois (ex.: prometeu ir pra cima no clássico). */
  marcar?: string;
}

export interface OpcaoDeResposta {
  texto: string;
  efeito: Efeito;
  /** Efeitos de mercado (contratar, vender, assumir clube...), aplicados pelo jogo. */
  mercado?: EfeitoDeMercado;
}

export interface Mensagem {
  id: string;
  rodada: number;
  de: string;
  assunto: string;
  texto: string;
  lida: boolean;
  opcoes?: OpcaoDeResposta[];
  resposta?: number;
}

export type TipoNoticia = "bom" | "ruim" | "info";

export interface Noticia {
  rodada: number;
  de: string;
  texto: string;
  tipo: TipoNoticia;
}

export interface JogoDoHistorico {
  temporada: number;
  rodada: number;
  competicao: string;
  adversario: string;
  mandante: boolean;
  golsPro: number;
  golsContra: number;
}

/** Tudo que é do técnico do usuário: clube, relações, comissão, treino, base e caixa de mensagens. */
export interface EstadoCarreira {
  tecnico: string;
  /** null = desempregado. */
  clubeId: string | null;
  diretoria: number;
  torcida: number;
  reputacao: number;
  meta: Meta;
  comissao: { membros: MembroComissao[]; funcoes: Record<FuncaoComissao, string> };
  treino: Treino;
  /** Entrosamento (0–100) por esquema. */
  entrosamento: Partial<Record<Esquema, number>>;
  /** Bônus do treino da semana para o próximo jogo. */
  bonus: Bonus;
  base: Jogador[];
  promessas: Promessa[];
  caixa: Mensagem[];
  noticias: Noticia[];
  marcas: Record<string, number>;
  tonsRecentes: TomDeConversa[];
  historico: JogoDoHistorico[];
  /** Pares de clássicos do pacote (ids). */
  classicos: [string, string][];
  /** Já avisou que o cargo está em risco nesta má fase. */
  avisoDeRisco: boolean;
  /** Contador para ids de mensagens e garotos da base. */
  proximoId: number;
}
