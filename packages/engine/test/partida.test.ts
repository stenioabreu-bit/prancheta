import { describe, expect, it } from "vitest";
import {
  criarClube,
  criarPartida,
  criarRng,
  encerrarPartida,
  jogarAteOFim,
  passo,
  podeSubstituir,
  recuperarEntreRodadas,
  substituir,
} from "../src";
import { clubesDeTeste, doisClubes } from "./apoio";

function jogar(semente: number) {
  const { casa, visitante, rng } = doisClubes(criarRng(semente));
  const partida = criarPartida(casa, visitante, { rng });
  jogarAteOFim(partida);
  return { partida, resultado: encerrarPartida(partida), casa, visitante };
}

describe("partida minuto a minuto", () => {
  it("é reproduzível: mesma semente, mesmos eventos e placar", () => {
    const a = jogar(123);
    const b = jogar(123);
    expect(a.partida.eventos).toEqual(b.partida.eventos);
    expect(a.resultado).toEqual(b.resultado);
  });

  it("sementes diferentes geram jogos diferentes", () => {
    const narracoes = new Set([1, 2, 3, 4, 5].map((s) => JSON.stringify(jogar(s).partida.eventos)));
    expect(narracoes.size).toBe(5);
  });

  it("para no intervalo e termina aos 90", () => {
    const { casa, visitante, rng } = doisClubes();
    const m = criarPartida(casa, visitante, { rng });
    let r = passo(m);
    while (r === "seguiu") r = passo(m);
    expect(r).toBe("intervalo");
    expect(m.minuto).toBe(45);
    while (r !== "fim") r = passo(m);
    expect(m.minuto).toBe(90);
    expect(m.fase).toBe("fim");
    expect(passo(m)).toBe("encerrada");
  });

  it("o placar bate com os eventos de gol e a posse fecha 100%", () => {
    for (const s of [10, 11, 12]) {
      const { partida, resultado } = jogar(s);
      const gols = partida.eventos.filter((e) => e.tipo === "gol");
      expect(gols.filter((e) => e.lado === "casa").length).toBe(resultado.golsCasa);
      expect(gols.filter((e) => e.lado === "visitante").length).toBe(resultado.golsVisitante);
      expect(resultado.est.casa.posse + resultado.est.visitante.posse).toBe(100);
    }
  });

  it("limita a 5 trocas em 3 paradas; o intervalo não conta como parada", () => {
    const { casa, visitante, rng } = doisClubes();
    const m = criarPartida(casa, visitante, { rng, usuarioId: casa.id });
    const lado = m.casa;
    const trocar = () => {
      const sai = lado.emCampo.find((p) => p.posto !== "GOL" && !p.atual.usado)!.atual.jogador.id;
      const entra = lado.banco.find((b) => !b.usado)!.jogador.id;
      return substituir(m, lado, sai, entra);
    };
    while (passo(m) !== "intervalo") {
      /* até o intervalo */
    }
    expect(trocar()).toBe(true);
    expect(trocar()).toBe(true);
    expect(lado.paradas).toBe(0);
    passo(m);
    expect(trocar()).toBe(true);
    passo(m);
    expect(trocar()).toBe(true);
    passo(m);
    expect(trocar()).toBe(true);
    expect(lado.trocas).toBe(5);
    expect(lado.paradas).toBe(3);
    expect(podeSubstituir(m, lado)).toBe(false);
    expect(trocar()).toBe(false);
  });

  it("a terceira parada fecha a janela mesmo com trocas sobrando", () => {
    const { casa, visitante, rng } = doisClubes();
    const m = criarPartida(casa, visitante, { rng, usuarioId: casa.id });
    const lado = m.casa;
    for (let i = 0; i < 3; i++) {
      passo(m);
      const sai = lado.emCampo.find((p) => p.posto !== "GOL" && !p.atual.usado)!.atual.jogador.id;
      expect(substituir(m, lado, sai, lado.banco.find((b) => !b.usado)!.jogador.id)).toBe(true);
    }
    passo(m);
    expect(lado.trocas).toBe(3);
    expect(podeSubstituir(m, lado)).toBe(false);
  });
});

describe("fim de jogo e rodada", () => {
  it("moral regride para o centro: (moral·0,7 + moral do jogo·0,3)·0,88 + 62·0,12 ± 3", () => {
    const { partida, resultado, casa } = jogar(77);
    const titular = partida.casa.emCampo[0]!.atual;
    const esperado = Math.max(
      0,
      Math.min(
        100,
        Math.round((62 * 0.7 + titular.moral * 0.3) * 0.88 + 62 * 0.12) +
          (resultado.golsCasa > resultado.golsVisitante
            ? 3
            : resultado.golsCasa < resultado.golsVisitante
              ? -3
              : 0),
      ),
    );
    expect(casa.jogadores.find((j) => j.id === titular.jogador.id)!.moral).toBe(esperado);
  });

  it("suspenso perde exatamente uma rodada", () => {
    const clube = criarClube(clubesDeTeste(1)[0]!, criarRng(2));
    const j = clube.jogadores[0]!;
    j.susp = 1;
    recuperarEntreRodadas([clube]);
    expect(j.susp).toBe(1);
    recuperarEntreRodadas([clube]);
    expect(j.susp).toBe(0);
  });

  it("lesão começa a contar só na rodada seguinte", () => {
    const clube = criarClube(clubesDeTeste(1)[0]!, criarRng(2));
    const j = clube.jogadores[0]!;
    j.lesao = 2;
    j.recemLesionado = true;
    recuperarEntreRodadas([clube]);
    expect(j.lesao).toBe(2);
    recuperarEntreRodadas([clube]);
    expect(j.lesao).toBe(1);
  });
});
