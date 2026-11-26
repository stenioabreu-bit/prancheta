import { describe, expect, it } from "vitest";
import {
  type ClubeDados,
  DIVISOES,
  type Divisao,
  type EstadoJogo,
  type RitmoAtleta,
  avancarAtleta,
  clubeDoAtleta,
  competicoesAtivas,
  competicoesDoClube,
  conquistasNaoVistas,
  criarRng,
  decidirDilema,
  dispensarResultado,
  efeitosDeJogo,
  escolherLance,
  jogadorDoAtleta,
  lancesPendentes,
  novoJogoAtleta,
  pendenciaDoAtleta,
  propostasDaBase,
  propostasDeTecnico,
  proximoJogoDoUsuario,
  repararLigasDoMundo,
  salaDeTrofeus,
  seguir,
  simularPartidaDoUsuario,
  todosOsEventos,
  verConquista,
  virarTecnico,
} from "../src";
import { premiosDaTemporada, registrarTitulosDoAtleta } from "../src/atleta/conquistas";
import { legadoDaCarreira } from "../src/atleta/legado";
import { verificarMarcos } from "../src/atleta/marcos";
import {
  type ContextoAtleta,
  bonusDeJogo,
  consumirEfeitosDeJogo,
  criarDilema,
  eventoAtleta,
} from "../src/atleta/motor";

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

  it("ritmo decisivos para nos dilemas e só nos lances decisivos", () => {
    const e = atleta(13, "decisivos");
    const a = e.atleta!;
    for (let k = 0; k < 30; k++) {
      const p = avancarAtleta(e, 200);
      if (p === "lances") {
        expect(lancesPendentes(a.jogo!).some((l) => l.decisivo)).toBe(true);
      }
      if (p === "dilemas") expect(a.dilemas.length).toBeGreaterThan(0);
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

    // Pós-carreira: vira técnico no mesmo mundo e o save segue no modo técnico.
    const propostas = propostasDeTecnico(e);
    expect(propostas.length).toBeGreaterThan(0);
    expect(virarTecnico(e, "inexistente")).toBe(false);
    expect(virarTecnico(e, propostas[0]!.clubeId)).toBe(true);
    expect(a.virouTecnico).toBe(true);
    expect(e.carreira.clubeId).toBe(propostas[0]!.clubeId);
    expect(e.temporada.usuarioId).toBe(propostas[0]!.clubeId);
    expect(e.carreira.tecnico).toBe(a.nome);
    expect(e.mercado.tecnicos[propostas[0]!.clubeId]).toBe(a.nome);
    for (const c of Object.values(e.temporada.clubes)) {
      expect(c.jogadores.some((j) => j.id === a.jogadorId)).toBe(false);
      expect(c.titulares).not.toContain(a.jogadorId);
    }
    expect(propostasDeTecnico(e)).toEqual([]);
    // E a carreira de técnico anda normalmente.
    const rodada = e.temporada.rodada;
    for (let k = 0; k < 5; k++) {
      if (proximoJogoDoUsuario(e)) simularPartidaDoUsuario(e);
      seguir(e);
    }
    expect(e.temporada.rodada).toBeGreaterThan(rodada);
  }, 120_000);

  it("os jogos do atleta rodam no motor de partida completo", () => {
    const e = atleta(5);
    jogarSemanas(e, 12);
    const jogos = e.atleta!.ultimosJogos;
    expect(jogos.length).toBeGreaterThan(0);
    for (const g of jogos) {
      expect(g.motor).toBe(true);
      expect(g.posse).toBeGreaterThan(0);
      // O placar final é o do motor sem as jogadas do atleta, mais o que ele decidiu.
      expect(g.placar![0]).toBeGreaterThanOrEqual(g.golsBase[0]);
      expect(g.placar![1]).toBeGreaterThanOrEqual(g.golsBase[1]);
      const minutos = g.lances.map((l) => l.minuto);
      expect(minutos).toEqual([...minutos].sort((x, y) => x - y));
      for (const l of g.lances) {
        if (g.minutos === 0) continue;
        expect(l.minuto).toBeGreaterThan(g.entrou === 0 ? 0 : g.entrou - 1);
      }
      if (g.minutos === 0) expect(g.lances).toEqual([]);
    }
    // O resto do elenco recebeu números do motor.
    const clube = clubeDoAtleta(e);
    expect(clube.jogadores.some((j) => j.id !== "atleta" && j.temporada.jogos > 0)).toBe(true);
  });

  it("ligas do mundo jogam em paralelo e viram com a temporada", () => {
    const mundo = ["ENG", "ESP"].map((codigo, k) => ({
      id: `mundo-${codigo.toLowerCase()}`,
      codigo,
      nome: k ? "La Liga" : "Premier League",
      pais: k ? "Espanha" : "Inglaterra",
      nivel: 1,
      clubes: Array.from({ length: 10 }, (_, i) => ({
        id: `m-${codigo}-${i}`,
        nome: `${codigo} FC ${i}`,
        sigla: `${codigo.slice(0, 2)}${i}`,
        nivel: 80 - i,
      })),
    }));
    const e = novoJogoAtleta({
      semente: 4,
      temporada: 2026,
      divisoes: divisoes(),
      vagasDiretasCopa: ["c0", "c1", "d0", "d1"],
      clubeId: "a5",
      nome: "Zé Mundo",
      pos: "ATA",
      origem: "profissional",
      ritmo: "temporada",
      numero: 9,
      pe: "esquerdo",
      mundo,
    });
    expect(e.atleta!.numero).toBe(9);
    expect(e.atleta!.pe).toBe("esquerdo");
    expect(competicoesAtivas(e.temporada)).toEqual(
      expect.arrayContaining(["est-mundo-eng", "est-mundo-esp"]),
    );
    expect(e.temporada.clubes["m-ENG-0"]!.jogadores.length).toBeGreaterThan(15);
    const a = e.atleta!;
    for (let k = 0; k < 200 && a.historico.length < 1 && !a.aposentado; k++) {
      const p = avancarAtleta(e, 200);
      if (p === "dilemas" || p === "lances") responderTudo(e);
    }
    expect(a.historico.length).toBe(1);
    // A liga do mundo terminou com campeão e foi remontada para o ano novo.
    expect(e.temporada.estaduais!["mundo-eng"]!.encerrada).toBe(false);
    expect(Object.values(e.temporada.jogos).some((j) => j.competicao === "est-mundo-esp")).toBe(true);
  }, 120_000);

  it("propostas da base: três clubes diferentes com minutos previstos", () => {
    const ds = divisoes();
    const opcoes = [
      ...ds.A.map((dados) => ({ dados, divisao: 1, liga: "Série A" })),
      ...ds.B.map((dados) => ({ dados, divisao: 2, liga: "Série B" })),
    ];
    const p = propostasDaBase(opcoes, "ATA", 60, 77);
    expect(p).toHaveLength(3);
    expect(new Set(p.map((x) => x.clubeId)).size).toBe(3);
    for (const x of p) {
      expect(x.minutos).toBeGreaterThan(0);
      expect(x.nivel).toBeGreaterThanOrEqual(1);
      expect(x.nivel).toBeLessThanOrEqual(5);
    }
    // Mesma semente, mesmas propostas.
    expect(propostasDaBase(opcoes, "ATA", 60, 77)).toEqual(p);
  });

  it("decisão mostra a chance de cada opção e guarda o cartão do resultado", () => {
    const e = atleta(17);
    const a = e.atleta!;
    for (let k = 0; k < 60 && !a.dilemas.length; k++) {
      if (a.jogo) responderTudo(e);
      avancarAtleta(e);
    }
    const d = a.dilemas[0]!;
    for (const o of d.opcoes) {
      expect(o.chance).toBeGreaterThanOrEqual(0);
      expect(o.chance).toBeLessThanOrEqual(1);
    }
    const texto = decidirDilema(e, d.id, 0);
    expect(a.ultimoResultado?.texto).toBe(texto);
    expect(a.ultimoResultado?.titulo).toBe(d.titulo);
    for (const v of Object.values(a.ultimoResultado!.mudancas)) expect(v).not.toBe(0);
    dispensarResultado(e);
    expect(a.ultimoResultado).toBeNull();
    // A tela de torneios acha a liga do clube com a posição.
    const comps = competicoesDoClube(e, clubeDoAtleta(e).id);
    expect(comps.find((c) => c.id === "A")?.resumo).toMatch(/º$/);
  });

  it("craque é assediado pelos grandes e converte mais as chances", () => {
    const e = atleta(23, "temporada");
    const a = e.atleta!;
    const j = jogadorDoAtleta(e);
    const d = 90 - j.ovr;
    j.ovr = 90;
    for (const k of Object.keys(j.at) as (keyof typeof j.at)[]) j.at[k] = Math.min(95, j.at[k] + d);
    a.potencial = 90;
    a.contrato.ate = 2035;
    a.vida.tecnico = 70;
    let leilao = null as null | (typeof a.dilemas)[number];
    const chutes: number[] = [];
    for (let k = 0; k < 300 && !leilao && a.historico.length < 1; k++) {
      avancarAtleta(e, 1);
      leilao = a.dilemas.find((x) => x.evento === "leilao") ?? null;
      for (const g of a.ultimosJogos)
        for (const l of g.lances) {
          const c = l.opcoes.find((o) => o.id === "chutar");
          if (c) chutes.push(c.chance);
        }
      if (!leilao) responderTudo(e);
    }
    expect(leilao).not.toBeNull();
    expect(leilao!.opcoes).toHaveLength(4);
    const salario = a.contrato.salario;
    decidirDilema(e, leilao!.id, 3);
    expect(a.contrato.salario).toBeGreaterThan(salario);
    for (let k = 0; k < 300 && chutes.length < 8 && !a.aposentado; k++) {
      responderTudo(e);
      avancarAtleta(e, 1);
      for (const g of a.ultimosJogos.splice(0))
        for (const l of g.lances) {
          const c = l.opcoes.find((o) => o.id === "chutar");
          if (c) chutes.push(c.chance);
        }
    }
    expect(chutes.length).toBeGreaterThan(0);
    expect(chutes.reduce((s, x) => s + x, 0) / chutes.length).toBeGreaterThan(0.45);
  }, 60_000);

  it("título do clube vira conquista com aviso dourado e entra na sala de troféus", () => {
    const e = atleta(7);
    const c = ctx(e);
    e.temporada.copa.campeao = c.clube.id;
    const novas = registrarTitulosDoAtleta(c);
    expect(novas).toHaveLength(1);
    expect(novas[0]!.tipo).toBe("titulo");
    expect(novas[0]!.peso).toBe(2);
    // Não repete na semana seguinte.
    expect(registrarTitulosDoAtleta(c)).toHaveLength(0);
    expect(conquistasNaoVistas(e).map((x) => x.id)).toEqual([novas[0]!.id]);
    verConquista(e, novas[0]!.id);
    expect(conquistasNaoVistas(e)).toHaveLength(0);
    const sala = salaDeTrofeus(e);
    expect(sala.titulos).toHaveLength(1);
    expect(sala.titulos[0]!.temporadas).toEqual([2026]);
  });

  it("temporada de craque rende artilharia, prêmio de craque e Bola de Ouro", () => {
    const e = atleta(11);
    const c = ctx(e);
    c.j.ovr = 94;
    c.j.temporada.porCompeticao = { A: { jogos: 36, gols: 48, assist: 15 } };
    c.j.temporada.jogos = 36;
    c.j.temporada.somaNotas = 36 * 8.4;
    c.j.temporada.qtdNotas = 36;
    const nomes = premiosDaTemporada(c).map((x) => x.chave);
    expect(nomes).toContain("artilheiro:A");
    expect(nomes).toContain("craque:A");
    expect(nomes).toContain("bola-de-ouro");
    expect(e.atleta!.bolaDeOuro![0]!.posicao).toBe(1);
    // A cerimônia vira história na semana seguinte.
    expect(e.atleta!.agendadas.some((x) => x.evento === "noite-bola-de-ouro")).toBe(true);
  });

  it("marcos da carreira viram momentos, um de cada vez e sem repetir", () => {
    const e = atleta(13);
    const c = ctx(e);
    const a = e.atleta!;
    a.numeros.jogos = 1;
    a.numeros.gols = 1;
    expect(verificarMarcos(c)?.evento).toBe("marco-estreia");
    expect(verificarMarcos(c)?.evento).toBe("marco-primeiro-gol");
    expect(verificarMarcos(c)).toBeNull();
    a.numeros.gols = 50;
    const d = verificarMarcos(c);
    expect(d?.evento).toBe("marco-gols");
    expect(d?.titulo).toBe("Gol número 50");
  });

  it("as escolhas da semana mexem no próximo jogo e somem depois dele", () => {
    const e = atleta(15);
    const a = e.atleta!;
    a.marcas.focado = a.semana + 2;
    a.marcas.confiante = a.semana + 3;
    a.marcas.ressaca = a.semana + 2;
    expect(
      efeitosDeJogo(a)
        .map((x) => x.id)
        .sort(),
    ).toEqual(["confiante", "focado", "ressaca"]);
    expect(bonusDeJogo(a)).toBeCloseTo(0.02);
    consumirEfeitosDeJogo(a);
    expect(efeitosDeJogo(a).map((x) => x.id)).toEqual(["confiante"]);
  });

  it("leilões em série não inflam o salário além do teto", () => {
    const e = atleta(23, "temporada");
    const a = e.atleta!;
    const j = jogadorDoAtleta(e);
    j.ovr = 92;
    a.contrato.ate = 2040;
    for (let k = 0; k < 400 && a.historico.length < 4 && !a.aposentado; k++) {
      avancarAtleta(e, 400);
      for (const d of [...a.dilemas]) decidirDilema(e, d.id, d.evento === "leilao" ? 3 : 0);
    }
    expect(a.contrato.salario).toBeLessThan(60);
  }, 120_000);

  it("clube das ligas do mundo não é confundido com um do pacote de mesmo nome", () => {
    const liga = (pais: string) => ({
      id: "mundo-esp",
      codigo: "ESP",
      nome: "La Liga",
      pais,
      nivel: 1,
      clubes: [
        { id: "m-barca", nome: "FC Barcelona", sigla: "FCB", nivel: 85 },
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `m-esp-${i}`,
          nome: `Espanhol ${i}`,
          sigla: `E${i}`,
          nivel: 78,
        })),
      ],
    });
    const criar = (pais: string) =>
      novoJogoAtleta({
        semente: 6,
        temporada: 2026,
        divisoes: divisoes(),
        vagasDiretasCopa: ["c0", "c1", "d0", "d1"],
        clubesExtras: [{ id: "x-barcelona", nome: "Barcelona SC", sigla: "BSC", nivel: 70 }],
        clubeId: "a5",
        nome: "Zé",
        pos: "ATA",
        origem: "base",
        mundo: [liga(pais)],
      });
    const jogosDa = (e: EstadoJogo) =>
      Object.values(e.temporada.jogos).filter((j) => j.competicao === "est-mundo-esp");
    // Liga europeia: o Barcelona de verdade entra, o equatoriano fica nas copas dele.
    const certo = criar("Espanha");
    expect(certo.temporada.estaduais!["mundo-esp"]!.clubes).toContain("m-barca");
    expect(certo.temporada.estaduais!["mundo-esp"]!.clubes).not.toContain("x-barcelona");
    // Save antigo (clube confundido): o reparo troca pelo clube certo na tabela e nos jogos.
    const antigo = criar("Argentina");
    expect(antigo.temporada.estaduais!["mundo-esp"]!.clubes).toContain("x-barcelona");
    expect(repararLigasDoMundo(antigo, [liga("Espanha")])).toBe(1);
    const div = antigo.temporada.estaduais!["mundo-esp"]!;
    expect(div.clubes).toContain("m-barca");
    expect(div.clubes).not.toContain("x-barcelona");
    expect(antigo.temporada.formatosEstaduais!["mundo-esp"]!.participantes).toContain("m-barca");
    expect(jogosDa(antigo).some((j) => j.casa === "m-barca" || j.visitante === "m-barca")).toBe(true);
    expect(jogosDa(antigo).some((j) => j.casa === "x-barcelona" || j.visitante === "x-barcelona")).toBe(
      false,
    );
    expect(antigo.temporada.clubes["x-barcelona"]).toBeTruthy();
    // Rodar de novo não troca nada.
    expect(repararLigasDoMundo(antigo, [liga("Espanha")])).toBe(0);
  });

  it("evento repetido chega com outra cena", () => {
    const e = atleta(17);
    const c = ctx(e);
    const def = eventoAtleta("balada")!;
    const primeira = criarDilema(c, def)!;
    e.atleta!.vezes = { balada: 1 };
    const segunda = criarDilema(c, def)!;
    expect(segunda.titulo).not.toBe(primeira.titulo);
    expect(segunda.opcoes.map((o) => o.texto)).toEqual(primeira.opcoes.map((o) => o.texto));
  });

  it("legado: patamar e distância até o topo da história", () => {
    const e = atleta(19);
    const a = e.atleta!;
    a.historico = Array.from({ length: 18 }, (_, i) => ({
      temporada: 2026 + i,
      clubeId: "a5",
      idade: 17 + i,
      ovr: 94,
      jogos: 50,
      gols: 45,
      assist: 15,
      nota: 7.9,
      titulos: [],
    }));
    a.conquistas = Array.from({ length: 6 }, (_, i) => ({
      id: `${2030 + i}:bola-de-ouro`,
      tipo: "premio" as const,
      chave: "bola-de-ouro",
      nome: "Bola de Ouro",
      temporada: 2030 + i,
      clubeId: "a5",
      clube: "Clube A5",
      peso: 3 as const,
      visto: true,
    }));
    const l = legadoDaCarreira(e);
    expect(l.patamar.id).toBe("goat");
    expect(l.numeros.gols).toBe(810);
    expect(l.rotulos).toContain("Ídolo do Clube A5");
    expect(l.pontos).toBeGreaterThan(50);
    expect(l.clubes).toHaveLength(1);
  });
});

function ctx(e: EstadoJogo): ContextoAtleta {
  return { estado: e, a: e.atleta!, j: jogadorDoAtleta(e), clube: clubeDoAtleta(e), rng: criarRng(1) };
}
