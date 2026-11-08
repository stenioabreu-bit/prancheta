import { AJUSTES } from "./ajustes";
import { jogadorDoClube } from "./clube";
import { ESQUEMA_POSTOS, PESO_SETOR } from "./constantes";
import { type Rng, limitar, poisson, sortearComPeso } from "./rng";
import type { Clube, Jogador, Posicao } from "./tipos";

/** Placar de um jogo não assistido, por Poisson sobre a diferença de força. */
export function placarRapido(rng: Rng, casa: Clube, visitante: Clube): [number, number] {
  const { golsMandante, golsVisitante, escalaForca } = AJUSTES.simulacaoRapida;
  const diferenca = casa.forca - visitante.forca;
  const lambdaCasa = golsMandante * Math.exp(diferenca / escalaForca);
  const lambdaVisitante = golsVisitante * Math.exp(-diferenca / escalaForca);
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
 */
export function estatisticasRapidas(rng: Rng, clube: Clube, golsPro: number, golsContra: number): void {
  const postos = ESQUEMA_POSTOS[clube.esquema];
  const escalados: Escalado[] = clube.titulares.map((id, i) => ({
    jogador: jogadorDoClube(clube, id),
    posto: postos[i]?.[0] ?? "MC",
    gols: 0,
    assist: 0,
  }));
  const deLinha = escalados.filter((e) => e.posto !== "GOL");
  for (const e of escalados) {
    e.jogador.temporada.jogos++;
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
    }
  }
  const goleiro = escalados.find((e) => e.posto === "GOL");
  if (goleiro) {
    goleiro.jogador.temporada.golsSofridos += golsContra;
    goleiro.jogador.temporada.jogosNoGol++;
    if (!golsContra) goleiro.jogador.temporada.semSofrer++;
  }
  const resultado = golsPro > golsContra ? 0.35 : golsPro < golsContra ? -0.35 : 0;
  for (const e of escalados) {
    let nota =
      6.3 +
      resultado +
      (e.jogador.ovr - 68) / 40 +
      e.gols * 1.0 +
      e.assist * 0.5 +
      (rng.proximo() - 0.5) * 0.9;
    if (e.posto === "GOL") nota += golsContra === 0 ? 0.5 : -0.25 * golsContra;
    if (["ZAG", "LD", "LE", "VOL"].includes(e.posto) && golsContra === 0) nota += 0.3;
    nota = limitar(Math.round(nota * 10) / 10, 4, 10);
    e.jogador.temporada.somaNotas += nota;
    e.jogador.temporada.qtdNotas++;
  }
}
