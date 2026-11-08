import { describe, expect, it } from "vitest";
import {
  ESQUEMA_POSTOS,
  criarClube,
  criarJogador,
  criarRng,
  escalarAutomatico,
  familiaridade,
  jogadorDoClube,
} from "../src";
import { clubesDeTeste } from "./apoio";

describe("jogador", () => {
  it("deriva atributos do overall de forma determinística e respeita os informados", () => {
    const a = criarJogador(["Fulano", "ATA", 75, { FIN: 88 }], "x", 0);
    const b = criarJogador(["Fulano", "ATA", 75, { FIN: 88 }], "x", 0);
    expect(a.at).toEqual(b.at);
    expect(a.at.FIN).toBe(88);
    expect(a.at.GOL).toBe(25);
    for (const v of Object.values(a.at)) {
      expect(v).toBeGreaterThanOrEqual(20);
      expect(v).toBeLessThanOrEqual(95);
    }
  });

  it("rende menos fora de posição", () => {
    const j = criarJogador(["Ciclano", "LD", 70, { alt: ["PD"] }], "x", 0);
    expect(familiaridade(j, "LD")).toBe(1);
    expect(familiaridade(j, "PD")).toBe(0.97);
    expect(familiaridade(j, "LE")).toBe(0.84);
    expect(familiaridade(j, "GOL")).toBe(0.3);
  });
});

describe("escalação automática", () => {
  it("escala 11 jogadores diferentes, goleiro no gol, sem lesionados nem suspensos", () => {
    const clube = criarClube(clubesDeTeste(1)[0]!, criarRng(5));
    const titularAnterior = jogadorDoClube(clube, clube.titulares[0]!);
    titularAnterior.lesao = 2;
    const xi = escalarAutomatico(clube, clube.esquema);
    expect(new Set(xi).size).toBe(11);
    expect(xi).not.toContain(titularAnterior.id);
    const goleiro = jogadorDoClube(clube, xi[ESQUEMA_POSTOS[clube.esquema].findIndex(([p]) => p === "GOL")]!);
    expect(goleiro.pos).toBe("GOL");
  });

  it("mantém os titulares preferidos quando eles servem para o posto", () => {
    const clube = criarClube(
      {
        id: "t",
        nome: "Teste",
        sigla: "TST",
        esquema: "4-4-2",
        elenco: [
          ["G1", "GOL", 70],
          ["G2", "GOL", 72],
          ["LD1", "LD", 70],
          ["LE1", "LE", 70],
          ["Z1", "ZAG", 70],
          ["Z2", "ZAG", 70],
          ["Z3", "ZAG", 71],
          ["V1", "VOL", 70],
          ["M1", "MC", 70],
          ["PD1", "PD", 70],
          ["PE1", "PE", 70],
          ["A1", "ATA", 70],
          ["A2", "ATA", 70],
        ],
        titulares: ["G1", "LD1", "LE1", "Z1", "Z2", "V1", "M1", "PD1", "PE1", "A1", "A2"],
      },
      criarRng(1),
    );
    const nomes = clube.titulares.map((id) => jogadorDoClube(clube, id).nome);
    expect(nomes).toContain("G1");
    expect(nomes).not.toContain("G2");
    expect(nomes).not.toContain("Z3");
  });
});
