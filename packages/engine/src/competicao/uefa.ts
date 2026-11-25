import { embaralhar, type Rng } from "../rng";

/** Cadastro mínimo e estável de um participante UEFA. */
export interface ClubeUefa {
  id: string;
  /** Código da associação, por exemplo ENG, ESP ou GER. */
  associacao: string;
  /** Coeficiente UEFA individual vigente antes do sorteio. */
  coeficiente: number;
}

export interface PartidaUefa {
  /** Jornada da fase de liga, de 1 a 8. */
  jornada: number;
  casa: string;
  visitante: string;
}

export interface ResultadoUefa extends PartidaUefa {
  golsCasa: number;
  golsVisitante: number;
  /** Amarelo = 1; vermelho direto ou por segundo amarelo = 3. */
  disciplinaCasa?: number;
  disciplinaVisitante?: number;
}

export interface LinhaLigaUefa {
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  golsFora: number;
  vitoriasFora: number;
  pontos: number;
  disciplina: number;
}

export type TabelaLigaUefa = Record<string, LinhaLigaUefa>;

export interface SorteioLigaUefa {
  /** Quatro potes ordenados pelo coeficiente UEFA. */
  potes: string[][];
  partidas: PartidaUefa[];
}

const novaLinha = (): LinhaLigaUefa => ({
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro: 0,
  golsContra: 0,
  golsFora: 0,
  vitoriasFora: 0,
  pontos: 0,
  disciplina: 0,
});

const chave = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const baralhar = <T>(rng: Rng, itens: readonly T[]) => embaralhar(rng, itens.slice());

type Direcao = "casa" | "fora";
type Necessidades = Map<string, Record<Direcao, Set<number>>>;
type ContagemPorAssociacao = Map<string, Map<string, number>>;

function criarNecessidades(participantes: readonly ClubeUefa[]): Necessidades {
  return new Map(
    participantes.map((clube) => [clube.id, { casa: new Set([0, 1, 2, 3]), fora: new Set([0, 1, 2, 3]) }]),
  );
}

function totalContraAssociacao(contagens: ContagemPorAssociacao, clubeId: string, associacao: string): number {
  return contagens.get(clubeId)?.get(associacao) ?? 0;
}

function ajustarAssociacao(
  contagens: ContagemPorAssociacao,
  clubeId: string,
  associacao: string,
  delta: 1 | -1,
) {
  const porAssociacao = contagens.get(clubeId) ?? new Map<string, number>();
  const proximo = (porAssociacao.get(associacao) ?? 0) + delta;
  if (proximo <= 0) porAssociacao.delete(associacao);
  else porAssociacao.set(associacao, proximo);
  contagens.set(clubeId, porAssociacao);
}

function podeEnfrentar(
  casa: ClubeUefa,
  visitante: ClubeUefa,
  necessidades: Necessidades,
  poteDe: ReadonlyMap<string, number>,
  pares: ReadonlySet<string>,
  contagens: ContagemPorAssociacao,
): boolean {
  if (casa.id === visitante.id || casa.associacao === visitante.associacao || pares.has(chave(casa.id, visitante.id))) {
    return false;
  }
  if (
    !necessidades.get(casa.id)?.casa.has(poteDe.get(visitante.id)!) ||
    !necessidades.get(visitante.id)?.fora.has(poteDe.get(casa.id)!)
  ) {
    return false;
  }
  return (
    totalContraAssociacao(contagens, casa.id, visitante.associacao) < 2 &&
    totalContraAssociacao(contagens, visitante.id, casa.associacao) < 2
  );
}

function registrar(
  casa: ClubeUefa,
  visitante: ClubeUefa,
  necessidades: Necessidades,
  poteDe: ReadonlyMap<string, number>,
  pares: Set<string>,
  contagens: ContagemPorAssociacao,
) {
  necessidades.get(casa.id)!.casa.delete(poteDe.get(visitante.id)!);
  necessidades.get(visitante.id)!.fora.delete(poteDe.get(casa.id)!);
  pares.add(chave(casa.id, visitante.id));
  ajustarAssociacao(contagens, casa.id, visitante.associacao, 1);
  ajustarAssociacao(contagens, visitante.id, casa.associacao, 1);
}

function desfazer(
  casa: ClubeUefa,
  visitante: ClubeUefa,
  necessidades: Necessidades,
  poteDe: ReadonlyMap<string, number>,
  pares: Set<string>,
  contagens: ContagemPorAssociacao,
) {
  necessidades.get(casa.id)!.casa.add(poteDe.get(visitante.id)!);
  necessidades.get(visitante.id)!.fora.add(poteDe.get(casa.id)!);
  pares.delete(chave(casa.id, visitante.id));
  ajustarAssociacao(contagens, casa.id, visitante.associacao, -1);
  ajustarAssociacao(contagens, visitante.id, casa.associacao, -1);
}

interface Candidato {
  casa: ClubeUefa;
  visitante: ClubeUefa;
}

function candidatosDo(
  clube: ClubeUefa,
  livres: readonly ClubeUefa[],
  necessidades: Necessidades,
  poteDe: ReadonlyMap<string, number>,
  pares: ReadonlySet<string>,
  contagens: ContagemPorAssociacao,
): Candidato[] {
  const candidatos: Candidato[] = [];
  for (const outro of livres) {
    if (outro.id === clube.id) continue;
    if (podeEnfrentar(clube, outro, necessidades, poteDe, pares, contagens)) candidatos.push({ casa: clube, visitante: outro });
    if (podeEnfrentar(outro, clube, necessidades, poteDe, pares, contagens)) candidatos.push({ casa: outro, visitante: clube });
  }
  return candidatos;
}

/** Uma jornada é um emparelhamento perfeito, já respeitando potes, mandos e associações. */
function montarJornada(
  participantes: readonly ClubeUefa[],
  rng: Rng,
  necessidades: Necessidades,
  poteDe: ReadonlyMap<string, number>,
  pares: Set<string>,
  contagens: ContagemPorAssociacao,
): Candidato[] | null {
  const livres = new Set(participantes.map((c) => c.id));
  const porId = new Map(participantes.map((c) => [c.id, c]));
  const jogos: Candidato[] = [];

  function buscar(): boolean {
    if (!livres.size) return true;
    let escolhido: ClubeUefa | null = null;
    let opcoes: Candidato[] = [];
    for (const id of livres) {
      const clube = porId.get(id)!;
      const candidaturas = candidatosDo(
        clube,
        [...livres].map((x) => porId.get(x)!),
        necessidades,
        poteDe,
        pares,
        contagens,
      );
      if (!candidaturas.length) return false;
      if (!escolhido || candidaturas.length < opcoes.length) {
        escolhido = clube;
        opcoes = candidaturas;
      }
    }
    for (const candidato of baralhar(rng, opcoes)) {
      if (!livres.has(candidato.casa.id) || !livres.has(candidato.visitante.id)) continue;
      registrar(candidato.casa, candidato.visitante, necessidades, poteDe, pares, contagens);
      livres.delete(candidato.casa.id);
      livres.delete(candidato.visitante.id);
      jogos.push(candidato);
      if (buscar()) return true;
      jogos.pop();
      livres.add(candidato.casa.id);
      livres.add(candidato.visitante.id);
      desfazer(candidato.casa, candidato.visitante, necessidades, poteDe, pares, contagens);
    }
    return false;
  }

  return buscar() ? jogos : null;
}

/**
 * Sorteia a fase de liga da Champions. O resultado tem 144 partidas: oito
 * adversários distintos por clube, quatro jogos em casa e quatro fora, um de
 * cada mando contra cada pote. Clubes da mesma associação não se enfrentam e
 * há no máximo dois adversários de uma mesma associação por participante.
 */
export function sortearLigaUefa(participantes: readonly ClubeUefa[], rng: Rng): SorteioLigaUefa {
  if (participantes.length !== 36) throw new Error("A fase de liga da Champions exige 36 clubes");
  if (new Set(participantes.map((c) => c.id)).size !== participantes.length) {
    throw new Error("Há clubes duplicados no sorteio UEFA");
  }
  const ordenados = participantes.slice().sort((a, b) => b.coeficiente - a.coeficiente || a.id.localeCompare(b.id));
  const potes = Array.from({ length: 4 }, (_, i) => ordenados.slice(i * 9, i * 9 + 9));
  const poteDe = new Map(ordenados.map((c, i) => [c.id, Math.floor(i / 9)]));

  // Uma escolha local válida pode bloquear a última jornada. Por isso a agenda
  // inteira é tentada de novo, mas sem nunca aceitar uma agenda irregular.
  for (let tentativa = 0; tentativa < 300; tentativa++) {
    const necessidades = criarNecessidades(ordenados);
    const pares = new Set<string>();
    const contagens: ContagemPorAssociacao = new Map(ordenados.map((c) => [c.id, new Map()]));
    const partidas: PartidaUefa[] = [];
    let valido = true;
    for (let jornada = 1; jornada <= 8; jornada++) {
      const jogos = montarJornada(ordenados, rng, necessidades, poteDe, pares, contagens);
      if (!jogos) {
        valido = false;
        break;
      }
      partidas.push(...jogos.map((jogo) => ({ jornada, casa: jogo.casa.id, visitante: jogo.visitante.id })));
    }
    if (valido) return { potes: potes.map((pote) => pote.map((clube) => clube.id)), partidas };
  }
  throw new Error("Não foi possível gerar um sorteio UEFA válido com as restrições informadas");
}

export function novaTabelaUefa(participantes: readonly ClubeUefa[]): TabelaLigaUefa {
  return Object.fromEntries(participantes.map((clube) => [clube.id, novaLinha()]));
}

export function registrarResultadoUefa(tabela: TabelaLigaUefa, resultado: ResultadoUefa): void {
  const casa = tabela[resultado.casa];
  const visitante = tabela[resultado.visitante];
  if (!casa || !visitante) throw new Error("Resultado UEFA tem clube fora da fase de liga");
  casa.jogos++;
  visitante.jogos++;
  casa.golsPro += resultado.golsCasa;
  casa.golsContra += resultado.golsVisitante;
  visitante.golsPro += resultado.golsVisitante;
  visitante.golsContra += resultado.golsCasa;
  visitante.golsFora += resultado.golsVisitante;
  casa.disciplina += resultado.disciplinaCasa ?? 0;
  visitante.disciplina += resultado.disciplinaVisitante ?? 0;
  if (resultado.golsCasa > resultado.golsVisitante) {
    casa.vitorias++;
    casa.pontos += 3;
    visitante.derrotas++;
  } else if (resultado.golsCasa < resultado.golsVisitante) {
    visitante.vitorias++;
    visitante.vitoriasFora++;
    visitante.pontos += 3;
    casa.derrotas++;
  } else {
    casa.empates++;
    visitante.empates++;
    casa.pontos++;
    visitante.pontos++;
  }
}

/** Critérios UEFA da fase de liga: sem confronto direto. */
export function classificacaoLigaUefa(
  participantes: readonly ClubeUefa[],
  tabela: TabelaLigaUefa,
  partidas: readonly PartidaUefa[],
): string[] {
  const clube = new Map(participantes.map((c) => [c.id, c]));
  const adversarios = new Map(participantes.map((c) => [c.id, [] as string[]]));
  for (const partida of partidas) {
    adversarios.get(partida.casa)?.push(partida.visitante);
    adversarios.get(partida.visitante)?.push(partida.casa);
  }
  const somaDosAdversarios = (id: string, campo: "pontos" | "golsPro" | "golsContra") =>
    (adversarios.get(id) ?? []).reduce((total, adversario) => total + (tabela[adversario]?.[campo] ?? 0), 0);
  const saldoDosAdversarios = (id: string) =>
    (adversarios.get(id) ?? []).reduce((total, adversario) => {
      const linha = tabela[adversario];
      return total + (linha ? linha.golsPro - linha.golsContra : 0);
    }, 0);
  return participantes
    .map((c) => c.id)
    .sort((a, b) => {
      const x = tabela[a]!;
      const y = tabela[b]!;
      return (
        y.pontos - x.pontos ||
        y.golsPro - y.golsContra - (x.golsPro - x.golsContra) ||
        y.golsPro - x.golsPro ||
        y.golsFora - x.golsFora ||
        y.vitorias - x.vitorias ||
        y.vitoriasFora - x.vitoriasFora ||
        somaDosAdversarios(b, "pontos") - somaDosAdversarios(a, "pontos") ||
        saldoDosAdversarios(b) - saldoDosAdversarios(a) ||
        somaDosAdversarios(b, "golsPro") - somaDosAdversarios(a, "golsPro") ||
        x.disciplina - y.disciplina ||
        (clube.get(b)?.coeficiente ?? 0) - (clube.get(a)?.coeficiente ?? 0) ||
        a.localeCompare(b)
      );
    });
}

export interface ConfrontoUefa {
  casaIda: string;
  casaVolta: string;
  /** Melhor posição da fase de liga; decide a volta em casa. */
  cabecaDeChave: string;
}

/** Playoffs 9º–24º, com os oito cabeças decidindo a volta em casa. */
export function sortearPlayoffsUefa(classificacao: readonly string[], rng: Rng): ConfrontoUefa[] {
  if (classificacao.length < 24) throw new Error("A classificação UEFA precisa ter ao menos 24 clubes");
  const confrontos: ConfrontoUefa[] = [];
  for (let bloco = 0; bloco < 4; bloco++) {
    const cabecas = classificacao.slice(8 + bloco * 2, 10 + bloco * 2);
    const naoCabecas = baralhar(rng, classificacao.slice(22 - bloco * 2, 24 - bloco * 2));
    for (let i = 0; i < 2; i++) {
      const cabeca = cabecas[i]!;
      confrontos.push({ casaIda: naoCabecas[i]!, casaVolta: cabeca, cabecaDeChave: cabeca });
    }
  }
  return confrontos;
}

/** Fatias da classificação usadas pelo mata-mata e pelo histórico. */
export function destinosDaLigaUefa(classificacao: readonly string[]) {
  if (classificacao.length !== 36) throw new Error("A fase de liga UEFA precisa terminar com 36 clubes");
  return { oitavasDiretas: classificacao.slice(0, 8), playoffs: classificacao.slice(8, 24), eliminados: classificacao.slice(24) };
}
