/**
 * O jogo do atleta: o técnico (IA) decide se ele é titular, banco ou fora; os lances dele são
 * decisões (chutar/passar, driblar/tocar, provocar/ignorar, cavar falta...) que mudam gols, nota,
 * cartões e reputação. O placar do time sai da simulação rápida, sem a parte do atleta, mais o que
 * ele fizer nos lances.
 */
import { ehClassico } from "../carreira/diretoria";
import type { EstadoJogo } from "../carreira/jogo";
import { escalarAutomatico, forcaDoClube, melhorPara } from "../clube";
import { fasesDaCompeticao, jogosDaRodada, nomeDaCompeticao, registrarPlacar } from "../competicao/temporada";
import type { JogoAgendado } from "../competicao/tipos";
import { ESQUEMA_POSTOS, PESO_SETOR } from "../constantes";
import { disponivel, familiaridade } from "../jogador";
import {
  type LadoPartida,
  type Partida,
  type PostoEmCampo,
  type TipoLance,
  criarPartida,
  emJogo,
  encerrarPartida,
  passo,
  substituir,
} from "../partida";
import { type Rng, inteiroEntre, limitar, sortearComPeso } from "../rng";
import { estatisticasRapidas } from "../simulacaoRapida";
import type { Clube, Jogador, Posicao } from "../tipos";
import { type ContextoAtleta, marcaAtiva, mexerVida, noFeed } from "./motor";
import type { Escalacao, JogoDoAtleta, LanceAtleta, OpcaoDeLance, TipoLanceAtleta } from "./tipos";

/** Próximo jogo do clube do atleta ainda sem placar na semana atual. */
export function jogoPendenteDoAtleta(estado: EstadoJogo, clubeId: string): JogoAgendado | null {
  return (
    jogosDaRodada(estado.temporada).find(
      (j) => !j.placar && (j.casa === clubeId || j.visitante === clubeId),
    ) ?? null
  );
}

function mediaDeNotas(j: Jogador): number {
  return j.notas.length ? j.notas.reduce((s, x) => s + x, 0) / j.notas.length : 6.5;
}

function familiaridadeNoEsquema(clube: Clube, j: Jogador): number {
  return Math.max(...ESQUEMA_POSTOS[clube.esquema].map((p) => familiaridade(j, p[0])));
}

/** O técnico decide: compara o atleta (overall, forma, relação, moral, notas) com os concorrentes da posição. */
export function decidirEscalacao(c: ContextoAtleta): Escalacao {
  const { a, j, clube } = c;
  if (j.lesao > 0) return "lesionado";
  if (j.susp > 0) return "suspenso";
  if (marcaAtiva(a, "ausente-jogo")) {
    a.marcas["ausente-jogo"] = -1;
    return "fora";
  }
  const postos = ESQUEMA_POSTOS[clube.esquema];
  const vagas = Math.max(1, postos.filter((p) => familiaridade(j, p[0]) >= 0.9).length);
  const nota =
    j.ovr * familiaridadeNoEsquema(clube, j) +
    (a.vida.forma - 55) / 6 +
    (a.vida.tecnico - 50) / 7 +
    (a.vida.moral - 50) / 15 +
    (mediaDeNotas(j) - 6.5) * 2.5 +
    (marcaAtiva(a, "capitao") ? 2 : 0);
  const rivais = clube.jogadores
    .filter((x) => x.id !== j.id && disponivel(x) && familiaridade(x, j.pos) >= 0.9)
    .map((x) => x.ovr * familiaridade(x, j.pos) + (x.cond - 85) / 10 + (mediaDeNotas(x) - 6.5) * 1.5);
  const acima = rivais.filter((r) => r > nota).length;
  const barrado = marcaAtiva(a, "barrado");
  if (acima < vagas && !barrado) return "titular";
  if (a.vida.tecnico < 20 && !barrado) return "fora";
  if (acima < vagas + 3 || barrado) return "banco";
  return a.vida.tecnico >= 45 ? "banco" : "fora";
}

/** Coloca (ou tira) o atleta do time titular do clube, trocando com quem ocupa o posto dele. */
export function ajustarEscalacao(clube: Clube, j: Jogador, titular: boolean): void {
  const postos = ESQUEMA_POSTOS[clube.esquema];
  const i = clube.titulares.indexOf(j.id);
  if (titular && i < 0) {
    let melhor = -1;
    let melhorValor = Number.NEGATIVE_INFINITY;
    clube.titulares.forEach((id, k) => {
      const ocupante = clube.jogadores.find((x) => x.id === id);
      const fam = familiaridade(j, postos[k]![0]);
      const valor = fam * 100 - (ocupante ? ocupante.ovr * familiaridade(ocupante, postos[k]![0]) : 0) / 10;
      if (postos[k]![0] !== "GOL" || j.pos === "GOL") {
        if (valor > melhorValor) {
          melhorValor = valor;
          melhor = k;
        }
      }
    });
    if (melhor >= 0) clube.titulares[melhor] = j.id;
  } else if (!titular && i >= 0) {
    const livres = clube.jogadores.filter(
      (x) => x.id !== j.id && !clube.titulares.includes(x.id) && disponivel(x),
    );
    const sub = melhorPara(livres, postos[i]![0]);
    if (sub) clube.titulares[i] = sub.id;
    else
      clube.titulares = escalarAutomatico(clube, clube.esquema).map((id) =>
        id === j.id ? clube.titulares[i]! : id,
      );
  }
  clube.forca = forcaDoClube(clube);
}

/** 0–1 a partir de um atributo (40 = 0, 100 = 1). */
const q = (v: number) => limitar((v - 40) / 60, 0, 1);

const PESOS_POR_POSICAO: Record<Posicao, Partial<Record<TipoLanceAtleta, number>>> = {
  ATA: { finalizacao: 5, drible: 2, simulacao: 1.5, provocacao: 1 },
  PD: { finalizacao: 3, drible: 4, simulacao: 1, provocacao: 1, lancamento: 1 },
  PE: { finalizacao: 3, drible: 4, simulacao: 1, provocacao: 1, lancamento: 1 },
  MEI: { finalizacao: 2.5, drible: 3, lancamento: 3, provocacao: 1, simulacao: 0.6 },
  MC: { lancamento: 4, drible: 2, finalizacao: 1.5, carrinho: 1, provocacao: 1 },
  VOL: { carrinho: 4, lancamento: 3, provocacao: 1, finalizacao: 0.6 },
  LD: { carrinho: 3, drible: 2, lancamento: 2, provocacao: 1 },
  LE: { carrinho: 3, drible: 2, lancamento: 2, provocacao: 1 },
  ZAG: { carrinho: 5, provocacao: 1, finalizacao: 0.8, lancamento: 1 },
  GOL: { saidaDoGol: 5, provocacao: 0.6 },
};

const LANCES_POR_JOGO: Record<Posicao, number> = {
  ATA: 3,
  PD: 3,
  PE: 3,
  MEI: 3,
  MC: 2.5,
  VOL: 2.5,
  LD: 2.5,
  LE: 2.5,
  ZAG: 2,
  GOL: 2,
};

const TEXTOS: Record<TipoLanceAtleta, string[]> = {
  finalizacao: [
    "A bola sobra na entrada da área, você está de frente para o gol.",
    "Cruzamento rasteiro: você chega na segunda trave, mas um companheiro está livre no meio.",
    "Rebote do goleiro cai no seu pé, dentro da área.",
  ],
  drible: [
    "Você recebe aberto, com o lateral sozinho na sua frente.",
    "Bola dominada no meio, dois marcadores fechando.",
  ],
  provocacao: [
    "O zagueiro adversário pisa no seu pé de propósito e diz algo no seu ouvido.",
    "Depois de uma dividida, o rival manda você levantar e parar de chorar.",
  ],
  simulacao: [
    "Na área, o zagueiro encosta no seu ombro. Dá para cair.",
    "Você percebe o carrinho chegando atrasado na entrada da área.",
  ],
  carrinho: [
    "O atacante deles arranca em velocidade e só você está entre ele e o gol.",
    "Contra-ataque: dois contra um e você é o último homem.",
  ],
  saidaDoGol: [
    "Bola alçada na área, a defesa hesita.",
    "Lançamento em profundidade: o atacante deles vai sair cara a cara.",
  ],
  penalti: ["Pênalti! A bola está nas suas mãos."],
  lancamento: [
    "Você recebe no meio e vê o atacante começando a infiltração.",
    "Espaço na intermediária, a defesa recua.",
  ],
};

function opcoesDoLance(tipo: TipoLanceAtleta, j: Jogador, forma: number): OpcaoDeLance[] {
  const at = j.at;
  const f = (forma - 50) / 500;
  const r = (x: number) => Math.round(limitar(x + f, 0.03, 0.97) * 100) / 100;
  switch (tipo) {
    case "finalizacao":
      return [
        { id: "chutar", texto: "Chutar de primeira", chance: r(0.08 + 0.3 * q(at.FIN)) },
        {
          id: "colocado",
          texto: "Ajeitar e bater colocado",
          chance: r(0.06 + 0.32 * q((at.FIN + at.CTL) / 2)),
        },
        { id: "passar", texto: "Passar para o companheiro", chance: r(0.15 + 0.3 * q(at.PAS)) },
      ];
    case "drible":
      return [
        { id: "driblar", texto: "Partir para cima", chance: r(0.2 + 0.5 * q((at.CTL + at.VEL) / 2)) },
        { id: "tocar", texto: "Tocar de lado", chance: r(0.92) },
        { id: "firula", texto: "Caneta de efeito", chance: r(0.1 + 0.35 * q(at.CTL)) },
      ];
    case "provocacao":
      return [
        { id: "ignorar", texto: "Ignorar", chance: r(0.95) },
        { id: "responder", texto: "Responder na mesma moeda", chance: r(0.45) },
      ];
    case "simulacao":
      return [
        { id: "cavar", texto: "Cair e cavar o pênalti", chance: r(0.38) },
        { id: "seguir", texto: "Seguir em pé e finalizar", chance: r(0.06 + 0.25 * q(at.FIN)) },
      ];
    case "carrinho":
      return [
        { id: "carrinho", texto: "Dar o carrinho", chance: r(0.3 + 0.5 * q(at.DEF)) },
        {
          id: "acompanhar",
          texto: "Acompanhar sem fazer falta",
          chance: r(0.25 + 0.45 * q((at.DEF + at.VEL) / 2)),
        },
        { id: "tatica", texto: "Falta tática", chance: r(0.97) },
      ];
    case "saidaDoGol":
      return [
        { id: "sair", texto: "Sair do gol", chance: r(0.3 + 0.5 * q(at.GOL)) },
        { id: "ficar", texto: "Ficar na linha", chance: r(0.25 + 0.45 * q(at.GOL)) },
      ];
    case "penalti":
      return [
        { id: "canto", texto: "Bater no canto", chance: r(0.68 + 0.18 * q(at.FIN)) },
        { id: "cavadinha", texto: "Cavadinha", chance: r(0.52 + 0.2 * q(at.CTL)) },
        { id: "batedor", texto: "Deixar para o batedor oficial", chance: r(0.75) },
      ];
    case "lancamento":
      return [
        { id: "lancar", texto: "Lançamento longo", chance: r(0.15 + 0.45 * q(at.PAS)) },
        { id: "curto", texto: "Toque curto", chance: r(0.9) },
        { id: "defora", texto: "Arriscar de fora", chance: r(0.03 + 0.15 * q(at.FIN)) },
      ];
  }
}

/** Opção escolhida sozinha (ritmos rápidos): o melhor valor esperado, sem firula. */
export function escolhaAutomaticaDoLance(l: LanceAtleta): string {
  const valor: Record<string, number> = {
    chutar: 1,
    colocado: 1,
    passar: 0.75,
    driblar: 0.5,
    tocar: 0.12,
    firula: 0,
    ignorar: 1,
    responder: 0,
    cavar: 0,
    seguir: 1,
    carrinho: 0.6,
    acompanhar: 0.7,
    tatica: 0.2,
    sair: 0.6,
    ficar: 0.6,
    canto: 1,
    cavadinha: 0,
    batedor: 0.6,
    lancar: 0.6,
    curto: 0.12,
    defora: 0.9,
  };
  let melhor = l.opcoes[0]!;
  for (const o of l.opcoes)
    if (o.chance * (valor[o.id] ?? 0.5) > melhor.chance * (valor[melhor.id] ?? 0.5)) melhor = o;
  return melhor.id;
}

function ehDecisivo(estado: EstadoJogo, jogo: JogoAgendado): boolean {
  if (jogo.competicao === "copa") return true;
  const fase = fasesDaCompeticao(estado.temporada, jogo.competicao).find((f) => f.nome === jogo.fase);
  if (fase?.tipo === "mataMata") return true;
  return ehClassico(estado.carreira, jogo.casa, jogo.visitante);
}

/** Qualidade da chance que o motor criou: pesa nas opções de finalização do lance. */
const FATOR_DA_CHANCE: Record<TipoLance, number> = {
  trama: 1,
  cruz: 0.8,
  contra: 1.25,
  fora: 0.55,
  indiv: 1,
  parada: 0.75,
  press: 1.2,
};

/** Opções que dependem da qualidade da chance (finalizar ou defender a finalização). */
const OPCOES_DA_CHANCE = new Set([
  "lancar",
  "chutar",
  "colocado",
  "seguir",
  "defora",
  "carrinho",
  "acompanhar",
  "sair",
  "ficar",
]);

const ATACANTES: readonly Posicao[] = ["ATA", "PD", "PE", "MEI"];

/** Põe o atleta em campo no posto que ele joga melhor (no início ou como substituição). */
function porEmCampo(m: Partida, lado: LadoPartida, j: Jogador, minuto: number): boolean {
  if (lado.emCampo.some((p) => p.atual.jogador.id === j.id && !p.expulso)) return true;
  let melhor: PostoEmCampo | null = null;
  let valor = Number.NEGATIVE_INFINITY;
  for (const p of lado.emCampo) {
    if (p.expulso || (p.posto === "GOL") !== (j.pos === "GOL")) continue;
    const v = familiaridade(j, p.posto) * 100 - p.atual.cond / 20 - p.atual.jogador.ovr / 10;
    if (v > valor) {
      valor = v;
      melhor = p;
    }
  }
  if (!melhor) return false;
  if (!lado.banco.some((b) => b.jogador.id === j.id)) lado.banco.push(emJogo(j, m.rng));
  if (minuto > 0 && substituir(m, lado, melhor.atual.jogador.id, j.id)) return true;
  // Antes do apito (ou sem trocas sobrando): entra direto no lugar dele.
  const entra = lado.banco.find((b) => b.jogador.id === j.id)!;
  const sai = melhor.atual;
  lado.banco = lado.banco.filter((b) => b !== entra);
  if (minuto > 0) {
    sai.usado = true;
    entra.usado = true;
    lado.saidos.push(sai.jogador.id);
  }
  lado.banco.push(sai);
  entra.entrou = minuto;
  melhor.atual = entra;
  melhor.instrucao = null;
  return true;
}

/** Tira o atleta de campo (no início, troca pelo melhor reserva; durante o jogo, substituição). */
function tirarDeCampo(m: Partida, lado: LadoPartida, j: Jogador, minuto: number, ficaNoBanco: boolean): void {
  const p = lado.emCampo.find((x) => x.atual.jogador.id === j.id && !x.expulso);
  if (p) {
    const opcoes = lado.banco.filter((b) => b.jogador.id !== j.id && !b.usado);
    const sub = melhorPara(
      opcoes.map((b) => b.jogador),
      p.posto,
    );
    if (minuto > 0) {
      if (sub) substituir(m, lado, j.id, sub.id);
    } else if (sub) {
      const e = opcoes.find((b) => b.jogador === sub)!;
      lado.banco = lado.banco.filter((b) => b !== e);
      lado.banco.push(p.atual);
      p.atual = e;
      p.instrucao = null;
    }
  }
  if (minuto > 0) return;
  if (!ficaNoBanco) lado.banco = lado.banco.filter((b) => b.jogador.id !== j.id);
  else if (
    !lado.banco.some((b) => b.jogador.id === j.id) &&
    !lado.emCampo.some((x) => x.atual.jogador.id === j.id)
  )
    lado.banco.push(emJogo(j, m.rng));
}

function emCampo(lado: LadoPartida, j: Jogador): boolean {
  return lado.emCampo.some((p) => p.atual.jogador.id === j.id && !p.expulso);
}

interface Candidato {
  lance: LanceAtleta;
  /** Gol do motor que passa a depender da decisão do atleta. */
  golPro: boolean;
  golContra: boolean;
  /** Índice do evento de gol no motor (sai da narração quando o lance é do atleta). */
  eventoGol: number;
}

/**
 * Monta o jogo do atleta no motor de partida completo: o técnico decide a escalação, o jogo roda minuto
 * a minuto com o atleta em campo, e as jogadas em que ele aparece (finalizações, passes, chances do
 * adversário na zona dele, faltas) viram os lances que ele decide. Os gols do motor que passaram por
 * ele saem do placar-base e voltam (ou não) pelas escolhas.
 */
export function montarJogo(c: ContextoAtleta, jogo: JogoAgendado): JogoDoAtleta {
  const { estado, a, j, clube, rng } = c;
  const t = estado.temporada;
  const mandante = jogo.casa === clube.id;
  const adversario = t.clubes[mandante ? jogo.visitante : jogo.casa]!;
  const escalacao = decidirEscalacao(c);
  ajustarEscalacao(clube, j, escalacao === "titular");
  // Plano do técnico: quando o atleta entra (banco) ou sai (titular cansado).
  let entraAos = 0;
  let saiAos = 90;
  if (escalacao === "titular") {
    saiAos =
      a.vida.forma < 40 || j.cond < 60
        ? inteiroEntre(rng, 55, 80)
        : rng.proximo() < 0.75
          ? 90
          : inteiroEntre(rng, 65, 85);
  } else if (escalacao === "banco" && rng.proximo() < 0.5 + (a.vida.tecnico - 50) / 150) {
    entraAos = inteiroEntre(rng, 55, 82);
  }
  const decisivo = ehDecisivo(estado, jogo);

  const m = criarPartida(t.clubes[jogo.casa]!, t.clubes[jogo.visitante]!, {
    rng,
    copa: jogo.competicao === "copa",
    competicao: jogo.competicao,
  });
  const lado = mandante ? m.casa : m.visitante;
  const outro = mandante ? m.visitante : m.casa;
  let ini = -1;
  let fim = 90;
  if (escalacao === "titular") {
    if (porEmCampo(m, lado, j, 0)) ini = 0;
  } else tirarDeCampo(m, lado, j, 0, entraAos > 0);
  while (m.fase !== "fim") {
    if (entraAos > 0 && ini < 0 && m.minuto === entraAos && porEmCampo(m, lado, j, m.minuto)) ini = m.minuto;
    if (saiAos < 90 && ini >= 0 && m.minuto === saiAos && fim === 90) {
      tirarDeCampo(m, lado, j, m.minuto, true);
      if (!emCampo(lado, j)) fim = m.minuto;
    }
    passo(m);
  }
  for (const e of m.eventos) {
    if (e.min > fim || e.min <= ini) continue;
    if (
      (e.tipo === "substituicao" && e.jogadores[1] === j.id) ||
      (e.tipo === "vermelho" && e.jogadores[0] === j.id)
    )
      fim = e.min;
  }
  const minutos = ini >= 0 ? Math.max(1, fim - ini) : 0;
  const entrou = ini > 0 ? ini : 0;

  // Jogadas do motor em que o atleta aparece.
  const candidatos: Candidato[] = [];
  const pesoDefesa = j.pos === "GOL" ? 0.55 : PESO_SETOR[j.pos].d * 0.55;
  const ev = m.eventos;
  if (ini >= 0) {
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i]!;
      if (e.min <= ini || e.min > fim) continue;
      const nosso = e.lado === lado.lado;
      if (e.tipo === "lance" && e.lance) {
        const gol = ev[i + 1]?.tipo === "gol";
        const [quemChuta, quemCria] = e.jogadores;
        let tipo: TipoLanceAtleta | null = null;
        let fator = 1;
        if (nosso && quemChuta === j.id) {
          tipo = e.lance === "indiv" ? "drible" : "finalizacao";
          // A chance que o motor transformou em gol era boa: a decisão certa quase sempre resolve.
          fator = gol ? Math.max(1, FATOR_DA_CHANCE[e.lance]) * 1.9 : FATOR_DA_CHANCE[e.lance] * 1.15;
        } else if (nosso && quemCria === j.id) {
          tipo = "lancamento";
          fator = gol ? 1.7 : 1;
        } else if (!nosso && pesoDefesa > 0 && rng.proximo() < pesoDefesa) {
          tipo = j.pos === "GOL" ? "saidaDoGol" : "carrinho";
          fator = (2 - FATOR_DA_CHANCE[e.lance]) * (gol ? 0.85 : 1);
        }
        if (tipo) {
          candidatos.push({
            lance: novoLance(rng, tipo, j, a.vida.forma, e.min, decisivo, e.texto, fator),
            golPro: nosso && gol,
            golContra: !nosso && gol,
            eventoGol: gol ? i + 1 : -1,
          });
        }
        continue;
      }
      const falta =
        e.tipo === "amarelo" || e.tipo === "vermelho" || (e.tipo === "neutro" && e.jogadores.length === 2);
      if (!falta) continue;
      if (nosso && e.jogadores[0] === j.id && j.pos !== "GOL") {
        candidatos.push({
          lance: novoLance(rng, "carrinho", j, a.vida.forma, e.min, decisivo),
          golPro: false,
          golContra: false,
          eventoGol: -1,
        });
      } else if (!nosso && e.jogadores[1] === j.id) {
        const tipo = ATACANTES.includes(j.pos) ? "simulacao" : "provocacao";
        candidatos.push({
          lance: novoLance(rng, tipo, j, a.vida.forma, e.min, decisivo),
          golPro: false,
          golContra: false,
          eventoGol: -1,
        });
      }
    }
  }
  // Quantos lances o atleta decide: os gols que passaram por ele sempre; o resto, sorteado até a cota.
  const ritmo = 1 + (a.vida.forma - 60) / 200 + (adversario.forca < clube.forca ? 0.1 : -0.05);
  const cota =
    minutos > 0
      ? Math.max(1, Math.round((LANCES_POR_JOGO[j.pos] * minutos * ritmo) / 90 + (rng.proximo() - 0.5)))
      : 0;
  const escolhidos = candidatos.filter((x) => x.golPro || x.golContra);
  const outros = candidatos.filter((x) => !x.golPro && !x.golContra);
  while (escolhidos.length < cota && outros.length) {
    escolhidos.push(outros.splice(Math.floor(rng.proximo() * outros.length), 1)[0]!);
  }
  const lances = escolhidos.map((x) => x.lance);
  // Pouca participação no motor: completa com lances de bastidor (provocação, drible, queda na área).
  const pesosExtras = (Object.entries(PESOS_POR_POSICAO[j.pos]) as [TipoLanceAtleta, number][]).filter(
    ([tipo]) => tipo === "provocacao" || tipo === "drible" || tipo === "simulacao",
  );
  for (let k = lances.length; k < cota && pesosExtras.length; k++) {
    const [tipo] = sortearComPeso(rng, pesosExtras, (p) => p[1]);
    const minuto = inteiroEntre(rng, ini + 1, fim);
    lances.push(novoLance(rng, tipo, j, a.vida.forma, minuto, decisivo));
  }
  lances.sort((x, y) => x.minuto - y.minuto);
  const golsTirados = new Set(escolhidos.filter((x) => x.eventoGol >= 0).map((x) => x.eventoGol));
  const pro = lado.est.gols - escolhidos.filter((x) => x.golPro).length;
  const contra = outro.est.gols - escolhidos.filter((x) => x.golContra).length;
  const narracao = ev
    .map((e, i) => ({ e, i }))
    .filter(
      ({ e, i }) =>
        (e.tipo === "gol" && !golsTirados.has(i)) || (e.tipo === "vermelho" && e.jogadores[0] !== j.id),
    )
    .map(({ e }) => ({
      min: e.min,
      texto: e.texto.replace(/\s\d+ x \d+$/, ""),
      nosso: e.lado === lado.lado,
    }));

  // O resto dos dois elencos recebe os números do motor; os do atleta vêm dos lances, em `fecharJogo`.
  const copia = JSON.parse(JSON.stringify(j)) as Jogador;
  encerrarPartida(m);
  Object.assign(j, copia);

  return {
    jogoId: jogo.id,
    competicao: jogo.competicao,
    nomeCompeticao: nomeDaCompeticao(t, jogo.competicao),
    adversarioId: adversario.id,
    mandante,
    decisivo,
    escalacao,
    entrou,
    minutos,
    lances,
    golsBase: [pro, contra],
    gols: 0,
    assist: 0,
    amarelo: false,
    vermelho: false,
    lesao: 0,
    extras: { nota: 0, golsDoTime: 0, golsContra: 0 },
    motor: true,
    narracao,
    posse: lado.est.posse,
  };
}

function novoLance(
  rng: Rng,
  tipo: TipoLanceAtleta,
  j: Jogador,
  forma: number,
  minuto: number,
  decisivo: boolean,
  texto?: string,
  fator = 1,
): LanceAtleta {
  const textos = TEXTOS[tipo];
  const opcoes = opcoesDoLance(tipo, j, forma);
  if (fator !== 1)
    for (const o of opcoes)
      if (OPCOES_DA_CHANCE.has(o.id))
        o.chance = Math.round(limitar(o.chance * fator, 0.03, 0.95) * 100) / 100;
  return {
    minuto,
    tipo,
    texto: texto ?? textos[Math.floor(rng.proximo() * textos.length)]!,
    opcoes,
    decisivo: decisivo || minuto >= 78,
  };
}

/** Lances ainda sem escolha (os que vêm depois de uma expulsão são descartados). */
export function lancesPendentes(g: JogoDoAtleta): LanceAtleta[] {
  return g.lances.filter((l) => !l.escolha);
}

/**
 * Resolve um lance com a opção escolhida. Os números do lance ficam guardados no próprio jogo
 * (gols, assistências, cartões), e o ajuste fino de nota e placar no `extras` do lance.
 */
export function decidirLance(
  c: ContextoAtleta,
  g: JogoDoAtleta,
  indice: number,
  opcaoId: string,
): LanceAtleta | null {
  const { a, j, rng } = c;
  const l = g.lances[indice];
  if (!l || l.escolha) return null;
  const o = l.opcoes.find((x) => x.id === opcaoId);
  if (!o) return null;
  l.escolha = o.id;
  const ok = rng.proximo() < o.chance;
  l.bom = ok;
  const ex = g.extras;
  const cartao = (vermelhoDireto = false) => {
    if (vermelhoDireto || g.amarelo) {
      g.vermelho = true;
      ex.nota -= 1.2;
      g.minutos = Math.max(1, l.minuto - g.entrou);
      for (const outro of g.lances) if (!outro.escolha) outro.escolha = "expulso";
      if (rng.proximo() < 0.4) ex.golsContra++;
      return vermelhoDireto ? "Vermelho direto. Você sai de cabeça baixa." : "Segundo amarelo: expulso!";
    }
    g.amarelo = true;
    ex.nota -= 0.3;
    return "Cartão amarelo.";
  };
  let txt = "";
  switch (o.id) {
    case "chutar":
    case "colocado":
      if (ok) {
        g.gols++;
        ex.nota += 0.9;
        txt = o.id === "chutar" ? "Bomba no ângulo. GOL!" : "Tirou do goleiro com categoria. GOL!";
      } else {
        ex.nota -= 0.15;
        txt = rng.proximo() < 0.5 ? "Para fora, raspando a trave." : "O goleiro defendeu.";
        if (o.id === "chutar") mexerVida(a, "elenco", -0.5);
      }
      break;
    case "passar":
      if (ok) {
        g.assist++;
        ex.nota += 0.55;
        mexerVida(a, "elenco", 1);
        txt = "Passe açucarado, o companheiro só empurrou. Assistência!";
      } else {
        ex.nota -= 0.1;
        txt = "O passe foi interceptado.";
      }
      break;
    case "driblar":
      if (ok) {
        ex.nota += 0.35;
        mexerVida(a, "fama", 0.5);
        if (rng.proximo() < 0.15 + 0.25 * q(j.at.FIN)) {
          g.gols++;
          ex.nota += 0.9;
          txt = "Deixou o marcador no chão e bateu cruzado. GOL!";
        } else txt = "Passou pelo marcador e a jogada morreu na zaga.";
      } else {
        ex.nota -= 0.25;
        txt = "Perdeu a bola.";
        if (rng.proximo() < 0.1) {
          ex.golsContra++;
          txt += " Contra-ataque e gol deles.";
          mexerVida(a, "tecnico", -2);
        }
      }
      break;
    case "tocar":
      ex.nota += ok ? 0.08 : -0.1;
      txt = ok ? "Simples e certo." : "Até o toque de lado saiu torto.";
      break;
    case "firula":
      if (ok) {
        ex.nota += 0.45;
        mexerVida(a, "fama", 2.5);
        mexerVida(a, "torcida", 2);
        txt = "Caneta! A torcida levantou.";
      } else {
        ex.nota -= 0.4;
        mexerVida(a, "tecnico", -2);
        txt = "A firula não saiu e o técnico gritou da beira.";
      }
      break;
    case "ignorar":
      mexerVida(a, "reputacao", 0.5);
      txt = "Você seguiu o jogo.";
      break;
    case "responder":
      if (ok) {
        mexerVida(a, "fama", 1.5);
        mexerVida(a, "torcida", 1);
        if (rng.proximo() < 0.35) {
          ex.golsContra = Math.max(0, ex.golsContra - 1);
          ex.golsDoTime += rng.proximo() < 0.5 ? 1 : 0;
          txt = "Ele perdeu a cabeça e foi expulso. Vantagem para vocês.";
        } else txt = "A troca de farpas ficou por isso mesmo.";
      } else {
        mexerVida(a, "reputacao", -2);
        txt = cartao(rng.proximo() < 0.15);
      }
      break;
    case "cavar":
      if (ok) {
        mexerVida(a, "reputacao", -1);
        txt = "O juiz marcou pênalti!";
        const p = novoLance(rng, "penalti", j, a.vida.forma, l.minuto, l.decisivo);
        g.lances.splice(indice + 1, 0, p);
      } else {
        mexerVida(a, "reputacao", -3);
        mexerVida(a, "imprensa", -1);
        txt = `Simulação. ${cartao()}`;
      }
      break;
    case "seguir":
      if (ok) {
        g.gols++;
        ex.nota += 1;
        mexerVida(a, "reputacao", 1);
        txt = "Aguentou a pancada e marcou. GOL!";
      } else {
        ex.nota -= 0.1;
        txt = "Desequilibrado, finalizou mal.";
      }
      break;
    case "canto":
    case "cavadinha":
      if (ok) {
        g.gols++;
        ex.nota += 0.7;
        if (o.id === "cavadinha") {
          mexerVida(a, "fama", 5);
          mexerVida(a, "torcida", 3);
        }
        txt =
          o.id === "cavadinha"
            ? "Cavadinha! O goleiro caiu e a bola entrou devagar. GOL!"
            : "Bateu firme no canto. GOL!";
      } else {
        ex.nota -= 0.6;
        if (o.id === "cavadinha") {
          mexerVida(a, "fama", -3);
          mexerVida(a, "torcida", -5);
          mexerVida(a, "imprensa", -4);
          mexerVida(a, "tecnico", -4);
        }
        txt =
          o.id === "cavadinha"
            ? "A cavadinha saiu fraca e o goleiro só segurou. Vexame."
            : "O goleiro pegou!";
      }
      break;
    case "batedor":
      mexerVida(a, "elenco", 1);
      if (ok) ex.golsDoTime++;
      txt = ok ? "O batedor oficial converteu." : "O batedor oficial perdeu.";
      break;
    case "carrinho":
      if (ok) {
        ex.nota += 0.4;
        txt = "Carrinho perfeito, na bola.";
      } else if (rng.proximo() < 0.35) {
        ex.golsContra += rng.proximo() < 0.75 ? 1 : 0;
        txt = `Pênalti para eles. ${cartao(rng.proximo() < 0.12)}`;
      } else {
        txt = cartao(rng.proximo() < 0.1);
      }
      break;
    case "acompanhar":
      if (ok) {
        ex.nota += 0.3;
        txt = "Acompanhou e tirou no tempo certo.";
      } else if (rng.proximo() < 0.4) {
        ex.golsContra++;
        ex.nota -= 0.4;
        txt = "Ele passou e marcou.";
      } else {
        ex.nota -= 0.1;
        txt = "Ele passou, mas finalizou mal.";
      }
      break;
    case "tatica":
      mexerVida(a, "tecnico", 0.5);
      txt = `Parou a jogada. ${cartao()}`;
      break;
    case "sair":
    case "ficar":
      if (ok) {
        ex.nota += o.id === "sair" ? 0.5 : 0.4;
        txt = o.id === "sair" ? "Saiu com segurança e ficou com a bola." : "Defesaça!";
      } else if (rng.proximo() < (o.id === "sair" ? 0.8 : 0.65)) {
        ex.golsContra++;
        ex.nota -= 0.5;
        txt = "Não alcançou. Gol deles.";
      } else {
        ex.nota -= 0.1;
        txt = "Deu rebote, mas a zaga afastou.";
      }
      break;
    case "lancar":
      if (ok) {
        ex.nota += 0.3;
        if (rng.proximo() < 0.5) {
          g.assist++;
          ex.nota += 0.5;
          txt = "Lançamento de 40 metros na medida. Assistência!";
        } else txt = "Lançamento perfeito, mas o atacante desperdiçou.";
      } else {
        ex.nota -= 0.15;
        txt = "Lançamento longo demais.";
      }
      break;
    case "curto":
      ex.nota += ok ? 0.06 : -0.1;
      txt = ok ? "Bola de pé em pé." : "Errou o toque curto.";
      break;
    case "defora":
      if (ok) {
        g.gols++;
        ex.nota += 1.1;
        mexerVida(a, "fama", 3);
        txt = "Chute de fora da área no ângulo. GOLAÇO!";
      } else {
        ex.nota -= 0.1;
        txt = "Foi parar na arquibancada.";
      }
      break;
  }
  // Pancada ou dividida feia: chance pequena de lesão.
  if (
    ["carrinho", "driblar", "seguir", "cavar"].includes(o.id) &&
    rng.proximo() < 0.018 + (a.vida.forma < 40 ? 0.02 : 0)
  ) {
    g.lesao = inteiroEntre(rng, 1, 5);
    g.minutos = Math.max(1, l.minuto - g.entrou);
    for (const outro of g.lances) if (!outro.escolha) outro.escolha = "lesionado";
    txt += ` Você sentiu a coxa e pediu para sair (${g.lesao} semana${g.lesao > 1 ? "s" : ""} fora).`;
  }
  l.resultado = txt;
  return l;
}

/** Estatísticas pela simulação rápida (jogos montados antes do motor completo, em saves antigos). */
function estatisticasDoRestoRapidas(
  c: ContextoAtleta,
  golsDoAtleta: number,
  pro: number,
  contra: number,
  copa: boolean,
  competicao: string,
  adversario: Clube,
): void {
  const { j, clube, rng } = c;
  // Estatísticas do resto do time: o atleta sai do time no sorteio (os números dele vêm dos lances).
  const idx = clube.titulares.indexOf(j.id);
  const guardado = clube.titulares.slice();
  if (idx >= 0) {
    const livres = clube.jogadores.filter((x) => x.id !== j.id && !clube.titulares.includes(x.id));
    const sub = melhorPara(livres, ESQUEMA_POSTOS[clube.esquema][idx]![0]);
    if (sub) clube.titulares[idx] = sub.id;
  }
  estatisticasRapidas(rng, clube, Math.max(0, pro - golsDoAtleta), contra, copa, competicao);
  clube.titulares = guardado;
  estatisticasRapidas(rng, adversario, contra, pro, copa, competicao);
}

/** Fecha o jogo: placar, estatísticas (do atleta e do resto), nota, cartões, lesão e reação. */
export function fecharJogo(c: ContextoAtleta, g: JogoDoAtleta): void {
  const { estado, a, j, clube, rng } = c;
  const t = estado.temporada;
  const jogo = t.jogos[g.jogoId]!;
  const ex = g.extras;
  const pro = g.golsBase[0] + g.gols + g.assist + ex.golsDoTime;
  const contra = g.golsBase[1] + ex.golsContra;
  g.placar = [pro, contra];
  registrarPlacar(t, jogo.id, g.mandante ? [pro, contra] : [contra, pro]);
  const copa = jogo.competicao === "copa";
  const adversario = t.clubes[g.adversarioId]!;
  // No motor completo, os elencos já receberam os números da partida ao montar o jogo.
  if (!g.motor) estatisticasDoRestoRapidas(c, g.gols, pro, contra, copa, jogo.competicao, adversario);

  if (g.minutos > 0) {
    const resultado = pro > contra ? 0.35 : pro < contra ? -0.35 : 0;
    const nota = limitar(
      Math.round(
        (6.2 +
          resultado +
          (j.ovr - 68) / 40 +
          (a.vida.forma - 60) / 80 +
          ex.nota +
          (rng.proximo() - 0.5) * 0.6) *
          10,
      ) / 10,
      3.5,
      10,
    );
    g.nota = nota;
    j.notas = [...j.notas, nota].slice(-8);
    j.semJogar = 0;
    j.cond = Math.max(30, j.cond - g.minutos * 0.35);
    j.temporada.porCompeticao ??= {};
    const pc = j.temporada.porCompeticao;
    pc[jogo.competicao] ??= { jogos: 0, gols: 0, assist: 0 };
    const reg = pc[jogo.competicao]!;
    reg.jogos++;
    reg.gols += g.gols;
    reg.assist += g.assist;
    reg.somaNotas = (reg.somaNotas ?? 0) + nota;
    reg.qtdNotas = (reg.qtdNotas ?? 0) + 1;
    if (copa) j.temporada.golsCopa += g.gols;
    else {
      j.temporada.jogos++;
      j.temporada.gols += g.gols;
      j.temporada.assist += g.assist;
      j.temporada.somaNotas += nota;
      j.temporada.qtdNotas++;
    }
    a.numeros.jogos++;
    a.numeros.gols += g.gols;
    a.numeros.assist += g.assist;
    a.numeros.somaNotas += nota;
    a.numeros.qtdNotas++;
    // Reações: técnico pela nota, torcida e fama por gols e resultado, moral por tudo junto.
    mexerVida(a, "tecnico", (nota - 6.5) * 1.3);
    mexerVida(
      a,
      "torcida",
      (nota - 6.5) * 0.9 + g.gols * 0.8 + (pro > contra ? 0.5 : pro < contra ? -0.8 : 0),
    );
    mexerVida(a, "fama", g.gols * (g.decisivo ? 0.9 : 0.4) + g.assist * 0.2 + (nota >= 8 ? 0.5 : 0));
    mexerVida(a, "moral", (nota - 6.5) * 1.2 + (pro > contra ? 1.5 : pro < contra ? -1.5 : 0));
    mexerVida(a, "forma", -g.minutos / 60);
  } else {
    j.semJogar++;
    mexerVida(a, "moral", g.escalacao === "banco" ? -1.5 : g.escalacao === "fora" ? -3 : -0.5);
  }
  if (g.vermelho) {
    j.susp = Math.max(j.susp, 1);
    j.cumprindoSuspensao = false;
    mexerVida(a, "tecnico", -5);
    mexerVida(a, "torcida", -3);
  } else if (g.amarelo) {
    j.amarelos++;
    if (j.amarelos >= 3) {
      j.amarelos = 0;
      j.susp = Math.max(j.susp, 1);
      j.cumprindoSuspensao = false;
    }
  }
  if (g.lesao) {
    j.lesao = Math.max(j.lesao, g.lesao);
    j.recemLesionado = true;
  }
  j.moral = a.vida.moral;
  const placar = `${clube.sigla} ${pro} x ${contra} ${adversario.sigla}`;
  const meu =
    g.minutos > 0
      ? ` · nota ${g.nota!.toFixed(1)}${g.gols ? ` · ${g.gols} gol${g.gols > 1 ? "s" : ""}` : ""}${g.assist ? ` · ${g.assist} assist.` : ""}${g.vermelho ? " · expulso" : ""}`
      : ` · ${g.escalacao === "banco" ? "ficou no banco" : g.escalacao === "fora" ? "fora da lista" : g.escalacao}`;
  noFeed(a, `${g.nomeCompeticao}: ${placar}${meu}`, pro > contra ? "bom" : pro < contra ? "ruim" : "info");
  a.ultimosJogos.unshift(g);
  if (a.ultimosJogos.length > 12) a.ultimosJogos.pop();
}
