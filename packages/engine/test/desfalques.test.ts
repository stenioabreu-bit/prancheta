import { describe, expect, it } from "vitest";
import { criarClube } from "../src/clube";
import { reporDesfalques } from "../src/carreira/treino";
import { recuperarEntreRodadas } from "../src/liga";
import { criarRng } from "../src/rng";

describe("desfalques e descanso", () => {
  const clube = criarClube({ id: "x", nome: "X", sigla: "XXX", nivel: 70 }, criarRng(1));
  it("titular suspenso sai e volta ao time quando cumpre a suspensão", () => {
    const titular = clube.jogadores.find((j) => j.id === clube.titulares[5])!;
    titular.susp = 1;
    clube.reservas = clube.jogadores
      .filter((x) => !clube.titulares.includes(x.id))
      .slice(0, 10)
      .map((x) => x.id);
    reporDesfalques(clube);
    expect(clube.titulares).not.toContain(titular.id);
    expect(clube.reservas).not.toContain(titular.id);
    recuperarEntreRodadas([clube]);
    recuperarEntreRodadas([clube]);
    expect(titular.susp).toBe(0);
    reporDesfalques(clube);
    expect(clube.titulares[5]).toBe(titular.id);
  });
  it("quem não joga recupera a condição rápido", () => {
    const j = clube.jogadores[0]!;
    j.cond = 40;
    j.semJogar = 1;
    recuperarEntreRodadas([clube]);
    expect(j.cond).toBeGreaterThanOrEqual(78);
  });
});
