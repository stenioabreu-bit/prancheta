import type { Posicao } from "../tipos";

/** Como o usuário quer jogar: semana a semana, só nos momentos decisivos ou temporada a temporada. */
export type RitmoAtleta = "jogo" | "decisivos" | "temporada";

/** Indicadores da vida do atleta, todos de 0 a 100. */
export interface VidaAtleta {
  moral: number;
  /** Forma física (treino, descanso, noitadas). */
  forma: number;
  fama: number;
  /** Profissionalismo aos olhos do meio (clubes, imprensa, patrocinadores). */
  reputacao: number;
  tecnico: number;
  elenco: number;
  torcida: number;
  imprensa: number;
  familia: number;
  /** Relação com o empresário. */
  empresario: number;
  vicios: number;
}

export type CampoVida = keyof VidaAtleta;

export const CAMPOS_VIDA: readonly CampoVida[] = [
  "moral",
  "forma",
  "fama",
  "reputacao",
  "tecnico",
  "elenco",
  "torcida",
  "imprensa",
  "familia",
  "empresario",
  "vicios",
];

export type Relacionamento = "solteiro" | "namorando" | "casado";

export interface ContratoAtleta {
  clubeId: string;
  /** Salário anual (€ mi). */
  salario: number;
  /** Última temporada do contrato. */
  ate: number;
}

/** Rotina que o usuário define: puxa evolução, lesão, família e gastos. */
export interface RotinaAtleta {
  /** 0 leve, 1 normal, 2 intensa (treino extra). */
  treino: 0 | 1 | 2;
  /** 0 simples, 1 confortável, 2 ostentação. */
  padrao: 0 | 1 | 2;
  /** Folga: 0 família, 1 descanso, 2 noite, 3 negócios e redes (saves antigos não têm). */
  folga?: 0 | 1 | 2 | 3;
}

/** Consequência agendada: dispara um evento numa semana futura, com uma chance. */
export interface ConsequenciaAgendada {
  evento: string;
  /** Semana absoluta da carreira em que pode disparar. */
  semana: number;
  chance: number;
  /** Evento que plantou a consequência (para o histórico). */
  origem: string;
}

export interface OpcaoDoDilema {
  texto: string;
  /** Prévia curta do que tende a mexer (sem revelar as consequências futuras). */
  dica?: string;
  /** Chance de dar certo (0–1); 1 quando não há risco. */
  chance?: number;
}

/** O que a última decisão do usuário causou (cartão de resultado). */
export interface ResultadoDaDecisao {
  dilemaId: string;
  titulo: string;
  categoria: CategoriaEvento;
  escolha: string;
  texto: string;
  /** A opção arriscada deu certo (ou não havia risco). */
  certo: boolean;
  mudancas: Partial<Record<CampoVida, number>>;
  /** Variação do patrimônio (€ mi). */
  dinheiro: number;
  /** Contrato novo (clube, salário, até) quando a decisão mudou o vínculo. */
  contrato?: ContratoAtleta;
  /** Consequências futuras foram plantadas. */
  futuro: boolean;
}

/** Evento sorteado que espera a resposta do atleta. */
export interface DilemaAtleta {
  id: string;
  evento: string;
  semana: number;
  titulo: string;
  texto: string;
  categoria: CategoriaEvento;
  /** Decisão grande: nunca é resolvida sozinha nos ritmos rápidos. */
  capital: boolean;
  opcoes: OpcaoDoDilema[];
  /** Dados do sorteio (clube da proposta, valor...). */
  dados?: Record<string, string | number>;
}

export type CategoriaEvento =
  | "treino"
  | "familia"
  | "festa"
  | "relacionamento"
  | "dinheiro"
  | "imprensa"
  | "empresario"
  | "vestiario"
  | "saude"
  | "carreira"
  | "rotina"
  | "polemica"
  | "marco"
  | "selecao";

export interface RegistroDeEscolha {
  semana: number;
  temporada: number;
  titulo: string;
  escolha: string;
  resultado: string;
  capital: boolean;
}

export type TipoLanceAtleta =
  | "finalizacao"
  | "drible"
  | "provocacao"
  | "simulacao"
  | "carrinho"
  | "saidaDoGol"
  | "penalti"
  | "lancamento";

export interface OpcaoDeLance {
  id: string;
  texto: string;
  /** Chance de dar certo (0–1), mostrada ao usuário. */
  chance: number;
}

export interface LanceAtleta {
  minuto: number;
  tipo: TipoLanceAtleta;
  texto: string;
  opcoes: OpcaoDeLance[];
  decisivo: boolean;
  escolha?: string;
  resultado?: string;
  bom?: boolean;
}

export type Escalacao = "titular" | "banco" | "fora" | "lesionado" | "suspenso";

/** Jogo do clube do atleta na semana, montado antes de o usuário decidir os lances. */
export interface JogoDoAtleta {
  jogoId: string;
  competicao: string;
  nomeCompeticao: string;
  adversarioId: string;
  mandante: boolean;
  decisivo: boolean;
  escalacao: Escalacao;
  /** Minuto em que entra (banco) e minutos jogados. */
  entrou: number;
  minutos: number;
  lances: LanceAtleta[];
  /** Gols do time sem as participações do atleta (decididas nos lances). */
  golsBase: [number, number];
  /** Preenchido quando o jogo fecha. */
  placar?: [number, number];
  gols: number;
  assist: number;
  nota?: number;
  amarelo: boolean;
  vermelho: boolean;
  lesao: number;
  /** Nota extra dos lances e gols/sofridos que não são do atleta (pênalti do batedor, falha...). */
  extras: { nota: number; golsDoTime: number; golsContra: number };
  /** Jogo rodado no motor de partida completo (o resto do elenco já recebeu os números dele). */
  motor?: boolean;
  /** Gols e expulsões do jogo que não passam pelo atleta (do motor de partida). */
  narracao?: { min: number; texto: string; nosso: boolean }[];
  /** Posse de bola do time do atleta (%), do motor. */
  posse?: number;
}

export interface TemporadaDoAtleta {
  temporada: number;
  clubeId: string;
  idade: number;
  ovr: number;
  jogos: number;
  gols: number;
  assist: number;
  nota: number | null;
  titulos: string[];
  /** Prêmios individuais da temporada. */
  premios?: string[];
}

export type PeDominante = "direito" | "esquerdo";

/** Título do clube ou prêmio individual; aparece na sala de troféus e num aviso dourado até ser visto. */
export interface ConquistaAtleta {
  id: string;
  tipo: "titulo" | "premio";
  /** Competição (títulos) ou id do prêmio ("bola-de-ouro", "artilheiro:A"...). */
  chave: string;
  nome: string;
  temporada: number;
  clubeId: string;
  clube: string;
  /** Chave do logo da competição (títulos). */
  logo?: string;
  /** "27 gols", "1º de 30 no ranking"... */
  detalhe?: string;
  /** 1 comum, 2 grande, 3 histórico (Bola de Ouro, Copa do Mundo, continental). */
  peso: 1 | 2 | 3;
  visto: boolean;
}

/** Colocação do atleta na Bola de Ouro de uma temporada. */
export interface ColocacaoNaBola {
  temporada: number;
  posicao: number;
  vencedor: string;
  vencedorClube: string;
}

export interface EstadoAtleta {
  jogadorId: string;
  nome: string;
  pos: Posicao;
  /** Número da camisa e pé dominante (identidade; saves antigos não têm). */
  numero?: number;
  pe?: PeDominante;
  idade: number;
  /** Teto de overall (cresce com bom rendimento). */
  potencial: number;
  /** Pontos de treino acumulados na temporada (viram overall na virada). */
  treinoAcumulado: number;
  ritmo: RitmoAtleta;
  rotina: RotinaAtleta;
  vida: VidaAtleta;
  /** € mi. */
  dinheiro: number;
  /** Gastos fixos semanais (€ mi): pensão, empréstimo, investimento... */
  gastosFixos: { motivo: string; porSemana: number; ate?: number }[];
  relacionamento: Relacionamento;
  filhos: number;
  contrato: ContratoAtleta;
  /** Semana absoluta da carreira (não zera na virada). */
  semana: number;
  marcas: Record<string, number>;
  agendadas: ConsequenciaAgendada[];
  /** Última semana em que cada evento saiu (evita repetir). */
  ultimaVez: Record<string, number>;
  dilemas: DilemaAtleta[];
  jogo: JogoDoAtleta | null;
  /** Jogos fechados da semana (o último aparece no feed). */
  ultimosJogos: JogoDoAtleta[];
  escolhas: RegistroDeEscolha[];
  feed: { semana: number; texto: string; tipo: "bom" | "ruim" | "info" }[];
  historico: TemporadaDoAtleta[];
  /** Números da temporada em andamento (todas as competições). */
  numeros: {
    jogos: number;
    gols: number;
    assist: number;
    somaNotas: number;
    qtdNotas: number;
    /** Gols bonitos da temporada (de fora, caneta, cavadinha): concorrem ao Gol do Ano. */
    golacos?: number;
  };
  /** Títulos já contados na temporada ("temporada:competição"). */
  titulos: string[];
  convocacoes: number;
  /** Jogos e gols pela seleção (saves antigos não têm). */
  selecao?: { jogos: number; gols: number };
  aposentado: boolean;
  /** Texto do pós-carreira (quando aposenta). */
  posCarreira?: string;
  /** Cartão da última decisão, até o usuário dispensar. */
  ultimoResultado?: ResultadoDaDecisao | null;
  /** Última variação de cada indicador (mostrada no Status). */
  ultimaMudanca?: Partial<Record<CampoVida, number>>;
  /** Títulos e prêmios individuais (saves antigos não têm). */
  conquistas?: ConquistaAtleta[];
  /** Colocações na Bola de Ouro (só quando entrou no top 30). */
  bolaDeOuro?: ColocacaoNaBola[];
  /** Marcos da carreira já comemorados ("primeiro-gol", "gols-100"...). */
  marcos?: string[];
  /** Quantas vezes cada evento já saiu (para variar as histórias). */
  vezes?: Record<string, number>;
  /** Categorias dos últimos eventos (para não repetir o tema). */
  recentes?: string[];
  /** Hat-tricks na carreira. */
  hatTricks?: number;
  /** Aposentado que virou técnico: o save segue no modo técnico. */
  virouTecnico?: boolean;
  proximoId: number;
}
