/**
 * Testes estatísticos: travam o realismo do motor contra a Série A de 2019 a 2025
 * (média de 2,41 gols por jogo, 1,41 do mandante e 1,00 do visitante; mandante
 * vence 46,8%, empate 27,3%; 3,3% dos jogos com 4+ gols de diferença; campeão
 * com 79 pontos e lanterna com 22; artilheiro com 15 a 21 gols).
 * Cinco temporadas por modo, com elencos gerados (que marcam um pouco menos que
 * os reais), então as faixas têm folga para o ruído da amostra.
 */
import { describe, expect, it } from "vitest";
import {
  type Clube,
  calendarioPontosCorridos,
  classificacao,
  criarClube,
  criarPartida,
  criarRng,
  encerrarPartida,
  estatisticasRapidas,
  jogarAteOFim,
  novaTabela,
  placarRapido,
  recuperarEntreRodadas,
  registrarResultado,
} from "../src";
import { clubesDeTeste } from "./apoio";

function temporada(semente: number, modo: "motor" | "rapido") {
  const rng = criarRng(semente);
  const clubes = new Map<string, Clube>(clubesDeTeste().map((d) => [d.id, criarClube(d, rng)]));
  const ids = [...clubes.keys()];
  const tabela = novaTabela(ids);
  const placares: [number, number][] = [];
  let amarelos = 0;
  let vermelhos = 0;
  for (const rodada of calendarioPontosCorridos(rng, ids)) {
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
        amarelos += r.est.casa.amarelos + r.est.visitante.amarelos;
        vermelhos += r.est.casa.vermelhos + r.est.visitante.vermelhos;
      } else {
        [gc, gv] = placarRapido(rng, c, v);
        estatisticasRapidas(rng, c, gc, gv);
        estatisticasRapidas(rng, v, gv, gc);
      }
      placares.push([gc, gv]);
      registrarResultado(tabela, casa, visitante, gc, gv);
    }
    recuperarEntreRodadas(clubes.values());
  }
  const ordem = classificacao(ids, tabela);
  const artilheiro = Math.max(
    ...[...clubes.values()].flatMap((c) => c.jogadores.map((j) => j.temporada.gols)),
  );
  return {
    placares,
    tabela,
    artilheiro,
    campeao: tabela[ordem[0]!]!.pts,
    lanterna: tabela[ordem[ordem.length - 1]!]!.pts,
    amarelos,
    vermelhos,
  };
}

const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

describe.each(["motor", "rapido"] as const)("calibração contra o Brasileirão (%s)", (modo) => {
  const temporadas = [1, 2, 3, 4, 5].map((s) => temporada(s, modo));
  const placares = temporadas.flatMap((t) => t.placares);
  const fracao = (f: (p: [number, number]) => boolean) => placares.filter(f).length / placares.length;

  it("gols por jogo perto de 2,41, com o mandante marcando mais", () => {
    const casa = media(placares.map(([c]) => c));
    const fora = media(placares.map(([, v]) => v));
    expect(casa + fora).toBeGreaterThan(2.15);
    expect(casa + fora).toBeLessThan(2.65);
    expect(casa - fora).toBeGreaterThan(0.25);
  });

  it("mandante vence ~47%, empate ~27%", () => {
    expect(fracao(([c, v]) => c > v)).toBeGreaterThan(0.42);
    expect(fracao(([c, v]) => c > v)).toBeLessThan(0.52);
    expect(fracao(([c, v]) => c === v)).toBeGreaterThan(0.22);
    expect(fracao(([c, v]) => c === v)).toBeLessThan(0.32);
  });

  it("goleadas de 4+ gols são raras (real: 2,4% a 5%)", () => {
    expect(fracao(([c, v]) => Math.abs(c - v) >= 4)).toBeLessThan(0.065);
  });

  it("campeão entre 70 e 92 pontos, lanterna acima de 15", () => {
    const campeao = media(temporadas.map((t) => t.campeao));
    expect(campeao).toBeGreaterThan(70);
    expect(campeao).toBeLessThan(92);
    expect(media(temporadas.map((t) => t.lanterna))).toBeGreaterThan(15);
  });

  it("sem bola de neve: nenhum clube passa de 2,6 gols por jogo na temporada", () => {
    for (const t of temporadas) {
      for (const linha of Object.values(t.tabela)) expect(linha.gp / 38).toBeLessThan(2.6);
    }
  });

  it("artilheiro entre 13 e 26 gols (real: 15 a 21)", () => {
    const artilheiro = media(temporadas.map((t) => t.artilheiro));
    expect(artilheiro).toBeGreaterThan(13);
    expect(artilheiro).toBeLessThan(26);
  });
});

describe("cartões no motor", () => {
  const temporadas = [11, 12].map((s) => temporada(s, "motor"));
  const jogos = temporadas.reduce((s, t) => s + t.placares.length, 0);

  it("~3 amarelos e ~0,2 vermelho por jogo (abaixo da média real, a pedido, para soar natural)", () => {
    const amarelos = temporadas.reduce((s, t) => s + t.amarelos, 0) / jogos;
    const vermelhos = temporadas.reduce((s, t) => s + t.vermelhos, 0) / jogos;
    expect(amarelos).toBeGreaterThan(2.4);
    expect(amarelos).toBeLessThan(4);
    expect(vermelhos).toBeGreaterThan(0.05);
    expect(vermelhos).toBeLessThan(0.35);
  });
});

describe("decisões do técnico pesam", () => {
  function gols(mentalidade: number) {
    let pro = 0;
    let contra = 0;
    const n = 800;
    for (let i = 0; i < n; i++) {
      const rng = criarRng(5000 + i);
      const [a, b] = clubesDeTeste(2);
      const casa = criarClube({ ...a!, nivel: 73, esquema: "4-3-3", estilo: "equilibrado" }, rng);
      const visitante = criarClube({ ...b!, nivel: 73, esquema: "4-3-3", estilo: "equilibrado" }, rng);
      casa.tatica.mentalidade = mentalidade;
      const m = criarPartida(casa, visitante, { rng, usuarioId: casa.id });
      jogarAteOFim(m);
      const r = encerrarPartida(m);
      pro += r.golsCasa;
      contra += r.golsVisitante;
    }
    return { pro: pro / n, contra: contra / n };
  }

  it("mentalidade ofensiva faz e sofre mais gols; a defensiva tranca o jogo", () => {
    const neutra = gols(0);
    const ofensiva = gols(2);
    const defensiva = gols(-2);
    expect(ofensiva.pro).toBeGreaterThan(neutra.pro * 1.1);
    expect(ofensiva.contra).toBeGreaterThan(neutra.contra * 1.05);
    expect(defensiva.pro).toBeLessThan(neutra.pro * 0.92);
    expect(defensiva.contra).toBeLessThan(neutra.contra * 0.95);
  });
});
