import {
  fimDeTemporada,
  idaDoConfronto,
  novaTemporadaDoJogo,
  novoJogo,
  proximoJogoDoUsuario,
  rankingDaCompeticao,
  seguir,
  simularPartidaDoUsuario,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

const pacote = lerPacote(PASTA_TESTE_REAL)!;

describe("títulos e ida e volta", () => {
  it("cada competição vencida vira título uma vez só; jogos de volta mostram a ida", () => {
    const j = novoJogo({
      semente: 5,
      temporada: 2026,
      divisoes: pacote.divisoes,
      vagasDiretasCopa: pacote.vagasDiretasCopa,
      estaduais: pacote.estaduais!,
      clubesExtras: pacote.clubesExtras!,
      continentais: pacote.continentais!,
      tecnico: "Teste",
      clubeId: "flamengo",
    });
    let voltas = 0;
    let g = 0;
    while (!fimDeTemporada(j) && g++ < 200) {
      j.carreira.diretoria = 70;
      const p = proximoJogoDoUsuario(j);
      if (p && idaDoConfronto(j.temporada, p)) voltas++;
      if (p) simularPartidaDoUsuario(j);
      else seguir(j);
    }
    const t = j.temporada;
    const venceu = [
      ...(["A"] as const).filter((d) => t.divisoes[d].campeao === "flamengo"),
      ...Object.entries(t.estaduais ?? {})
        .filter(([, e]) => e.campeao === "flamengo")
        .map(([uf]) => `est-${uf}`),
      ...(t.copa.campeao === "flamengo" ? ["copa"] : []),
      ...Object.entries(t.continentais ?? {})
        .filter(([, c]) => c.campeao === "flamengo")
        .map(([id]) => id),
    ];
    for (const c of ["A", "est-SP", "copa"]) {
      const r = rankingDaCompeticao(t, c, "gols", 5);
      expect(r.length).toBeGreaterThan(0);
      for (const l of r) expect(l.valor).toBe(l.jogador.temporada.porCompeticao![c]!.gols);
    }
    expect(rankingDaCompeticao(t, "A", "notas", 5).length).toBeGreaterThan(0);
    expect(rankingDaCompeticao(t, "est-SP", "goleiros", 5).length).toBeGreaterThan(0);
    novaTemporadaDoJogo(j);
    const titulos = (j.carreira.titulos ?? []).filter((x) => x.temporada === 2026).map((x) => x.competicao);
    expect(new Set(titulos).size).toBe(titulos.length);
    for (const c of venceu) expect(titulos).toContain(c);
    expect(voltas).toBeGreaterThan(0);
  });
});
