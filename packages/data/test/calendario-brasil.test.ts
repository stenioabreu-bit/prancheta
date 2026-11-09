import {
  type EstadoTemporada,
  adiar,
  conflitosDeCalendario,
  dataDoJogo,
  fimDeTemporada,
  novaTemporada,
  novaTemporadaDoJogo,
  novoJogo,
  proximoJogoDoUsuario,
  seguir,
  simularPartidaDoUsuario,
  simularRodada,
  temporadaEncerrada,
  virarTemporada,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

const pacote = lerPacote(PASTA_TESTE_REAL)!;

function nova(semente = 11): EstadoTemporada {
  return novaTemporada({
    semente,
    temporada: pacote.temporada,
    divisoes: pacote.divisoes,
    vagasDiretasCopa: pacote.vagasDiretasCopa,
    estaduais: pacote.estaduais!,
    clubesExtras: pacote.clubesExtras!,
  });
}

function jogarTudo(e: EstadoTemporada) {
  for (let g = 0; g < 80 && !temporadaEncerrada(e); g++) simularRodada(e);
}

const porComp = (e: EstadoTemporada, c: string) => Object.values(e.jogos).filter((j) => j.competicao === c);

describe("calendário brasileiro 2026", () => {
  const e = nova();
  const inicio = structuredClone(e.jogos);
  jogarTudo(e);

  it("temporada completa com os estaduais disponíveis, sem conflito nem jogo sem descanso", () => {
    expect(temporadaEncerrada(e)).toBe(true);
    expect(Object.keys(e.estaduais!).length).toBe(pacote.estaduais!.length);
    for (const est of Object.values(e.estaduais!)) {
      expect(est.encerrada).toBe(true);
      expect(est.campeao).toBeTruthy();
    }
    expect(conflitosDeCalendario(e.jogos)).toEqual([]);
  });

  it("estaduais usam a tabela real: 1ª fase nas datas oficiais, dentro de jan–abr", () => {
    for (const est of pacote.estaduais!) {
      const jogos = porComp(e, `est-${est.uf}`);
      const datas = jogos.map(dataDoJogo).sort();
      expect(datas[0]! >= "2026-01-05").toBe(true);
      expect(datas.at(-1)! <= "2026-04-30").toBe(true);
      const fase1 = est.formato.fases[0]!;
      if (fase1.tipo === "liga")
        expect(jogos.filter((j) => j.fase === "1ª fase")).toHaveLength(fase1.jogos!.length);
    }
  });

  it("Série A e B: 38 rodadas, 380 jogos, de 28/01 a 02/12 e de 21/03 a 28/11", () => {
    for (const [c, ini, fim] of [
      ["A", "2026-01-28", "2026-12-02"],
      ["B", "2026-03-21", "2026-11-28"],
    ] as const) {
      const jogos = porComp(e, c);
      expect(jogos).toHaveLength(380);
      const datas = Object.values(inicio)
        .filter((j) => j.competicao === c)
        .map((j) => j.data!)
        .sort();
      expect(datas[0]).toBe(ini);
      expect(datas.at(-1)).toBe(fim);
    }
  });

  it("Série C (1ª fase, quadrangulares, final) e Série D (16 grupos, mata-matas e playoffs) completas", () => {
    expect(e.divisoes.C.fases.map((f) => f.nome)).toEqual(["1ª fase", "2ª fase", "Final"]);
    expect(e.divisoes.D.fases.map((f) => f.nome)).toEqual(
      expect.arrayContaining([
        "1ª fase",
        "2ª fase",
        "3ª fase",
        "Oitavas de final",
        "Quartas de final",
        "Playoffs",
        "Semifinal",
        "Final",
      ]),
    );
    expect(e.divisoes.C.campeao && e.divisoes.D.campeao).toBeTruthy();
  });

  it("Copa do Brasil: 9 fases até a final de 06/12", () => {
    expect(e.copa.fases).toHaveLength(9);
    const final = porComp(e, "copa").find((j) => j.fase === "Final")!;
    expect(final.data).toBe("2026-12-06");
  });

  it("clube em estadual, Série e Copa ao mesmo tempo nunca joga duas vezes sem descanso", () => {
    const multi = Object.keys(e.clubes).filter(
      (id) =>
        Object.values(e.jogos).some(
          (j) => j.competicao.startsWith("est-") && (j.casa === id || j.visitante === id),
        ) &&
        Object.values(e.jogos).some((j) => j.competicao === "copa" && (j.casa === id || j.visitante === id)),
    );
    expect(multi.length).toBeGreaterThan(20);
    expect(conflitosDeCalendario(e.jogos)).toEqual([]);
  });

  it("vira a temporada preservando o histórico e remonta o calendário", () => {
    const resumo = virarTemporada(e);
    expect(e.historico.at(-1)).toBe(resumo);
    expect(e.temporada).toBe(2027);
    expect(Object.keys(e.estaduais!).length).toBe(pacote.estaduais!.length);
    expect(conflitosDeCalendario(e.jogos)).toEqual([]);
  });
});

describe("adiamento", () => {
  it("detecta duplicidade, reagenda e guarda a data antiga", () => {
    const e = nova(4);
    const [a, b] = Object.values(e.jogos).filter(
      (j) => j.competicao === "A" && j.casa === e.divisoes.A.clubes[0],
    );
    adiar(e, b!.id, a!.data!);
    expect(conflitosDeCalendario(e.jogos).length).toBeGreaterThan(0);
    expect(e.jogos[b!.id]!.adiadoDe).toHaveLength(1);
  });
});

describe("carreira com estaduais", () => {
  it("técnico de clube da Série A joga estadual, Brasileirão e Copa até o fim", () => {
    const j = novoJogo({
      semente: 9,
      temporada: 2026,
      divisoes: pacote.divisoes,
      vagasDiretasCopa: pacote.vagasDiretasCopa,
      estaduais: pacote.estaduais!,
      clubesExtras: pacote.clubesExtras!,
      tecnico: "Teste",
      clubeId: "palmeiras",
    });
    let g = 0;
    while (!fimDeTemporada(j) && g++ < 200) {
      if (proximoJogoDoUsuario(j)) simularPartidaDoUsuario(j);
      else seguir(j);
    }
    expect(fimDeTemporada(j)).toBe(true);
    const comps = new Set(j.carreira.historico.map((h) => h.competicao));
    expect(comps.has("Série A")).toBe(true);
    expect(comps.has("Campeonato Paulista")).toBe(true);
    novaTemporadaDoJogo(j);
    expect(j.temporada.temporada).toBe(2027);
  });
});
