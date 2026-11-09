import {
  buscarNoMercado,
  novoJogo,
  pedirAoOlheiro,
  rankingDaCompeticao,
  resolverOlheiro,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

const pacote = lerPacote(PASTA_TESTE_REAL)!;
const j = novoJogo({
  semente: 3,
  temporada: 2026,
  divisoes: pacote.divisoes,
  vagasDiretasCopa: pacote.vagasDiretasCopa,
  estaduais: pacote.estaduais!,
  clubesExtras: pacote.clubesExtras!,
  continentais: pacote.continentais!,
  tecnico: "Teste",
  clubeId: "bahia",
});

describe("mercado, olheiro e rankings", () => {
  it("mercado inclui estrangeiros das copas continentais", () => {
    const fora = buscarNoMercado(j, { origem: "exterior", limite: 50 });
    expect(fora.length).toBeGreaterThan(0);
    expect(fora.every((i) => i.estrangeiro)).toBe(true);
  });

  it("olheiro filtra por posição, atributo e faixa de preço e entrega o relatório", () => {
    pedirAoOlheiro(
      j,
      { posicao: "ATA", atributo: "VEL", atributoMinimo: 75, valorMinimo: 0.2, valorMaximo: 1 },
      "ATA rápidos",
    );
    j.temporada.rodada += 2;
    resolverOlheiro(j);
    const p = j.mercado.olheiro![0]!;
    expect(p.resultado).toBeDefined();
    const todos = Object.values(j.temporada.clubes).flatMap((c) => c.jogadores);
    for (const id of p.resultado!) {
      const x = todos.find((y) => y.id === id)!;
      expect(x.at.VEL).toBeGreaterThanOrEqual(75);
    }
    j.temporada.rodada -= 2;
  });

  it("ranking de competição que não é Série usa os números da competição", () => {
    expect(rankingDaCompeticao(j.temporada, "copa", "notas")).toEqual([]);
    expect(Array.isArray(rankingDaCompeticao(j.temporada, "est-SP", "gols"))).toBe(true);
  });

  it("nenhum jogador de clube pequeno com overall de craque (homônimo do FC26)", () => {
    const treze = j.temporada.clubes.treze;
    if (treze) expect(Math.max(...treze.jogadores.map((x) => x.ovr))).toBeLessThan(75);
  });
});

describe("metas por competição", () => {
  it("clube da Série A tem meta no estadual, na Série, na Copa e mostra o estadual como competição do momento", async () => {
    const { metasDaTemporada, competicaoDoMomento, gritarDaBeira, iniciarPartida } = await import(
      "@prancheta/engine"
    );
    const metas = metasDaTemporada(j.temporada, j.carreira);
    const ids = metas.map((x) => x.competicao);
    expect(ids).toContain("est-BA");
    expect(ids).toContain("A");
    expect(competicaoDoMomento(j.temporada, j.carreira)).toBe("est-BA");
    const m = iniciarPartida(j);
    const eu = m.casa.ehUsuario ? m.casa : m.visitante;
    m.fase = "jogo";
    m.minuto = 10;
    const antes = eu.bonus.A;
    gritarDaBeira(m, eu, "incentivar");
    expect(eu.bonus.A).toBeGreaterThan(antes);
    expect(gritarDaBeira(m, eu, "cobrar")).toContain("digerindo");
  });
});
