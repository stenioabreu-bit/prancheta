import {
  type Clube,
  type ClubeDados,
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
} from "@prancheta/engine";
import type { JogoMedido, TemporadaMedida } from "./metricas";

export type Modo = "motor" | "rapido";

/** Uma temporada de pontos corridos só com IA, no motor portado para TypeScript. */
export function temporadaPort(clubesDados: ClubeDados[], semente: number, modo: Modo): TemporadaMedida {
  const rng = criarRng(semente);
  const clubes = new Map<string, Clube>(clubesDados.map((d) => [d.id, criarClube(d, rng)]));
  const ids = [...clubes.keys()];
  const tabela = novaTabela(ids);
  const jogos: JogoMedido[] = [];
  const maisForte = ids.reduce((a, b) => (clubes.get(b)!.forca > clubes.get(a)!.forca ? b : a));
  let golsMaisForte = 0;
  let goleadasMaisForte = 0;

  for (const rodada of calendarioPontosCorridos(rng, ids)) {
    for (const { casa, visitante } of rodada) {
      const c = clubes.get(casa)!;
      const v = clubes.get(visitante)!;
      let jogo: JogoMedido;
      if (modo === "motor") {
        const partida = criarPartida(c, v, { rng });
        jogarAteOFim(partida);
        const r = encerrarPartida(partida);
        const { casa: ec, visitante: ev } = r.est;
        jogo = {
          golsCasa: r.golsCasa,
          golsVisitante: r.golsVisitante,
          detalhe: {
            amarelos: ec.amarelos + ev.amarelos,
            vermelhos: ec.vermelhos + ev.vermelhos,
            chutes: ec.chutes + ev.chutes,
            xg: ec.xg + ev.xg,
            lesoes: partida.eventos.filter((e) => e.tipo === "lesao").length,
          },
        };
      } else {
        const [gc, gv] = placarRapido(rng, c, v);
        estatisticasRapidas(rng, c, gc, gv);
        estatisticasRapidas(rng, v, gv, gc);
        jogo = { golsCasa: gc, golsVisitante: gv };
      }
      jogos.push(jogo);
      registrarResultado(tabela, casa, visitante, jogo.golsCasa, jogo.golsVisitante);
      if (casa === maisForte || visitante === maisForte) {
        const pro = casa === maisForte ? jogo.golsCasa : jogo.golsVisitante;
        const contra = casa === maisForte ? jogo.golsVisitante : jogo.golsCasa;
        golsMaisForte += pro;
        if (pro - contra >= 4) goleadasMaisForte++;
      }
    }
    recuperarEntreRodadas(clubes.values());
  }

  const jogadores = [...clubes.values()].flatMap((c) => c.jogadores);
  const artilheiro = jogadores.reduce((a, b) => (b.temporada.gols > a.temporada.gols ? b : a));
  const garcom = jogadores.reduce((a, b) => (b.temporada.assist > a.temporada.assist ? b : a));
  const ordem = classificacao(ids, tabela);
  return {
    jogos,
    artilheiro: { nome: artilheiro.nome, gols: artilheiro.temporada.gols },
    garcom: { nome: garcom.nome, assist: garcom.temporada.assist },
    pontosCampeao: tabela[ordem[0]!]!.pts,
    pontosLanterna: tabela[ordem[ordem.length - 1]!]!.pts,
    maisForte: {
      golsPorJogo: golsMaisForte / 38,
      goleadas: goleadasMaisForte,
      pontos: tabela[maisForte]!.pts,
    },
  };
}
