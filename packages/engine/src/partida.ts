import { AJUSTES } from "./ajustes";
import { escalarAutomatico, jogadorDoClube, melhorPara } from "./clube";
import {
  ESQUEMA_POSTOS,
  FUNCOES,
  INSTRUCOES,
  PESO_SETOR,
  POSICOES_DE_LADO,
  taticaPadrao,
} from "./constantes";
import { NARRACAO, preencher } from "./conteudo/narracao";
import { disponivel, familiaridade } from "./jogador";
import { type Rng, limitar, sortear, sortearComPeso } from "./rng";
import {
  BONUS_ZERO,
  type Bonus,
  type Clube,
  type Instrucao,
  type Jogador,
  type Posicao,
  type Tatica,
} from "./tipos";

/** Estado de um jogador durante a partida (o `Jogador` só muda no fim do jogo). */
export interface JogadorEmJogo {
  jogador: Jogador;
  cond: number;
  moral: number;
  /** Fase do dia, sorteada entre 0,97 e 1,03. */
  forma: number;
  nota: number;
  gols: number;
  assist: number;
  amarelo: boolean;
  vermelho: boolean;
  lesionado: boolean;
  entrou: number;
  /** Já saiu ou já entrou: não pode mais ser trocado de volta. */
  usado: boolean;
}

export interface PostoEmCampo {
  atual: JogadorEmJogo;
  posto: Posicao;
  x: number;
  y: number;
  expulso: boolean;
  instrucao: Instrucao | null;
}

export interface EstatisticasPartida {
  gols: number;
  chutes: number;
  noAlvo: number;
  xg: number;
  posse: number;
  escanteios: number;
  faltas: number;
  amarelos: number;
  vermelhos: number;
}

export type Lado = "casa" | "visitante";

export interface LadoPartida {
  lado: Lado;
  clube: Clube;
  ehUsuario: boolean;
  bonus: Bonus;
  emCampo: PostoEmCampo[];
  banco: JogadorEmJogo[];
  tatica: Tatica;
  trocas: number;
  paradas: number;
  minutoDaUltimaParada: number | null;
  saidos: string[];
  est: EstatisticasPartida;
}

export type TipoEvento =
  | "apito"
  | "lance"
  | "gol"
  | "defesa"
  | "neutro"
  | "amarelo"
  | "vermelho"
  | "lesao"
  | "substituicao";

export type TipoLance = "trama" | "cruz" | "contra" | "fora" | "indiv" | "parada" | "press";

/** Evento tipado: alimenta tanto o feed de texto quanto a animação do campo. */
export interface EventoPartida {
  min: number;
  tipo: TipoEvento;
  lado: Lado | null;
  /** Ids dos jogadores envolvidos (finalizador primeiro). */
  jogadores: string[];
  lance?: TipoLance;
  texto: string;
}

export type FasePartida = "pre" | "jogo" | "intervalo" | "fim";

export interface Partida {
  rng: Rng;
  minuto: number;
  fase: FasePartida;
  intervaloFeito: boolean;
  /** Jogo de copa não conta para as estatísticas da liga. */
  copa: boolean;
  eventos: EventoPartida[];
  casa: LadoPartida;
  visitante: LadoPartida;
  posse: { casa: number; visitante: number };
}

export interface OpcoesPartida {
  rng: Rng;
  /** Clube controlado pelo usuário (não é escalado nem trocado pela IA). */
  usuarioId?: string | null;
  bonusUsuario?: Bonus;
  copa?: boolean;
}

function emJogo(j: Jogador, rng: Rng): JogadorEmJogo {
  return {
    jogador: j,
    cond: j.cond,
    moral: j.moral,
    forma: 0.97 + rng.proximo() * 0.06,
    nota: 6.4,
    gols: 0,
    assist: 0,
    amarelo: false,
    vermelho: false,
    lesionado: false,
    entrou: 0,
    usado: false,
  };
}

function montarLado(clube: Clube, lado: Lado, opcoes: OpcoesPartida): LadoPartida {
  const ehUsuario = clube.id === opcoes.usuarioId;
  if (!ehUsuario) {
    const nomes = clube.titulares.map((id) => clube.jogadores.find((j) => j.id === id)?.nome ?? "");
    clube.titulares = escalarAutomatico(clube, clube.esquema, nomes);
  }
  const postos = ESQUEMA_POSTOS[clube.esquema];
  const emCampo = clube.titulares.map((id, i) => {
    const [posto, x, y] = postos[i]!;
    return {
      atual: emJogo(jogadorDoClube(clube, id), opcoes.rng),
      posto,
      x,
      y,
      expulso: false,
      instrucao: null,
    };
  });
  const reservas = clube.jogadores
    .filter((j) => !clube.titulares.includes(j.id) && disponivel(j))
    .map((j) => emJogo(j, opcoes.rng));
  return {
    lado,
    clube,
    ehUsuario,
    bonus: ehUsuario ? (opcoes.bonusUsuario ?? BONUS_ZERO) : BONUS_ZERO,
    emCampo,
    banco: ehUsuario ? reservas : reservas.slice(0, 7),
    tatica: { ...clube.tatica },
    trocas: 0,
    paradas: 0,
    minutoDaUltimaParada: null,
    saidos: [],
    est: {
      gols: 0,
      chutes: 0,
      noAlvo: 0,
      xg: 0,
      posse: 0,
      escanteios: 0,
      faltas: 0,
      amarelos: 0,
      vermelhos: 0,
    },
  };
}

export function criarPartida(casa: Clube, visitante: Clube, opcoes: OpcoesPartida): Partida {
  return {
    rng: opcoes.rng,
    minuto: 0,
    fase: "pre",
    intervaloFeito: false,
    copa: opcoes.copa ?? false,
    eventos: [],
    casa: montarLado(casa, "casa", opcoes),
    visitante: montarLado(visitante, "visitante", opcoes),
    posse: { casa: 0, visitante: 0 },
  };
}

/* ---------- instruções ---------- */

const INSTRUCAO_NEUTRA: Instrucao = {
  apoio: 0,
  cruz: 0,
  chute: 0,
  drible: 0,
  passe: 0,
  desarme: 0,
  pressao: 0,
  alvo: 0,
  funcao: null,
};

/** Instruções do jogador; uma função que não existe no posto atual é descartada. */
export function instrucaoDoJogador(clube: Clube, jogadorId: string, posto?: Posicao): Instrucao {
  const salva = clube.instrucoes[jogadorId];
  if (!salva) return INSTRUCAO_NEUTRA;
  const completa: Instrucao = { ...INSTRUCAO_NEUTRA, ...salva };
  if (posto && completa.funcao && !FUNCOES[posto].some(([nome]) => nome === completa.funcao)) {
    const semFuncao: Instrucao = { ...INSTRUCAO_NEUTRA };
    for (const { chave } of INSTRUCOES) semFuncao[chave] = salva[chave] ?? 0;
    return semFuncao;
  }
  return completa;
}

function instrucao(lado: LadoPartida, p: PostoEmCampo): Instrucao {
  p.instrucao ??= instrucaoDoJogador(lado.clube, p.atual.jogador.id, p.posto);
  return p.instrucao;
}

function somaDeInstrucoes(lado: LadoPartida) {
  const g = { cruz: 0, chute: 0, drible: 0, passe: 0, pressao: 0 };
  for (const p of lado.emCampo) {
    if (p.expulso || p.posto === "GOL") continue;
    const i = instrucao(lado, p);
    if (POSICOES_DE_LADO.includes(p.posto)) g.cruz += i.cruz;
    if (PESO_SETOR[p.posto].a >= 0.2 || PESO_SETOR[p.posto].m >= 0.6) {
      g.chute += i.chute;
      g.drible += i.drible * (p.atual.jogador.at.CTL / 75);
      g.passe += i.passe;
    }
    g.pressao += i.pressao;
  }
  return g;
}

/* ---------- força das linhas ---------- */

function habilidades(j: Jogador) {
  const a = j.at;
  return {
    d: 0.42 * a.DEF + 0.2 * a.FIS + 0.16 * a.VEL + 0.22 * a.CAB,
    m: 0.42 * a.PAS + 0.3 * a.CTL + 0.14 * a.RES + 0.14 * a.ATQ,
    a: 0.3 * a.ATQ + 0.28 * a.FIN + 0.22 * a.CTL + 0.2 * a.VEL,
    g: a.GOL,
  };
}

export function fatorCondicao(c: number): number {
  return c >= 72 ? 1 : 0.8 + (0.2 * c) / 72;
}

export function fatorMoral(m: number): number {
  return 0.965 + (0.07 * limitar(m, 0, 100)) / 100;
}

export interface ForcaDasLinhas {
  D: number;
  M: number;
  A: number;
  G: number;
  /** Qualidade pelos lados (velocidade + passe de laterais e pontas). */
  W: number;
  /** Velocidade de quem ataca. */
  vel: number;
  /** Jogo aéreo de quem ataca. */
  cab: number;
  /** Velocidade dos zagueiros. */
  zv: number;
}

export function forcaDasLinhas(lado: LadoPartida): ForcaDasLinhas {
  let D = 0;
  let Dw = 0;
  let M = 0;
  let Mw = 0;
  let A = 0;
  let Aw = 0;
  let G = 60;
  let W = 0;
  let Ww = 0;
  let vel = 0;
  let velN = 0;
  let cab = 0;
  let cabN = 0;
  let zv = 0;
  let zvN = 0;
  let emCampo = 0;
  for (const p of lado.emCampo) {
    if (p.expulso) continue;
    emCampo++;
    const e = p.atual;
    const j = e.jogador;
    const f = familiaridade(j, p.posto) * fatorCondicao(e.cond) * fatorMoral(e.moral) * e.forma;
    const s = habilidades(j);
    if (p.posto === "GOL") {
      G = s.g * f;
      continue;
    }
    const peso0 = PESO_SETOR[p.posto];
    const i = instrucao(lado, p);
    const w = {
      d: Math.max(0, peso0.d - 0.14 * i.apoio),
      m: peso0.m + 0.04 * i.passe,
      a: Math.max(0, peso0.a + 0.16 * i.apoio + (i.apoio > 0 && peso0.a < 0.3 ? 0.06 : 0)),
    };
    s.d *= 1 + 0.025 * i.desarme;
    s.m *= 1 + 0.012 * i.pressao;
    D += w.d * s.d * f;
    Dw += w.d;
    M += w.m * s.m * f;
    Mw += w.m;
    A += w.a * s.a * f;
    Aw += w.a;
    if (POSICOES_DE_LADO.includes(p.posto)) {
      W += (0.5 * j.at.VEL + 0.5 * j.at.PAS) * f;
      Ww++;
    }
    if (w.a >= 0.6) {
      vel += j.at.VEL * f;
      velN++;
      cab += j.at.CAB * f;
      cabN++;
    }
    if (p.posto === "ZAG") {
      zv += j.at.VEL;
      zvN++;
    }
  }
  const desfalque = (11 - emCampo) * 0.045;
  const b = lado.bonus;
  return {
    D: (D / Math.max(Dw, 0.1)) * (1 - desfalque) * (1 + b.D),
    M: (M / Math.max(Mw, 0.1)) * (1 - desfalque) * (1 + b.M),
    A: (A / Math.max(Aw, 0.1)) * (1 - desfalque * 0.6) * (1 + b.A),
    G,
    W: Ww ? W / Ww : 55,
    vel: velN ? vel / velN : 60,
    cab: cabN ? cab / cabN : 60,
    zv: zvN ? zv / zvN : 60,
  };
}

function modificadoresTaticos(t: Tatica) {
  return {
    ataque: 1 + 0.05 * t.mentalidade,
    defesa: 1 - 0.035 * t.mentalidade,
    possePorPressao: [-0.05, 0, 0.05][t.pressao]!,
    cansaco: [0.85, 1, 1.32][t.pressao]! * [0.92, 1, 1.12][t.ritmo]!,
    ritmoDeChance: [0.82, 1, 1.18][t.ritmo]!,
    possePorRitmo: [0.05, 0, -0.04][t.ritmo]!,
    abertura: [-0.15, 0, 0.2][t.largura]!,
  };
}

/* ---------- eventos ---------- */

function registrar(
  m: Partida,
  tipo: TipoEvento,
  texto: string,
  lado: LadoPartida | null,
  jogadores: string[] = [],
  lance?: TipoLance,
) {
  const ev: EventoPartida = { min: m.minuto, tipo, lado: lado ? lado.lado : null, jogadores, texto };
  if (lance) ev.lance = lance;
  m.eventos.push(ev);
}

/* ---------- substituições ---------- */

/** Pode fazer uma troca agora? 5 trocas em até 3 paradas; o intervalo não conta como parada. */
export function podeSubstituir(m: Partida, lado: LadoPartida): boolean {
  if (lado.trocas >= 5 || m.fase === "fim") return false;
  return lado.paradas < 3 || m.fase === "intervalo" || lado.minutoDaUltimaParada === m.minuto;
}

export function substituir(m: Partida, lado: LadoPartida, saiId: string, entraId: string): boolean {
  const p = lado.emCampo.find((x) => x.atual.jogador.id === saiId && !x.expulso);
  const entra = lado.banco.find((b) => b.jogador.id === entraId && !b.usado);
  if (!p || !entra || !podeSubstituir(m, lado)) return false;
  const sai = p.atual;
  lado.saidos.push(saiId);
  entra.usado = true;
  lado.banco = lado.banco.filter((b) => b !== entra);
  lado.banco.push(sai);
  sai.usado = true;
  entra.entrou = m.minuto;
  p.atual = entra;
  p.instrucao = null;
  lado.trocas++;
  if (m.fase !== "intervalo" && lado.minutoDaUltimaParada !== m.minuto) {
    lado.paradas++;
    lado.minutoDaUltimaParada = m.minuto;
  }
  registrar(
    m,
    "substituicao",
    `Substituição no ${lado.clube.sigla}: sai ${sai.jogador.nome}, entra ${entra.jogador.nome}.`,
    lado,
    [entra.jogador.id, saiId],
  );
  return true;
}

/* ---------- IA do técnico adversário ---------- */

function inteligenciaArtificial(m: Partida, eu: LadoPartida, adversario: LadoPartida) {
  if (eu.ehUsuario) return;
  const saldo = eu.est.gols - adversario.est.gols;
  const base = taticaPadrao(eu.clube.estilo);
  if (m.minuto >= 60 && saldo < 0) {
    eu.tatica.mentalidade = Math.min(2, base.mentalidade + (m.minuto > 75 ? 2 : 1));
    eu.tatica.ritmo = 2;
  } else if (m.minuto >= 70 && saldo > 0) {
    eu.tatica.mentalidade = Math.max(-2, base.mentalidade - 1);
  } else {
    eu.tatica.mentalidade = base.mentalidade;
  }
  if (m.minuto >= 58 && eu.trocas < 5 && eu.paradas < 3 && m.rng.proximo() < 0.18) {
    const cansados = eu.emCampo
      .filter((p) => !p.expulso && p.posto !== "GOL")
      .sort((a, b) => a.atual.cond - b.atual.cond);
    const maisCansado = cansados[0];
    if (maisCansado && maisCansado.atual.cond < 74) {
      const opcoes = eu.banco
        .filter((b) => !eu.saidos.includes(b.jogador.id) && !b.usado)
        .map((b) => b.jogador);
      const entra = melhorPara(opcoes, maisCansado.posto);
      if (entra) substituir(m, eu, maisCansado.atual.jogador.id, entra.id);
    }
  }
}

/* ---------- minuto a minuto ---------- */

function escolherEmCampo(m: Partida, lado: LadoPartida, peso: (p: PostoEmCampo) => number): PostoEmCampo {
  const candidatos = lado.emCampo.filter((p) => !p.expulso && p.posto !== "GOL");
  return sortearComPeso(m.rng, candidatos, peso);
}

function finalizador(m: Partida, lado: LadoPartida, tipo: TipoLance): PostoEmCampo {
  if (tipo === "press" || tipo === "indiv" || tipo === "fora") {
    return escolherEmCampo(m, lado, (p) => {
      const i = instrucao(lado, p);
      const ajuste = tipo === "fora" ? i.chute : tipo === "indiv" ? i.drible : i.pressao;
      return Math.max(
        0.02,
        (PESO_SETOR[p.posto].a + 0.1) * (p.atual.jogador.at.CTL / 60) ** 2 * (1 + 0.7 * ajuste),
      );
    });
  }
  return escolherEmCampo(m, lado, (p) => {
    const i = instrucao(lado, p);
    const w = Math.max(0.05, PESO_SETOR[p.posto].a + 0.16 * i.apoio);
    const at = p.atual.jogador.at;
    const s = tipo === "cruz" ? at.CAB : at.FIN;
    const { expoentePesoPosicao, basePesoPosicao, expoenteFinalizador } = AJUSTES.partida;
    return (
      (w ** expoentePesoPosicao + basePesoPosicao) *
      (s / 60) ** expoenteFinalizador *
      (tipo === "cruz" ? 1 + 0.9 * i.alvo : 1)
    );
  });
}

function criador(m: Partida, lado: LadoPartida, excluir: PostoEmCampo, tipo: TipoLance): PostoEmCampo {
  return escolherEmCampo(m, lado, (p) => {
    if (p === excluir) return 0;
    const i = instrucao(lado, p);
    const peso = PESO_SETOR[p.posto];
    let w = (peso.m + peso.a * 0.6) * (p.atual.jogador.at.PAS / 60) ** 2 * (1 + 0.3 * i.passe);
    if (tipo === "cruz") w *= (POSICOES_DE_LADO.includes(p.posto) ? 2.5 : 0.4) * (1 + 0.7 * i.cruz);
    return Math.max(0.001, w);
  });
}

function goleiroDe(lado: LadoPartida): JogadorEmJogo | null {
  return lado.emCampo.find((p) => p.posto === "GOL" && !p.expulso)?.atual ?? null;
}

const FAIXA_XG: Record<TipoLance, readonly [number, number]> = {
  trama: [0.1, 0.24],
  cruz: [0.07, 0.15],
  contra: [0.18, 0.36],
  fora: [0.025, 0.06],
  indiv: [0.08, 0.2],
  parada: [0.06, 0.12],
  press: [0.15, 0.3],
};

function lance(
  m: Partida,
  atk: LadoPartida,
  def: LadoPartida,
  tipo: TipoLance,
  ra: ForcaDasLinhas,
  rd: ForcaDasLinhas,
) {
  const rng = m.rng;
  const quemChuta = finalizador(m, atk, tipo);
  const quemCria = criador(m, atk, quemChuta, tipo);
  const sh = quemChuta.atual;
  const cr = quemCria.atual;
  const goleiro = goleiroDe(def);
  registrar(
    m,
    "lance",
    preencher(sortear(rng, NARRACAO[tipo]), { t: atk.clube.nome, p: sh.jogador.nome, a: cr.jogador.nome }),
    atk,
    [sh.jogador.id, cr.jogador.id],
    tipo,
  );
  const [min, max] = FAIXA_XG[tipo];
  let xg = min + rng.proximo() * (max - min);
  if (tipo === "parada") xg *= 1 + atk.bonus.parada;
  if (tipo === "cruz") xg *= 0.7 + (sh.jogador.at.CAB - rd.D * 0.9) / 70;
  xg = limitar(xg * (1 + (ra.A - rd.D) / AJUSTES.partida.escalaXgPorForca), 0.01, 0.7);
  atk.est.chutes++;
  atk.est.xg += xg;
  if (tipo === "parada") atk.est.escanteios++;
  const fatorFinalizacao = (sh.jogador.at.FIN / 72) * fatorCondicao(sh.cond) * fatorMoral(sh.moral);
  const fatorGoleiro = (goleiro?.jogador.at.GOL ?? 40) / 72;
  const pGol = limitar(
    (0.84 * xg * fatorFinalizacao ** AJUSTES.partida.expoenteFinalizacaoNoGol) / fatorGoleiro ** 1.1,
    0.005,
    0.85,
  );
  const r = rng.proximo();
  const nomeGoleiro = goleiro?.jogador.nome ?? "o goleiro";
  if (r < pGol) {
    atk.est.gols++;
    atk.est.noAlvo++;
    sh.gols++;
    sh.nota += 1.1;
    const comAssistencia = cr !== sh && tipo !== "fora" && tipo !== "indiv";
    if (comAssistencia) {
      cr.assist++;
      cr.nota += 0.6;
    }
    if (goleiro) goleiro.nota -= 0.4;
    registrar(
      m,
      "gol",
      `${preencher(sortear(rng, NARRACAO.gol), { T: atk.clube.nome.toUpperCase(), p: sh.jogador.nome })} ${m.casa.est.gols} x ${m.visitante.est.gols}`,
      atk,
      comAssistencia ? [sh.jogador.id, cr.jogador.id] : [sh.jogador.id],
      tipo,
    );
    for (const p of atk.emCampo) p.atual.moral = Math.min(100, p.atual.moral + 3);
    for (const p of def.emCampo) p.atual.moral = Math.max(0, p.atual.moral - 2);
  } else if (r < pGol + 0.3) {
    atk.est.noAlvo++;
    if (goleiro) goleiro.nota += 0.25;
    sh.nota += 0.05;
    registrar(
      m,
      "defesa",
      preencher(sortear(rng, NARRACAO.defesa), { g: nomeGoleiro }),
      def,
      goleiro ? [goleiro.jogador.id] : [],
    );
    if (rng.proximo() < 0.3) atk.est.escanteios++;
  } else if (r < pGol + 0.45) {
    const zagueiro = escolherEmCampo(m, def, (p) => PESO_SETOR[p.posto].d).atual;
    zagueiro.nota += 0.15;
    registrar(m, "neutro", preencher(sortear(rng, NARRACAO.bloqueio), { z: zagueiro.jogador.nome }), def, [
      zagueiro.jogador.id,
    ]);
  } else {
    sh.nota -= 0.05;
    registrar(m, "neutro", sortear(rng, NARRACAO.paraFora), atk, [sh.jogador.id]);
  }
}

function expulsar(m: Partida, lado: LadoPartida, p: PostoEmCampo) {
  p.expulso = true;
  lado.est.vermelhos++;
  p.atual.vermelho = true;
  p.atual.nota -= 1.5;
  registrar(m, "vermelho", preencher(sortear(m.rng, NARRACAO.vermelho), { p: p.atual.jogador.nome }), lado, [
    p.atual.jogador.id,
  ]);
}

export type ResultadoDoPasso = "intervalo" | "fim" | "seguiu" | "encerrada";

/** Avança um minuto. Para no minuto 45 (intervalo) e no 90 (fim). */
export function passo(m: Partida): ResultadoDoPasso {
  if (m.minuto >= 90) return "encerrada";
  if (m.minuto === 45 && !m.intervaloFeito) {
    m.intervaloFeito = true;
    m.fase = "intervalo";
    registrar(m, "apito", "Fim do primeiro tempo.", null);
    return "intervalo";
  }
  m.fase = "jogo";
  m.minuto++;
  const rng = m.rng;
  const H = m.casa;
  const A = m.visitante;
  if (m.minuto === 1) registrar(m, "apito", `Rola a bola! ${H.clube.nome} x ${A.clube.nome}.`, null);
  if (m.minuto === 46) registrar(m, "apito", "Começa o segundo tempo.", null);
  inteligenciaArtificial(m, H, A);
  inteligenciaArtificial(m, A, H);
  const mh = modificadoresTaticos(H.tatica);
  const ma = modificadoresTaticos(A.tatica);
  const rh = forcaDasLinhas(H);
  const ra = forcaDasLinhas(A);

  for (const [lado, mod] of [
    [H, mh],
    [A, ma],
  ] as const) {
    for (const p of lado.emCampo) {
      if (p.expulso) continue;
      const res = p.atual.jogador.at.RES;
      const base = p.posto === "GOL" ? 0.08 : 0.34;
      const i = instrucao(lado, p);
      const extra = 1 + 0.16 * i.pressao + (i.apoio > 0 ? 0.06 : 0) + (i.drible > 0 ? 0.04 : 0);
      p.atual.cond = Math.max(5, p.atual.cond - base * mod.cansaco * extra * (1.25 - res / 160));
    }
  }

  const ih = somaDeInstrucoes(H);
  const ia = somaDeInstrucoes(A);
  let posseCasa =
    0.5 +
    (rh.M - ra.M) / AJUSTES.partida.escalaPossePorMeio +
    mh.possePorPressao -
    ma.possePorPressao +
    mh.possePorRitmo -
    ma.possePorRitmo +
    0.02 -
    0.008 * (ih.passe - ia.passe) +
    0.004 * (ih.pressao - ia.pressao);
  posseCasa = limitar(posseCasa, 0.25, 0.75);
  const atk = rng.proximo() < posseCasa ? H : A;
  const def = atk === H ? A : H;
  if (atk === H) m.posse.casa++;
  else m.posse.visitante++;
  const rAtk = atk === H ? rh : ra;
  const rDef = atk === H ? ra : rh;
  const mAtk = atk === H ? mh : ma;
  const mDef = atk === H ? ma : mh;
  const iAtk = atk === H ? ih : ia;

  const { vantagemMandante, chanceBase, expoenteRazao, expoenteTatica } = AJUSTES.partida;
  const mando = atk === H ? vantagemMandante : 1 / vantagemMandante;
  const razaoDeForca = rAtk.A / rDef.D;
  const razaoTatica = mAtk.ataque / mDef.defesa;
  const pChance =
    chanceBase *
    razaoDeForca ** expoenteRazao *
    razaoTatica ** expoenteTatica *
    mando *
    mAtk.ritmoDeChance *
    (1 + 0.035 * iAtk.passe);
  const rouboNaPressao = atk.tatica.pressao === 2 ? 0.025 * (rAtk.M / Math.max(rDef.M, 40)) : 0;
  const riscoDeContra =
    (atk.tatica.contra ? 1.6 : 1) *
    (def.tatica.linha === 2 ? 1.6 : def.tatica.linha === 0 ? 0.55 : 1) *
    (rAtk.vel / Math.max(rDef.zv, 40)) ** 2 *
    (def.tatica.mentalidade > 0 ? 1.25 : 1);

  if (rng.proximo() < pChance) {
    const opcoes: [TipoLance, number][] = [
      ["trama", 1.05 - mAtk.abertura],
      ["cruz", Math.max(0.08, 0.55 + mAtk.abertura * 2 + (rAtk.cab - 60) / 80 + 0.18 * iAtk.cruz)],
      ["contra", 0.22 * riscoDeContra],
      ["fora", Math.max(0.06, 0.32 + 0.1 * iAtk.chute)],
      ["indiv", Math.max(0.05, (0.3 * (rAtk.vel + rAtk.A)) / 140 + 0.08 * iAtk.drible)],
      ["parada", 0.32],
    ];
    if (rouboNaPressao > 0 && rng.proximo() < rouboNaPressao * 8) opcoes.push(["press", 0.5]);
    const tipo = sortearComPeso(rng, opcoes, (o) => o[1])[0];
    lance(m, atk, def, tipo, rAtk, rDef);
  } else if (rng.proximo() < AJUSTES.partida.chanceFalta) {
    const faltoso = escolherEmCampo(
      m,
      def,
      (p) => (0.5 + PESO_SETOR[p.posto].d) * (1 + 0.6 * instrucao(def, p).desarme),
    );
    const vitima = escolherEmCampo(m, atk, (p) => 0.3 + PESO_SETOR[p.posto].a).atual;
    const f = faltoso.atual;
    def.est.faltas++;
    const temperamento = f.jogador.perso === "temperamental" ? 1.6 : 1;
    const textoFalta = preencher(sortear(rng, NARRACAO.falta), { p: f.jogador.nome, v: vitima.jogador.nome });
    const pCartao =
      AJUSTES.partida.chanceCartao *
      (f.amarelo ? AJUSTES.partida.cautelaComAmarelo : 1) *
      temperamento *
      (def.tatica.pressao === 2 ? 1.25 : 1) *
      (1 + 0.4 * instrucao(def, faltoso).desarme);
    if (rng.proximo() < pCartao) {
      if (f.amarelo || rng.proximo() < AJUSTES.partida.chanceVermelhoDireto) {
        expulsar(m, def, faltoso);
      } else {
        f.amarelo = true;
        def.est.amarelos++;
        f.nota -= 0.3;
        registrar(
          m,
          "amarelo",
          `${textoFalta} ${preencher(NARRACAO.amarelo[0], { p: f.jogador.nome })}`,
          def,
          [f.jogador.id, vitima.jogador.id],
        );
      }
    } else if (rng.proximo() < 0.18) {
      registrar(m, "neutro", textoFalta, def, [f.jogador.id, vitima.jogador.id]);
    }
  } else if (rng.proximo() < 0.05) {
    const p = escolherEmCampo(m, atk, () => 1).atual;
    registrar(
      m,
      "neutro",
      preencher(sortear(rng, NARRACAO.posse), { t: atk.clube.nome, p: p.jogador.nome }),
      atk,
      [p.jogador.id],
    );
  }

  if (rng.proximo() < 0.0032) {
    const lado = rng.proximo() < 0.5 ? H : A;
    const candidatos = lado.emCampo.filter((p) => !p.expulso && p.posto !== "GOL");
    if (candidatos.length) {
      const v = sortear(rng, candidatos).atual;
      v.lesionado = true;
      v.cond = Math.min(v.cond, 30);
      registrar(m, "lesao", preencher(sortear(rng, NARRACAO.lesao), { p: v.jogador.nome }), lado, [
        v.jogador.id,
      ]);
    }
  }

  if (m.minuto >= 90) {
    m.fase = "fim";
    registrar(
      m,
      "apito",
      `Fim de jogo: ${H.clube.nome} ${H.est.gols} x ${A.est.gols} ${A.clube.nome}.`,
      null,
    );
    return "fim";
  }
  return "seguiu";
}

/** Joga a partida inteira sem pausas (IA x IA ou simulação instantânea). */
export function jogarAteOFim(m: Partida): void {
  while (m.fase !== "fim") passo(m);
}

/* ---------- fim de jogo ---------- */

export interface ResultadoPartida {
  casaId: string;
  visitanteId: string;
  golsCasa: number;
  golsVisitante: number;
  est: { casa: EstatisticasPartida; visitante: EstatisticasPartida };
}

function notaFinal(m: Partida, e: JogadorEmJogo): number {
  return limitar(Math.round((e.nota + (m.rng.proximo() - 0.5) * 0.6) * 10) / 10, 3.5, 10);
}

/** Passa o que aconteceu no jogo para os jogadores (condição, moral, cartões, lesões, estatísticas). */
export function encerrarPartida(m: Partida): ResultadoPartida {
  const H = m.casa;
  const A = m.visitante;
  const total = m.posse.casa + m.posse.visitante || 1;
  H.est.posse = Math.round((100 * m.posse.casa) / total);
  A.est.posse = 100 - H.est.posse;
  for (const lado of [H, A]) {
    const adversario = lado === H ? A : H;
    const venceu = lado.est.gols > adversario.est.gols;
    const perdeu = lado.est.gols < adversario.est.gols;
    const participou = new Map<string, JogadorEmJogo>();
    for (const p of lado.emCampo) participou.set(p.atual.jogador.id, p.atual);
    for (const b of lado.banco) if (lado.saidos.includes(b.jogador.id)) participou.set(b.jogador.id, b);
    if (!m.copa) {
      const goleiro = lado.emCampo.find((p) => p.posto === "GOL")?.atual.jogador;
      if (goleiro) {
        goleiro.temporada.golsSofridos += adversario.est.gols;
        goleiro.temporada.jogosNoGol++;
        if (!adversario.est.gols) goleiro.temporada.semSofrer++;
      }
    }
    for (const j of lado.clube.jogadores) {
      const e = participou.get(j.id);
      if (!e) {
        j.semJogar++;
        if (j.ovr >= 70 && j.semJogar >= 3) j.moral = limitar(j.moral - 3, 0, 100);
        continue;
      }
      j.semJogar = 0;
      j.cond = Math.round(e.cond);
      const nota = notaFinal(m, e);
      j.notas.push(nota);
      if (j.notas.length > 8) j.notas.shift();
      if (!m.copa) {
        j.temporada.jogos++;
        j.temporada.gols += e.gols;
        j.temporada.assist += e.assist;
        j.temporada.somaNotas += nota;
        j.temporada.qtdNotas++;
      } else {
        j.temporada.golsCopa += e.gols;
      }
      j.moral = limitar(
        Math.round((j.moral * 0.7 + e.moral * 0.3) * 0.88 + 62 * 0.12) + (venceu ? 3 : perdeu ? -3 : 0),
        0,
        100,
      );
      if (e.amarelo) {
        j.amarelos++;
        if (j.amarelos >= 3) {
          j.susp = 1;
          j.amarelos = 0;
        }
      }
      if (e.vermelho) j.susp = Math.max(j.susp, 1 + (m.rng.proximo() < 0.3 ? 1 : 0));
      if (e.lesionado) {
        j.lesao = 1 + Math.floor(m.rng.proximo() * 4);
        j.recemLesionado = true;
      }
    }
  }
  return {
    casaId: H.clube.id,
    visitanteId: A.clube.id,
    golsCasa: H.est.gols,
    golsVisitante: A.est.gols,
    est: { casa: { ...H.est }, visitante: { ...A.est } },
  };
}
