/**
 * Testes estatísticos: travam o comportamento atual do motor (equivalente ao
 * protótipo) para que qualquer ajuste de fórmula seja uma decisão consciente.
 * Os limites são os números do protótipo com folga, não a meta de realismo.
 */
import { describe, expect, it } from "vitest";
import {
  type Clube,
  calendarioPontosCorridos,
  criarClube,
  criarPartida,
  criarRng,
  encerrarPartida,
  estatisticasRapidas,
  jogarAteOFim,
  placarRapido,
  recuperarEntreRodadas,
} from "../src";
import { clubesDeTeste } from "./apoio";

function temporada(semente: number, modo: "motor" | "rapido") {
  const rng = criarRng(semente);
  const clubes = new Map<string, Clube>(clubesDeTeste().map((d) => [d.id, criarClube(d, rng)]));
  const placares: [number, number][] = [];
  const golsPorClube = new Map<string, number>();
  for (const rodada of calendarioPontosCorridos(rng, [...clubes.keys()])) {
    for (const { casa, visitante } of rodada) {
      const c = clubes.get(casa)!;
      const v = clubes.get(visitante)!;
      let gc: number;
      let gv: number;
      if (modo === "motor") {
        const m = criarPartida(c, v, { rng });
        jogarAteOFim(m);
        const r = encerrarPartida(m);
        gc = r.golsCasa;
        gv = r.golsVisitante;
      } else {
        [gc, gv] = placarRapido(rng, c, v);
        estatisticasRapidas(rng, c, gc, gv);
        estatisticasRapidas(rng, v, gv, gc);
      }
      placares.push([gc, gv]);
      golsPorClube.set(casa, (golsPorClube.get(casa) ?? 0) + gc);
      golsPorClube.set(visitante, (golsPorClube.get(visitante) ?? 0) + gv);
    }
    recuperarEntreRodadas(clubes.values());
  }
  const artilheiro = Math.max(
    ...[...clubes.values()].flatMap((c) => c.jogadores.map((j) => j.temporada.gols)),
  );
  return { placares, golsPorClube, artilheiro };
}

describe.each(["motor", "rapido"] as const)("calibração (%s)", (modo) => {
  const temporadas = [1, 2, 3, 4, 5].map((s) => temporada(s, modo));
  const placares = temporadas.flatMap((t) => t.placares);
  const golsPorJogo = placares.reduce((s, [a, b]) => s + a + b, 0) / placares.length;

  it("média de gols por jogo entre 2,3 e 2,9", () => {
    expect(golsPorJogo).toBeGreaterThan(2.3);
    expect(golsPorJogo).toBeLessThan(2.9);
  });

  it("sem bola de neve: nenhum clube passa de 3 gols por jogo na temporada", () => {
    for (const t of temporadas) for (const gols of t.golsPorClube.values()) expect(gols / 38).toBeLessThan(3);
  });

  it("goleadas de 6+ gols de diferença ficam abaixo de 4% (protótipo: ~2–2,5%)", () => {
    expect(placares.filter(([a, b]) => Math.abs(a - b) >= 6).length / placares.length).toBeLessThan(0.04);
  });

  it("artilheiro dentro da faixa do protótipo", () => {
    const media = temporadas.reduce((s, t) => s + t.artilheiro, 0) / temporadas.length;
    expect(media).toBeGreaterThan(15);
    expect(media).toBeLessThan(modo === "motor" ? 48 : 32);
  });
});
