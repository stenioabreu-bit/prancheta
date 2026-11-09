import {
  fimDeTemporada,
  novaTemporada,
  novoJogo,
  proximoJogoDoUsuario,
  seguir,
  simularPartidaDoUsuario,
  simularRodada,
  temporadaEncerrada,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { pacoteFicticio } from "../src";

describe("pacote fictício", () => {
  const pacote = pacoteFicticio();
  const clubes = Object.values(pacote.divisoes).flat();

  it("tem os tamanhos dos formatos de 2026 e ids e siglas únicos", () => {
    expect(pacote.divisoes.A).toHaveLength(20);
    expect(pacote.divisoes.B).toHaveLength(20);
    expect(pacote.divisoes.C).toHaveLength(20);
    expect(pacote.divisoes.D).toHaveLength(96);
    expect(new Set(clubes.map((c) => c.id)).size).toBe(clubes.length);
    expect(new Set(clubes.map((c) => c.sigla)).size).toBe(clubes.length);
    expect(clubes.every((c) => /^[A-Z]{3}$/.test(c.sigla))).toBe(true);
  });

  it("as vagas diretas da Copa existem no pacote", () => {
    const ids = new Set(clubes.map((c) => c.id));
    expect(pacote.vagasDiretasCopa.every((id) => ids.has(id))).toBe(true);
  });

  it("joga uma temporada inteira", () => {
    const estado = novaTemporada({
      semente: 1,
      temporada: pacote.temporada,
      divisoes: pacote.divisoes,
      vagasDiretasCopa: pacote.vagasDiretasCopa,
    });
    for (let g = 0; g < 120 && !temporadaEncerrada(estado); g++) simularRodada(estado);
    expect(temporadaEncerrada(estado)).toBe(true);
  });
});

describe("carreira com o pacote fictício", () => {
  it("clássicos apontam para clubes do pacote e a temporada de técnico termina", () => {
    const pacote = pacoteFicticio();
    const ids = new Set(
      Object.values(pacote.divisoes)
        .flat()
        .map((c) => c.id),
    );
    expect(pacote.classicos.flat().every((id) => ids.has(id))).toBe(true);
    const estado = novoJogo({
      semente: 2,
      temporada: pacote.temporada,
      divisoes: pacote.divisoes,
      vagasDiretasCopa: pacote.vagasDiretasCopa,
      classicos: pacote.classicos,
      tecnico: "Teste",
      clubeId: pacote.divisoes.A[0]!.id,
    });
    let guarda = 0;
    while (!fimDeTemporada(estado) && guarda++ < 200) {
      if (proximoJogoDoUsuario(estado)) simularPartidaDoUsuario(estado);
      else seguir(estado);
    }
    expect(fimDeTemporada(estado)).toBe(true);
  });
});
