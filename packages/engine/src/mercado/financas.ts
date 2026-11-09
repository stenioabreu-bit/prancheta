/**
 * Motor financeiro do clube do técnico (€ milhões). A base de 2026 dá o valor do elenco e o orçamento
 * inicial; caixa, dívida e receita são estimativas internas, marcadas como tal. A semana paga salários,
 * despesas e juros e recebe as receitas; a virada de temporada amortiza a dívida, reavalia a situação e
 * libera o novo orçamento a partir do caixa. Não há dinheiro artificial para equilibrar clubes.
 */
import type { Divisao } from "../competicao/tipos";
import type { Clube } from "../tipos";
import type { Financas, SituacaoFinanceira } from "./tipos";
import { COTACAO, arredondar, formatarDinheiro, salario, valorDeMercado } from "./valores";

export interface SeedFinanceiro {
  valorElenco: number;
  orcamento: number;
}

const DIVIDA_POR_SITUACAO: Record<SituacaoFinanceira, number> = {
  healthy: 0.25,
  stable: 0.6,
  pressured: 1,
  indebted: 1.6,
};
/** Parte do caixa que a diretoria libera para contratações na virada. */
const LIBERA_DO_CAIXA: Record<SituacaoFinanceira, number> = {
  healthy: 0.45,
  stable: 0.3,
  pressured: 0.18,
  indebted: 0.08,
};
/** Margem da receita sobre os gastos fixos: clube saudável sobra, endividado fica no vermelho. */
const MARGEM: Record<SituacaoFinanceira, number> = {
  healthy: 1.06,
  stable: 1.02,
  pressured: 0.98,
  indebted: 0.95,
};
const ORDEM: SituacaoFinanceira[] = ["healthy", "stable", "pressured", "indebted"];
export const NOME_DA_SITUACAO: Record<SituacaoFinanceira, string> = {
  healthy: "saudável",
  stable: "estável",
  pressured: "pressionada",
  indebted: "endividada",
};
const JUROS_ANUAIS = 0.07;
const COMISSAO_EMPRESARIO = 0.05;

function situacaoPeloOrcamento(orcamento: number, valorElenco: number): SituacaoFinanceira {
  const r = orcamento / Math.max(0.1, valorElenco);
  return r >= 0.07 ? "healthy" : r >= 0.035 ? "stable" : r >= 0.015 ? "pressured" : "indebted";
}

function rotuloDaDivida(s: SituacaoFinanceira): Financas["divida"] {
  return s === "indebted" ? "muito alta" : s === "pressured" ? "alta" : "moderada";
}

/** Folha anual (€ mi): salários dos jogadores + 25% de comissão técnica e encargos. */
export function folhaAnual(clube: Clube): number {
  return arredondar((clube.jogadores.reduce((s, j) => s + salario(j), 0) * 12 * 1.25) / 1000);
}

/** Despesas fixas anuais: estádio, CT, viagens e administração (estimativa: 35% da folha). */
function despesasFixas(clube: Clube): number {
  return folhaAnual(clube) * 0.35;
}

/** Finanças ao assumir um clube. Sem dado na base: valor do elenco pela soma dos jogadores (estimado). */
export function financasIniciais(
  clube: Clube,
  divisao: Divisao | null,
  seed: SeedFinanceiro | undefined,
  orcamentoPadrao: number,
  perfil: Financas["perfil"],
  ouvir: number,
  temporada: number,
): Financas {
  const valorElenco =
    seed?.valorElenco ?? arredondar(clube.jogadores.reduce((s, j) => s + valorDeMercado(j, divisao), 0));
  const orcamento = seed?.orcamento ?? orcamentoPadrao;
  const situacao = situacaoPeloOrcamento(orcamento, valorElenco);
  const dividaTotal = arredondar(valorElenco * DIVIDA_POR_SITUACAO[situacao]);
  const receitaAnual = arredondar(
    (folhaAnual(clube) + despesasFixas(clube) + dividaTotal * JUROS_ANUAIS) * MARGEM[situacao],
  );
  const caixa = arredondar(orcamento * 1.5 + receitaAnual * 0.05);
  return {
    orcamento,
    divida: rotuloDaDivida(situacao),
    perfil: situacao === "indebted" ? "economico" : perfil,
    ouvir,
    caixa,
    dividaTotal,
    receitaAnual,
    situacao,
    valorElenco,
    fonteValorElenco: seed ? "other_market_reference" : "estimated",
    fonteOrcamento: "gameplay_estimate",
    orcamentoInicial: orcamento,
    atualizadoEm: `${temporada}-01-05`,
    caixaNoInicio: caixa,
    prejuizosSeguidos: 0,
    movimentos: [],
  };
}

/** Saves antigos guardavam só o orçamento, em reais: converte e completa os campos. */
export function completarFinancas(
  f: Financas,
  clube: Clube,
  divisao: Divisao | null,
  temporada: number,
): void {
  if (f.caixa !== undefined) return;
  const orcamento = arredondar(f.orcamento / COTACAO.BRL);
  Object.assign(f, financasIniciais(clube, divisao, undefined, orcamento, f.perfil, f.ouvir, temporada));
}

export function registrar(
  f: Financas,
  temporada: number,
  rodada: number,
  descricao: string,
  valor: number,
): void {
  f.movimentos ??= [];
  f.movimentos.unshift({ temporada, rodada, descricao, valor: arredondar(valor) });
  if (f.movimentos.length > 200) f.movimentos.length = 200;
}

/** Entrada de dinheiro (prêmio): vai para o caixa e uma parte vira verba de contratação. */
export function creditar(
  f: Financas,
  valor: number,
  descricao: string,
  temporada: number,
  rodada: number,
  paraOrcamento = 0.5,
): void {
  f.caixa = arredondar((f.caixa ?? 0) + valor);
  f.orcamento = arredondar(f.orcamento + valor * paraOrcamento);
  registrar(f, temporada, rodada, descricao, valor);
}

/** Compra: sai do orçamento e do caixa, mais a comissão do empresário. */
export function pagarContratacao(
  f: Financas,
  custo: number,
  nome: string,
  temporada: number,
  rodada: number,
) {
  const comissao = arredondar(custo * COMISSAO_EMPRESARIO);
  f.orcamento = arredondar(Math.max(0, f.orcamento - custo));
  f.caixa = arredondar((f.caixa ?? 0) - custo - comissao);
  registrar(f, temporada, rodada, `Contratação de ${nome}`, -custo);
  registrar(f, temporada, rodada, `Comissão de empresário (${nome})`, -comissao);
}

/** Venda: o valor entra no caixa; parte vira orçamento (menos com presidente econômico ou dívida alta). */
export function receberVenda(f: Financas, valor: number, nome: string, temporada: number, rodada: number) {
  const parte = f.perfil === "economico" || f.situacao === "indebted" ? 0.25 : 0.5;
  f.caixa = arredondar((f.caixa ?? 0) + valor);
  f.orcamento = arredondar(f.orcamento + valor * parte);
  registrar(f, temporada, rodada, `Venda de ${nome}`, valor);
}

/** Semana: receitas, salários, despesas fixas e juros. Lança no histórico a cada 4 semanas. */
export function fluxoSemanal(f: Financas, clube: Clube, temporada: number, rodada: number): void {
  const receitas = (f.receitaAnual ?? 0) / 52;
  const salarios = folhaAnual(clube) / 52;
  const despesas = despesasFixas(clube) / 52;
  const juros = ((f.dividaTotal ?? 0) * JUROS_ANUAIS) / 52;
  f.caixa = arredondar((f.caixa ?? 0) + receitas - salarios - despesas - juros);
  const a = (f.acumulado ??= { receitas: 0, salarios: 0, despesas: 0, juros: 0, semanas: 0 });
  a.receitas += receitas;
  a.salarios += salarios;
  a.despesas += despesas;
  a.juros += juros;
  a.semanas++;
  if (a.semanas < 4) return;
  registrar(f, temporada, rodada, "Receitas (TV, bilheteria, sócios, patrocínios)", a.receitas);
  registrar(f, temporada, rodada, "Folha salarial (elenco e comissão)", -a.salarios);
  registrar(f, temporada, rodada, "Despesas (estádio, CT, viagens, administração)", -a.despesas);
  if (a.juros > 0) registrar(f, temporada, rodada, "Juros da dívida", -a.juros);
  f.acumulado = { receitas: 0, salarios: 0, despesas: 0, juros: 0, semanas: 0 };
}

export interface FechamentoDoAno {
  temporada: number;
  /** -1 rebaixado, 0 ficou, 1 subiu. */
  mudouDeDivisao: number;
  disputouContinental: boolean;
  /** Colocação relativa na liga (0 = campeão, 1 = lanterna). */
  colocacao: number | null;
}

/** Virada de temporada: amortiza ou rola a dívida, reavalia receitas e situação e libera o novo orçamento. */
export function fecharAnoFinanceiro(f: Financas, clube: Clube, x: FechamentoDoAno): string {
  const t = x.temporada;
  const resultado = arredondar((f.caixa ?? 0) - (f.caixaNoInicio ?? f.caixa ?? 0));
  f.prejuizosSeguidos = resultado < 0 ? (f.prejuizosSeguidos ?? 0) + 1 : 0;
  let caixa = f.caixa ?? 0;
  let divida = f.dividaTotal ?? 0;
  if (caixa < 0) {
    divida += -caixa;
    registrar(f, t, 0, "Empréstimo para cobrir o caixa negativo", -caixa);
    caixa = 0;
  } else {
    const amortiza = Math.min(caixa * 0.3, divida * 0.1);
    if (amortiza > 0) {
      caixa -= amortiza;
      divida -= amortiza;
      registrar(f, t, 0, "Amortização da dívida", -amortiza);
    }
  }
  let fator = 1;
  if (x.mudouDeDivisao > 0) fator *= 1.8;
  if (x.mudouDeDivisao < 0) fator *= 0.55;
  if (x.disputouContinental) fator *= 1.08;
  if (x.colocacao !== null) fator *= x.colocacao <= 0.25 ? 1.05 : x.colocacao >= 0.75 ? 0.95 : 1;
  f.receitaAnual = arredondar((f.receitaAnual ?? 0) * fator);
  const peso = divida / Math.max(0.1, f.receitaAnual);
  let i = peso < 0.6 ? 0 : peso < 1.2 ? 1 : peso < 2 ? 2 : 3;
  if ((f.prejuizosSeguidos ?? 0) >= 2) i = Math.min(3, i + 1);
  const situacao = ORDEM[i]!;
  f.situacao = situacao;
  f.divida = rotuloDaDivida(situacao);
  if (situacao === "indebted") f.perfil = "economico";
  f.caixa = arredondar(caixa);
  f.dividaTotal = arredondar(divida);
  f.orcamento = arredondar(Math.max(0, caixa * LIBERA_DO_CAIXA[situacao]));
  f.caixaNoInicio = f.caixa;
  f.atualizadoEm = `${t + 1}-01-05`;
  return (
    `Balanço de ${t}: ${resultado >= 0 ? "superávit" : "déficit"} de ${formatarDinheiro(Math.abs(resultado))}. ` +
    `Caixa ${formatarDinheiro(f.caixa)}, dívida ${formatarDinheiro(f.dividaTotal)}, situação ${NOME_DA_SITUACAO[situacao]}. ` +
    `Orçamento para contratações em ${t + 1}: ${formatarDinheiro(f.orcamento)}. Folha anual: ${formatarDinheiro(folhaAnual(clube))}.`
  );
}
