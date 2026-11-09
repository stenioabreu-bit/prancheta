import { describe, expect, it } from "vitest";
import {
  type ClubeDados,
  DIVISOES,
  type Divisao,
  type EstadoJogo,
  FUNCOES_COMISSAO,
  coletivaDepois,
  concluirPartida,
  conversar,
  criarRng,
  encerrarPartida,
  fimDeTemporada,
  iniciarPartida,
  jogarAteOFim,
  novaTemporadaDoJogo,
  novoJogo,
  passo,
  prelecao,
  proximoJogoDoUsuario,
  responderMensagem,
  seguir,
  simularPartidaDoUsuario,
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

function jogo(semente = 1, clubeId = "a5") {
  return novoJogo({
    semente,
    temporada: 2026,
    divisoes: divisoes(),
    vagasDiretasCopa: ["c0", "c1", "d0", "d1"],
    classicos: [["a5", "a6"]],
    tecnico: "Fulano",
    clubeId,
  });
}

/** Avança as semanas sem jogo do usuário (pré-temporada) até a próxima partida dele. */
function ateOProximoJogo(estado: EstadoJogo) {
  for (let g = 0; g < 60 && !proximoJogoDoUsuario(estado); g++) seguir(estado);
}

/** Joga a temporada inteira simulando os jogos do usuário no motor. */
function jogarTemporada(estado: EstadoJogo) {
  let guarda = 0;
  while (!fimDeTemporada(estado) && guarda++ < 400) {
    if (proximoJogoDoUsuario(estado)) simularPartidaDoUsuario(estado);
    else seguir(estado);
  }
}

describe("novo jogo", () => {
  const estado = jogo();
  const c = estado.carreira;

  it("monta comissão com uma pessoa por função, base com 10 garotos e mensagem de boas-vindas", () => {
    expect(c.comissao.membros).toHaveLength(10);
    const ocupantes = FUNCOES_COMISSAO.map((f) => c.comissao.funcoes[f.funcao]);
    expect(new Set(ocupantes).size).toBe(6);
    expect(c.base).toHaveLength(10);
    expect(c.base.every((j) => j.daBase && (j.potencial ?? 0) >= 62)).toBe(true);
    expect(c.caixa[0]!.assunto).toBe("Boas-vindas e objetivos");
    expect(c.meta.posicao).toBeGreaterThan(0);
  });

  it("exige nome do técnico", () => {
    expect(() =>
      novoJogo({
        ...{ semente: 1, temporada: 2026, divisoes: divisoes(), vagasDiretasCopa: [] },
        tecnico: " ",
        clubeId: "a0",
      }),
    ).toThrow();
  });
});

describe("temporada inteira como técnico", () => {
  const estado = jogo(2);
  jogarTemporada(estado);
  const c = estado.carreira;

  it("chega ao fim com o histórico dos jogos do usuário", () => {
    expect(fimDeTemporada(estado)).toBe(true);
    const liga = c.historico.filter((h) => h.competicao === "Série A");
    if (c.clubeId) expect(liga).toHaveLength(38);
    else expect(liga.length).toBeGreaterThanOrEqual(5);
    expect(c.historico.some((h) => h.competicao === "Copa do Brasil")).toBe(true);
  });

  it("recebe relatório semanal do auxiliar e avaliações da diretoria", () => {
    expect(c.caixa.some((m) => m.assunto.startsWith("Relatório da semana"))).toBe(true);
    expect(c.caixa.some((m) => m.assunto.startsWith("Avaliação após"))).toBe(true);
  });

  it("entrosamento sobe com os treinos e a base recebe novos garotos", () => {
    const clube = estado.temporada.clubes.a5!;
    expect(c.entrosamento[clube.esquema]).toBeGreaterThan(70);
    expect(c.base.length).toBeGreaterThan(10);
  });

  it("vira a temporada com nova meta e diretoria/torcida perto do meio", () => {
    novaTemporadaDoJogo(estado);
    expect(estado.temporada.temporada).toBe(2027);
    expect(c.diretoria).toBeGreaterThanOrEqual(30);
    expect(c.diretoria).toBeLessThanOrEqual(80);
  });
});

describe("decisões de vestiário", () => {
  it("promessa de minutos quebrada derruba a moral do jogador", () => {
    const estado = jogo(3);
    const clube = estado.temporada.clubes.a5!;
    const reserva = clube.jogadores.find((j) => !clube.titulares.includes(j.id))!;
    conversar(estado.carreira, clube, estado.temporada.rodada, reserva.id, "minutos");
    const moralDepois = reserva.moral;
    expect(estado.carreira.promessas[0]!.status).toBe("aberta");
    for (let i = 0; i < 6; i++) {
      if (proximoJogoDoUsuario(estado)) {
        // O técnico nunca põe o reserva (a IA não faz trocas no time do usuário).
        const p = iniciarPartida(estado);
        jogarAteOFim(p);
        concluirPartida(estado, p);
      } else seguir(estado);
    }
    expect(estado.carreira.promessas[0]!.status).toBe("quebrada");
    expect(reserva.moral).toBeLessThan(moralDepois);
    expect(estado.carreira.caixa.some((m) => m.assunto === "Promessa quebrada")).toBe(true);
  });

  it("responder uma mensagem aplica o efeito uma vez só", () => {
    const estado = jogo(4);
    const clube = estado.temporada.clubes.a5!;
    const c = estado.carreira;
    c.caixa.unshift({
      id: "teste",
      rodada: 0,
      de: "X",
      assunto: "Y",
      texto: "Z",
      lida: false,
      opcoes: [{ texto: "ok", efeito: { diretoria: 5 } }],
    });
    const antes = c.diretoria;
    responderMensagem(c, clube, 0, "teste", 0);
    responderMensagem(c, clube, 0, "teste", 0);
    expect(c.diretoria).toBe(antes + 5);
  });

  it("preleção mexe na moral e repetir o mesmo tom perde força", () => {
    const estado = jogo(5);
    const medias: number[] = [];
    ateOProximoJogo(estado);
    for (let i = 0; i < 4; i++) {
      const p = iniciarPartida(estado);
      medias.push(prelecao(p, estado.carreira, "pre", "motivar", criarRng(i)).media);
    }
    expect(medias[0]).toBeGreaterThan(0);
    expect(medias[3]!).toBeLessThan(medias[0]!);
  });

  it("coletiva depois do jogo tem de 1 a 3 perguntas", () => {
    const estado = jogo(6);
    ateOProximoJogo(estado);
    const p = iniciarPartida(estado);
    while (passo(p) !== "fim") {
      /* joga até o fim */
    }
    encerrarPartida(p);
    const perguntas = coletivaDepois(estado.carreira, p);
    expect(perguntas.length).toBeGreaterThanOrEqual(1);
    expect(perguntas.length).toBeLessThanOrEqual(3);
  });
});

describe("reprodutibilidade", () => {
  it("mesma semente, mesma carreira", () => {
    const a = jogo(9);
    const b = jogo(9);
    for (let i = 0; i < 5; i++) {
      for (const e of [a, b]) {
        if (proximoJogoDoUsuario(e)) simularPartidaDoUsuario(e);
        else seguir(e);
      }
    }
    expect(a.carreira.historico).toEqual(b.carreira.historico);
    expect(a.carreira.diretoria).toBe(b.carreira.diretoria);
  });
});
