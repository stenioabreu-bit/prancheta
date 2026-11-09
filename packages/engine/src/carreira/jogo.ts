import type { ClubeDados } from "../clube";
import {
  type EstadoTemporada,
  type ResumoTemporada,
  divisaoDo,
  jogosDaRodada,
  nomeDaCompeticao,
  novaTemporada,
  registrarPlacar,
  simularRodada,
  temporadaEncerrada,
  virarTemporada,
} from "../competicao/temporada";
import type { Divisao, FormatoDivisao, JogoAgendado } from "../competicao/tipos";
import { semanaDoMercado } from "../mercado/semana";
import { assumir, ficarDesempregado } from "../mercado/tecnico";
import type { EstadoMercado } from "../mercado/tipos";
import { aplicarEfeitoDeMercado } from "../mercado/transferencias";
import {
  PESO_DIVISAO_NO_MERCADO,
  PREMIO_COPA,
  formatarDinheiro,
  orcamentoInicial,
  premioDaLiga,
} from "../mercado/valores";
import { type Partida, criarPartida, encerrarPartida, jogarAteOFim } from "../partida";
import { type Rng, criarRng, limitar } from "../rng";
import { gerarGarotos } from "./base";
import { distribuirFuncoes, gerarComissao } from "./comissao";
import {
  ehClassico,
  metaDaTemporada,
  pontosEsperados,
  posicaoNaTabela,
  reagirAoConfrontoDaCopa,
  reagirAoJogoDaLiga,
} from "./diretoria";
import { enviarMensagem, responderMensagem } from "./efeitos";
import { type ResumoDaRodada, semana } from "./semana";
import type { EstadoCarreira } from "./tipos";
import { bonusDoUsuario, reporDesfalques } from "./treino";

/** Save completo: temporada (clubes, competições) + carreira do técnico + mercado. */
export interface EstadoJogo {
  versao: 1;
  temporada: EstadoTemporada;
  carreira: EstadoCarreira;
  mercado: EstadoMercado;
  /** O que o técnico fez na rodada em andamento (zera quando a rodada fecha). */
  rodadaAtual: ResumoDaRodada;
}

export interface OpcoesNovoJogo {
  semente: number;
  temporada: number;
  divisoes: Record<Divisao, ClubeDados[]>;
  vagasDiretasCopa: string[];
  classicos?: [string, string][];
  formatos?: Partial<Record<Divisao, FormatoDivisao>>;
  semCopa?: boolean;
  estaduais?: { uf: string; formato: FormatoDivisao; clubes: string[] }[];
  clubesExtras?: ClubeDados[];
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
    ...(o.formatos ? { formatos: o.formatos } : {}),
    ...(o.semCopa ? { semCopa: true } : {}),
    ...(o.estaduais ? { estaduais: o.estaduais } : {}),
    ...(o.clubesExtras ? { clubesExtras: o.clubesExtras } : {}),
  });
  const clube = temporada.clubes[o.clubeId];
  if (!clube) throw new Error(`Clube ${o.clubeId} não está no pacote`);
  const todos = Object.values(o.divisoes).flat();
  const dadosDoClube = todos.find((c) => c.id === o.clubeId)!;
  const grandes = todos.filter((c) => c.grande).map((c) => c.id);
  const tecnicos: Record<string, string | null> = {};
  for (const c of todos) tecnicos[c.id] = c.tecnico ?? null;
  const tecnico = o.tecnico.trim();
  tecnicos[o.clubeId] = tecnico;
  const grande = grandes.includes(o.clubeId);
  const estado: EstadoJogo = {
    versao: 1,
    temporada,
    rodadaAtual: rodadaVazia(),
    carreira: {
      tecnico,
      clubeId: o.clubeId,
      diretoria: 62,
      torcida: 60,
      reputacao: grande ? 58 : 45,
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
    mercado: {
      financas: {
        orcamento: orcamentoInicial(divisaoDo(temporada, o.clubeId) ?? "D", grande),
        divida: grande ? "muito alta" : "moderada",
        perfil: dadosDoClube.perfilDiretoria ?? "normal",
        ouvir: 50,
      },
      indicacoes: [],
      tecnicos,
      grandes,
      vagas: [],
      candidaturas: [],
      passagens: [{ clubeId: o.clubeId, temporada: o.temporada, rodada: 0 }],
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
    texto: `Professor, a meta da temporada é ${estado.carreira.meta.texto.toLowerCase()}. Contratações passam pela diretoria: indique quem você quer e nós decidimos com base nas finanças. Montamos uma comissão técnica para você: defina quem cuida de cada área na aba Clube.`,
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

/**
 * Fecha a partida do usuário: placar, histórico, reação da diretoria e da
 * torcida, reputação e o resto da rodada.
 */
export function concluirPartida(estado: EstadoJogo, partida: Partida): void {
  const jogo = proximoJogoDoUsuario(estado);
  if (!jogo) throw new Error("Não há jogo do usuário em aberto");
  const resultado = encerrarPartida(partida);
  const t = estado.temporada;
  registrarPlacar(t, jogo.id, [resultado.golsCasa, resultado.golsVisitante]);
  const c = estado.carreira;
  const clubeId = c.clubeId!;
  const mandante = jogo.casa === clubeId;
  const adversarioId = mandante ? jogo.visitante : jogo.casa;
  const golsPro = mandante ? resultado.golsCasa : resultado.golsVisitante;
  const golsContra = mandante ? resultado.golsVisitante : resultado.golsCasa;
  const meuLado = partida.casa.ehUsuario ? partida.casa : partida.visitante;
  const r = estado.rodadaAtual;
  r.titulares.push(...t.clubes[clubeId]!.titulares);
  r.jogaram.push(...meuLado.emCampo.map((p) => p.atual.jogador.id), ...meuLado.saidos);
  c.historico.push({
    temporada: t.temporada,
    rodada: t.rodada,
    competicao: nomeDaCompeticao(t, jogo.competicao),
    adversario: adversarioId,
    mandante,
    golsPro,
    golsContra,
  });
  if (jogo.competicao !== "copa") {
    r.resultado = golsPro > golsContra ? "V" : golsPro === golsContra ? "E" : "D";
    r.classico = ehClassico(c, clubeId, adversarioId);
    const pontos = golsPro > golsContra ? 3 : golsPro === golsContra ? 1 : 0;
    const esperado = pontosEsperados(t.clubes[clubeId]!.forca, t.clubes[adversarioId]!.forca, mandante);
    const divisaoDoJogo = jogo.competicao.startsWith("est-")
      ? (divisaoDo(t, clubeId) ?? "D")
      : (jogo.competicao as Divisao);
    const peso =
      PESO_DIVISAO_NO_MERCADO[divisaoDoJogo] * (jogo.competicao.startsWith("est-") ? 0.5 : 1) + 0.3;
    c.reputacao = limitar(c.reputacao + (pontos - esperado) * 0.6 * peso, 0, 100);
    reagirAoJogoDaLiga(c, t, adversarioId, mandante, golsPro, golsContra);
    if (!c.clubeId) ficarDesempregado(estado, clubeId);
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
  const souA = confronto.a === c.clubeId;
  const placar = `${souA ? ga : gb} x ${souA ? gb : ga}${confronto.penaltis ? ", nos pênaltis" : ""}`;
  const passou = confronto.vencedor === c.clubeId;
  if (passou) {
    const f = estado.mercado.financas;
    f.orcamento = Math.round((f.orcamento + (PREMIO_COPA[indice] ?? 0) * 0.5) * 10) / 10;
  }
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
 * nesta rodada, para e espera; senão fecha a rodada e roda a semana (vestiário e mercado).
 */
export function seguir(estado: EstadoJogo): void {
  const t = estado.temporada;
  const pendente = proximoJogoDoUsuario(estado);
  const rodadaAntes = t.rodada;
  simularRodada(t, pendente ? [pendente.id] : []);
  if (t.rodada === rodadaAntes) return;
  reagirACopa(estado, rodadaAntes);
  comRng(estado, (rng) => {
    semana(estado.carreira, t, estado.rodadaAtual, rng);
    semanaDoMercado(estado, rng);
  });
  estado.rodadaAtual = rodadaVazia();
}

/** Responde uma mensagem da caixa: efeitos de vestiário e de mercado (inclusive assumir outro clube). */
export function responder(estado: EstadoJogo, mensagemId: string, opcao: number): string[] {
  const c = estado.carreira;
  const mensagem = c.caixa.find((m) => m.id === mensagemId);
  const escolhida = mensagem?.opcoes?.[opcao];
  if (!mensagem || !escolhida || mensagem.resposta !== undefined) return [];
  const clube = c.clubeId ? estado.temporada.clubes[c.clubeId]! : null;
  const reacoes = responderMensagem(c, clube, estado.temporada.rodada, mensagemId, opcao);
  const ef = escolhida.mercado;
  if (!ef) return reacoes;
  return comRng(estado, (rng) => {
    if (ef.assumir) {
      assumir(estado, ef.assumir, rng);
      return [...reacoes, `Você assumiu o ${estado.temporada.clubes[ef.assumir]!.nome}.`];
    }
    return [...reacoes, ...aplicarEfeitoDeMercado(estado, ef, rng)];
  });
}

export function fimDeTemporada(estado: EstadoJogo): boolean {
  return temporadaEncerrada(estado.temporada);
}

/** Vira a temporada; diretoria e torcida voltam para perto do meio e a meta é refeita. */
export function novaTemporadaDoJogo(estado: EstadoJogo): ResumoTemporada {
  const premio = premiacaoDaTemporada(estado);
  const resumo = virarTemporada(estado.temporada);
  const c = estado.carreira;
  c.diretoria = limitar(Math.round(c.diretoria * 0.6 + 24), 30, 80);
  c.torcida = limitar(Math.round(c.torcida * 0.6 + 24), 30, 80);
  c.promessas = [];
  c.tonsRecentes = [];
  c.marcas = {};
  estado.mercado.indicacoes = estado.mercado.indicacoes.filter((i) => i.status === "pendente");
  if (c.clubeId) {
    c.meta = metaDaTemporada(estado.temporada, c.clubeId);
    enviarMensagem(c, 0, {
      de: "Presidência",
      assunto: `Temporada ${estado.temporada.temporada}`,
      texto: `Nova temporada, novos objetivos: ${c.meta.texto.toLowerCase()}.`,
    });
    if (premio) {
      enviarMensagem(c, 0, { de: "Financeiro", assunto: "Premiação da temporada", texto: premio });
    }
  }
  return resumo;
}

/** Credita a premiação pela colocação do usuário na divisão (antes de virar a temporada). */
function premiacaoDaTemporada(estado: EstadoJogo): string | null {
  const id = estado.carreira.clubeId;
  if (!id) return null;
  const d = divisaoDo(estado.temporada, id);
  const pos = posicaoNaTabela(estado.temporada, id);
  if (!d || !pos) return null;
  const idLiga = estado.temporada.formatos?.[d]?.id ?? `brasileirao-serie-${d.toLowerCase()}`;
  const valor = premioDaLiga(idLiga, pos, estado.temporada.divisoes[d].clubes.length);
  const f = estado.mercado.financas;
  f.orcamento = Math.round((f.orcamento + valor) * 10) / 10;
  return `Pela ${pos}ª colocação na ${nomeDaCompeticao(estado.temporada, d)}, o clube recebeu ${formatarDinheiro(valor)} de premiação.`;
}
