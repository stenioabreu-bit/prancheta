import { describe, expect, it } from "vitest";
import {
  type ClubeDados,
  DIVISOES,
  type Divisao,
  type EstadoJogo,
  type RitmoAtleta,
  avancarAtleta,
  clubeDoAtleta,
  decidirDilema,
  escolherLance,
  jogadorDoAtleta,
  lancesPendentes,
  novoJogoAtleta,
  pendenciaDoAtleta,
  todosOsEventos,
} from "../src";

const TAMANHO: Record<Divisao, number> = { A: 20, B: 20, C: 20, D: 96 };
const NIVEL: Record<Divisao, number> = { A: 74, B: 67, C: 61, D: 54 };

function divisoes(): Record<Divisao, ClubeDados[]> {
  const r = {} as Record<Divisao, ClubeDados[]>;
  for (const d of DIVISOES) {
    r[d] = Array.from({ length: TAMANHO[d] }, (_, i) => ({
      id: `${d.toLowerCase()}${i}`,
      nome: `Clube ${d}${i}`,
      sigla: `${d}${String(i).padStart(2, "0")}`,
      nivel: NIVEL[d] + 4 - (i % 9),
    }));
  }
  return r;
}

function atleta(semente = 3, ritmo: RitmoAtleta = "jogo") {
  return novoJogoAtleta({
    semente,
    temporada: 2026,
    divisoes: divisoes(),
    vagasDiretasCopa: ["c0", "c1", "d0", "d1"],
    classicos: [["a5", "a6"]],
    clubeId: "a5",
    nome: "Zé Teste",
    pos: "ATA",
    origem: "base",
    ritmo,
  });
}

/** Responde tudo o que o jogo pedir (sempre a primeira opção, ou a primeira do lance). */
function responderTudo(estado: EstadoJogo) {
  const a = estado.atleta!;
  for (const d of [...a.dilemas]) decidirDilema(estado, d.id, 0);
  if (a.jogo) {
    for (let i = 0; i < a.jogo.lances.length; i++) {
      const l = a.jogo.lances[i]!;
      if (!l.escolha) escolherLance(estado, i, l.opcoes[0]!.id);
    }
  }
}

function jogarSemanas(estado: EstadoJogo, semanas: number) {
  const a = estado.atleta!;
  for (let k = 0; k < semanas * 4 && a.semana < semanas && !a.aposentado; k++) {
    responderTudo(estado);
    avancarAtleta(estado);
  }
}

describe("modo jogador", () => {
  it("cria o atleta no elenco do clube, fora do técnico do usuário", () => {
    const e = atleta();
    expect(e.carreira.clubeId).toBeNull();
    expect(e.temporada.usuarioId).toBeNull();
    const j = jogadorDoAtleta(e);
    expect(j.id).toBe("atleta");
    expect(clubeDoAtleta(e).id).toBe("a5");
    expect(e.atleta!.idade).toBe(17);
    expect(e.atleta!.contrato.salario).toBeGreaterThan(0);
  });

  it("tem pelo menos 30 eventos e todo evento agendado existe", () => {
    const eventos = todosOsEventos();
    expect(eventos.length).toBeGreaterThanOrEqual(30);
    const ids = new Set(eventos.map((e) => e.id));
    for (const e of eventos)
      for (const o of e.opcoes) {
        for (const ag of o.efeito.agendar ?? [])
          expect(ids.has(ag.evento), `${e.id} → ${ag.evento}`).toBe(true);
        for (const ag of o.sorte?.senao.efeito.agendar ?? []) expect(ids.has(ag.evento)).toBe(true);
      }
  });

  it("joga semana a semana: escalação, lances e números", () => {
    const e = atleta(5);
    jogarSemanas(e, 20);
    const a = e.atleta!;
    expect(a.semana).toBeGreaterThanOrEqual(20);
    expect(a.ultimosJogos.length).toBeGreaterThan(0);
    expect(a.escolhas.length).toBeGreaterThan(0);
    for (const g of a.ultimosJogos) {
      expect(g.placar).toBeTruthy();
      expect(e.temporada.jogos[g.jogoId]!.placar).toBeTruthy();
    }
  });

  it("é reproduzível com a mesma semente", () => {
    const x = atleta(9);
    const y = atleta(9);
    jogarSemanas(x, 15);
    jogarSemanas(y, 15);
    expect(JSON.stringify(x.atleta)).toBe(JSON.stringify(y.atleta));
  });

  it("ritmo temporada: avança até a virada e guarda o histórico", () => {
    const e = atleta(11, "temporada");
    const a = e.atleta!;
    for (let k = 0; k < 200 && a.historico.length < 2 && !a.aposentado; k++) {
      const p = avancarAtleta(e, 200);
      if (p === "dilemas" || p === "lances") responderTudo(e);
    }
    expect(a.historico.length).toBe(2);
    expect(a.idade).toBe(19);
    expect(e.temporada.temporada).toBe(2028);
    expect(a.historico[0]!.jogos).toBeGreaterThanOrEqual(0);
  });

  it("ritmo decisivos só para em dilema capital ou lance decisivo", () => {
    const e = atleta(13, "decisivos");
    const a = e.atleta!;
    for (let k = 0; k < 30; k++) {
      const p = avancarAtleta(e, 200);
      if (p === "lances") {
        expect(lancesPendentes(a.jogo!).some((l) => l.decisivo)).toBe(true);
      }
      if (p === "dilemas") expect(a.dilemas.some((d) => d.capital)).toBe(true);
      responderTudo(e);
    }
    expect(pendenciaDoAtleta(e)).toBeTruthy();
  });

  it("carreira inteira termina em aposentadoria com pós-carreira", () => {
    const e = atleta(21, "temporada");
    const a = e.atleta!;
    for (let k = 0; k < 3000 && !a.aposentado; k++) {
      const p = avancarAtleta(e, 400);
      if (p === "dilemas" || p === "lances") responderTudo(e);
    }
    expect(a.aposentado).toBe(true);
    expect(a.posCarreira).toMatch(/pendurou as chuteiras/);
    expect(a.historico.length).toBeGreaterThan(10);
  }, 120_000);
});
