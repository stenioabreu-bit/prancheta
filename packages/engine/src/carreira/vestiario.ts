import { forcaDoClube, jogadorDoClube } from "../clube";
import {
  COLETIVA,
  CONSELHO_INTERVALO,
  CONVERSA,
  DICA_POR_ESTILO,
  type Pergunta,
  TONS,
  reacaoDoGrupo,
  reacaoIndividual,
} from "../conteudo/vestiario";
import type { LadoPartida, Partida } from "../partida";
import { type Rng, limitar, sortear } from "../rng";
import { type Clube, ESTILOS, type Jogador, type Personalidade } from "../tipos";
import { membroDaFuncao, multiplicadorDoAuxiliar } from "./comissao";
import { aplicarEfeito } from "./efeitos";
import type { Efeito, EstadoCarreira, OpcaoDeResposta, TomDeConversa } from "./tipos";

/* ---------- preleção ---------- */

export type MomentoDaFala = "pre" | "intervalo" | "pos";

function ladoDoUsuario(m: Partida): { eu: LadoPartida; adversario: LadoPartida } {
  return m.casa.ehUsuario ? { eu: m.casa, adversario: m.visitante } : { eu: m.visitante, adversario: m.casa };
}

interface Contexto {
  momento: MomentoDaFala;
  saldo: number;
  saldoXg: number;
  favorito: boolean;
  zebra: boolean;
}

function contextoDaFala(m: Partida, momento: MomentoDaFala): Contexto {
  const { eu, adversario } = ladoDoUsuario(m);
  const diferenca = forcaDoClube(eu.clube) - forcaDoClube(adversario.clube) + (eu === m.casa ? 1.5 : -1.5);
  return {
    momento,
    saldo: eu.est.gols - adversario.est.gols,
    saldoXg: eu.est.xg - adversario.est.xg,
    favorito: diferenca > 2.5,
    zebra: diferenca < -2.5,
  };
}

/** Quanto cada tom funciona no contexto (de −1,2 a 1,1). */
function adequacao(tom: TomDeConversa, c: Contexto): number {
  if (c.momento === "pre") {
    return {
      calmo: c.favorito ? 0.6 : 0.3,
      motivar: c.zebra ? 1 : 0.6,
      cobrar: c.favorito ? 0.4 : -0.5,
      elogiar: -0.2,
      semPressao: c.zebra ? 1.1 : -0.6,
      agressivo: -1,
    }[tom];
  }
  if (c.momento === "intervalo") {
    if (c.saldo > 0)
      return {
        calmo: 0.9,
        motivar: 0.4,
        cobrar: c.saldoXg < 0 ? 0.6 : -0.6,
        elogiar: c.saldoXg >= 0 ? 1 : 0.2,
        semPressao: 0.1,
        agressivo: -1.2,
      }[tom];
    if (c.saldo === 0)
      return {
        calmo: 0.3,
        motivar: 0.8,
        cobrar: c.saldoXg < -0.3 ? 0.8 : -0.2,
        elogiar: c.saldoXg > 0.3 ? 0.6 : -0.4,
        semPressao: c.zebra ? 0.6 : -0.3,
        agressivo: c.saldoXg < -0.5 ? 0.3 : -0.8,
      }[tom];
    return {
      calmo: c.saldoXg > 0 ? 0.6 : -0.2,
      motivar: 0.7,
      cobrar: c.saldoXg < 0 ? 0.9 : -0.3,
      elogiar: c.saldoXg > 0 ? 0.4 : -1,
      semPressao: c.saldo < -1 ? 0.3 : -0.4,
      agressivo: c.saldo < -1 ? -1 : c.saldoXg < -0.5 ? 0.6 : -0.4,
    }[tom];
  }
  if (c.saldo > 0)
    return {
      calmo: 0.3,
      motivar: 0.4,
      cobrar: c.saldoXg < -0.5 ? 0.5 : -0.7,
      elogiar: 1,
      semPressao: 0,
      agressivo: -1.2,
    }[tom];
  if (c.saldo === 0)
    return {
      calmo: 0.5,
      motivar: 0.5,
      cobrar: c.favorito ? 0.5 : -0.3,
      elogiar: c.zebra ? 0.8 : -0.2,
      semPressao: 0.1,
      agressivo: -0.6,
    }[tom];
  return {
    calmo: c.zebra ? 0.6 : 0.2,
    motivar: 0.6,
    cobrar: c.favorito ? 0.7 : 0.1,
    elogiar: -1,
    semPressao: 0.2,
    agressivo: c.favorito && c.saldoXg < -0.5 ? 0.2 : -0.9,
  }[tom];
}

/** Como cada personalidade sente cada tom (`_` = os demais). */
const SENSIBILIDADE: Record<Personalidade, Partial<Record<TomDeConversa | "_", number>>> = {
  temperamental: { agressivo: 1.8, cobrar: 1.5, _: 1.3 },
  jovem: { agressivo: 1.6, cobrar: 1.3, elogiar: 1.4, _: 1.1 },
  veterano: { calmo: 1.4, elogiar: 0.6, semPressao: 0.7, _: 0.8 },
  lider: { _: 1.1 },
  profissional: { _: 0.9 },
  tranquilo: { agressivo: 0.7, _: 0.85 },
};

export interface ResultadoDaFala {
  geral: string;
  reacoes: string[];
  media: number;
}

/**
 * Preleção antes do jogo, no intervalo ou depois. Mexe na moral do jogo (e um
 * quarto disso na moral de fora). Repetir o mesmo tom perde força; líderes em
 * campo ajudam; o auxiliar motivador amplifica.
 */
export function prelecao(
  m: Partida,
  carreira: EstadoCarreira,
  momento: MomentoDaFala,
  tom: TomDeConversa,
  rng: Rng,
): ResultadoDaFala {
  const { eu } = ladoDoUsuario(m);
  let base = adequacao(tom, contextoDaFala(m, momento));
  base *= multiplicadorDoAuxiliar(carreira, base);
  const repeticoes = carreira.tonsRecentes.filter((t) => t === tom).length;
  if (repeticoes >= 2 && base > 0) base *= Math.max(0.25, 1 - 0.3 * (repeticoes - 1));
  carreira.tonsRecentes = [tom, ...carreira.tonsRecentes].slice(0, 5);
  const emCampo = eu.emCampo.filter((p) => !p.expulso);
  const lideres = emCampo.filter((p) => p.atual.jogador.perso === "lider").length;
  const reacoes: { nome: string; d: number }[] = [];
  let soma = 0;
  for (const p of emCampo) {
    const j = p.atual.jogador;
    const sens = SENSIBILIDADE[j.perso];
    let efeito = base * (sens[tom] ?? sens._ ?? 1) + (rng.proximo() - 0.5) * 0.5;
    if (base < 0 && j.perso === "temperamental" && tom === "agressivo") efeito -= 0.5;
    efeito += lideres * 0.12;
    const d = Math.round(efeito * 7);
    p.atual.moral = limitar(p.atual.moral + d, 0, 100);
    j.moral = limitar(j.moral + Math.round(d * 0.25), 0, 100);
    soma += d;
    reacoes.push({ nome: j.nome, d });
  }
  reacoes.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  const media = soma / Math.max(1, reacoes.length);
  const geral = reacaoDoGrupo(media);
  if (momento === "intervalo") {
    m.eventos.push({
      min: m.minuto,
      tipo: "neutro",
      lado: eu.lado,
      jogadores: [],
      texto: `Preleção (${TONS[tom].nome}): ${geral}`,
    });
  }
  return { geral, reacoes: reacoes.slice(0, 3).map((r) => reacaoIndividual(r.nome, r.d)), media };
}

/* ---------- conversa individual ---------- */

export type AssuntoDaConversa = "elogiar" | "cobrar" | "minutos" | "paciencia" | "titular" | "lideranca";

export interface OpcaoDeConversa extends OpcaoDeResposta {
  assunto: AssuntoDaConversa;
}

function mediaRecente(j: Jogador): number {
  const ultimas = j.notas.slice(-4);
  return ultimas.length ? ultimas.reduce((a, b) => a + b, 0) / ultimas.length : 6.5;
}

export function opcoesDeConversa(clube: Clube, j: Jogador): OpcaoDeConversa[] {
  const media = mediaRecente(j);
  const titular = clube.titulares.includes(j.id);
  const p = j.perso;
  const ops: OpcaoDeConversa[] = [
    {
      assunto: "elogiar",
      texto: CONVERSA.elogiar,
      efeito: { jogador: { id: j.id, moral: media >= 7 ? 8 : media >= 6.5 ? 3 : -3 } },
    },
    {
      assunto: "cobrar",
      texto: CONVERSA.cobrar,
      efeito: {
        jogador: {
          id: j.id,
          moral:
            media < 6.3 ? (p === "profissional" || p === "lider" ? 5 : p === "temperamental" ? -7 : -2) : -6,
        },
      },
    },
  ];
  if (!titular) {
    ops.push(
      {
        assunto: "minutos",
        texto: CONVERSA.minutos,
        efeito: {
          jogador: { id: j.id, moral: 10 },
          promessa: { tipo: "minutos", jogadorId: j.id, nome: j.nome, meta: 2, prazo: 4 },
        },
      },
      {
        assunto: "paciencia",
        texto: CONVERSA.paciencia,
        efeito: {
          jogador: {
            id: j.id,
            moral: p === "veterano" || p === "profissional" ? 3 : p === "temperamental" ? -4 : 0,
          },
        },
      },
    );
  } else {
    ops.push(
      {
        assunto: "titular",
        texto: CONVERSA.titular,
        efeito: {
          jogador: { id: j.id, moral: 8 },
          promessa: { tipo: "titular", jogadorId: j.id, nome: j.nome, meta: 3, prazo: 3 },
        },
      },
      {
        assunto: "lideranca",
        texto: CONVERSA.lideranca,
        efeito: {
          jogador: { id: j.id, moral: p === "lider" || p === "veterano" ? 6 : p === "jovem" ? -3 : 1 },
        },
      },
    );
  }
  return ops;
}

export function conversar(
  carreira: EstadoCarreira,
  clube: Clube,
  rodada: number,
  jogadorId: string,
  assunto: AssuntoDaConversa,
): string[] {
  const j = jogadorDoClube(clube, jogadorId);
  const opcao = opcoesDeConversa(clube, j).find((o) => o.assunto === assunto);
  if (!opcao) return [];
  const reacoes = aplicarEfeito(carreira, clube, rodada, opcao.efeito);
  if (opcao.efeito.promessa) {
    reacoes.push(
      opcao.efeito.promessa.tipo === "minutos" ? CONVERSA.promessaMinutos : CONVERSA.promessaTitular,
    );
  }
  return reacoes;
}

/* ---------- coletivas ---------- */

export function coletivaAntes(
  carreira: EstadoCarreira,
  clube: Clube,
  adversario: Clube,
  classico: boolean,
  posicao: number | null,
): Pergunta[] {
  if (classico) return [COLETIVA.classico(adversario.nome)];
  if (posicao !== null && posicao > carreira.meta.posicao + 3) {
    return [COLETIVA.abaixoDaMeta(clube.nome, posicao, adversario.nome)];
  }
  return [];
}

export function coletivaDepois(carreira: EstadoCarreira, m: Partida): Pergunta[] {
  const { eu, adversario } = ladoDoUsuario(m);
  const perguntas: Pergunta[] = [];
  const pro = eu.est.gols;
  const contra = adversario.est.gols;
  const nomeAdv = adversario.clube.nome;
  if (pro > contra) perguntas.push(COLETIVA.vitoria(nomeAdv));
  else if (pro < contra) perguntas.push(COLETIVA.derrota(nomeAdv, carreira.torcida < 40));
  else perguntas.push(COLETIVA.empate(nomeAdv));
  const jogaram = [
    ...eu.emCampo.map((p) => p.atual.jogador),
    ...eu.saidos.map((id) => jogadorDoClube(eu.clube, id)),
  ];
  const ultimaNota = (j: Jogador) => j.notas[j.notas.length - 1] ?? 6.5;
  const melhor = jogaram.slice().sort((a, b) => ultimaNota(b) - ultimaNota(a))[0];
  const pior = jogaram.slice().sort((a, b) => ultimaNota(a) - ultimaNota(b))[0];
  if (melhor && ultimaNota(melhor) >= 7.3) {
    perguntas.push(COLETIVA.destaque(melhor.nome, melhor.id, melhor.perso === "profissional"));
  } else if (pior && ultimaNota(pior) <= 5.8) {
    perguntas.push(COLETIVA.criticado(pior.nome, pior.id));
  }
  const encostado = eu.clube.jogadores.find((j) => j.ovr >= 72 && j.semJogar >= 2 && !jogaram.includes(j));
  if (encostado) perguntas.push(COLETIVA.encostado(encostado.nome, encostado.id, encostado.semJogar));
  if (carreira.diretoria < 35) perguntas.push(COLETIVA.cargoAmeacado());
  return perguntas.slice(0, 3);
}

export function responderColetiva(
  carreira: EstadoCarreira,
  clube: Clube | null,
  rodada: number,
  pergunta: Pergunta,
  opcao: number,
): string[] {
  const efeito: Efeito | undefined = pergunta.opcoes[opcao]?.efeito;
  return efeito ? aplicarEfeito(carreira, clube, rodada, efeito) : [];
}

/* ---------- auxiliar ---------- */

export interface Conselho {
  de: string;
  texto: string;
}

/** Dica sobre o adversário; o auxiliar pode ler errado (acerta mais com tático alto). */
export function conselhoAntes(carreira: EstadoCarreira, adversario: Clube, rng: Rng): Conselho {
  const auxiliar = membroDaFuncao(carreira, "auxiliar");
  const acertou = rng.proximo() < 0.45 + auxiliar.at.tatico / 30;
  const estilo = acertou ? adversario.estilo : sortear(rng, ESTILOS);
  return { de: auxiliar.nome, texto: DICA_POR_ESTILO[estilo] };
}

export function conselhoIntervalo(carreira: EstadoCarreira, m: Partida): Conselho {
  const auxiliar = membroDaFuncao(carreira, "auxiliar");
  const { eu, adversario } = ladoDoUsuario(m);
  const partes: string[] = [];
  const cansados = eu.emCampo.filter((p) => !p.expulso && p.atual.cond < 66).map((p) => p.atual.jogador.nome);
  if (cansados.length) partes.push(CONSELHO_INTERVALO.cansados(cansados.slice(0, 2)));
  const pior = eu.emCampo
    .filter((p) => !p.expulso && p.posto !== "GOL")
    .sort((a, b) => a.atual.nota - b.atual.nota)[0];
  if (pior && pior.atual.nota < 6.1 && auxiliar.at.tatico >= 9)
    partes.push(CONSELHO_INTERVALO.malNoJogo(pior.atual.jogador.nome));
  if (adversario.est.xg > eu.est.xg + 0.5) partes.push(CONSELHO_INTERVALO.elesChegamMais);
  else if (eu.est.xg > adversario.est.xg + 0.5 && eu.est.gols <= adversario.est.gols)
    partes.push(CONSELHO_INTERVALO.faltaCapricho);
  if (!partes.length) partes.push(CONSELHO_INTERVALO.controlado);
  return { de: auxiliar.nome, texto: partes.join(" ") };
}
