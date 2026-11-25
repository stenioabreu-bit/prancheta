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
import { ESQUEMA_POSTOS } from "../constantes";
import { disponivel, familiaridade } from "../jogador";
import { type Rng, inteiroEntre, limitar, sortearComPeso } from "../rng";
import { estatisticasRapidas, placarRapido } from "../simulacaoRapida";
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

/** Monta o jogo do atleta: escalação, minutos, lances e o placar-base do time. */
export function montarJogo(c: ContextoAtleta, jogo: JogoAgendado): JogoDoAtleta {
  const { estado, a, j, clube, rng } = c;
  const t = estado.temporada;
  const mandante = jogo.casa === clube.id;
  const adversario = t.clubes[mandante ? jogo.visitante : jogo.casa]!;
  const escalacao = decidirEscalacao(c);
  ajustarEscalacao(clube, j, escalacao === "titular");
  let entrou = 0;
  let minutos = 0;
  if (escalacao === "titular") {
    minutos =
      a.vida.forma < 40 || j.cond < 60
        ? inteiroEntre(rng, 55, 80)
        : rng.proximo() < 0.75
          ? 90
          : inteiroEntre(rng, 65, 85);
  } else if (escalacao === "banco" && rng.proximo() < 0.5 + (a.vida.tecnico - 50) / 150) {
    entrou = inteiroEntre(rng, 55, 82);
    minutos = 90 - entrou;
  }
  const decisivo = ehDecisivo(estado, jogo);
  const [gc, gv] = placarRapido(rng, t.clubes[jogo.casa]!, t.clubes[jogo.visitante]!, jogo.neutro);
  let pro = mandante ? gc : gv;
  const contra = mandante ? gv : gc;
  // A parte do atleta sai do placar-base: ela volta pelos lances.
  if (minutos > 0) {
    let mantidos = 0;
    for (let k = 0; k < pro; k++) if (rng.proximo() >= 0.24 * (minutos / 90)) mantidos++;
    pro = mantidos;
  }
  const lances: LanceAtleta[] = [];
  if (minutos > 0) {
    const ritmo = 1 + (a.vida.forma - 60) / 200 + (adversario.forca < clube.forca ? 0.1 : -0.05);
    const n = Math.max(
      1,
      Math.round((LANCES_POR_JOGO[j.pos] * minutos * ritmo) / 90 + (rng.proximo() - 0.5)),
    );
    const pesos = Object.entries(PESOS_POR_POSICAO[j.pos]) as [TipoLanceAtleta, number][];
    const minutosSorteados = Array.from({ length: n }, () =>
      inteiroEntre(rng, Math.max(1, entrou + 1), Math.min(90, entrou + minutos)),
    ).sort((x, y) => x - y);
    for (const minuto of minutosSorteados) {
      let [tipo] = sortearComPeso(rng, pesos, (p) => p[1]);
      if (tipo === "provocacao" && marcaAtiva(a, "rixa-rival") && rng.proximo() < 0.3) tipo = "provocacao";
      lances.push(novoLance(rng, tipo, j, a.vida.forma, minuto, decisivo));
    }
  }
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
  };
}

function novoLance(
  rng: Rng,
  tipo: TipoLanceAtleta,
  j: Jogador,
  forma: number,
  minuto: number,
  decisivo: boolean,
): LanceAtleta {
  const textos = TEXTOS[tipo];
  return {
    minuto,
    tipo,
    texto: textos[Math.floor(rng.proximo() * textos.length)]!,
    opcoes: opcoesDoLance(tipo, j, forma),
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
  // Estatísticas do resto do time: o atleta sai do time no sorteio (os números dele vêm dos lances).
  const idx = clube.titulares.indexOf(j.id);
  const guardado = clube.titulares.slice();
  if (idx >= 0) {
    const livres = clube.jogadores.filter((x) => x.id !== j.id && !clube.titulares.includes(x.id));
    const sub = melhorPara(livres, ESQUEMA_POSTOS[clube.esquema][idx]![0]);
    if (sub) clube.titulares[idx] = sub.id;
  }
  estatisticasRapidas(rng, clube, Math.max(0, pro - g.gols), contra, copa, jogo.competicao);
  clube.titulares = guardado;
  estatisticasRapidas(rng, adversario, contra, pro, copa, jogo.competicao);

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
