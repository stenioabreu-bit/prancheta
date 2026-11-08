import type { Divisao } from "../competicao/tipos";
import type { Jogador, Posicao } from "../tipos";

/** Rodadas com janela de transferências aberta (pré-temporada e meio do ano). */
export const JANELAS: readonly [number, number][] = [
  [0, 3],
  [17, 21],
];

export function janelaAberta(rodada: number): boolean {
  return JANELAS.some(([a, b]) => rodada >= a && rodada <= b);
}

export function proximaJanela(rodada: number): number | null {
  return JANELAS.find(([a]) => a > rodada)?.[0] ?? null;
}

const PESO_DIVISAO_NO_VALOR: Record<Divisao, number> = { A: 1, B: 0.75, C: 0.55, D: 0.55 };
export const PESO_DIVISAO_NO_MERCADO: Record<Divisao, number> = { A: 1, B: 0.45, C: 0.18, D: 0.07 };

/** Valor de mercado (R$ mi): cresce exponencialmente com o overall; jovem vale mais, veterano menos. */
export function valorDeMercado(j: Jogador, divisao: Divisao | null): number {
  const base = 0.55 * Math.exp((j.ovr - 60) / 6.2);
  const idade = j.daBase || j.perso === "jovem" ? 1.35 : j.perso === "veterano" ? 0.55 : 1;
  return Math.max(0.1, Math.round(base * idade * PESO_DIVISAO_NO_VALOR[divisao ?? "A"] * 10) / 10);
}

/** Salário mensal (R$ mil). */
export function salario(j: Jogador): number {
  return Math.max(15, Math.round(18 * Math.exp((j.ovr - 60) / 9)));
}

export function formatarDinheiro(milhoes: number): string {
  return milhoes >= 1
    ? `R$ ${milhoes.toFixed(1).replace(".", ",")} mi`
    : `R$ ${Math.round(milhoes * 1000)} mil`;
}

export type SetorDoMercado = "GOL" | "DEF" | "MEIO" | "ATA";

export function setorDaPosicao(pos: Posicao): SetorDoMercado {
  if (pos === "GOL") return "GOL";
  if (pos === "ZAG" || pos === "LD" || pos === "LE") return "DEF";
  if (pos === "VOL" || pos === "MC" || pos === "MEI") return "MEIO";
  return "ATA";
}

/** Orçamento inicial por divisão (R$ mi). */
export function orcamentoInicial(divisao: Divisao, grande: boolean): number {
  return { A: grande ? 9 : 4.5, B: 2.5, C: 0.8, D: 0.3 }[divisao];
}

/** Prêmio (R$ mi) por avançar em cada fase da Copa do Brasil (valores do jogo). */
export const PREMIO_COPA: readonly number[] = [0.1, 0.15, 0.25, 0.4, 1.5, 2.5, 4, 6, 10];

/** Reputação mínima que o clube exige do técnico. */
export function exigenciaDoClube(divisao: Divisao, grande: boolean): number {
  return { A: 52, B: 38, C: 25, D: 12 }[divisao] + (grande ? 14 : 0);
}

/** Premiação (R$ mi) pela colocação final na divisão: [campeão, demais por posição...]; valores do jogo. */
export const PREMIO_DIVISAO: Readonly<
  Record<"A" | "B" | "C" | "D", { campeao: number; porPosicao: number; base: number }>
> = {
  A: { campeao: 48, porPosicao: 1.6, base: 12 },
  B: { campeao: 8, porPosicao: 0.3, base: 2.5 },
  C: { campeao: 3, porPosicao: 0.1, base: 0.8 },
  D: { campeao: 1, porPosicao: 0.02, base: 0.2 },
};

/** Valor pela posição final (1 = campeão). Quanto melhor a colocação, maior o prêmio. */
export function premioPorColocacao(divisao: "A" | "B" | "C" | "D", posicao: number, total: number): number {
  const p = PREMIO_DIVISAO[divisao];
  if (posicao === 1) return p.campeao;
  return Math.round((p.base + p.porPosicao * Math.max(0, total - posicao)) * 10) / 10;
}
