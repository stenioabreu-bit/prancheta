import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  fimDeTemporada,
  novaTemporadaDoJogo,
  novoJogo,
  proximoJogoDoUsuario,
  seguir,
  simularPartidaDoUsuario,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import type { PacoteDados } from "../src/pacote";

const PACKS = join(__dirname, "../packs");
const ids = readdirSync(PACKS).filter((d) => d.endsWith("-2026"));

describe("ligas estrangeiras", () => {
  it.each(ids)("%s: temporada completa e virada", (id) => {
    const p = JSON.parse(readFileSync(join(PACKS, id, "pacote.json"), "utf8")) as PacoteDados;
    const jogo = novoJogo({
      semente: 7,
      temporada: p.temporada,
      divisoes: p.divisoes,
      vagasDiretasCopa: p.vagasDiretasCopa,
      formatos: p.formatos!,
      semCopa: true,
      tecnico: "Teste",
      clubeId: p.divisoes.A[0]!.id,
    });
    let guarda = 0;
    while (!fimDeTemporada(jogo) && guarda++ < 200) {
      if (proximoJogoDoUsuario(jogo)) simularPartidaDoUsuario(jogo);
      else seguir(jogo);
    }
    expect(fimDeTemporada(jogo)).toBe(true);
    expect(jogo.temporada.divisoes.A.campeao).toBeTruthy();
    novaTemporadaDoJogo(jogo);
    expect(jogo.temporada.divisoes.A.clubes).toHaveLength(p.divisoes.A.length);
  });
});
