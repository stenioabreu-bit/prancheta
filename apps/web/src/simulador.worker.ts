/// <reference lib="webworker" />
import { pacoteFicticio } from "@prancheta/data";
import {
  type EventoPartida,
  type ResultadoPartida,
  criarClube,
  criarPartida,
  criarRng,
  encerrarPartida,
  jogarAteOFim,
} from "@prancheta/engine";

export interface PedidoSimulacao {
  casaId: string;
  visitanteId: string;
  semente: number;
}

export interface RespostaSimulacao {
  resultado: ResultadoPartida;
  eventos: EventoPartida[];
  nomes: { casa: string; visitante: string };
}

/** O motor roda aqui, fora da thread da interface. */
self.onmessage = (e: MessageEvent<PedidoSimulacao>) => {
  const { casaId, visitanteId, semente } = e.data;
  const rng = criarRng(semente);
  const dados = pacoteFicticio().divisoes.A ?? [];
  const casa = criarClube(dados.find((c) => c.id === casaId)!, rng);
  const visitante = criarClube(dados.find((c) => c.id === visitanteId)!, rng);
  const partida = criarPartida(casa, visitante, { rng });
  jogarAteOFim(partida);
  const resposta: RespostaSimulacao = {
    resultado: encerrarPartida(partida),
    eventos: partida.eventos,
    nomes: { casa: casa.nome, visitante: visitante.nome },
  };
  self.postMessage(resposta);
};
