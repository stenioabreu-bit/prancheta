/**
 * Conquistas do atleta: títulos do clube (registrados na semana em que saem), prêmios individuais
 * no fim da temporada (artilharia, craque e seleção do campeonato, revelação, Bola de Ouro, Chuteira
 * de Ouro, melhor jovem, Luva de Ouro, Gol do Ano) e os torneios de seleções (Copa do Mundo e Copa
 * América). Cada conquista nova fica com `visto: false` até a tela mostrar o aviso dourado.
 */
import { publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import { campeoes } from "../carreira/titulos";
import { chaveDoLogo, nomeDaCompeticao } from "../competicao/temporada";
import type { IdCompeticao } from "../competicao/tipos";
import { limitar, poisson } from "../rng";
import type { Clube, Jogador, Posicao } from "../tipos";
import { golsPorJogoNaSelecao } from "./mercado";
import { type ContextoAtleta, type EfeitoAtleta, mexerVida, noFeed } from "./motor";
import { ehLigaDoMundo, prestigioDaLiga } from "./mundo";
import type { ConquistaAtleta, DilemaAtleta, EstadoAtleta } from "./tipos";

/* ───────────── Títulos ───────────── */

/** Liga nacional de pontos corridos (as divisões do pacote e as ligas do mundo). */
function ehLiga(comp: string): boolean {
  return ["A", "B", "C", "D"].includes(comp) || ehLigaDoMundo(comp);
}

/** Primeira divisão: Série A do pacote ou liga do mundo de nível 1 (código sem número no fim). */
function ehElite(comp: string): boolean {
  return comp === "A" || (ehLigaDoMundo(comp) && !/\d$/.test(comp));
}

const GRANDES_LIGAS = ["est-mundo-eng", "est-mundo-esp", "est-mundo-ita", "est-mundo-ger", "est-mundo-fra"];

/** Bônus de cada título continental no ranking da Bola de Ouro (Champions no topo). */
const BONUS_CONTINENTAL: Record<string, number> = {
  "cont-UCL": 24,
  "cont-LIB": 14,
  "cont-UEL": 10,
  "cont-SUL": 8,
  "cont-UECL": 6,
};

function pesoDoTitulo(comp: string): 1 | 2 | 3 {
  if (comp === "cont-UECL" || comp === "cont-SUL") return 2;
  if (comp.startsWith("cont-")) return 3;
  if (comp === "copa" || ehElite(comp)) return 2;
  return 1;
}

/** Save antigo (sem a lista): os títulos do histórico viram conquistas já vistas. */
function conquistasDoHistorico(estado: EstadoJogo): ConquistaAtleta[] {
  const a = estado.atleta!;
  return a.historico.flatMap((h) =>
    h.titulos.map(
      (nome): ConquistaAtleta => ({
        id: `${h.temporada}:${nome}`,
        tipo: "titulo",
        chave: nome,
        nome,
        temporada: h.temporada,
        clubeId: h.clubeId,
        clube: estado.temporada.clubes[h.clubeId]?.nome ?? h.clubeId,
        peso: 1,
        visto: true,
      }),
    ),
  );
}

function novaConquista(
  c: ContextoAtleta,
  x: Omit<ConquistaAtleta, "id" | "temporada" | "clubeId" | "clube" | "visto"> & { clube?: string },
): ConquistaAtleta | null {
  const { a, estado, clube } = c;
  const t = estado.temporada;
  a.conquistas ??= conquistasDoHistorico(estado);
  const id = `${t.temporada}:${x.chave}`;
  if (a.conquistas.some((y) => y.id === id)) return null;
  const nova: ConquistaAtleta = {
    ...x,
    id,
    temporada: t.temporada,
    clubeId: clube.id,
    clube: x.clube ?? clube.nome,
    visto: false,
  };
  a.conquistas.push(nova);
  return nova;
}

/** Títulos que o clube do atleta acabou de ganhar (chamado toda semana e na virada). */
export function registrarTitulosDoAtleta(c: ContextoAtleta): ConquistaAtleta[] {
  const { estado, a, j, clube } = c;
  const t = estado.temporada;
  const novas: ConquistaAtleta[] = [];
  for (const [comp, campeao] of campeoes(estado)) {
    if (campeao !== clube.id) continue;
    const pc = j.temporada.porCompeticao?.[comp];
    const nova = novaConquista(c, {
      tipo: "titulo",
      chave: comp,
      nome: nomeDaCompeticao(t, comp),
      logo: chaveDoLogo(t, comp),
      peso: pesoDoTitulo(comp),
      ...(pc?.jogos
        ? {
            detalhe: `${pc.jogos} jogo${pc.jogos > 1 ? "s" : ""}, ${pc.gols} gol${pc.gols === 1 ? "" : "s"}, ${pc.assist} assist.`,
          }
        : {}),
    });
    if (!nova) continue;
    novas.push(nova);
    mexerVida(a, "fama", 3 * nova.peso);
    mexerVida(a, "moral", 4 + 2 * nova.peso);
    mexerVida(a, "torcida", 3 * nova.peso);
    mexerVida(a, "elenco", 2);
    noFeed(a, `Campeão: ${nova.nome}!`, "bom");
  }
  return novas;
}

/* ───────────── Prêmios individuais ───────────── */

interface Linha {
  j: Jogador;
  clube: Clube;
  idade: number;
  jogos: number;
  gols: number;
  assist: number;
  nota: number;
  pontos: number;
}

const PESO_ATAQUE: Record<Posicao, number> = {
  ATA: 1,
  PD: 1,
  PE: 1,
  MEI: 0.95,
  MC: 0.85,
  VOL: 0.8,
  LD: 0.8,
  LE: 0.8,
  ZAG: 0.8,
  GOL: 0,
};

/** Setor para as seleções do campeonato e do ano (quantos de cada). */
const SETOR: Record<Posicao, "gol" | "def" | "meio" | "ataque"> = {
  GOL: "gol",
  ZAG: "def",
  LD: "def",
  LE: "def",
  VOL: "meio",
  MC: "meio",
  MEI: "meio",
  PE: "ataque",
  PD: "ataque",
  ATA: "ataque",
};
const VAGAS_DO_SETOR = { gol: 1, def: 4, meio: 3, ataque: 3 } as const;

/** Bônus de títulos da temporada por clube (pesa na Bola de Ouro e nos prêmios de craque). */
function bonusDeTitulos(estado: EstadoJogo): Map<string, number> {
  const m = new Map<string, number>();
  for (const [comp, campeao] of campeoes(estado)) {
    if (!campeao) continue;
    const b = comp.startsWith("cont-")
      ? (BONUS_CONTINENTAL[comp] ?? 10)
      : ehElite(comp)
        ? 10
        : comp === "copa"
          ? 5
          : ehLiga(comp)
            ? 4
            : 2;
    m.set(campeao, (m.get(campeao) ?? 0) + b);
  }
  return m;
}

/** Todos os jogadores do mundo com a temporada deles, pontuados para os prêmios. */
function linhasDaTemporada(c: ContextoAtleta): Linha[] {
  const { estado, a } = c;
  const titulos = bonusDeTitulos(estado);
  const linhas: Linha[] = [];
  for (const clube of Object.values(estado.temporada.clubes)) {
    // Números na Série B não valem o mesmo que na Premier League.
    const prestigio = prestigioDaLiga(estado, clube.id);
    for (const j of clube.jogadores) {
      let jogos = 0;
      let gols = 0;
      let assist = 0;
      for (const pc of Object.values(j.temporada.porCompeticao ?? {})) {
        jogos += pc.jogos;
        gols += pc.gols;
        assist += pc.assist;
      }
      if (jogos === 0) continue;
      const nota = j.temporada.qtdNotas ? j.temporada.somaNotas / j.temporada.qtdNotas : 6.4;
      const idade = j.id === a.jogadorId ? a.idade : (j.idade ?? 27);
      const presenca = Math.min(1, jogos / 34);
      const ataque = PESO_ATAQUE[j.pos];
      const defesa = 1 - ataque;
      const pontos =
        presenca *
          prestigio *
          ((j.ovr - 75) * (2 + defesa * 1.4) +
            (nota - 6.6) * 14 +
            gols * 1.05 * ataque +
            assist * 0.6 +
            (j.pos === "GOL" ? j.temporada.semSofrer * 0.8 : 0)) +
        (titulos.get(clube.id) ?? 0) * (0.5 + prestigio / 2) +
        (clube.forca - 75) * 0.8;
      linhas.push({ j, clube, idade, jogos, gols, assist, nota, pontos });
    }
  }
  return linhas;
}

function daCompeticao(l: Linha, comp: string): { jogos: number; gols: number; assist: number } {
  return l.j.temporada.porCompeticao?.[comp] ?? { jogos: 0, gols: 0, assist: 0 };
}

/** Coeficiente de liga da Chuteira de Ouro. */
function coeficienteDaChuteira(comp: string): number {
  if (GRANDES_LIGAS.includes(comp)) return 2;
  if (ehElite(comp)) return 1.5;
  return 1;
}

/** Entra na seleção do setor (top N do setor na lista ordenada)? */
function naSelecao(linhas: Linha[], alvo: Linha): boolean {
  const setor = SETOR[alvo.j.pos];
  const doSetor = linhas.filter((l) => SETOR[l.j.pos] === setor).sort((x, y) => y.pontos - x.pontos);
  return doSetor.slice(0, VAGAS_DO_SETOR[setor]).includes(alvo);
}

function premio(
  c: ContextoAtleta,
  chave: string,
  nome: string,
  peso: 1 | 2 | 3,
  detalhe: string,
  novas: ConquistaAtleta[],
): void {
  const nova = novaConquista(c, { tipo: "premio", chave, nome, peso, detalhe });
  if (!nova) return;
  novas.push(nova);
  const { a, estado } = c;
  mexerVida(a, "fama", 2 * peso + 1);
  mexerVida(a, "moral", 3 + peso);
  mexerVida(a, "reputacao", peso);
  noFeed(a, `Prêmio: ${nome} (${detalhe}).`, "bom");
  if (peso >= 2)
    publicarNoticia(
      estado.carreira,
      estado.temporada.rodada,
      "Prêmios",
      `${a.nome} (${c.clube.nome}) leva: ${nome}.`,
      "bom",
    );
}

/**
 * Prêmios da temporada, calculados antes de zerar as estatísticas. Devolve as conquistas novas e
 * deixa a colocação na Bola de Ouro em `a.bolaDeOuro`.
 */
export function premiosDaTemporada(c: ContextoAtleta): ConquistaAtleta[] {
  const { a, j, estado } = c;
  const t = estado.temporada;
  const linhas = linhasDaTemporada(c);
  const eu = linhas.find((l) => l.j.id === a.jogadorId);
  const novas: ConquistaAtleta[] = [];
  if (!eu) return novas;

  // Competição por competição: artilharia em todas; nas ligas, garçom, craque, revelação e seleção.
  for (const [comp, minhas] of Object.entries(j.temporada.porCompeticao ?? {})) {
    if (minhas.jogos < 3) continue;
    const nomeComp = nomeDaCompeticao(t, comp as IdCompeticao);
    const nela = linhas.filter((l) => daCompeticao(l, comp).jogos > 0);
    const maxGols = Math.max(...nela.map((l) => daCompeticao(l, comp).gols));
    const liga = ehLiga(comp);
    const pesoComp: 1 | 2 = comp.startsWith("cont-") || ehElite(comp) ? 2 : 1;
    if (minhas.gols === maxGols && minhas.gols >= (liga ? 8 : 4))
      premio(c, `artilheiro:${comp}`, `Artilheiro · ${nomeComp}`, pesoComp, `${minhas.gols} gols`, novas);
    if (!liga) continue;
    const maxAssist = Math.max(...nela.map((l) => daCompeticao(l, comp).assist));
    if (minhas.assist === maxAssist && minhas.assist >= 12)
      premio(
        c,
        `assistencias:${comp}`,
        `Rei das assistências · ${nomeComp}`,
        1,
        `${minhas.assist} assistências`,
        novas,
      );
    const maxJogos = Math.max(...nela.map((l) => daCompeticao(l, comp).jogos));
    if (minhas.jogos < maxJogos * 0.5) continue;
    const regulares = nela
      .filter((l) => daCompeticao(l, comp).jogos >= maxJogos * 0.5)
      .sort((x, y) => y.pontos - x.pontos);
    const posicao = regulares.indexOf(eu) + 1;
    if (posicao === 1)
      premio(
        c,
        `craque:${comp}`,
        `Craque do campeonato · ${nomeComp}`,
        pesoComp,
        `nota ${eu.nota.toFixed(2)}, ${minhas.gols} gols e ${minhas.assist} assist.`,
        novas,
      );
    else if (eu.nota >= 7 && naSelecao(regulares, eu))
      premio(c, `selecao:${comp}`, `Seleção do campeonato · ${nomeComp}`, 1, `${posicao}º no ranking`, novas);
    if (eu.idade <= 21 && eu.nota >= 6.9 && minhas.jogos >= maxJogos * 0.6) {
      const jovens = regulares.filter((l) => l.idade <= 21);
      if (jovens[0] === eu)
        premio(c, `revelacao:${comp}`, `Revelação · ${nomeComp}`, 1, `${a.idade} anos`, novas);
    }
  }

  // Prêmios do mundo.
  const elegiveis = linhas.filter((l) => l.jogos >= 18).sort((x, y) => y.pontos - x.pontos);
  const posicao = elegiveis.indexOf(eu) + 1;
  if (posicao > 0 && posicao <= 30) {
    const vencedor = elegiveis[0]!;
    a.bolaDeOuro ??= [];
    a.bolaDeOuro.push({
      temporada: t.temporada,
      posicao,
      vencedor: vencedor.j.nome,
      vencedorClube: vencedor.clube.nome,
    });
    // A cerimônia vira história na semana seguinte (discurso, boicote...).
    if (posicao <= 3)
      a.agendadas.push({
        evento: posicao === 1 ? "noite-bola-de-ouro" : "cerimonia-podio",
        semana: a.semana + 1,
        chance: 1,
        origem: "bola-de-ouro",
      });
    if (posicao === 1)
      premio(
        c,
        "bola-de-ouro",
        "Bola de Ouro",
        3,
        `o melhor do mundo em ${t.temporada}: ${eu.gols} gols e ${eu.assist} assist.`,
        novas,
      );
    else if (posicao <= 3)
      premio(
        c,
        "podio-bola",
        `Bola de Ouro · ${posicao}º lugar`,
        2,
        `atrás de ${vencedor.j.nome} (${vencedor.clube.nome})`,
        novas,
      );
    else {
      noFeed(
        a,
        `Bola de Ouro ${t.temporada}: você ficou em ${posicao}º. Venceu ${vencedor.j.nome} (${vencedor.clube.nome}).`,
        posicao <= 10 ? "bom" : "info",
      );
      mexerVida(a, "fama", posicao <= 10 ? 3 : 1);
    }
  } else if (elegiveis[0]) {
    noFeed(a, `Bola de Ouro ${t.temporada}: ${elegiveis[0].j.nome} (${elegiveis[0].clube.nome}).`, "info");
  }

  // Chuteira de Ouro: gols de liga com o coeficiente da liga.
  const chuteira = (l: Linha) =>
    Object.entries(l.j.temporada.porCompeticao ?? {})
      .filter(([comp]) => ehLiga(comp))
      .reduce((s, [comp, pc]) => s + pc.gols * coeficienteDaChuteira(comp), 0);
  let lider: Linha | null = null;
  let melhor = 0;
  for (const l of linhas) {
    const p = chuteira(l);
    if (p > melhor) {
      melhor = p;
      lider = l;
    }
  }
  if (lider && chuteira(eu) >= melhor && melhor >= 36)
    premio(c, "chuteira-de-ouro", "Chuteira de Ouro", 2, `${melhor} pontos na liga`, novas);

  if (eu.idade <= 21 && elegiveis.filter((l) => l.idade <= 21)[0] === eu)
    premio(c, "melhor-jovem", "Melhor Jovem do Mundo", 2, `${a.idade} anos`, novas);

  if (j.pos === "GOL" && elegiveis.filter((l) => l.j.pos === "GOL")[0] === eu)
    premio(c, "luva-de-ouro", "Luva de Ouro", 2, `${j.temporada.semSofrer} jogos sem sofrer gol`, novas);

  if (posicao > 1 && naSelecao(elegiveis, eu))
    premio(c, "selecao-do-ano", "Seleção do Ano", 2, `${posicao}º na Bola de Ouro`, novas);

  const golacos = a.numeros.golacos ?? 0;
  if (golacos >= 2 && c.rng.proximo() < limitar(golacos * 0.012 + (a.vida.fama - 70) / 800, 0, 0.12))
    premio(
      c,
      "gol-do-ano",
      "Gol do Ano",
      2,
      `${golacos} golaço${golacos > 1 ? "s" : ""} na temporada`,
      novas,
    );

  return novas;
}

/* ───────────── Torneios de seleções ───────────── */

/** Copa do Mundo de 4 em 4 anos (2026, 2030...) e Copa América no meio do ciclo. */
export function torneioDoAno(temporada: number): { id: string; nome: string; mundial: boolean } | null {
  const d = (((temporada - 2026) % 4) + 4) % 4;
  if (d === 0) return { id: "copa-do-mundo", nome: "Copa do Mundo", mundial: true };
  if (d === 2) return { id: "copa-america", nome: "Copa América", mundial: false };
  return null;
}

/** Entra na lista do torneio: convocado recentemente ou nível de seleção. */
export function convocavelParaTorneio(a: EstadoAtleta, j: Jogador): boolean {
  if ((a.marcas["aposentou-selecao"] ?? -1) >= a.semana) return false;
  const recente = (a.marcas.selecao ?? -1) >= a.semana;
  return j.lesao <= 2 && (recente ? j.ovr >= 74 : j.ovr >= 79 && a.vida.fama >= 55);
}

const FASES_MUNDIAL = [
  "na fase de grupos",
  "nas oitavas de final",
  "nas quartas de final",
  "na semifinal",
  "na final",
];
const FASES_AMERICA = ["na fase de grupos", "nas quartas de final", "na semifinal", "na final"];

/**
 * Disputa o torneio (ação "torneio" do evento da lista): a seleção avança fase a fase, com o atleta
 * pesando pelo nível; os gols dele saem por Poisson. Campeão vira conquista; boa campanha individual
 * vira artilharia ou melhor jogador do torneio. Agenda a volta para casa (título, vice ou queda).
 */
export function disputarTorneio(c: ContextoAtleta, ef: EfeitoAtleta, dilema: DilemaAtleta): string {
  const { a, j, rng, estado } = c;
  const torneio = torneioDoAno(estado.temporada.temporada) ?? {
    id: "copa-america",
    nome: "Copa América",
    mundial: false,
  };
  const reserva = dilema.dados?.reserva === 1 || (ef.marcar && "poupado-torneio" in ef.marcar);
  const fases = torneio.mundial ? FASES_MUNDIAL : FASES_AMERICA;
  const passa = torneio.mundial ? [0.88, 0.68, 0.6, 0.55, 0.52] : [0.9, 0.66, 0.58, 0.55];
  const peso = limitar((j.ovr - 80) * (reserva ? 0.003 : 0.007), -0.05, 0.1);
  let fase = 0;
  let jogos = 0;
  let gols = 0;
  const media = golsPorJogoNaSelecao(j) * (reserva ? 0.45 : 1);
  for (; fase < fases.length; fase++) {
    const partidas = fase === 0 ? 3 : 1;
    jogos += partidas;
    gols += poisson(rng, media * partidas);
    if (rng.proximo() >= passa[fase]! + peso) break;
  }
  const campeao = fase === fases.length;
  const final = fase === fases.length - 1;
  a.convocacoes++;
  a.marcas.selecao = a.semana + 60;
  a.selecao ??= { jogos: 0, gols: 0 };
  const sel = a.selecao;
  sel.jogos += jogos;
  sel.gols += gols;
  const golsTxt = gols ? `${gols} gol${gols > 1 ? "s" : ""}` : "nenhum gol";
  const seu = `Você jogou ${jogos} jogo${jogos > 1 ? "s" : ""} e fez ${golsTxt}.`;
  const novas: ConquistaAtleta[] = [];
  if (campeao) {
    const nova = novaConquista(c, {
      tipo: "titulo",
      chave: torneio.id,
      nome: torneio.nome,
      peso: 3,
      clube: "Seleção",
      detalhe: `${jogos} jogos, ${golsTxt}`,
    });
    if (nova) novas.push(nova);
    mexerVida(a, "fama", torneio.mundial ? 22 : 12);
    mexerVida(a, "moral", 15);
    mexerVida(a, "torcida", 8);
  } else {
    mexerVida(a, "moral", final ? -8 : -4);
    mexerVida(a, "fama", final ? 6 : 2);
  }
  const artilharia = gols >= (torneio.mundial ? 5 : 4) || (gols >= 4 && rng.proximo() < 0.4);
  if (artilharia)
    premio(
      c,
      `artilheiro:${torneio.id}`,
      `Artilheiro · ${torneio.nome}`,
      torneio.mundial ? 3 : 2,
      `${gols} gols`,
      novas,
    );
  if ((campeao || final) && !reserva && (gols >= 3 || j.ovr >= 86) && rng.proximo() < (campeao ? 0.55 : 0.3))
    premio(
      c,
      `craque:${torneio.id}`,
      `Melhor jogador · ${torneio.nome}`,
      torneio.mundial ? 3 : 2,
      seu.replace("Você jogou ", ""),
      novas,
    );
  for (const x of novas) x.clube = "Seleção";
  const seguinte = campeao ? "volta-campeao" : final ? "vice-na-final" : fase >= 2 ? "queda-selecao" : null;
  if (seguinte) a.agendadas.push({ evento: seguinte, semana: a.semana + 1, chance: 1, origem: torneio.id });
  publicarNoticia(
    estado.carreira,
    estado.temporada.rodada,
    torneio.nome,
    campeao
      ? `A seleção é campeã da ${torneio.nome}! ${a.nome}: ${golsTxt}.`
      : `A seleção caiu ${fases[fase]} da ${torneio.nome}.`,
    campeao ? "bom" : "info",
  );
  if (campeao) return `CAMPEÃO DA ${torneio.nome.toUpperCase()}! ${seu}`;
  return `A seleção caiu ${fases[fase]}. ${seu}`;
}

/* ───────────── Aviso dourado ───────────── */

/** Conquistas ainda sem o aviso dourado (na ordem em que saíram). */
export function conquistasNaoVistas(estado: EstadoJogo): ConquistaAtleta[] {
  return (estado.atleta?.conquistas ?? []).filter((x) => !x.visto);
}

/** Marca o aviso como visto. */
export function verConquista(estado: EstadoJogo, id: string): void {
  const x = estado.atleta?.conquistas?.find((y) => y.id === id);
  if (x) x.visto = true;
}

/** Sala de troféus: conquistas agrupadas pelo nome, com as temporadas de cada uma. */
export function salaDeTrofeus(estado: EstadoJogo): {
  titulos: { nome: string; logo?: string; peso: number; temporadas: number[]; clubes: string[] }[];
  premios: { nome: string; peso: number; temporadas: number[]; detalhes: string[] }[];
} {
  const a = estado.atleta;
  const lista = a ? (a.conquistas ?? conquistasDoHistorico(estado)) : [];
  const titulos = new Map<
    string,
    { nome: string; logo?: string; peso: number; temporadas: number[]; clubes: string[] }
  >();
  const premios = new Map<string, { nome: string; peso: number; temporadas: number[]; detalhes: string[] }>();
  for (const x of lista) {
    if (x.tipo === "titulo") {
      const g = titulos.get(x.nome) ?? {
        nome: x.nome,
        ...(x.logo ? { logo: x.logo } : {}),
        peso: x.peso,
        temporadas: [],
        clubes: [],
      };
      g.temporadas.push(x.temporada);
      if (!g.clubes.includes(x.clube)) g.clubes.push(x.clube);
      titulos.set(x.nome, g);
    } else {
      // "Bola de Ouro · 2º lugar" e "· 3º lugar" ficam juntos como pódio.
      const nome = x.chave === "podio-bola" ? "Pódio da Bola de Ouro" : x.nome;
      const g = premios.get(nome) ?? { nome, peso: x.peso, temporadas: [], detalhes: [] };
      g.temporadas.push(x.temporada);
      g.detalhes.push(`${x.temporada}: ${x.detalhe ?? x.nome}`);
      premios.set(nome, g);
    }
  }
  const ordem = <T extends { peso: number; temporadas: number[] }>(xs: T[]) =>
    xs.sort((x, y) => y.peso - x.peso || y.temporadas.length - x.temporadas.length);
  return { titulos: ordem([...titulos.values()]), premios: ordem([...premios.values()]) };
}
