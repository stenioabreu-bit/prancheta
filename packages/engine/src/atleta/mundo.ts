/**
 * Ligas do mundo no modo jogador: os clubes do pacote de mundo (Premier League, La Liga, MLS...)
 * entram no mesmo save e jogam campeonatos de pontos corridos em paralelo ao pacote base. Assim o
 * atleta pode receber propostas e jogar fora do país. No modo técnico elas não existem.
 */
import type { EstadoJogo } from "../carreira/jogo";
import { type ClubeDados, criarClube } from "../clube";
import { adicionarLigaParalela, divisaoDo } from "../competicao/temporada";
import type { FormatoDivisao } from "../competicao/tipos";
import { transferir } from "../mercado/transferencias";
import { criarRng } from "../rng";

export interface LigaDoMundo {
  id: string;
  /** Código curto do país/divisão ("ENG", "ESP2"). */
  codigo: string;
  nome: string;
  pais: string;
  nivel: number;
  clubes: ClubeDados[];
}

export interface PacoteDoMundo {
  formato: 1;
  fonte?: string;
  ligas: LigaDoMundo[];
}

/** Nome comparável: sem acento, minúsculo, sem siglas de clube ("CA", "FC"...). */
function normalizar(nome: string): string {
  return nome
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\b(club|clube|ca|cd|fc|cf|sc|ac|afc|atletico|athletic|de|del|la|el)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Chave da liga dentro dos estaduais ("mundo-eng"): a competição vira "est-mundo-eng". */
export function chaveDaLiga(l: LigaDoMundo): string {
  return l.id.startsWith("mundo-") ? l.id : `mundo-${l.codigo.toLowerCase()}`;
}

export function ehLigaDoMundo(competicao: string): boolean {
  return competicao.startsWith("est-mundo-");
}

/**
 * Só liga sul-americana pode reaproveitar um clube que já está no save pelo nome (os estrangeiros das
 * copas continentais, como River e Boca). Fora daqui, nome igual é coincidência: "FC Barcelona" e
 * "Barcelona SC" viram o mesmo "barcelona" depois de normalizados.
 */
const PAISES_DA_CONMEBOL = new Set([
  "Argentina",
  "Bolívia",
  "Brasil",
  "Chile",
  "Colômbia",
  "Equador",
  "Paraguai",
  "Peru",
  "Uruguai",
  "Venezuela",
]);

function podeReaproveitar(liga: LigaDoMundo): boolean {
  return PAISES_DA_CONMEBOL.has(liga.pais);
}

/**
 * Põe as ligas no mundo do save. Clube que já existe no pacote base com o mesmo nome (estrangeiros das
 * copas continentais) é reaproveitado; liga cujos clubes já estão nas divisões do pacote (o pacote base
 * é daquele país) fica de fora, assim como os códigos em `excluir`.
 */
export function adicionarLigasDoMundo(
  estado: EstadoJogo,
  ligas: readonly LigaDoMundo[],
  excluir: string[] = [],
) {
  const t = estado.temporada;
  const rng = criarRng((t.rng ^ 0x3a17) >>> 0);
  const porNome = new Map<string, string>();
  for (const c of Object.values(t.clubes)) porNome.set(normalizar(c.nome), c.id);
  for (const liga of ligas) {
    if (excluir.includes(liga.codigo)) continue;
    const ids: string[] = [];
    let jaNoPacote = 0;
    for (const dados of liga.clubes) {
      const existente = podeReaproveitar(liga) ? porNome.get(normalizar(dados.nome)) : undefined;
      if (existente) {
        if (divisaoDo(t, existente)) jaNoPacote++;
        ids.push(existente);
        continue;
      }
      if (!t.clubes[dados.id]) t.clubes[dados.id] = criarClube(dados, rng);
      estado.mercado.tecnicos[dados.id] ??= dados.tecnico ?? null;
      ids.push(dados.id);
    }
    if (jaNoPacote >= liga.clubes.length / 2) continue;
    // Clube que joga uma divisão do pacote base não entra numa liga estrangeira.
    const participantes = [...new Set(ids)].filter((id) => !divisaoDo(t, id));
    const n = participantes.length;
    const formato: FormatoDivisao = {
      divisao: "A",
      competicao: `est-${chaveDaLiga(liga)}`,
      id: liga.id,
      nome: liga.nome,
      inicio: 0,
      clubes: n,
      participantes,
      fases: [
        {
          tipo: "liga",
          nome: "Pontos corridos",
          grupos: 1,
          distribuicao: "unico",
          turnos: 2 * (n - 1) <= 38 ? 2 : 1,
          avancamPorGrupo: 0,
        },
      ],
      acesso: [],
      rebaixamento: [],
    };
    adicionarLigaParalela(t, chaveDaLiga(liga), formato);
  }
}

const GRANDES_LIGAS = ["mundo-eng", "mundo-esp", "mundo-ita", "mundo-ger", "mundo-fra"];

/**
 * Prestígio da liga em que o clube joga (0,35–1): as cinco grandes da Europa no topo, as outras
 * primeiras divisões e a Série A do pacote logo abaixo, as divisões de acesso embaixo.
 */
export function prestigioDaLiga(estado: EstadoJogo, clubeId: string): number {
  const div = divisaoDo(estado.temporada, clubeId);
  if (div) return div === "A" ? 0.8 : div === "B" ? 0.5 : 0.35;
  const liga = ligaDoMundoDoClube(estado, clubeId);
  if (!liga) return 0.6;
  if (GRANDES_LIGAS.includes(liga.chave)) return 1;
  return /\d$/.test(liga.chave) ? 0.5 : 0.8;
}

/** Quanto o clube consegue pagar em relação ao salário de mercado (0,5–1,3). */
export function riquezaDoClube(estado: EstadoJogo, clube: { id: string; forca: number }): number {
  const p = prestigioDaLiga(estado, clube.id);
  return Math.min(1.3, Math.max(0.5, 0.4 + p * 0.4 + (clube.forca - 70) / 40));
}

/** Troca um clube por outro dentro de uma liga paralela: participantes, tabela, grupos e jogos. */
function trocarNaLiga(estado: EstadoJogo, chave: string, de: string, para: string): void {
  const t = estado.temporada;
  const troca = (id: string) => (id === de ? para : id);
  const formato = t.formatosEstaduais?.[chave];
  if (formato?.participantes) formato.participantes = formato.participantes.map(troca);
  const div = t.estaduais?.[chave];
  if (!div) return;
  div.clubes = div.clubes.map(troca);
  div.acesso = div.acesso.map(troca);
  div.rebaixados = div.rebaixados.map(troca);
  if (div.campeao === de) div.campeao = para;
  for (const f of div.fases) {
    if (f.tipo === "liga") {
      f.grupos = f.grupos.map((g) => g.map(troca));
      for (const tabela of f.tabelas) {
        if (!tabela[de]) continue;
        tabela[para] = tabela[de]!;
        delete tabela[de];
      }
    } else {
      for (const c of f.confrontos) {
        c.a = troca(c.a);
        c.b = troca(c.b);
        if (c.vencedor) c.vencedor = troca(c.vencedor);
      }
    }
  }
  const competicao = `est-${chave}`;
  for (const j of Object.values(t.jogos)) {
    if (j.competicao !== competicao) continue;
    j.casa = troca(j.casa);
    j.visitante = troca(j.visitante);
  }
}

/**
 * Conserta saves criados antes da regra de `podeReaproveitar`: clube de liga fora da América do Sul que
 * foi confundido com um clube do pacote de mesmo nome (o Barcelona SC jogando a La Liga) vira o clube
 * certo dentro da liga; o do pacote segue nas copas dele. Atleta que assinou com o clube da liga vai
 * junto. Devolve quantos clubes foram trocados.
 */
export function repararLigasDoMundo(estado: EstadoJogo, ligas: readonly LigaDoMundo[]): number {
  const t = estado.temporada;
  // Com um jogo do atleta montado no meio, espera a próxima carga (o jogo já tem os ids antigos).
  if (estado.atleta?.jogo) return 0;
  const rng = criarRng((t.rng ^ 0x7c41) >>> 0);
  let trocados = 0;
  for (const liga of ligas) {
    const chave = chaveDaLiga(liga);
    const div = t.estaduais?.[chave];
    if (!div || podeReaproveitar(liga)) continue;
    const idsDaLiga = new Set(liga.clubes.map((c) => c.id));
    for (const dados of liga.clubes) {
      if (div.clubes.includes(dados.id)) continue;
      const errado = div.clubes.find(
        (id) => !idsDaLiga.has(id) && normalizar(t.clubes[id]?.nome ?? "") === normalizar(dados.nome),
      );
      if (!errado) continue;
      if (!t.clubes[dados.id]) t.clubes[dados.id] = criarClube(dados, rng);
      estado.mercado.tecnicos[dados.id] ??= dados.tecnico ?? null;
      trocarNaLiga(estado, chave, errado, dados.id);
      const a = estado.atleta;
      if (a && !a.aposentado && a.contrato.clubeId === errado) {
        const de = t.clubes[errado]!;
        const j = de.jogadores.find((x) => x.id === a.jogadorId);
        if (j) transferir(j, de, t.clubes[dados.id]!);
        a.contrato.clubeId = dados.id;
      }
      trocados++;
    }
  }
  return trocados;
}

/** Liga do mundo de um clube (para mostrar país e nível nas propostas). */
export function ligaDoMundoDoClube(
  estado: EstadoJogo,
  clubeId: string,
): { nome: string; chave: string } | null {
  for (const [chave, div] of Object.entries(estado.temporada.estaduais ?? {})) {
    if (!chave.startsWith("mundo-") || !div.clubes.includes(clubeId)) continue;
    return { chave, nome: estado.temporada.formatosEstaduais?.[chave]?.nome ?? chave };
  }
  return null;
}
