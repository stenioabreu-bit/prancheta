import { describe, expect, it } from "vitest";
import {
  type ClubeDados,
  DIVISOES,
  type Divisao,
  type EstadoTemporada,
  FASES_DA_COPA_2026,
  RODADAS_POR_TEMPORADA,
  faseDoEstado,
  horarioDaData,
  jogosDaRodada,
  novaTemporada,
  proximoJogoDo,
  registrarPlacar,
  simularRodada,
  temporadaEncerrada,
  virarTemporada,
} from "../src";

const TAMANHO: Record<Divisao, number> = { A: 20, B: 20, C: 20, D: 96 };
const NIVEL: Record<Divisao, number> = { A: 74, B: 67, C: 61, D: 54 };

function divisoesDeTeste(): Record<Divisao, ClubeDados[]> {
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

function jogarTemporada(estado: EstadoTemporada) {
  let guarda = 0;
  while (!temporadaEncerrada(estado) && guarda++ < 120) simularRodada(estado);
}

function nova(semente = 1, usuarioId: string | null = null) {
  return novaTemporada({
    semente,
    temporada: 2026,
    divisoes: divisoesDeTeste(),
    vagasDiretasCopa: ["c0", "c1", "d0", "d1"],
    usuarioId,
  });
}

describe("temporada completa (formatos 2026)", () => {
  const estado = nova();
  const inicio = structuredClone(estado);
  jogarTemporada(estado);

  it("termina com campeão em todas as divisões e na Copa", () => {
    expect(temporadaEncerrada(estado)).toBe(true);
    for (const d of DIVISOES) expect(estado.divisoes[d].campeao).toBeTruthy();
    expect(estado.copa.campeao).toBeTruthy();
    expect(Object.values(estado.jogos).every((j) => j.placar)).toBe(true);
  });

  it("Série A: 38 rodadas, cada clube com 19 jogos em casa e 4 rebaixados", () => {
    const jogos = Object.values(estado.jogos).filter((j) => j.competicao === "A");
    expect(jogos).toHaveLength(380);
    expect(jogos.filter((j) => j.casa === "a0")).toHaveLength(19);
    expect(estado.divisoes.A.rebaixados).toHaveLength(4);
    expect(estado.divisoes.A.acesso).toHaveLength(0);
  });

  it("Série B: sobem 4 e caem 4", () => {
    expect(estado.divisoes.B.acesso).toHaveLength(4);
    expect(estado.divisoes.B.rebaixados).toHaveLength(4);
  });

  it("Série C: turno único, quadrangulares com 8, final entre os líderes, sobem 4 e caem 6", () => {
    const c = estado.divisoes.C;
    const primeira = faseDoEstado(c, "1ª fase");
    const segunda = faseDoEstado(c, "2ª fase");
    expect(
      Object.values(estado.jogos).filter((j) => j.competicao === "C" && j.fase === "1ª fase"),
    ).toHaveLength(190);
    expect(segunda?.tipo === "liga" && segunda.grupos.map((g) => g.length)).toEqual([4, 4]);
    expect(c.acesso).toHaveLength(4);
    expect(c.rebaixados).toHaveLength(6);
    const final = faseDoEstado(c, "Final");
    expect(final?.tipo === "mataMata" && final.confrontos).toHaveLength(1);
    expect(c.acesso).toContain(c.campeao);
    expect(primeira?.encerrada).toBe(true);
  });

  it("Série D: 16 grupos de 6, mata-mata de 64, sobem os 4 semifinalistas e os 2 vencedores dos playoffs", () => {
    const d = estado.divisoes.D;
    const primeira = faseDoEstado(d, "1ª fase");
    expect(primeira?.tipo === "liga" && primeira.grupos.every((g) => g.length === 6)).toBe(true);
    const confrontos = (nome: string) => {
      const f = faseDoEstado(d, nome);
      return f?.tipo === "mataMata" ? f.confrontos : [];
    };
    expect(confrontos("2ª fase")).toHaveLength(32);
    expect(confrontos("3ª fase")).toHaveLength(16);
    expect(confrontos("Oitavas de final")).toHaveLength(8);
    expect(confrontos("Quartas de final")).toHaveLength(4);
    expect(confrontos("Playoffs")).toHaveLength(2);
    expect(confrontos("Semifinal")).toHaveLength(2);
    const semifinalistas = confrontos("Semifinal").flatMap((c) => [c.a, c.b]);
    const playoffs = confrontos("Playoffs").map((c) => c.vencedor!);
    expect(d.acesso.sort()).toEqual([...semifinalistas, ...playoffs].sort());
    const perdedoresQuartas = confrontos("Quartas de final").map((c) => (c.vencedor === c.a ? c.b : c.a));
    expect(
      confrontos("Playoffs")
        .flatMap((c) => [c.a, c.b])
        .sort(),
    ).toEqual(perdedoresQuartas.sort());
    expect(confrontos("2ª fase").every((c) => c.jogos.length === 2)).toBe(true);
  });

  it("Copa do Brasil: 126 clubes, 9 fases, 2ª fase e 5ª à semi em ida e volta", () => {
    const participantes = new Set(Object.values(inicio.copa.entram).flat());
    expect(participantes.size).toBe(126);
    const fases = estado.copa.fases;
    expect(fases.map((f) => f.nome)).toEqual(FASES_DA_COPA_2026.map((f) => f.nome));
    expect(fases.map((f) => f.confrontos.length)).toEqual([14, 44, 24, 12, 16, 8, 4, 2, 1]);
    const legs = fases.map((f) => f.confrontos[0]!.jogos.length);
    expect(legs).toEqual([1, 2, 1, 1, 2, 2, 2, 2, 1]);
    const serieA = estado.divisoes.A.clubes;
    expect(fases[4]!.confrontos.flatMap((c) => [c.a, c.b]).filter((x) => serieA.includes(x))).toHaveLength(
      20,
    );
    const final = estado.jogos[fases[8]!.confrontos[0]!.jogos[0]!]!;
    expect(final.neutro).toBe(true);
  });

  it("Copa e Série A nas datas oficiais da CBF, e a semana sai em ordem de data", () => {
    const copa = Object.values(inicio.jogos).filter((j) => j.competicao === "copa");
    expect(new Set(copa.map((j) => j.data))).toEqual(new Set(["2026-02-18"]));
    const serieA = Object.values(inicio.jogos).filter((j) => j.competicao === "A");
    expect(serieA.map((j) => j.data).sort()[0]).toBe("2026-01-28");
    const semana = jogosDaRodada(inicio, horarioDaData("2026-03-15").semana);
    const datas = semana.map((j) => j.data ?? "");
    expect(datas).toEqual([...datas].sort());
  });

  it("é reproduzível com a mesma semente", () => {
    const outro = nova();
    jogarTemporada(outro);
    expect(outro.copa.campeao).toBe(estado.copa.campeao);
    expect(DIVISOES.map((d) => outro.divisoes[d].campeao)).toEqual(
      DIVISOES.map((d) => estado.divisoes[d].campeao),
    );
  });
});

describe("virada de temporada", () => {
  const estado = nova(3);
  jogarTemporada(estado);
  const antes = structuredClone(estado.divisoes);
  const resumo = virarTemporada(estado);

  it("mantém os tamanhos e move quem subiu e caiu", () => {
    for (const d of DIVISOES) expect(estado.divisoes[d].clubes).toHaveLength(TAMANHO[d]);
    for (const id of antes.B.acesso) expect(estado.divisoes.A.clubes).toContain(id);
    for (const id of antes.A.rebaixados) expect(estado.divisoes.B.clubes).toContain(id);
    for (const id of antes.D.acesso) expect(estado.divisoes.C.clubes).toContain(id);
    for (const id of antes.C.rebaixados) expect(estado.divisoes.D.clubes).toContain(id);
    expect(resumo.temporada).toBe(2026);
    expect(estado.temporada).toBe(2027);
    expect(estado.rodada).toBe(0);
  });

  it("zera as estatísticas e monta a nova Copa com campeões e vices de C e D", () => {
    const algum = Object.values(estado.clubes)[0]!.jogadores[0]!;
    expect(algum.temporada.gols).toBe(0);
    expect(estado.vagasDiretasCopa).toContain(antes.C.campeao);
    expect(estado.vagasDiretasCopa).toContain(antes.D.campeao);
    expect(estado.copa.fases).toHaveLength(1);
  });

  it("a segunda temporada também termina", () => {
    jogarTemporada(estado);
    expect(temporadaEncerrada(estado)).toBe(true);
  });
});

describe("jogo do usuário", () => {
  it("fica fora da simulação da rodada até receber o placar", () => {
    const estado = nova(5, "d95");
    expect(Object.values(estado.copa.entram).flat()).toContain("d95");
    for (let g = 0; g < 10 && !proximoJogoDo(estado, "a0"); g++) simularRodada(estado);
    const meu = proximoJogoDo(estado, "a0")!;
    const semana = estado.rodada;
    simularRodada(estado, [meu.id]);
    expect(estado.rodada).toBe(semana);
    expect(estado.jogos[meu.id]!.placar).toBeNull();
    registrarPlacar(estado, meu.id, [2, 1]);
    simularRodada(estado);
    expect(estado.rodada).toBe(semana + 1);
  });
});
