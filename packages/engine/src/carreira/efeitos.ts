import { limitar } from "../rng";
import type { Clube } from "../tipos";
import type { Efeito, EstadoCarreira, Mensagem, Noticia, TipoNoticia } from "./tipos";

const LIMITE_CAIXA = 60;
const LIMITE_NOTICIAS = 40;

export function enviarMensagem(
  carreira: EstadoCarreira,
  rodada: number,
  m: Omit<Mensagem, "id" | "rodada" | "lida">,
): Mensagem {
  const mensagem: Mensagem = { id: `m${carreira.proximoId++}`, rodada, lida: false, ...m };
  carreira.caixa.unshift(mensagem);
  if (carreira.caixa.length > LIMITE_CAIXA) carreira.caixa.pop();
  return mensagem;
}

export function publicarNoticia(
  carreira: EstadoCarreira,
  rodada: number,
  de: string,
  texto: string,
  tipo: TipoNoticia = "info",
): void {
  const n: Noticia = { rodada, de, texto, tipo };
  carreira.noticias.unshift(n);
  if (carreira.noticias.length > LIMITE_NOTICIAS) carreira.noticias.pop();
}

/** Mensagens não lidas ou com pergunta ainda sem resposta. */
export function pendentes(carreira: EstadoCarreira): number {
  return carreira.caixa.filter((m) => !m.lida || (m.opcoes && m.resposta === undefined)).length;
}

/**
 * Aplica um efeito e devolve as reações em texto. Temperamental sente mais a
 * bronca (×1,5); veterano sente menos (×0,7).
 */
export function aplicarEfeito(
  carreira: EstadoCarreira,
  clube: Clube | null,
  rodada: number,
  ef: Efeito,
): string[] {
  const reacoes: string[] = [];
  if (ef.diretoria) {
    carreira.diretoria = limitar(carreira.diretoria + ef.diretoria, 0, 100);
    reacoes.push(ef.diretoria > 0 ? "A diretoria aprovou." : "A diretoria não gostou.");
  }
  if (ef.torcida) {
    carreira.torcida = limitar(carreira.torcida + ef.torcida, 0, 100);
    reacoes.push(ef.torcida > 0 ? "A torcida curtiu nas redes." : "A torcida reagiu mal nas redes.");
  }
  if (ef.elenco && clube) {
    const e = ef.elenco;
    reacoes.push(
      e >= 3
        ? "O elenco gostou muito da sua postura."
        : e > 0
          ? "O elenco recebeu bem."
          : "O vestiário não gostou de ser exposto.",
    );
    for (const j of clube.jogadores) {
      const peso = j.perso === "temperamental" && e < 0 ? 1.5 : 1;
      j.moral = limitar(j.moral + Math.round(e * peso), 0, 100);
    }
  }
  if (ef.jogador && clube) {
    const j = clube.jogadores.find((x) => x.id === ef.jogador!.id);
    if (j) {
      let d = ef.jogador.moral;
      if (d < 0 && j.perso === "temperamental") d = Math.round(d * 1.5);
      if (d < 0 && j.perso === "veterano") d = Math.round(d * 0.7);
      j.moral = limitar(j.moral + d, 0, 100);
      reacoes.push(
        `${j.nome} ${d >= 5 ? "gostou muito." : d > 0 ? "gostou." : d > -5 ? "não gostou." : "ficou revoltado."}`,
      );
    }
  }
  if (ef.promessa) {
    const { prazo, ...resto } = ef.promessa;
    carreira.promessas.push({ ...resto, ate: rodada + prazo, feitos: 0, status: "aberta" });
  }
  if (ef.intensidade !== undefined) carreira.treino.intensidade = ef.intensidade;
  if (ef.marcar) carreira.marcas[ef.marcar] = rodada;
  return reacoes;
}

/** Responde uma mensagem com opções; responder de novo não faz nada. */
export function responderMensagem(
  carreira: EstadoCarreira,
  clube: Clube | null,
  rodada: number,
  mensagemId: string,
  opcao: number,
): string[] {
  const m = carreira.caixa.find((x) => x.id === mensagemId);
  if (!m?.opcoes || m.resposta !== undefined) return [];
  const escolhida = m.opcoes[opcao];
  if (!escolhida) return [];
  m.resposta = opcao;
  m.lida = true;
  return aplicarEfeito(carreira, clube, rodada, escolhida.efeito);
}
