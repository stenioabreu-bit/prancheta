import type { Atributos, Esquema, Estilo, Instrucao, Posicao, Tatica } from "./tipos";

/** Desvio de cada atributo em relação ao overall, por posição. */
export const MODELO_POSICAO: Record<Posicao, Atributos> = {
  GOL: { ATQ: -40, FIN: -45, CTL: -25, PAS: -15, VEL: -20, FIS: -5, RES: -10, DEF: -30, CAB: -20, GOL: 0 },
  ZAG: { ATQ: -22, FIN: -26, CTL: -10, PAS: -6, VEL: -6, FIS: 2, RES: -2, DEF: 3, CAB: 3, GOL: -50 },
  LD: { ATQ: -6, FIN: -15, CTL: -3, PAS: -2, VEL: 3, FIS: -4, RES: 4, DEF: -1, CAB: -8, GOL: -50 },
  LE: { ATQ: -6, FIN: -15, CTL: -3, PAS: -2, VEL: 3, FIS: -4, RES: 4, DEF: -1, CAB: -8, GOL: -50 },
  VOL: { ATQ: -10, FIN: -12, CTL: -4, PAS: 0, VEL: -6, FIS: 1, RES: 3, DEF: 2, CAB: -4, GOL: -50 },
  MC: { ATQ: -3, FIN: -6, CTL: 1, PAS: 3, VEL: -4, FIS: -4, RES: 2, DEF: -5, CAB: -8, GOL: -50 },
  MEI: { ATQ: 3, FIN: -1, CTL: 4, PAS: 4, VEL: -2, FIS: -8, RES: -3, DEF: -20, CAB: -12, GOL: -50 },
  PD: { ATQ: 2, FIN: -2, CTL: 4, PAS: -3, VEL: 5, FIS: -8, RES: 0, DEF: -22, CAB: -12, GOL: -50 },
  PE: { ATQ: 2, FIN: -2, CTL: 4, PAS: -3, VEL: 5, FIS: -8, RES: 0, DEF: -22, CAB: -12, GOL: -50 },
  ATA: { ATQ: 4, FIN: 4, CTL: 0, PAS: -8, VEL: -1, FIS: 0, RES: -4, DEF: -28, CAB: 0, GOL: -50 },
};

/** Posto no esquema: posição, x e y (0–100) no campo, com o próprio gol embaixo. */
export type Posto = readonly [Posicao, number, number];

export const ESQUEMA_POSTOS: Record<Esquema, readonly Posto[]> = {
  "4-2-3-1": [
    ["GOL", 50, 4],
    ["LD", 88, 24],
    ["ZAG", 62, 16],
    ["ZAG", 38, 16],
    ["LE", 12, 24],
    ["VOL", 62, 36],
    ["VOL", 38, 36],
    ["PD", 84, 62],
    ["MEI", 50, 58],
    ["PE", 16, 62],
    ["ATA", 50, 82],
  ],
  "4-3-3": [
    ["GOL", 50, 4],
    ["LD", 88, 24],
    ["ZAG", 62, 16],
    ["ZAG", 38, 16],
    ["LE", 12, 24],
    ["VOL", 50, 34],
    ["MC", 70, 46],
    ["MC", 30, 46],
    ["PD", 84, 72],
    ["ATA", 50, 82],
    ["PE", 16, 72],
  ],
  "4-4-2": [
    ["GOL", 50, 4],
    ["LD", 88, 24],
    ["ZAG", 62, 16],
    ["ZAG", 38, 16],
    ["LE", 12, 24],
    ["PD", 86, 52],
    ["MC", 62, 44],
    ["VOL", 38, 40],
    ["PE", 14, 52],
    ["ATA", 62, 80],
    ["ATA", 38, 80],
  ],
  "4-1-4-1": [
    ["GOL", 50, 4],
    ["LD", 88, 24],
    ["ZAG", 62, 16],
    ["ZAG", 38, 16],
    ["LE", 12, 24],
    ["VOL", 50, 32],
    ["PD", 86, 56],
    ["MC", 64, 50],
    ["MC", 36, 50],
    ["PE", 14, 56],
    ["ATA", 50, 82],
  ],
  "3-5-2": [
    ["GOL", 50, 4],
    ["ZAG", 72, 16],
    ["ZAG", 50, 14],
    ["ZAG", 28, 16],
    ["LD", 90, 44],
    ["VOL", 50, 36],
    ["MC", 68, 48],
    ["MEI", 32, 54],
    ["LE", 10, 44],
    ["ATA", 62, 80],
    ["ATA", 38, 80],
  ],
  "5-3-2": [
    ["GOL", 50, 4],
    ["LD", 90, 26],
    ["ZAG", 72, 16],
    ["ZAG", 50, 14],
    ["ZAG", 28, 16],
    ["LE", 10, 26],
    ["VOL", 50, 34],
    ["MC", 70, 44],
    ["MC", 30, 44],
    ["ATA", 62, 78],
    ["ATA", 38, 78],
  ],
  "3-4-3": [
    ["GOL", 50, 4],
    ["ZAG", 72, 16],
    ["ZAG", 50, 14],
    ["ZAG", 28, 16],
    ["LD", 90, 44],
    ["VOL", 60, 38],
    ["MC", 40, 42],
    ["LE", 10, 44],
    ["PD", 82, 72],
    ["ATA", 50, 82],
    ["PE", 18, 72],
  ],
};

/** Quanto cada posição contribui para defesa (d), meio (m) e ataque (a). */
export const PESO_SETOR: Record<Posicao, { d: number; m: number; a: number }> = {
  GOL: { d: 0, m: 0, a: 0 },
  ZAG: { d: 1, m: 0.12, a: 0 },
  LD: { d: 0.6, m: 0.3, a: 0.28 },
  LE: { d: 0.6, m: 0.3, a: 0.28 },
  VOL: { d: 0.6, m: 0.6, a: 0.05 },
  MC: { d: 0.25, m: 0.85, a: 0.22 },
  MEI: { d: 0.05, m: 0.6, a: 0.65 },
  PD: { d: 0.08, m: 0.25, a: 0.85 },
  PE: { d: 0.08, m: 0.25, a: 0.85 },
  ATA: { d: 0, m: 0.1, a: 1 },
};

export const POSICOES_DE_LADO: readonly Posicao[] = ["LD", "LE", "PD", "PE"];

const GRUPO_POSICAO: Record<Posicao, string> = {
  GOL: "G",
  ZAG: "D",
  LD: "W",
  LE: "W",
  VOL: "M",
  MC: "M",
  MEI: "A",
  PD: "F",
  PE: "F",
  ATA: "S",
};
const PARES_COMPATIVEIS: Record<string, number> = {
  "LD|LE": 0.84,
  "VOL|MC": 0.95,
  "MC|MEI": 0.92,
  "MEI|PD": 0.88,
  "MEI|PE": 0.88,
  "PD|PE": 0.9,
  "PD|ATA": 0.86,
  "PE|ATA": 0.86,
  "MEI|ATA": 0.85,
  "ZAG|VOL": 0.84,
  "ZAG|LD": 0.82,
  "ZAG|LE": 0.82,
  "LD|PD": 0.8,
  "LE|PE": 0.8,
  "VOL|MEI": 0.8,
};

/** Rendimento (0–1) de um jogador de posição `a` atuando como `b`. */
export function compatibilidade(a: Posicao, b: Posicao): number {
  if (a === b) return 1;
  const par = PARES_COMPATIVEIS[`${a}|${b}`] ?? PARES_COMPATIVEIS[`${b}|${a}`];
  if (par !== undefined) return par;
  if (a === "GOL" || b === "GOL") return 0.3;
  return GRUPO_POSICAO[a] === GRUPO_POSICAO[b] ? 0.85 : 0.62;
}

export type ChaveInstrucao = "apoio" | "cruz" | "chute" | "drible" | "passe" | "desarme" | "pressao";

export const INSTRUCOES: readonly {
  chave: ChaveInstrucao;
  nome: string;
  niveis: readonly [string, string, string];
  dica: string;
}[] = [
  {
    chave: "apoio",
    nome: "Posicionamento",
    niveis: ["Fica mais atrás", "Normal", "Apoia o ataque"],
    dica: "Apoiar o ataque soma gente na frente e deixa buraco atrás.",
  },
  {
    chave: "cruz",
    nome: "Cruzamentos",
    niveis: ["Cruza menos", "Normal", "Cruza mais"],
    dica: "Cruzar mais rende com centroavante forte no jogo aéreo.",
  },
  {
    chave: "chute",
    nome: "Chutes de longe",
    niveis: ["Evita", "Normal", "Arrisca"],
    dica: "Arriscar de longe gera volume, mas com pouca chance de gol.",
  },
  {
    chave: "drible",
    nome: "Dribles",
    niveis: ["Toca rápido", "Normal", "Dribla mais"],
    dica: "Driblar mais compensa com quem tem bom controle e velocidade.",
  },
  {
    chave: "passe",
    nome: "Passes",
    niveis: ["Seguro", "Normal", "Arriscado"],
    dica: "Passe arriscado cria mais chances e perde a bola com mais frequência.",
  },
  {
    chave: "desarme",
    nome: "Desarme",
    niveis: ["Cauteloso", "Normal", "Agressivo"],
    dica: "Agressivo rouba mais bolas e leva mais cartões.",
  },
  {
    chave: "pressao",
    nome: "Pressão no adversário",
    niveis: ["Menos", "Normal", "Mais"],
    dica: "Pressionar mais cansa o jogador mais rápido.",
  },
];

type Funcao = readonly [string, Partial<Instrucao>];
const FUNCOES_LATERAL: readonly Funcao[] = [
  ["Lateral", {}],
  ["Lateral apoiador", { apoio: 1, cruz: 1 }],
  ["Lateral defensivo", { apoio: -1, cruz: -1 }],
  ["Ala", { apoio: 1, cruz: 1, drible: 1, pressao: 1 }],
  ["Lateral invertido", { apoio: -1, passe: 1, cruz: -1 }],
];
const FUNCOES_PONTA: readonly Funcao[] = [
  ["Ponta", { cruz: 1, drible: 1 }],
  ["Ponta invertido", { cruz: -1, chute: 1, drible: 1 }],
  ["Ponta de marcação", { apoio: -1, pressao: 1 }],
  ["Extremo de velocidade", { apoio: 1, drible: 1 }],
];

/** Funções por posição; cada uma vem com as instruções que ela implica. */
export const FUNCOES: Record<Posicao, readonly Funcao[]> = {
  GOL: [
    ["Goleiro", {}],
    ["Goleiro líbero", { passe: 1, apoio: 1 }],
    ["Goleiro de reposição curta", { passe: -1 }],
  ],
  ZAG: [
    ["Zagueiro", {}],
    ["Zagueiro construtor", { passe: 1 }],
    ["Xerife", { desarme: 1, apoio: -1, passe: -1 }],
  ],
  LD: FUNCOES_LATERAL,
  LE: FUNCOES_LATERAL,
  VOL: [
    ["Volante", {}],
    ["Primeiro volante", { apoio: -1, passe: -1 }],
    ["Volante ladrão", { desarme: 1, pressao: 1 }],
    ["Construtor recuado", { apoio: -1, passe: 1 }],
  ],
  MC: [
    ["Meio-campista", {}],
    ["Box-to-box", { apoio: 1, pressao: 1 }],
    ["Armador", { passe: 1 }],
    ["Carrilero", { apoio: -1, pressao: 1 }],
  ],
  MEI: [
    ["Meia", {}],
    ["Camisa 10", { passe: 1, drible: 1, chute: 1 }],
    ["Meia-atacante", { apoio: 1, chute: 1 }],
    ["Meia de pressão", { pressao: 1, desarme: 1 }],
  ],
  PD: FUNCOES_PONTA,
  PE: FUNCOES_PONTA,
  ATA: [
    ["Centroavante", {}],
    ["Pivô", { drible: -1, alvo: 1 }],
    ["Finalizador", { apoio: 1, chute: -1 }],
    ["Falso 9", { apoio: -1, passe: 1, drible: 1 }],
    ["Atacante de pressão", { pressao: 1, desarme: 1 }],
  ],
};

export function taticaPadrao(estilo: Estilo): Tatica {
  const t: Tatica = { mentalidade: 0, pressao: 1, linha: 1, largura: 1, ritmo: 1, contra: false };
  switch (estilo) {
    case "ofensivo":
      t.mentalidade = 1;
      t.ritmo = 2;
      break;
    case "defensivo":
      t.mentalidade = -1;
      t.linha = 0;
      t.pressao = 0;
      t.contra = true;
      break;
    case "posse":
      t.ritmo = 0;
      t.pressao = 2;
      t.linha = 2;
      break;
    case "intenso":
      t.pressao = 2;
      t.ritmo = 2;
      t.linha = 2;
      break;
    case "contra-ataque":
      t.mentalidade = -1;
      t.contra = true;
      t.linha = 0;
      t.ritmo = 2;
      break;
    case "equilibrado":
      break;
  }
  return t;
}
