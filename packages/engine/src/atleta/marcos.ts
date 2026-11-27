/**
 * Momentos que não são sorteados: marcos da carreira (estreia, primeiro gol, hat-trick, gol 100,
 * jogo 300, primeiro título, estreia na seleção...), a semana antes de um jogo grande (clássico,
 * final, reencontro com um ex-clube) e a lista do torneio de seleções. Cada um vira um dilema.
 */
import { ehClassico } from "../carreira/diretoria";
import { fasesDaCompeticao, nomeDaCompeticao } from "../competicao/temporada";
import type { JogoAgendado } from "../competicao/tipos";
import { convocavelParaTorneio, torneioDoAno } from "./conquistas";
import { type ContextoAtleta, contarEvento, criarDilema, eventoAtleta, mexerVida, noFeed } from "./motor";
import { progressoDaTemporada } from "./painel";
import { jogoPendenteDoAtleta } from "./partida";
import type { DilemaAtleta, EstadoAtleta } from "./tipos";

interface Totais {
  jogos: number;
  gols: number;
  titulos: number;
}

function totais(a: EstadoAtleta): Totais {
  return {
    jogos: a.historico.reduce((s, h) => s + h.jogos, a.numeros.jogos),
    gols: a.historico.reduce((s, h) => s + h.gols, a.numeros.gols),
    titulos: (a.conquistas ?? []).filter((x) => x.tipo === "titulo").length,
  };
}

interface Marco {
  id: string;
  evento: string;
  vale: (a: EstadoAtleta, t: Totais) => boolean;
  n?: number;
}

const MARCOS: Marco[] = [
  { id: "estreia", evento: "marco-estreia", vale: (_, t) => t.jogos >= 1 },
  { id: "primeiro-gol", evento: "marco-primeiro-gol", vale: (_, t) => t.gols >= 1 },
  { id: "hat-trick", evento: "marco-hat-trick", vale: (a) => (a.hatTricks ?? 0) >= 1 },
  ...[50, 100, 200, 300, 400].map((n) => ({
    id: `gols-${n}`,
    evento: "marco-gols",
    n,
    vale: (_: EstadoAtleta, t: Totais) => t.gols >= n,
  })),
  ...[100, 250, 400, 600].map((n) => ({
    id: `jogos-${n}`,
    evento: "marco-jogos",
    n,
    vale: (_: EstadoAtleta, t: Totais) => t.jogos >= n,
  })),
  { id: "primeiro-titulo", evento: "marco-primeiro-titulo", vale: (_, t) => t.titulos >= 1 },
  { id: "estreia-selecao", evento: "marco-estreia-selecao", vale: (a) => a.convocacoes >= 1 },
];

/**
 * Confere os marcos e cria o dilema do primeiro que acabou de ser atingido (um por vez; o próximo
 * fica para a próxima checagem). Save antigo sem a lista: os marcos já passados ficam como vistos.
 */
export function verificarMarcos(c: ContextoAtleta): DilemaAtleta | null {
  const { a } = c;
  const t = totais(a);
  if (!a.marcos) {
    a.marcos = MARCOS.filter((m) => m.vale(a, t)).map((m) => m.id);
    return null;
  }
  for (const m of MARCOS) {
    if (a.marcos.includes(m.id) || !m.vale(a, t)) continue;
    a.marcos.push(m.id);
    const def = eventoAtleta(m.evento);
    if (!def || a.dilemas.some((d) => d.evento === m.evento)) continue;
    const d = criarDilema(c, def, { n: m.n ?? 0, jogos: t.jogos, gols: t.gols });
    if (d) {
      contarEvento(a, def);
      return d;
    }
  }
  return null;
}

/** Tipo do próximo jogo grande do clube (para a semana de clássico, final ou reencontro). */
export function jogoGrande(
  c: ContextoAtleta,
  jogo: JogoAgendado,
): {
  tipo: "final" | "mataMata" | "classico" | "reencontro" | "continental";
  adversario: string;
  fase: string;
} | null {
  const { estado, a, clube } = c;
  const t = estado.temporada;
  const advId = jogo.casa === clube.id ? jogo.visitante : jogo.casa;
  const adversario = t.clubes[advId]?.nome ?? "o rival";
  const ex = new Set(a.historico.map((h) => h.clubeId));
  ex.delete(clube.id);
  const fase = fasesDaCompeticao(t, jogo.competicao).find((f) => f.nome === jogo.fase);
  const faseNome = jogo.fase ?? "";
  if (fase?.tipo === "mataMata" && /final/i.test(faseNome) && !/semi|oitava|quarta/i.test(faseNome))
    return { tipo: "final", adversario, fase: faseNome };
  if (ex.has(advId)) return { tipo: "reencontro", adversario, fase: faseNome };
  if (jogo.competicao.startsWith("cont-") && fase?.tipo === "liga")
    return { tipo: "continental", adversario, fase: nomeDaCompeticao(t, jogo.competicao) };
  if (fase?.tipo === "mataMata") return { tipo: "mataMata", adversario, fase: faseNome };
  if (ehClassico(estado.carreira, jogo.casa, jogo.visitante))
    return { tipo: "classico", adversario, fase: faseNome };
  return null;
}

/** Chance de virar história e intervalo mínimo (semanas) entre duas do mesmo tipo. */
const EVENTO_DO_JOGO = {
  final: { evento: "semana-de-final", chance: 0.85, intervalo: 3 },
  reencontro: { evento: "reencontro-ex", chance: 0.45, intervalo: 30 },
  mataMata: { evento: "semana-de-mata-mata", chance: 0.25, intervalo: 30 },
  classico: { evento: "semana-de-classico", chance: 0.5, intervalo: 10 },
  continental: { evento: "noite-continental", chance: 0.5, intervalo: 8 },
} as const;

/** A semana antes de um jogo grande vira história (uma por jogo). */
export function semanaDeJogoGrande(c: ContextoAtleta): DilemaAtleta | null {
  const { estado, a, clube, rng, j } = c;
  if (j.lesao > 0 || j.susp > 0) return null;
  const jogo = jogoPendenteDoAtleta(estado, clube.id);
  if (!jogo) return null;
  const chave = `jogo-grande:${jogo.id}`;
  if (a.marcas[chave] !== undefined) return null;
  const g = jogoGrande(c, jogo);
  if (!g) return null;
  a.marcas[chave] = a.semana + 2;
  const { evento, chance, intervalo } = EVENTO_DO_JOGO[g.tipo];
  const def = eventoAtleta(evento);
  if (!def || a.semana - (a.ultimaVez[evento] ?? -1e9) < intervalo) return null;
  if (rng.proximo() >= chance || a.dilemas.some((d) => d.evento === evento)) return null;
  const d = criarDilema(c, def, { adversario: g.adversario, fase: g.fase });
  if (d) contarEvento(a, def);
  return d;
}

/** Ano de Copa: depois de ~45% da temporada sai a lista; quem fica fora sente. */
export function listaDoTorneio(c: ContextoAtleta): DilemaAtleta | null {
  const { estado, a, j } = c;
  const t = estado.temporada;
  const torneio = torneioDoAno(t.temporada);
  if (!torneio) return null;
  a.marcos ??= [];
  const id = `lista:${t.temporada}`;
  if (a.marcos.includes(id)) return null;
  const p = progressoDaTemporada(estado);
  if (p.semana / p.total < 0.45) return null;
  a.marcos.push(id);
  if (!convocavelParaTorneio(a, j)) {
    if (j.ovr >= 74 && a.vida.fama >= 45) {
      mexerVida(a, "moral", -5);
      noFeed(a, `Saiu a lista da ${torneio.nome}: o seu nome não estava lá.`, "ruim");
    }
    return null;
  }
  const def = eventoAtleta("lista-torneio");
  if (!def) return null;
  const d = criarDilema(c, def, { torneio: torneio.nome });
  if (d) contarEvento(a, def);
  return d;
}
