import { type EstadoJogo, type OpcoesNovoJogo, novoJogo } from "../carreira/jogo";
/**
 * Modo jogador: criação do atleta (um `Jogador` a mais num clube real) e o avanço da carreira
 * nos três ritmos — semana a semana, só nos momentos decisivos, ou temporada a temporada.
 */
import { campeoes } from "../carreira/titulos";
import { nomeDaCompeticao, simularRodada, temporadaEncerrada, virarTemporada } from "../competicao/temporada";
import { EVENTOS_ATLETA } from "../conteudo/atleta";
import { EVENTOS_ATLETA_EXTRAS } from "../conteudo/atletaExtras";
import { criarJogador } from "../jogador";
import { semanaDoMercado } from "../mercado/semana";
import { nomeDeTecnicoFicticio } from "../mercado/tecnico";
import { criarRng, inteiroEntre, limitar } from "../rng";
import type { Personalidade, Posicao } from "../tipos";
import { aposentar, executarAcao, salarioDeMercado } from "./mercado";
import {
  type ContextoAtleta,
  clubeDoAtleta,
  criarDilema,
  escolhaAutomatica,
  eventoAtleta,
  jogadorDoAtleta,
  marcaAtiva,
  mexerVida,
  noFeed,
  registrarEventos,
  resolverDilema,
  resolverDilemaDetalhado,
  salarioSemanal,
  sortearEventosDaSemana,
} from "./motor";
import { type LigaDoMundo, adicionarLigasDoMundo } from "./mundo";
import {
  decidirLance,
  escolhaAutomaticaDoLance,
  fecharJogo,
  jogoPendenteDoAtleta,
  lancesPendentes,
  montarJogo,
} from "./partida";
import {
  CAMPOS_VIDA,
  type EstadoAtleta,
  type PeDominante,
  type ResultadoDaDecisao,
  type RitmoAtleta,
  type RotinaAtleta,
} from "./tipos";

registrarEventos([...EVENTOS_ATLETA, ...EVENTOS_ATLETA_EXTRAS]);

export type OrigemAtleta = "base" | "profissional";

export interface OpcoesNovoAtleta extends Omit<OpcoesNovoJogo, "tecnico"> {
  nome: string;
  pos: Posicao;
  origem: OrigemAtleta;
  ritmo?: RitmoAtleta;
  /** Número da camisa (padrão 10). */
  numero?: number;
  pe?: PeDominante;
  /** Ligas do mundo (pacote de mundo) jogadas em paralelo; códigos em `excluirLigas` ficam de fora. */
  mundo?: readonly LigaDoMundo[];
  excluirLigas?: string[];
}

/** Overall de estreia: não depende do clube (como numa carta de jogador). */
export function ovrInicial(origem: OrigemAtleta, semente: number): number {
  const rng = criarRng(semente ^ 0x51ed);
  return origem === "base" ? inteiroEntre(rng, 62, 65) : inteiroEntre(rng, 67, 70);
}

const PERSONALIDADE_DA_ORIGEM: Record<OrigemAtleta, Personalidade> = {
  base: "jovem",
  profissional: "profissional",
};

function contexto(estado: EstadoJogo, rng: ContextoAtleta["rng"]): ContextoAtleta {
  const clube = clubeDoAtleta(estado);
  return { estado, a: estado.atleta!, j: jogadorDoAtleta(estado), clube, rng };
}

function comRng<T>(estado: EstadoJogo, f: (c: ContextoAtleta) => T): T {
  const rng = criarRng(estado.temporada.rng);
  const r = f(contexto(estado, rng));
  estado.temporada.rng = rng.estado();
  return r;
}

/** Cria o mundo igual ao do modo técnico e coloca o atleta no elenco do clube escolhido. */
export function novoJogoAtleta(o: OpcoesNovoAtleta): EstadoJogo {
  const nome = o.nome.trim();
  if (!nome) throw new Error("O jogador precisa de um nome");
  const estado = novoJogo({ ...o, tecnico: nome });
  // Ninguém é técnico do usuário: o clube volta para a IA.
  estado.carreira.clubeId = null;
  estado.carreira.caixa = [];
  estado.temporada.usuarioId = null;
  const dados = Object.values(o.divisoes)
    .flat()
    .find((c) => c.id === o.clubeId);
  estado.mercado.tecnicos[o.clubeId] = dados?.tecnico ?? nomeDeTecnicoFicticio(criarRng(o.semente ^ 0x5bd1));
  if (o.mundo?.length) adicionarLigasDoMundo(estado, o.mundo, o.excluirLigas);
  const clube = estado.temporada.clubes[o.clubeId]!;
  const base = o.origem === "base";
  const ovr = ovrInicial(o.origem, o.semente);
  const j = criarJogador([nome, o.pos, ovr, { perso: PERSONALIDADE_DA_ORIGEM[o.origem] }], clube.id, 0);
  j.id = "atleta";
  if (base) j.daBase = true;
  clube.jogadores.push(j);
  const rng = criarRng(o.semente ^ 0x9e37);
  const idade = base ? 17 : 21;
  const potencial = Math.min(92, ovr + (base ? inteiroEntre(rng, 16, 24) : inteiroEntre(rng, 7, 13)));
  const fama = base ? 15 : 28;
  const atleta: EstadoAtleta = {
    jogadorId: j.id,
    nome,
    pos: o.pos,
    numero: limitar(Math.round(o.numero ?? 10), 1, 99),
    pe: o.pe ?? "direito",
    idade,
    potencial,
    treinoAcumulado: 0,
    ritmo: o.ritmo ?? "jogo",
    rotina: { treino: 1, padrao: 1 },
    vida: {
      moral: 65,
      forma: 70,
      fama,
      reputacao: 55,
      tecnico: 50,
      elenco: 50,
      torcida: base ? 55 : 45,
      imprensa: 50,
      familia: 70,
      empresario: 55,
      vicios: 5,
    },
    dinheiro: base ? 0.02 : 0.15,
    gastosFixos: [],
    relacionamento: "solteiro",
    filhos: 0,
    contrato: { clubeId: clube.id, salario: salarioDeMercado(j, fama), ate: o.temporada + (base ? 2 : 1) },
    semana: 0,
    marcas: {},
    agendadas: [],
    ultimaVez: {},
    dilemas: [],
    jogo: null,
    ultimosJogos: [],
    escolhas: [],
    feed: [],
    historico: [],
    numeros: { jogos: 0, gols: 0, assist: 0, somaNotas: 0, qtdNotas: 0 },
    titulos: [],
    convocacoes: 0,
    aposentado: false,
    proximoId: 1,
  };
  estado.atleta = atleta;
  noFeed(
    atleta,
    base
      ? `${nome} sobe da base do ${clube.nome} com contrato profissional até ${atleta.contrato.ate}.`
      : `${nome} chega ao ${clube.nome} com contrato até ${atleta.contrato.ate}.`,
    "bom",
  );
  comRng(estado, (c) => {
    atleta.dilemas.push(...sortearEventosDaSemana(c));
  });
  return estado;
}

/** O que está esperando o usuário agora. */
export type PendenciaAtleta = "dilemas" | "lances" | "jogo" | "semana" | "aposentado";

/** Dilema pede o usuário: sempre no jogo a jogo e nos momentos decisivos; na temporada, só os capitais. */
function dilemaPedeUsuario(a: EstadoAtleta, capital: boolean): boolean {
  return a.ritmo !== "temporada" || capital;
}

/** Lance pede o usuário: todos no jogo a jogo; só os decisivos nos momentos decisivos; nenhum na temporada. */
function lancePedeUsuario(a: EstadoAtleta, decisivo: boolean): boolean {
  return a.ritmo === "jogo" || (a.ritmo === "decisivos" && decisivo);
}

export function pendenciaDoAtleta(estado: EstadoJogo): PendenciaAtleta {
  const a = estado.atleta!;
  if (a.aposentado) return "aposentado";
  if (a.dilemas.some((d) => dilemaPedeUsuario(a, d.capital))) return "dilemas";
  if (a.jogo && lancesPendentes(a.jogo).some((l) => lancePedeUsuario(a, l.decisivo))) return "lances";
  if (a.jogo) return "jogo";
  return "semana";
}

/** Responde um dilema da semana. */
export function decidirDilema(estado: EstadoJogo, dilemaId: string, opcao: number): string | null {
  const a = estado.atleta!;
  const antes = { ...a.vida };
  const dinheiro = a.dinheiro;
  const contrato = { ...a.contrato };
  const r = comRng(estado, (c) => resolverDilemaDetalhado(c, dilemaId, opcao, executarAcao));
  if (!r) return null;
  const mudancas: ResultadoDaDecisao["mudancas"] = {};
  for (const k of CAMPOS_VIDA) {
    const d = Math.round(a.vida[k] - antes[k]);
    if (d !== 0) mudancas[k] = d;
  }
  const mudouContrato =
    a.contrato.clubeId !== contrato.clubeId ||
    a.contrato.ate !== contrato.ate ||
    a.contrato.salario !== contrato.salario;
  a.ultimaMudanca = { ...(a.ultimaMudanca ?? {}), ...mudancas };
  a.ultimoResultado = {
    dilemaId,
    titulo: r.dilema.titulo,
    categoria: r.dilema.categoria,
    escolha: r.escolha,
    texto: r.texto,
    certo: r.certo,
    mudancas,
    dinheiro: Math.round((a.dinheiro - dinheiro) * 1000) / 1000,
    ...(mudouContrato ? { contrato: { ...a.contrato } } : {}),
    futuro: r.futuro,
  };
  return r.texto;
}

/** Fecha o cartão da última decisão. */
export function dispensarResultado(estado: EstadoJogo): void {
  if (estado.atleta) estado.atleta.ultimoResultado = null;
}

/** Escolhe a opção de um lance do jogo em andamento. */
export function escolherLance(estado: EstadoJogo, indice: number, opcaoId: string) {
  const a = estado.atleta!;
  if (!a.jogo) return null;
  const jogo = a.jogo;
  return comRng(estado, (c) => decidirLance(c, jogo, indice, opcaoId));
}

export function mudarRitmo(estado: EstadoJogo, ritmo: RitmoAtleta): void {
  estado.atleta!.ritmo = ritmo;
}

export function mudarRotina(estado: EstadoJogo, rotina: Partial<RotinaAtleta>): void {
  Object.assign(estado.atleta!.rotina, rotina);
}

/** Resolve sozinho o que o ritmo permite (dilemas e lances menores). */
function resolverAutomaticos(estado: EstadoJogo, tudo: boolean): void {
  const a = estado.atleta!;
  comRng(estado, (c) => {
    for (const d of [...a.dilemas]) {
      if (!tudo && dilemaPedeUsuario(a, d.capital)) continue;
      if (tudo && d.capital) continue;
      resolverDilema(c, d.id, escolhaAutomatica(d, c), executarAcao);
    }
    const g = a.jogo;
    if (!g) return;
    for (let i = 0; i < g.lances.length; i++) {
      const l = g.lances[i]!;
      if (l.escolha) continue;
      if (!tudo && lancePedeUsuario(a, l.decisivo)) continue;
      decidirLance(c, g, i, escolhaAutomaticaDoLance(l));
    }
  });
}

/**
 * Avança a carreira até precisar do usuário. No ritmo "jogo" para a cada semana; em "decisivos",
 * só em dilemas capitais e lances decisivos; em "temporada", só nas decisões capitais e na virada.
 * Devolve o que parou o avanço.
 */
export function avancarAtleta(estado: EstadoJogo, limiteDeSemanas = 80): PendenciaAtleta | "temporada" {
  const a = estado.atleta!;
  let semanas = 0;
  for (let guarda = 0; guarda < 2000; guarda++) {
    if (a.aposentado) return "aposentado";
    resolverAutomaticos(estado, false);
    // Dilemas que sobraram e que o usuário deixou para trás: a semana não anda sem resposta.
    if (a.dilemas.some((d) => dilemaPedeUsuario(a, d.capital))) return "dilemas";
    // Dilemas comuns que o usuário não respondeu no ritmo "jogo" já foram tratados acima.
    if (a.jogo) {
      if (lancesPendentes(a.jogo).some((l) => lancePedeUsuario(a, l.decisivo))) return "lances";
      comRng(estado, (c) => fecharJogo(c, a.jogo!));
      a.jogo = null;
      continue;
    }
    const clube = clubeDoAtleta(estado);
    const pendente = jogoPendenteDoAtleta(estado, clube.id);
    if (pendente) {
      a.jogo = comRng(estado, (c) => montarJogo(c, pendente));
      if (a.ritmo === "jogo") return lancesPendentes(a.jogo).length ? "lances" : "jogo";
      continue;
    }
    const virou = fecharSemana(estado);
    semanas++;
    if (a.aposentado) return "aposentado";
    if (virou && a.ritmo !== "jogo") return "temporada";
    if (a.ritmo === "jogo" || semanas >= limiteDeSemanas) return pendenciaDoAtleta(estado);
  }
  return pendenciaDoAtleta(estado);
}

/** Termina o jogo atual sem decidir o resto (o jogo escolhe pelos lances que faltam). */
export function terminarJogoDoAtleta(estado: EstadoJogo): void {
  const a = estado.atleta!;
  if (!a.jogo) return;
  const g = a.jogo;
  comRng(estado, (c) => {
    g.lances.forEach((l, i) => {
      if (!l.escolha) decidirLance(c, g, i, escolhaAutomaticaDoLance(l));
    });
    fecharJogo(c, g);
  });
  a.jogo = null;
}

/** Fecha a semana: resto da rodada, mercado, vida (dinheiro, rotina, deriva) e os eventos da próxima. Devolve se virou a temporada. */
function fecharSemana(estado: EstadoJogo): boolean {
  const a = estado.atleta!;
  const t = estado.temporada;
  const rodadaAntes = t.rodada;
  simularRodada(t);
  if (t.rodada !== rodadaAntes) {
    const rng = criarRng(t.rng);
    semanaDoMercado(estado, rng);
    t.rng = rng.estado();
  }
  comRng(estado, (c) => semanaDaVida(c));
  let virou = false;
  if (temporadaEncerrada(t)) {
    virada(estado);
    virou = true;
  }
  if (!a.aposentado) {
    comRng(estado, (c) => {
      a.dilemas.push(...sortearEventosDaSemana(c, 2, CHANCE_DE_EVENTO[a.ritmo]));
    });
  }
  return virou;
}

/** Chance de um evento comum na semana: menos histórias quando o jogo anda sozinho. */
const CHANCE_DE_EVENTO: Record<RitmoAtleta, number> = { jogo: 0.55, decisivos: 0.3, temporada: 0.55 };

const GASTO_DO_PADRAO = [0.25, 0.5, 0.95];
const TREINO_DA_ROTINA = [0.4, 1, 1.7];
const LESAO_DA_ROTINA = [0.002, 0.005, 0.013];

function semanaDaVida(c: ContextoAtleta): void {
  const { a, j, rng } = c;
  const sal = salarioSemanal(a);
  a.dinheiro += sal - sal * GASTO_DO_PADRAO[a.rotina.padrao]!;
  a.gastosFixos = a.gastosFixos.filter((g) => g.ate === undefined || g.ate > a.semana);
  for (const g of a.gastosFixos) a.dinheiro -= g.porSemana;
  if (a.dinheiro < 0) {
    mexerVida(a, "moral", -2);
    mexerVida(a, "familia", -1);
    if (!marcaAtiva(a, "aviso-dividas")) {
      a.marcas["aviso-dividas"] = a.semana + 12;
      noFeed(a, "As contas estão no vermelho. Corte o padrão de vida ou os gastos fixos.", "ruim");
    }
  }
  const r = a.rotina;
  a.treinoAcumulado += TREINO_DA_ROTINA[r.treino]! * (j.lesao > 0 ? 0.2 : 1) * (1 - a.vida.vicios / 200);
  const alvoForma = 58 + r.treino * 8 - a.vida.vicios / 5 - (j.lesao > 0 ? 15 : 0);
  mexerVida(a, "forma", (alvoForma - a.vida.forma) * 0.18);
  mexerVida(
    a,
    "familia",
    [0.8, 0, -1][r.treino]! + (a.relacionamento !== "solteiro" ? 0.3 : -0.2) + (60 - a.vida.familia) * 0.02,
  );
  mexerVida(a, "moral", [-0.6, 0.2, 0.8][r.padrao]! + (55 - a.vida.moral) * 0.06);
  // A fama puxa para o tamanho do jogador; o resto volta devagar para o meio.
  mexerVida(a, "fama", r.padrao * 0.2 + (limitar((j.ovr - 52) * 2.2, 5, 95) - a.vida.fama) * 0.03);
  mexerVida(a, "vicios", r.padrao === 2 ? 0.6 : -0.4);
  mexerVida(a, "tecnico", (55 - a.vida.tecnico) * 0.06);
  mexerVida(a, "torcida", (55 - a.vida.torcida) * 0.04);
  mexerVida(a, "reputacao", (55 - a.vida.reputacao) * 0.015);
  mexerVida(a, "elenco", (55 - a.vida.elenco) * 0.03);
  mexerVida(a, "imprensa", (50 - a.vida.imprensa) * 0.03);
  mexerVida(a, "empresario", (55 - a.vida.empresario) * 0.02);
  if (j.lesao === 0 && rng.proximo() < LESAO_DA_ROTINA[r.treino]! * (a.vida.forma < 40 ? 2 : 1)) {
    j.lesao = inteiroEntre(rng, 1, 3);
    noFeed(a, `Lesão muscular no treino: ${j.lesao} semana${j.lesao > 1 ? "s" : ""} fora.`, "ruim");
  }
  j.moral = a.vida.moral;
  for (const [m, ate] of Object.entries(a.marcas)) if (ate < a.semana) delete a.marcas[m];
  a.semana++;
}

/** Fim da temporada do atleta: histórico, títulos, evolução, contrato, aposentadoria. Depois vira o ano do mundo. */
function virada(estado: EstadoJogo): void {
  const a = estado.atleta!;
  const t = estado.temporada;
  comRng(estado, (c) => {
    const { j, clube, rng } = c;
    const titulos: string[] = [];
    for (const [comp, campeao] of campeoes(estado)) {
      if (campeao === clube.id) titulos.push(nomeDaCompeticao(t, comp));
    }
    const n = a.numeros;
    const nota = n.qtdNotas ? Math.round((n.somaNotas / n.qtdNotas) * 100) / 100 : null;
    a.historico.push({
      temporada: t.temporada,
      clubeId: clube.id,
      idade: a.idade,
      ovr: j.ovr,
      jogos: n.jogos,
      gols: n.gols,
      assist: n.assist,
      nota,
      titulos,
    });
    if (titulos.length) {
      mexerVida(a, "fama", 6 * titulos.length);
      mexerVida(a, "moral", 8);
      noFeed(a, `Campeão: ${titulos.join(", ")}!`, "bom");
    }
    // Evolução: idade, treino acumulado, minutos e notas; vícios atrapalham; depois dos 31, cai.
    a.idade++;
    const rendimento =
      (n.jogos >= 25 ? 2 : n.jogos >= 12 ? 1 : 0) +
      ((nota ?? 6) >= 7.2 ? 3 : (nota ?? 6) >= 6.8 ? 2 : (nota ?? 6) >= 6.5 ? 1 : 0);
    const treino = Math.floor(a.treinoAcumulado / 22);
    if ((nota ?? 0) >= 7.2 && n.jogos >= 20 && a.idade <= 24) a.potencial = Math.min(94, a.potencial + 2);
    let ganho =
      a.idade <= 21
        ? inteiroEntre(rng, 2, 4) + rendimento + treino
        : a.idade <= 24
          ? inteiroEntre(rng, 1, 2) + Math.ceil(rendimento * 0.7) + treino
          : a.idade <= 28
            ? Math.floor(rendimento / 2) + Math.floor(treino / 2)
            : a.idade <= 31
              ? Math.floor(treino / 3)
              : -inteiroEntre(rng, 1, 3) + (a.rotina.treino === 2 ? 1 : 0);
    ganho = Math.min(ganho, a.idade <= 21 ? 6 : a.idade <= 24 ? 4 : 2);
    ganho -= Math.floor(a.vida.vicios / 35);
    if (ganho > 0) ganho = Math.min(ganho, Math.max(0, a.potencial - j.ovr));
    if (ganho !== 0) {
      j.ovr = limitar(j.ovr + ganho, 40, 94);
      j.ovrBase = j.ovr;
      for (const at of ["CTL", "PAS", "FIN", "DEF", "GOL"] as const)
        j.at[at] = limitar(j.at[at] + ganho, 20, 95);
      if (a.idade >= 31) {
        j.at.VEL = Math.max(20, j.at.VEL - 2);
        j.at.RES = Math.max(20, j.at.RES - 1);
      }
      noFeed(
        a,
        `Fim de temporada: overall ${ganho > 0 ? "subiu" : "caiu"} para ${j.ovr}.`,
        ganho > 0 ? "bom" : "ruim",
      );
    }
    if (a.idade >= 30) j.perso = "veterano";
    a.treinoAcumulado = 0;
    a.numeros = { jogos: 0, gols: 0, assist: 0, somaNotas: 0, qtdNotas: 0 };
  });
  virarTemporada(t);
  for (const ult of a.ultimosJogos) {
    ult.lances = [];
    ult.narracao = [];
  }
  comRng(estado, (c) => {
    if (a.idade >= 40 || (a.idade >= 36 && c.j.ovr < 58)) {
      aposentar(c);
      return;
    }
    if (a.contrato.ate < t.temporada) {
      const d = criarDilema(c, eventoAtleta("livre")!);
      if (d) a.dilemas.push(d);
    }
    if (a.idade >= 34 && !marcaAtiva(a, "adiou-aposentadoria")) {
      const d = criarDilema(c, eventoAtleta("aposentadoria")!);
      if (d) a.dilemas.push(d);
    }
  });
}

/** Média de notas da temporada em andamento. */
export function notaDaTemporada(a: EstadoAtleta): number | null {
  return a.numeros.qtdNotas ? a.numeros.somaNotas / a.numeros.qtdNotas : null;
}
