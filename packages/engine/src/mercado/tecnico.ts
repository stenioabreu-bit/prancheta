import { gerarGarotos } from "../carreira/base";
import { metaDaTemporada } from "../carreira/diretoria";
import { enviarMensagem, publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import { escalarAutomatico, forcaDoClube, gerarElenco } from "../clube";
import { divisaoDo } from "../competicao/temporada";
import { NOMES_COMISSAO, SOBRENOMES_COMISSAO } from "../conteudo/nomes";
import { criarJogador } from "../jogador";
import { type Rng, limitar, sortear } from "../rng";
import { financasIniciais } from "./financas";
import { exigenciaDoClube, formatarDinheiro, orcamentoInicial } from "./valores";

export function nomeDeTecnicoFicticio(rng: Rng): string {
  return `${sortear(rng, NOMES_COMISSAO)} ${sortear(rng, SOBRENOMES_COMISSAO)}`;
}

export function exigencia(estado: EstadoJogo, clubeId: string): number {
  return exigenciaDoClube(
    divisaoDo(estado.temporada, clubeId) ?? "D",
    estado.mercado.grandes.includes(clubeId),
  );
}

function abrirVaga(estado: EstadoJogo, clubeId: string, duracao: number) {
  const rodada = estado.temporada.rodada;
  estado.mercado.tecnicos[clubeId] = null;
  if (!estado.mercado.vagas.some((v) => v.clubeId === clubeId)) {
    estado.mercado.vagas.push({ clubeId, desde: rodada, ate: rodada + duracao, sondou: false });
  }
}

/** Demitido pela diretoria: vaga aberta no clube antigo e −6 de reputação. */
export function ficarDesempregado(estado: EstadoJogo, clubeAntigo: string): void {
  abrirVaga(estado, clubeAntigo, 3);
  estado.carreira.clubeId = null;
  estado.temporada.usuarioId = null;
  estado.carreira.reputacao = limitar(estado.carreira.reputacao - 6, 0, 100);
}

export function pedirDemissao(estado: EstadoJogo): void {
  const c = estado.carreira;
  if (!c.clubeId) return;
  const clube = estado.temporada.clubes[c.clubeId]!;
  abrirVaga(estado, clube.id, 3);
  c.clubeId = null;
  estado.temporada.usuarioId = null;
  c.reputacao = limitar(c.reputacao - 4, 0, 100);
  publicarNoticia(
    c,
    estado.temporada.rodada,
    "Imprensa",
    `${c.tecnico} pediu demissão do ${clube.nome}.`,
    "ruim",
  );
}

export function candidatar(estado: EstadoJogo, clubeId: string): string {
  const m = estado.mercado;
  if (!m.vagas.some((v) => v.clubeId === clubeId)) return "Esse clube não está com vaga aberta.";
  if (m.candidaturas.some((c) => c.clubeId === clubeId && c.status === "aguardando")) {
    return "Você já se candidatou a essa vaga.";
  }
  m.candidaturas.push({ clubeId, rodada: estado.temporada.rodada, status: "aguardando" });
  return "Candidatura enviada. A resposta chega na próxima rodada.";
}

/**
 * Assume um clube: elenco completado até 22 (com gerados um pouco abaixo da
 * média), meta nova, diretoria e torcida recomeçam, base nova e orçamento da divisão.
 */
export function assumir(estado: EstadoJogo, clubeId: string, rng: Rng): void {
  const t = estado.temporada;
  const c = estado.carreira;
  const m = estado.mercado;
  const clube = t.clubes[clubeId];
  if (!clube) return;
  if (c.clubeId && c.clubeId !== clubeId) abrirVaga(estado, c.clubeId, 3);
  m.vagas = m.vagas.filter((v) => v.clubeId !== clubeId);
  m.tecnicos[clubeId] = c.tecnico;
  c.clubeId = clubeId;
  t.usuarioId = clubeId;
  if (clube.jogadores.length < 22) {
    const faltam = 22 - clube.jogadores.length;
    const reforcos = gerarElenco(rng, Math.round(clube.forca) - 7).slice(0, faltam);
    for (const dados of reforcos) clube.jogadores.push(criarJogador(dados, clube.id, 100 + c.proximoId++));
  }
  const nomes = clube.titulares.map((id) => clube.jogadores.find((j) => j.id === id)?.nome ?? "");
  clube.titulares = escalarAutomatico(clube, clube.esquema, nomes);
  clube.forca = forcaDoClube(clube);
  c.meta = metaDaTemporada(t, clubeId);
  c.diretoria = 60;
  c.torcida = 55;
  c.promessas = [];
  c.base = gerarGarotos(c, 8, rng);
  c.entrosamento[clube.esquema] ??= 60;
  m.indicacoes = [];
  const divisao = divisaoDo(t, clubeId) ?? "D";
  const grande = m.grandes.includes(clubeId);
  m.financas = financasIniciais(
    clube,
    divisao,
    m.basesFinanceiras?.[clubeId],
    orcamentoInicial(divisao, grande),
    rng.proximo() < 0.5 ? "economico" : "normal",
    50,
    t.temporada,
  );
  m.passagens.push({ clubeId, temporada: t.temporada, rodada: t.rodada });
  enviarMensagem(c, t.rodada, {
    de: "Presidência",
    assunto: `Bem-vindo ao ${clube.nome}`,
    texto: `Contamos com você. A meta é ${c.meta.texto.toLowerCase()}. Orçamento para contratações: ${formatarDinheiro(m.financas.orcamento)}.`,
  });
  publicarNoticia(c, t.rodada, "Imprensa", `${c.tecnico} é o novo técnico do ${clube.nome}.`, "bom");
}

/** Técnicos da IA demitidos, vagas preenchidas, respostas a candidaturas e sondagens. */
export function semanaDosTecnicos(estado: EstadoJogo, rng: Rng): void {
  const t = estado.temporada;
  const c = estado.carreira;
  const m = estado.mercado;
  const rodada = t.rodada;
  for (const d of ["A", "B"] as const) {
    const fase = t.divisoes[d].fases[0];
    if (fase?.tipo !== "liga") continue;
    const tabela = fase.tabelas[0]!;
    const ordem = t.divisoes[d].clubes.slice().sort((x, y) => {
      const a = tabela[x]!;
      const b = tabela[y]!;
      return b.pts - a.pts || b.v - a.v || b.gp - b.gc - (a.gp - a.gc) || b.gp - a.gp;
    });
    for (const id of t.divisoes[d].clubes) {
      if (id === c.clubeId || m.vagas.some((v) => v.clubeId === id)) continue;
      const linha = tabela[id]!;
      if (linha.j < 5) continue;
      const derrotas = linha.forma.slice(-4).filter((x) => x === "D").length;
      const esperado = m.grandes.includes(id) ? 8 : 14;
      if (derrotas >= 3 && ordem.indexOf(id) + 1 > esperado && rng.proximo() < 0.14) {
        const nome = m.tecnicos[id];
        abrirVaga(estado, id, 4);
        publicarNoticia(
          c,
          rodada,
          "Imprensa",
          `${t.clubes[id]!.nome} demite ${nome ?? "o técnico"} após sequência ruim.`,
        );
      }
    }
  }
  m.vagas = m.vagas.filter((v) => {
    if (rodada <= v.ate) return true;
    const nome = nomeDeTecnicoFicticio(rng);
    m.tecnicos[v.clubeId] = nome;
    publicarNoticia(c, rodada, "Imprensa", `${t.clubes[v.clubeId]!.nome} anuncia ${nome} como novo técnico.`);
    return false;
  });
  for (const cand of m.candidaturas.filter((x) => x.status === "aguardando" && x.rodada < rodada)) {
    const vaga = m.vagas.find((v) => v.clubeId === cand.clubeId);
    const req = exigencia(estado, cand.clubeId);
    const clube = t.clubes[cand.clubeId]!;
    if (vaga && c.reputacao >= req - 6 && rng.proximo() < 0.35 + (c.reputacao - req) / 30) {
      cand.status = "aceita";
      enviarMensagem(c, rodada, {
        de: clube.nome,
        assunto: "Proposta de trabalho",
        texto: `O ${clube.nome} respondeu sua candidatura: querem você como técnico agora.`,
        opcoes: [
          { texto: "Aceitar o cargo", efeito: {}, mercado: { assumir: clube.id } },
          { texto: "Recusar", efeito: {} },
        ],
      });
    } else {
      cand.status = "recusada";
      enviarMensagem(c, rodada, {
        de: clube.nome,
        assunto: "Candidatura recusada",
        texto: `O ${clube.nome} agradeceu, mas seguiu outro caminho.`,
      });
    }
  }
  for (const v of m.vagas) {
    if (v.sondou || v.clubeId === c.clubeId) continue;
    const req = exigencia(estado, v.clubeId);
    if (c.reputacao >= req + 4 && req >= c.reputacao - 22 && rng.proximo() < 0.15) {
      v.sondou = true;
      const clube = t.clubes[v.clubeId]!;
      enviarMensagem(c, rodada, {
        de: clube.nome,
        assunto: "Sondagem",
        texto: `O ${clube.nome} (Série ${divisaoDo(t, v.clubeId)}) procurou seu empresário. Querem você como técnico.`,
        opcoes: [
          { texto: "Aceitar e assumir", efeito: {}, mercado: { assumir: clube.id } },
          { texto: "Recusar, estou bem aqui", efeito: { diretoria: c.clubeId ? 2 : 0 } },
        ],
      });
    }
  }
  if (!c.clubeId && m.vagas.length < 2 && rng.proximo() < 0.5) {
    const candidatos = [...t.divisoes.A.clubes, ...t.divisoes.B.clubes].filter(
      (id) => !m.vagas.some((v) => v.clubeId === id),
    );
    const id = sortear(rng, candidatos);
    abrirVaga(estado, id, 4);
    publicarNoticia(c, rodada, "Imprensa", `${t.clubes[id]!.nome} está sem técnico.`);
  }
}
