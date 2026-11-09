import { novaTemporada, simularRodada, temporadaEncerrada } from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

// O pacote real fica fora do git; sem ele, o teste é pulado.
const pacote = lerPacote(PASTA_TESTE_REAL);

describe.skipIf(!pacote)("pacote real (elencos 2026)", () => {
  const clubes = Object.values(pacote?.divisoes ?? {}).flat();

  it("todo elenco informado tem goleiro, 16+ jogadores e ids permanentes únicos", () => {
    const ids = new Set<string>();
    for (const c of clubes.filter((c) => c.elenco)) {
      expect(c.elenco!.length, c.nome).toBeGreaterThanOrEqual(16);
      expect(
        c.elenco!.some((j) => j[1] === "GOL"),
        c.nome,
      ).toBe(true);
      for (const j of c.elenco!) {
        const id = j[3]?.id;
        if (!id) continue;
        expect(ids.has(id), `${id} repetido`).toBe(false);
        ids.add(id);
      }
    }
  });

  it("joga uma temporada inteira", () => {
    const estado = novaTemporada({
      semente: 1,
      temporada: pacote!.temporada,
      divisoes: pacote!.divisoes,
      vagasDiretasCopa: pacote!.vagasDiretasCopa,
    });
    for (let g = 0; g < 120 && !temporadaEncerrada(estado); g++) simularRodada(estado);
    expect(temporadaEncerrada(estado)).toBe(true);
  });
});
