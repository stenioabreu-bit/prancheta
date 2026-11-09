import {
  fimDeTemporada,
  formatarDinheiro,
  novaTemporadaDoJogo,
  novoJogo,
  proximoJogoDoUsuario,
  seguir,
  simularPartidaDoUsuario,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { FINANCAS_2026 } from "../src";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

const pacote = lerPacote(PASTA_TESTE_REAL)!;

function carreira(clubeId: string) {
  return novoJogo({
    semente: 4,
    temporada: 2026,
    divisoes: pacote.divisoes,
    vagasDiretasCopa: pacote.vagasDiretasCopa,
    estaduais: pacote.estaduais!,
    clubesExtras: pacote.clubesExtras!,
    continentais: pacote.continentais!,
    financas: FINANCAS_2026,
    moeda: "BRL",
    tecnico: "Teste",
    clubeId,
  });
}

describe("finanças", () => {
  it("orçamento inicial e valor do elenco saem da base de 2026; situação pelo porte", () => {
    const f = carreira("corinthians").mercado.financas;
    expect(f.orcamento).toBe(1.5);
    expect(f.valorElenco).toBe(150.3);
    expect(f.fonteValorElenco).toBe("other_market_reference");
    expect(f.situacao).toBe("indebted");
    expect(carreira("flamengo").mercado.financas.situacao).toBe("healthy");
  });

  it("formata na moeda escolhida pela cotação fixa", () => {
    expect(formatarDinheiro(1, "EUR")).toBe("€ 1,0 mi");
    expect(formatarDinheiro(1, "BRL")).toBe("R$ 6,1 mi");
    expect(formatarDinheiro(0.5, "USD")).toBe("US$ 557 mil");
  });

  it("uma temporada movimenta o caixa e a virada recalcula orçamento e situação", () => {
    const j = carreira("flamengo");
    let g = 0;
    while (!fimDeTemporada(j) && g++ < 200) {
      j.carreira.diretoria = 70;
      if (proximoJogoDoUsuario(j)) simularPartidaDoUsuario(j);
      else seguir(j);
    }
    const f = j.mercado.financas;
    expect(f.movimentos!.some((m) => m.descricao.startsWith("Folha salarial"))).toBe(true);
    expect(j.carreira.clubeId).toBe("flamengo");
    novaTemporadaDoJogo(j);
    expect(j.mercado.financas).toBe(f);
    expect(f.atualizadoEm).toBe("2027-01-05");
    expect(f.orcamento).toBeGreaterThanOrEqual(0);
    expect(f.caixa).toBeGreaterThanOrEqual(0);
    expect(Math.abs(f.caixa!)).toBeLessThan(200);
    expect(j.carreira.caixa.some((m) => m.assunto === "Balanço financeiro do ano")).toBe(true);
  });
});
