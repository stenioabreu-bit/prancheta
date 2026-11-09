import { describe, expect, it } from "vitest";
import {
  conflitosDeCalendario,
  horarioLivre,
  novaTemporada,
  simularRodada,
  temporadaEncerrada,
  ultimaSemanaAgendada,
} from "../src";
import { type ClubeDados, DIVISOES, type Divisao } from "../src";

const TAMANHO: Record<Divisao, number> = { A: 20, B: 20, C: 20, D: 96 };
function pacoteDeTeste() {
  const divisoes = {} as Record<Divisao, ClubeDados[]>;
  for (const d of DIVISOES) {
    divisoes[d] = Array.from({ length: TAMANHO[d] }, (_, i) => ({
      id: `${d.toLowerCase()}${i}`,
      nome: `Clube ${d}${i}`,
      sigla: `${d}${String(i).padStart(2, "0")}`,
      nivel: 70 - (i % 9),
    }));
  }
  return { semente: 3, temporada: 2026, divisoes, vagasDiretasCopa: ["c0", "c1", "d0", "d1"] };
}

describe("calendário", () => {
  it("temporada brasileira inteira sem clube com dois jogos no mesmo horário", () => {
    const estado = novaTemporada(pacoteDeTeste());
    let guarda = 0;
    while (!temporadaEncerrada(estado) && guarda++ < 120) simularRodada(estado);
    expect(temporadaEncerrada(estado)).toBe(true);
    expect(conflitosDeCalendario(estado.jogos)).toEqual([]);
    expect(estado.rodada).toBeGreaterThan(ultimaSemanaAgendada(estado.jogos));
  });

  it("acha o primeiro horário livre de um grupo de clubes", () => {
    const estado = novaTemporada(pacoteDeTeste());
    const ids = estado.divisoes.A.clubes.slice(0, 2);
    const primeira = Object.values(estado.jogos).find((j) => j.competicao === "A")!.rodada;
    expect(horarioLivre(estado.jogos, ids, 0, true)).toBe(0);
    expect(horarioLivre(estado.jogos, ids, primeira, true)).not.toBe(primeira);
  });
});
