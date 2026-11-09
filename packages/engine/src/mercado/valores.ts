import type { Divisao } from "../competicao/tipos";
import type { Jogador, Posicao } from "../tipos";

/**
 * Semanas com janela de registros aberta, pelo calendário da CBF de 2026:
 * 05/01 a 03/03 (semanas 0–8) e 20/07 a 11/09 (semanas 28–35).
 */
export const JANELAS: readonly [number, number][] = [
  [0, 8],
  [28, 35],
];

export function janelaAberta(rodada: number): boolean {
  return JANELAS.some(([a, b]) => rodada >= a && rodada <= b);
}

export function proximaJanela(rodada: number): number | null {
  return JANELAS.find(([a]) => a > rodada)?.[0] ?? null;
}

/** Moedas de exibição. O jogo guarda tudo em euro (€ milhões) e converte só na tela. */
export type Moeda = "BRL" | "USD" | "EUR";

/** Cotação fixa de 09/11/2026 (1 € = R$ 6,14 = US$ 1,114). Não acompanha câmbio. */
export const COTACAO: Readonly<Record<Moeda, number>> = { EUR: 1, BRL: 6.14, USD: 1.114 };
const SIMBOLO: Readonly<Record<Moeda, string>> = { EUR: "€", BRL: "R$", USD: "US$" };

let moedaAtual: Moeda = "EUR";
/** Moeda usada na exibição (definida pela carreira em andamento). */
export function definirMoeda(moeda: Moeda): void {
  moedaAtual = moeda;
}
export function moedaEmUso(): Moeda {
  return moedaAtual;
}

/** Converte um valor de referência em R$ para a moeda interna (€). */
export function deReais(valor: number): number {
  return Math.round((valor / COTACAO.BRL) * 1000) / 1000;
}

/** Arredonda dinheiro interno (€ mi) ao milhar de euros. */
export function arredondar(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

const PESO_DIVISAO_NO_VALOR: Record<Divisao, number> = { A: 1, B: 0.75, C: 0.55, D: 0.55 };
export const PESO_DIVISAO_NO_MERCADO: Record<Divisao, number> = { A: 1, B: 0.45, C: 0.18, D: 0.07 };

/** Valor de mercado (€ mi): cresce exponencialmente com o overall; jovem vale mais, veterano menos. */
export function valorDeMercado(j: Jogador, divisao: Divisao | null): number {
  const base = 0.55 * Math.exp((j.ovr - 60) / 6.2);
  const idade = j.daBase || j.perso === "jovem" ? 1.35 : j.perso === "veterano" ? 0.55 : 1;
  return Math.max(0.02, arredondar(deReais(base * idade * PESO_DIVISAO_NO_VALOR[divisao ?? "A"])));
}

/** Salário mensal (€ mil), estimativa do jogo pelo overall. */
export function salario(j: Jogador): number {
  return Math.max(3, Math.round(deReais(140 * Math.exp((j.ovr - 60) / 9))));
}

/** Formata um valor em € milhões na moeda escolhida. */
export function formatarDinheiro(milhoes: number, moeda: Moeda = moedaAtual): string {
  const v = milhoes * COTACAO[moeda];
  const sinal = v < 0 ? "-" : "";
  const a = Math.abs(v);
  return a >= 1
    ? `${sinal}${SIMBOLO[moeda]} ${a.toFixed(1).replace(".", ",")} mi`
    : `${sinal}${SIMBOLO[moeda]} ${Math.round(a * 1000)} mil`;
}

export type SetorDoMercado = "GOL" | "DEF" | "MEIO" | "ATA";

export function setorDaPosicao(pos: Posicao): SetorDoMercado {
  if (pos === "GOL") return "GOL";
  if (pos === "ZAG" || pos === "LD" || pos === "LE") return "DEF";
  if (pos === "VOL" || pos === "MC" || pos === "MEI") return "MEIO";
  return "ATA";
}

/** Orçamento inicial por divisão (€ mi) para clubes sem valor na base financeira. */
export function orcamentoInicial(divisao: Divisao, grande: boolean): number {
  return deReais({ A: grande ? 9 : 4.5, B: 2.5, C: 0.8, D: 0.3 }[divisao]);
}

/** Prêmio (€ mi) por avançar em cada fase da Copa do Brasil (valores do jogo). */
export const PREMIO_COPA: readonly number[] = [0.1, 0.15, 0.25, 0.4, 1.5, 2.5, 4, 6, 10].map(deReais);

/** Reputação mínima que o clube exige do técnico. */
export function exigenciaDoClube(divisao: Divisao, grande: boolean): number {
  return { A: 52, B: 38, C: 25, D: 12 }[divisao] + (grande ? 14 : 0);
}

function emEuro(p: { campeao: number; porPosicao: number; base: number }) {
  return { campeao: deReais(p.campeao), porPosicao: deReais(p.porPosicao), base: deReais(p.base) };
}

/** Premiação (€ mi; tabelas escritas em R$) pela colocação final na divisão: [campeão, demais por posição...]; valores do jogo. */
export const PREMIO_DIVISAO: Readonly<
  Record<"A" | "B" | "C" | "D", { campeao: number; porPosicao: number; base: number }>
> = {
  A: emEuro({ campeao: 48, porPosicao: 1.6, base: 12 }),
  B: emEuro({ campeao: 8, porPosicao: 0.3, base: 2.5 }),
  C: emEuro({ campeao: 3, porPosicao: 0.1, base: 0.8 }),
  D: emEuro({ campeao: 1, porPosicao: 0.02, base: 0.2 }),
};

/** Valor pela posição final (1 = campeão). Quanto melhor a colocação, maior o prêmio. */
export function premioPorColocacao(divisao: "A" | "B" | "C" | "D", posicao: number, total: number): number {
  const p = PREMIO_DIVISAO[divisao];
  if (posicao === 1) return p.campeao;
  return arredondar(p.base + p.porPosicao * Math.max(0, total - posicao));
}

/**
 * Premiação por colocação (€ mi) de cada competição de liga, pelo ID permanente do catálogo.
 * Valores do jogo, na proporção do peso de cada liga. Copas por fase ficam em PREMIO_POR_FASE.
 */
export const PREMIO_POR_COMPETICAO: Readonly<
  Record<string, { campeao: number; porPosicao: number; base: number }>
> = {
  "brasileirao-serie-a": PREMIO_DIVISAO.A,
  "brasileirao-serie-b": PREMIO_DIVISAO.B,
  "brasileirao-serie-c": PREMIO_DIVISAO.C,
  "brasileirao-serie-d": PREMIO_DIVISAO.D,
  "primera-division-argentina": emEuro({ campeao: 14, porPosicao: 0.35, base: 3 }),
  "primera-a-colombia": emEuro({ campeao: 6, porPosicao: 0.2, base: 1.5 }),
  "primera-division-chile": emEuro({ campeao: 5, porPosicao: 0.18, base: 1.2 }),
  "primera-division-uruguai": emEuro({ campeao: 4, porPosicao: 0.15, base: 1 }),
  "serie-a-equador": emEuro({ campeao: 5, porPosicao: 0.18, base: 1.2 }),
  "primera-division-paraguai": emEuro({ campeao: 4, porPosicao: 0.15, base: 1 }),
  "liga-1-peru": emEuro({ campeao: 3.5, porPosicao: 0.12, base: 0.9 }),
  "division-profesional-bolivia": emEuro({ campeao: 2.5, porPosicao: 0.08, base: 0.6 }),
  "primera-division-venezuela": emEuro({ campeao: 2, porPosicao: 0.07, base: 0.5 }),
  "campeonato-paulista": emEuro({ campeao: 5, porPosicao: 0.15, base: 1 }),
  "campeonato-carioca": emEuro({ campeao: 4, porPosicao: 0.12, base: 0.8 }),
  "campeonato-mineiro": emEuro({ campeao: 3, porPosicao: 0.1, base: 0.6 }),
  "campeonato-gaucho": emEuro({ campeao: 3, porPosicao: 0.1, base: 0.6 }),
};
/** Estadual sem valor próprio na tabela. */
export const PREMIO_ESTADUAL_PADRAO = emEuro({ campeao: 1, porPosicao: 0.04, base: 0.2 });

/** Prêmio por fase alcançada (€ mi) das copas: nacional e continentais. */
export const PREMIO_POR_FASE: Readonly<Record<string, readonly number[]>> = {
  "copa-do-brasil": PREMIO_COPA,
  /** Por fase disputada: Fase 1, Fase 2, Fase 3, grupos, oitavas, quartas, semifinal, final (+ título). */
  libertadores: [0.6, 0.8, 1.2, 6, 2.5, 3.5, 5.5, 13, 24].map(deReais),
  /** 1ª fase, grupos, playoffs, oitavas, quartas, semifinal, final (+ título). */
  "sul-americana": [0.4, 1.8, 0.8, 1.2, 1.8, 2.5, 5, 10].map(deReais),
};

/** Valor pela posição final em qualquer liga do catálogo. */
export function premioDaLiga(id: string, posicao: number, total: number): number {
  const p =
    PREMIO_POR_COMPETICAO[id] ?? (id.startsWith("campeonato-") ? PREMIO_ESTADUAL_PADRAO : PREMIO_DIVISAO.D);
  if (posicao === 1) return p.campeao;
  return arredondar(p.base + p.porPosicao * Math.max(0, total - posicao));
}
