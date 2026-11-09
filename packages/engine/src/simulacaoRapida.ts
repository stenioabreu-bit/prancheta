import { AJUSTES } from "./ajustes";
import { jogadorDoClube } from "./clube";
import { ESQUEMA_POSTOS, PESO_SETOR } from "./constantes";
import { type Rng, limitar, poisson, sortearComPeso } from "./rng";
import type { Clube, Jogador, Posicao } from "./tipos";

/** Placar de um jogo não assistido, por Poisson sobre a diferença de força. */
export function placarRapido(rng: Rng, casa: Clube, visitante: Clube, neutro = false): [number, number] {
  const { golsMandante, golsVisitante, escalaForca } = AJUSTES.simulacaoRapida;
  const diferenca = casa.forca - visitante.forca;
  const semMando = (golsMandante + golsVisitante) / 2;
  const lambdaCasa = (neutro ? semMando : golsMandante) * Math.exp(diferenca / escalaForca);
  const lambdaVisitante = (neutro ? semMando : golsVisitante) * Math.exp(-diferenca / escalaForca);
  return [poisson(rng, lambdaCasa), poisson(rng, lambdaVisitante)];
}

interface Escalado {
  jogador: Jogador;
  posto: Posicao;
  gols: number;
  assist: number;
}

/**
 * Estatísticas individuais de um jogo simulado (gols, assistências, notas,
 * goleiros), para os rankings também contarem os jogos que o usuário não viu.
 * Jogo de copa só conta os gols da copa, como no protótipo.
 */
export function estatisticasRapidas(
  rng: Rng,
  clube: Clube,
  golsPro: number,
  golsContra: number,
  copa = false,
  competicao?: string,
): void {
  const daCompeticao = (j: {
    temporada: { porCompeticao?: Record<string, import("./tipos").EstatisticaDaCompeticao> };
  }) => {
    if (!competicao) return null;
    j.temporada.porCompeticao ??= {};
    return (j.temporada.porCompeticao[competicao] ??= { jogos: 0, gols: 0, assist: 0 });
  };
  const postos = ESQUEMA_POSTOS[clube.esquema];
  const escalados: Escalado[] = clube.titulares.map((id, i) => ({
    jogador: jogadorDoClube(clube, id),
    posto: postos[i]?.[0] ?? "MC",
    gols: 0,
    assist: 0,
  }));
  const deLinha = escalados.filter((e) => e.posto !== "GOL");
  for (const e of escalados) {
    if (!copa) e.jogador.temporada.jogos++;
    const pc = daCompeticao(e.jogador);
    if (pc) pc.jogos++;
    e.jogador.semJogar = 0;
  }
  for (let k = 0; k < golsPro; k++) {
    const autor = sortearComPeso(
      rng,
      deLinha,
      (e) =>
        (PESO_SETOR[e.posto].a + 0.1) *
          (e.jogador.at.FIN / 60) ** AJUSTES.simulacaoRapida.expoenteFinalizador +
        (e.posto === "ZAG" ? 0.07 * (e.jogador.at.CAB / 60) ** 2 : 0),
    );
    const pcAutor = daCompeticao(autor.jogador);
    if (pcAutor) pcAutor.gols++;
    if (copa) {
      autor.jogador.temporada.golsCopa++;
      continue;
    }
    autor.gols++;
    autor.jogador.temporada.gols++;
    if (rng.proximo() < 0.72) {
      const garcom = sortearComPeso(
        rng,
        deLinha.filter((e) => e !== autor),
        (e) => (PESO_SETOR[e.posto].m + PESO_SETOR[e.posto].a * 0.7) * (e.jogador.at.PAS / 60) ** 2,
      );
      garcom.assist++;
      garcom.jogador.temporada.assist++;
      const pcGarcom = daCompeticao(garcom.jogador);
      if (pcGarcom) pcGarcom.assist++;
    }
  }
  const goleiroDaCompeticao = escalados.find((e) => e.posto === "GOL");
  if (goleiroDaCompeticao) {
    const pc = daCompeticao(goleiroDaCompeticao.jogador);
    if (pc) {
      pc.golsSofridos = (pc.golsSofridos ?? 0) + golsContra;
      pc.jogosNoGol = (pc.jogosNoGol ?? 0) + 1;
    }
  }
  const notaNaCompeticao = (e: (typeof escalados)[number], nota: number) => {
    const pc = daCompeticao(e.jogador);
    if (pc) {
      pc.somaNotas = (pc.somaNotas ?? 0) + nota;
      pc.qtdNotas = (pc.qtdNotas ?? 0) + 1;
    }
  };
  if (copa) {
    for (const e of escalados) notaNaCompeticao(e, notaRapida(e, golsPro, golsContra, 0));
    return;
  }
  const goleiro = escalados.find((e) => e.posto === "GOL");
  if (goleiro) {
    goleiro.jogador.temporada.golsSofridos += golsContra;
    goleiro.jogador.temporada.jogosNoGol++;
    if (!golsContra) goleiro.jogador.temporada.semSofrer++;
  }
  for (const e of escalados) {
    const nota = notaRapida(e, golsPro, golsContra, (rng.proximo() - 0.5) * 0.9);
    notaNaCompeticao(e, nota);
    e.jogador.temporada.somaNotas += nota;
    e.jogador.temporada.qtdNotas++;
  }
}

/** Nota do jogo rápido: resultado, overall, gols e assistências (o ruído vem de fora para não mexer no sorteio). */
function notaRapida(
  e: { jogador: { ovr: number }; posto: string; gols: number; assist: number },
  golsPro: number,
  golsContra: number,
  ruido: number,
): number {
  const resultado = golsPro > golsContra ? 0.35 : golsPro < golsContra ? -0.35 : 0;
  let nota = 6.3 + resultado + (e.jogador.ovr - 68) / 40 + e.gols * 1.0 + e.assist * 0.5 + ruido;
  if (e.posto === "GOL") nota += golsContra === 0 ? 0.5 : -0.25 * golsContra;
  if (["ZAG", "LD", "LE", "VOL"].includes(e.posto) && golsContra === 0) nota += 0.3;
  return limitar(Math.round(nota * 10) / 10, 4, 10);
}
