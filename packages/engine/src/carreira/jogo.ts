import type { ClubeDados } from "../clube";
import {
  type EstadoTemporada,
  type ResumoTemporada,
  jogosDaRodada,
  novaTemporada,
  registrarPlacar,
  simularRodada,
  temporadaEncerrada,
  virarTemporada,
} from "../competicao/temporada";
import type { Divisao, JogoAgendado } from "../competicao/tipos";
import { type Partida, criarPartida, encerrarPartida, jogarAteOFim } from "../partida";
import { type Rng, criarRng, limitar } from "../rng";
import { gerarGarotos } from "./base";
import { distribuirFuncoes, gerarComissao } from "./comissao";
import { ehClassico, metaDaTemporada, reagirAoConfrontoDaCopa, reagirAoJogoDaLiga } from "./diretoria";
import { enviarMensagem } from "./efeitos";
import { type ResumoDaRodada, semana } from "./semana";
import type { EstadoCarreira } from "./tipos";
import { bonusDoUsuario, reporDesfalques } from "./treino";

/** Save completo: temporada (clubes, competições) + carreira do técnico. */
export interface EstadoJogo {
  versao: 1;
  temporada: EstadoTemporada;
  carreira: EstadoCarreira;
  /** O que o técnico fez na rodada em andamento (zera quando a rodada fecha). */
  rodadaAtual: ResumoDaRodada;
}

export interface OpcoesNovoJogo {
  semente: number;
  temporada: number;
  divisoes: Record<Divisao, ClubeDados[]>;
  vagasDiretasCopa: string[];
  classicos?: [string, string][];
  tecnico: string;
  clubeId: string;
}

function comRng<T>(estado: EstadoJogo, f: (rng: Rng) => T): T {
  const rng = criarRng(estado.temporada.rng);
  const r = f(rng);
  estado.temporada.rng = rng.estado();
  return r;
}

const rodadaVazia = (): ResumoDaRodada => ({ titulares: [], jogaram: [], resultado: null, classico: false });

export function novoJogo(o: OpcoesNovoJogo): EstadoJogo {
  if (!o.tecnico.trim()) throw new Error("O técnico precisa de um nome");
  const temporada = novaTemporada({
    semente: o.semente,
    temporada: o.temporada,
    divisoes: o.divisoes,
    vagasDiretasCopa: o.vagasDiretasCopa,
    usuarioId: o.clubeId,
  });
  const clube = temporada.clubes[o.clubeId];
  if (!clube) throw new Error(`Clube ${o.clubeId} não está no pacote`);
  const estado: EstadoJogo = {
    versao: 1,
    temporada,
    rodadaAtual: rodadaVazia(),
    carreira: {
      tecnico: o.tecnico.trim(),
      clubeId: o.clubeId,
      diretoria: 62,
      torcida: 60,
      reputacao: 45,
      meta: metaDaTemporada(temporada, o.clubeId),
      comissao: { membros: [], funcoes: {} as EstadoCarreira["comissao"]["funcoes"] },
      treino: { foco: "equilibrado", intensidade: 1 },
      entrosamento: { [clube.esquema]: 70 },
      bonus: { A: 0, D: 0, M: 0, parada: 0 },
      base: [],
      promessas: [],
      caixa: [],
      noticias: [],
      marcas: {},
      tonsRecentes: [],
      historico: [],
      classicos: o.classicos ?? [],
      avisoDeRisco: false,
      proximoId: 1,
    },
  };
  comRng(estado, (rng) => {
    const membros = gerarComissao(rng);
    estado.carreira.comissao = { membros, funcoes: distribuirFuncoes(membros) };
    estado.carreira.base = gerarGarotos(estado.carreira, 10, rng);
  });
  enviarMensagem(estado.carreira, 0, {
    de: "Presidência",
    assunto: "Boas-vindas e objetivos",
    texto: `Professor, a meta da temporada é ${estado.carreira.meta.texto.toLowerCase()}. Contratações passam pela diretoria, então conte com o elenco e com a base. Montamos uma comissão técnica para você: defina quem cuida de cada área na aba Clube.`,
  });
  return estado;
}

/** Próximo jogo do clube do usuário na rodada atual (Copa vem antes da liga). */
export function proximoJogoDoUsuario(estado: EstadoJogo): JogoAgendado | null {
  const clubeId = estado.carreira.clubeId;
  if (!clubeId) return null;
  return (
    jogosDaRodada(estado.temporada).find(
      (j) => !j.placar && (j.casa === clubeId || j.visitante === clubeId),
    ) ?? null
  );
}

/** Monta a partida do usuário no motor (com o bônus de treino e entrosamento). */
export function iniciarPartida(estado: EstadoJogo): Partida {
  const jogo = proximoJogoDoUsuario(estado);
  if (!jogo) throw new Error("O clube do usuário não joga nesta rodada");
  const t = estado.temporada;
  const usuario = t.clubes[estado.carreira.clubeId!]!;
  reporDesfalques(usuario);
  const semente = comRng(estado, (rng) => Math.floor(rng.proximo() * 2 ** 32));
  return criarPartida(t.clubes[jogo.casa]!, t.clubes[jogo.visitante]!, {
    rng: criarRng(semente),
    usuarioId: usuario.id,
    bonusUsuario: bonusDoUsuario(estado.carreira, usuario),
    copa: jogo.competicao === "copa",
  });
}

/** Fecha a partida do usuário: placar, histórico, reação da diretoria e o resto da rodada. */
export function concluirPartida(estado: EstadoJogo, partida: Partida): void {
  const jogo = proximoJogoDoUsuario(estado);
  if (!jogo) throw new Error("Não há jogo do usuário em aberto");
  const resultado = encerrarPartida(partida);
  registrarPlacar(estado.temporada, jogo.id, [resultado.golsCasa, resultado.golsVisitante]);
  const c = estado.carreira;
  const clubeId = c.clubeId!;
  const mandante = jogo.casa === clubeId;
  const adversarioId = mandante ? jogo.visitante : jogo.casa;
  const golsPro = mandante ? resultado.golsCasa : resultado.golsVisitante;
  const golsContra = mandante ? resultado.golsVisitante : resultado.golsCasa;
  const meuLado = partida.casa.ehUsuario ? partida.casa : partida.visitante;
  const r = estado.rodadaAtual;
  r.titulares.push(...estado.temporada.clubes[clubeId]!.titulares);
  r.jogaram.push(...meuLado.emCampo.map((p) => p.atual.jogador.id), ...meuLado.saidos);
  c.historico.push({
    temporada: estado.temporada.temporada,
    rodada: estado.temporada.rodada,
    competicao: jogo.competicao === "copa" ? "Copa do Brasil" : `Série ${jogo.competicao}`,
    adversario: adversarioId,
    mandante,
    golsPro,
    golsContra,
  });
  if (jogo.competicao !== "copa") {
    r.resultado = golsPro > golsContra ? "V" : golsPro === golsContra ? "E" : "D";
    r.classico = ehClassico(c, clubeId, adversarioId);
    reagirAoJogoDaLiga(c, estado.temporada, adversarioId, mandante, golsPro, golsContra);
    if (!c.clubeId) estado.temporada.usuarioId = null;
  }
  seguir(estado);
}

/** Joga a partida do usuário sem assistir (motor completo, sem pausas). */
export function simularPartidaDoUsuario(estado: EstadoJogo): void {
  const partida = iniciarPartida(estado);
  jogarAteOFim(partida);
  concluirPartida(estado, partida);
}

function reagirACopa(estado: EstadoJogo, rodadaFechada: number) {
  const c = estado.carreira;
  if (!c.clubeId) return;
  const fases = estado.temporada.copa.fases;
  const indice = fases.findIndex((f) => f.encerrada && f.rodadaFinal === rodadaFechada);
  if (indice < 0) return;
  const confronto = fases[indice]!.confrontos.find((x) => x.a === c.clubeId || x.b === c.clubeId);
  if (!confronto) return;
  const adversario = confronto.a === c.clubeId ? confronto.b : confronto.a;
  const [ga, gb] = confronto.agregado ?? [0, 0];
  const placar = `${confronto.a === c.clubeId ? ga : gb} x ${confronto.a === c.clubeId ? gb : ga}${confronto.penaltis ? ", nos pênaltis" : ""}`;
  const passou = confronto.vencedor === c.clubeId;
  reagirAoConfrontoDaCopa(
    c,
    estado.temporada,
    indice,
    adversario,
    passou,
    placar,
    passou && estado.temporada.copa.campeao === c.clubeId,
  );
}

/**
 * Simula os jogos da rodada que não são do usuário. Se o usuário ainda tem jogo
 * nesta rodada, para e espera; senão fecha a rodada e roda a semana.
 */
export function seguir(estado: EstadoJogo): void {
  const t = estado.temporada;
  const pendente = proximoJogoDoUsuario(estado);
  const rodadaAntes = t.rodada;
  simularRodada(t, pendente ? [pendente.id] : []);
  if (t.rodada === rodadaAntes) return;
  reagirACopa(estado, rodadaAntes);
  comRng(estado, (rng) => semana(estado.carreira, t, estado.rodadaAtual, rng));
  estado.rodadaAtual = rodadaVazia();
}

export function fimDeTemporada(estado: EstadoJogo): boolean {
  return temporadaEncerrada(estado.temporada);
}

/** Vira a temporada; diretoria e torcida voltam para perto do meio e a meta é refeita. */
export function novaTemporadaDoJogo(estado: EstadoJogo): ResumoTemporada {
  const resumo = virarTemporada(estado.temporada);
  const c = estado.carreira;
  c.diretoria = limitar(Math.round(c.diretoria * 0.6 + 24), 30, 80);
  c.torcida = limitar(Math.round(c.torcida * 0.6 + 24), 30, 80);
  c.promessas = [];
  c.tonsRecentes = [];
  c.marcas = {};
  if (c.clubeId) {
    c.meta = metaDaTemporada(estado.temporada, c.clubeId);
    enviarMensagem(c, 0, {
      de: "Presidência",
      assunto: `Temporada ${estado.temporada.temporada}`,
      texto: `Nova temporada, novos objetivos: ${c.meta.texto.toLowerCase()}.`,
    });
  }
  return resumo;
}
