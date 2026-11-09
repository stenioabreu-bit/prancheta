import {
  devolverEmprestimos,
  emprestarDoUsuario,
  emprestimoDe,
  fimDeTemporada,
  novaTemporadaDoJogo,
  novoJogo,
  pedirEmprestimoDoUsuario,
  proximoJogoDoUsuario,
  seguir,
  simularPartidaDoUsuario,
} from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { FINANCAS_2026 } from "../src";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

const pacote = lerPacote(PASTA_TESTE_REAL)!;
const novo = () =>
  novoJogo({
    semente: 8,
    temporada: 2026,
    divisoes: pacote.divisoes,
    vagasDiretasCopa: pacote.vagasDiretasCopa,
    financas: FINANCAS_2026,
    tecnico: "Teste",
    clubeId: "palmeiras",
  });

describe("empréstimos", () => {
  it("pede emprestado, o jogador chega e volta ao clube de origem no fim do prazo", () => {
    const j = novo();
    const reserva = j.temporada.clubes.mirassol!.jogadores.find(
      (x) => !j.temporada.clubes.mirassol!.titulares.includes(x.id),
    )!;
    let texto = "";
    for (let i = 0; i < 10 && !emprestimoDe(j, reserva.id); i++)
      texto = pedirEmprestimoDoUsuario(j, reserva.id, "6m");
    expect(emprestimoDe(j, reserva.id), texto).toBeDefined();
    expect(j.temporada.clubes.palmeiras!.jogadores.some((x) => x.id === reserva.id)).toBe(true);
    j.temporada.rodada += 26;
    devolverEmprestimos(j);
    j.temporada.rodada -= 26;
    expect(j.temporada.clubes.mirassol!.jogadores.some((x) => x.id === reserva.id)).toBe(true);
    expect(emprestimoDe(j, reserva.id)).toBeUndefined();
  });

  it("empresta um reserva do elenco para outro clube", () => {
    const j = novo();
    const meu = j.temporada.clubes.palmeiras!;
    const reserva = meu.jogadores
      .filter((x) => !meu.titulares.includes(x.id))
      .sort((a, b) => a.ovr - b.ovr)[0]!;
    const texto = emprestarDoUsuario(j, reserva.id, "1a");
    const e = emprestimoDe(j, reserva.id);
    expect(e, texto).toBeDefined();
    expect(meu.jogadores.some((x) => x.id === reserva.id)).toBe(false);
  });
});

describe("acessos e rebaixamentos", () => {
  it("a virada guarda quem subiu e quem caiu", () => {
    const j = novo();
    let g = 0;
    while (!fimDeTemporada(j) && g++ < 200) {
      j.carreira.diretoria = 70;
      if (proximoJogoDoUsuario(j)) simularPartidaDoUsuario(j);
      else seguir(j);
    }
    novaTemporadaDoJogo(j);
    const a = j.carreira.acessos!;
    expect(a.temporada).toBe(2026);
    const serieA = a.divisoes.find((d) => d.nome.includes("A"))!;
    expect(serieA.cairam.length).toBe(4);
    expect(a.divisoes.some((d) => d.subiram.length === 4)).toBe(true);
  });
});
