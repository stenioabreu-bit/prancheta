import { describe, expect, it } from "vitest";
import {
  type ClubeDados,
  DIVISOES,
  type Divisao,
  type EstadoJogo,
  aplicarEfeitoDeMercado,
  assumir,
  buscarNoMercado,
  candidatar,
  criarRng,
  ficarDesempregado,
  fimDeTemporada,
  indicar,
  janelaAberta,
  novoJogo,
  pedirDemissao,
  proximoJogoDoUsuario,
  responder,
  seguir,
  simularPartidaDoUsuario,
  valorDeMercado,
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
      grande: d === "A" && i < 5,
      tecnico: d === "A" ? `Técnico ${i}` : undefined,
    }));
  }
  return r;
}

function jogo(semente = 1, clubeId = "a8") {
  return novoJogo({
    semente,
    temporada: 2026,
    divisoes: divisoes(),
    vagasDiretasCopa: ["c0", "c1", "d0", "d1"],
    tecnico: "Fulano",
    clubeId,
  });
}

function avancar(estado: EstadoJogo, rodadas: number) {
  const alvo = estado.temporada.rodada + rodadas;
  let guarda = 0;
  while (estado.temporada.rodada < alvo && !fimDeTemporada(estado) && guarda++ < 200) {
    if (proximoJogoDoUsuario(estado)) simularPartidaDoUsuario(estado);
    else seguir(estado);
  }
}

describe("valores e janelas", () => {
  it("jogador melhor vale mais; jovem vale mais que veterano; Série A paga mais", () => {
    const base = { id: "x", nome: "X", pos: "ATA", ovr: 75, alt: [], perso: "profissional" } as never;
    const j = (ovr: number, perso = "profissional") => ({ ...(base as object), ovr, perso }) as never;
    expect(valorDeMercado(j(80), "A")).toBeGreaterThan(valorDeMercado(j(70), "A"));
    expect(valorDeMercado(j(75, "jovem"), "A")).toBeGreaterThan(valorDeMercado(j(75, "veterano"), "A"));
    expect(valorDeMercado(j(75), "A")).toBeGreaterThan(valorDeMercado(j(75), "C"));
  });

  it("janelas nas rodadas 0–3 e 17–21", () => {
    expect([0, 3, 17, 21].every(janelaAberta)).toBe(true);
    expect([4, 16, 22, 37].some(janelaAberta)).toBe(false);
  });
});

describe("novo jogo", () => {
  const estado = jogo();
  it("começa com finanças, técnicos e a primeira passagem do técnico", () => {
    expect(estado.mercado.financas.orcamento).toBeGreaterThan(0);
    expect(estado.mercado.tecnicos.a0).toBe("Técnico 0");
    expect(estado.mercado.tecnicos.a8).toBe("Fulano");
    expect(estado.mercado.passagens).toHaveLength(1);
    expect(estado.mercado.grandes).toContain("a0");
  });

  it("busca no mercado não traz jogadores do próprio clube e respeita o filtro", () => {
    const itens = buscarNoMercado(estado, { setor: "GOL", valorMaximo: 2, limite: 30 });
    expect(itens.length).toBeGreaterThan(0);
    expect(itens.every((i) => i.clube.id !== "a8" && i.jogador.pos === "GOL" && i.valor <= 2)).toBe(true);
  });
});

describe("indicação à diretoria", () => {
  it("limita a 5 em aberto e não repete jogador", () => {
    const estado = jogo(2);
    const alvos = buscarNoMercado(estado, { divisao: "C", limite: 10 });
    expect(indicar(estado, alvos[0]!.jogador.id)).toContain("indicado");
    expect(indicar(estado, alvos[0]!.jogador.id)).toBe("Você já indicou esse jogador.");
    for (let i = 1; i < 5; i++) indicar(estado, alvos[i]!.jogador.id);
    expect(indicar(estado, alvos[5]!.jogador.id)).toContain("5 indicações");
  });

  it("a diretoria responde na janela e, quando fecha, o jogador muda de clube e o orçamento cai", () => {
    const estado = jogo(3);
    const baratos = buscarNoMercado(estado, { divisao: "D", valorMaximo: 0.5, limite: 5 });
    for (const b of baratos) indicar(estado, b.jogador.id);
    const orcamento = estado.mercado.financas.orcamento;
    avancar(estado, 4);
    const respostas = estado.carreira.caixa.filter((m) => m.assunto.startsWith("Indicação:"));
    expect(respostas.length).toBeGreaterThan(0);
    const contratados = estado.mercado.indicacoes.filter((i) => i.status === "contratado");
    const meu = estado.temporada.clubes.a8!;
    for (const c of contratados) expect(meu.jogadores.some((j) => j.id === c.jogadorId)).toBe(true);
    if (contratados.length) expect(estado.mercado.financas.orcamento).toBeLessThan(orcamento);
  });
});

describe("vender e segurar", () => {
  it("vender tira o jogador do elenco e põe metade do valor no orçamento", () => {
    const estado = jogo(4);
    const meu = estado.temporada.clubes.a8!;
    const j = meu.jogadores[0]!;
    const antes = estado.mercado.financas.orcamento;
    aplicarEfeitoDeMercado(
      estado,
      { vender: { jogadorId: j.id, valor: 10, comprador: "um clube do exterior" } },
      criarRng(1),
    );
    expect(meu.jogadores.includes(j)).toBe(false);
    expect(meu.titulares).not.toContain(j.id);
    expect(meu.titulares).toHaveLength(11);
    expect(estado.mercado.financas.orcamento).toBeCloseTo(antes + 5, 5);
  });

  it("venda para um clube do jogo leva o jogador para lá", () => {
    const estado = jogo(5);
    const meu = estado.temporada.clubes.a8!;
    const j = meu.jogadores[3]!;
    aplicarEfeitoDeMercado(
      estado,
      { vender: { jogadorId: j.id, valor: 4, comprador: "Clube A0" } },
      criarRng(1),
    );
    expect(estado.temporada.clubes.a0!.jogadores).toContain(j);
  });
});

describe("carreira do técnico", () => {
  it("demitido: fica sem clube, perde reputação e o clube antigo abre vaga", () => {
    const estado = jogo(6);
    const rep = estado.carreira.reputacao;
    ficarDesempregado(estado, "a8");
    expect(estado.carreira.clubeId).toBeNull();
    expect(estado.carreira.reputacao).toBe(rep - 6);
    expect(estado.mercado.vagas.some((v) => v.clubeId === "a8")).toBe(true);
    expect(proximoJogoDoUsuario(estado)).toBeNull();
  });

  it("desempregado, a temporada continua e aparecem vagas; dá para se candidatar", () => {
    const estado = jogo(7);
    pedirDemissao(estado);
    avancar(estado, 6);
    expect(estado.temporada.rodada).toBe(6);
    const vaga = estado.mercado.vagas[0];
    expect(vaga).toBeTruthy();
    expect(candidatar(estado, vaga!.clubeId)).toContain("Candidatura enviada");
    expect(candidatar(estado, vaga!.clubeId)).toBe("Você já se candidatou a essa vaga.");
  });

  it("assumir outro clube completa o elenco, refaz a meta e registra a passagem", () => {
    const estado = jogo(8);
    const destino = estado.temporada.divisoes.C.clubes[3]!;
    assumir(estado, destino, criarRng(3));
    const clube = estado.temporada.clubes[destino]!;
    expect(estado.carreira.clubeId).toBe(destino);
    expect(clube.jogadores.length).toBeGreaterThanOrEqual(22);
    expect(estado.carreira.meta.texto).toContain("segunda fase");
    expect(estado.mercado.passagens.map((p) => p.clubeId)).toEqual(["a8", destino]);
    expect(estado.mercado.vagas.some((v) => v.clubeId === "a8")).toBe(true);
    expect(estado.mercado.tecnicos[destino]).toBe("Fulano");
    expect(proximoJogoDoUsuario(estado)?.competicao).toBeTruthy();
  });

  it("aceitar uma sondagem pela caixa troca de clube", () => {
    const estado = jogo(9);
    estado.carreira.caixa.unshift({
      id: "sondagem",
      rodada: 0,
      de: "Clube B2",
      assunto: "Sondagem",
      texto: "",
      lida: false,
      opcoes: [{ texto: "Aceitar", efeito: {}, mercado: { assumir: "b2" } }],
    });
    const reacoes = responder(estado, "sondagem", 0);
    expect(estado.carreira.clubeId).toBe("b2");
    expect(reacoes.at(-1)).toContain("Clube B2");
  });
});

describe("temporada inteira com mercado", () => {
  it("termina e é reproduzível", () => {
    const a = jogo(10);
    const b = jogo(10);
    avancar(a, 38);
    avancar(b, 38);
    expect(fimDeTemporada(a)).toBe(true);
    expect(a.carreira.noticias).toEqual(b.carreira.noticias);
    expect(a.mercado.financas).toEqual(b.mercado.financas);
  });
});
