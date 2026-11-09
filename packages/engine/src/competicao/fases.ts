import { type Tabela, classificacao, novaTabela, registrarResultado, rodadasTodosContraTodos } from "../liga";
import { type Rng, embaralhar } from "../rng";
import { type Horario, horarioDaData } from "./calendario";
import type {
  Chaveamento,
  Confronto,
  Distribuicao,
  EstadoFaseLiga,
  EstadoFaseMataMata,
  FaseLiga,
  FaseMataMata,
  JogoAgendado,
} from "./tipos";

/** Contexto para criar jogos: prefixo dos ids e onde guardá-los. */
export interface Agenda {
  competicao: JogoAgendado["competicao"];
  jogos: Record<string, JogoAgendado>;
  meioDeSemana: boolean;
}

export function agendar(
  agenda: Agenda,
  fase: string,
  grupo: number,
  quando: number | Horario,
  casa: string,
  visitante: string,
): string {
  const h: Horario = typeof quando === "number" ? { semana: quando, meio: agenda.meioDeSemana } : quando;
  const rodada = h.semana;
  const id = `${agenda.competicao}:${fase}:${grupo}:${rodada}:${casa}:${visitante}`;
  agenda.jogos[id] = {
    id,
    rodada,
    meioDeSemana: h.meio,
    ...(h.data ? { data: h.data } : {}),
    competicao: agenda.competicao,
    fase,
    grupo,
    casa,
    visitante,
    placar: null,
  };
  return id;
}

export function distribuirEmGrupos(
  clubes: readonly string[],
  grupos: number,
  modo: Distribuicao,
): string[][] {
  const resultado = Array.from({ length: grupos }, () => [] as string[]);
  clubes.forEach((id, i) => {
    if (modo === "unico") resultado[0]!.push(id);
    else if (modo === "alternada") resultado[i % grupos]!.push(id);
    else {
      const volta = Math.floor(i / grupos);
      const posicao = i % grupos;
      resultado[volta % 2 === 0 ? posicao : grupos - 1 - posicao]!.push(id);
    }
  });
  return resultado;
}

/** Quantas rodadas uma fase de liga ocupa. */
export function rodadasDaLiga(fase: FaseLiga, clubes: number): number {
  const porGrupo = Math.ceil(clubes / fase.grupos);
  const porTurno = porGrupo % 2 ? porGrupo : porGrupo - 1;
  return porTurno * fase.turnos;
}

export function montarFaseLiga(
  fase: FaseLiga,
  clubes: readonly string[],
  rodadaInicial: number,
  agenda: Agenda,
  rng: Rng,
): EstadoFaseLiga {
  if (fase.jogos?.length) {
    // Tabela real: confrontos e datas oficiais, classificação em grupo único.
    const reais = fase.jogos.filter((j) => clubes.includes(j.casa) && clubes.includes(j.fora));
    const horarios = reais.map((j) => horarioDaData(j.data));
    reais.forEach((j, i) => agendar(agenda, fase.nome, 0, horarios[i]!, j.casa, j.fora));
    const semanas = horarios.map((h) => h.semana);
    return {
      tipo: "liga",
      nome: fase.nome,
      grupos: [clubes.slice()],
      tabelas: [novaTabela(clubes)],
      rodadaInicial: Math.min(...semanas),
      rodadaFinal: Math.max(...semanas),
      encerrada: false,
    };
  }
  const grupos = distribuirEmGrupos(clubes, fase.grupos, fase.distribuicao);
  const quando = (r: number): number | Horario =>
    fase.datas?.[r] ? horarioDaData(fase.datas[r]!) : rodadaInicial + r;
  grupos.forEach((grupo, g) => {
    const turno = embaralhar(rng, rodadasTodosContraTodos(grupo));
    const rodadas =
      fase.turnos === 2
        ? turno.concat(turno.map((r) => r.map((j) => ({ casa: j.visitante, visitante: j.casa }))))
        : turno;
    rodadas.forEach((jogos, r) => {
      for (const j of jogos) agendar(agenda, fase.nome, g, quando(r), j.casa, j.visitante);
    });
  });
  return {
    tipo: "liga",
    nome: fase.nome,
    grupos,
    tabelas: grupos.map((g) => novaTabela(g)),
    rodadaInicial: fase.datas?.length ? horarioDaData(fase.datas[0]!).semana : rodadaInicial,
    rodadaFinal: fase.datas?.length
      ? horarioDaData(fase.datas[rodadasDaLiga(fase, clubes.length) - 1] ?? fase.datas.at(-1)!).semana
      : rodadaInicial + rodadasDaLiga(fase, clubes.length) - 1,
    encerrada: false,
  };
}

/** Pares do mata-mata. `ordenados` já vem do melhor para o pior (ou na ordem da chave). */
export function parear(ordenados: readonly string[], modo: Chaveamento, rng: Rng): [string, string][] {
  const n = ordenados.length;
  if (modo === "sorteio") {
    const sorteados = embaralhar(rng, ordenados.slice());
    return Array.from({ length: n / 2 }, (_, i) => [sorteados[2 * i]!, sorteados[2 * i + 1]!]);
  }
  if (modo === "chave")
    return Array.from({ length: n / 2 }, (_, i) => [ordenados[2 * i]!, ordenados[2 * i + 1]!]);
  if (modo === "melhorContraPior") {
    // Ordem de chaveamento: 1x8, 4x5, 2x7, 3x6 — os dois melhores só se cruzam na final.
    const pares = Array.from(
      { length: n / 2 },
      (_, i) => [ordenados[i]!, ordenados[n - 1 - i]!] as [string, string],
    );
    return ordemDeChave(pares.length).map((i) => pares[i]!);
  }
  throw new Error(`Chaveamento ${modo} precisa dos grupos (use cruzarGrupos)`);
}

/**
 * Ordem clássica de chave: [0, 3, 1, 2] para 4 pares, generalizada por recursão.
 * Sem potência de 2 (1ª fase da Copa, 14 pares) não há chave a seguir: ordem simples.
 */
function ordemDeChave(pares: number): number[] {
  if (pares & (pares - 1)) return Array.from({ length: pares }, (_, i) => i);
  if (pares <= 1) return [0];
  const metade = ordemDeChave(pares / 2);
  return metade.flatMap((i) => [i, pares - 1 - i]);
}

/** 1º do grupo g x 4º do grupo g+1 e 2º do grupo g x 3º do grupo g+1 (grupos pareados dois a dois). */
export function cruzarGrupos(classificados: readonly string[][]): [string, string][] {
  const pares: [string, string][] = [];
  for (let g = 0; g < classificados.length; g += 2) {
    const a = classificados[g]!;
    const b = classificados[g + 1]!;
    pares.push([a[0]!, b[3]!], [b[1]!, a[2]!], [b[0]!, a[3]!], [a[1]!, b[2]!]);
  }
  return pares;
}

export function montarFaseMataMata(
  fase: Pick<FaseMataMata, "nome" | "idaEVolta">,
  pares: readonly [string, string][],
  /** Rodada (ou horário com data) do jogo único, ou da ida e da volta. */
  rodadas: readonly (number | Horario)[],
  agenda: Agenda,
  /** Quem tem o mando da volta (ou do jogo único): o melhor da campanha, ou sorteio. */
  mandoFinal: (a: string, b: string) => string,
  neutro = false,
): EstadoFaseMataMata {
  const [ida, volta] = rodadas as [number | Horario, (number | Horario)?];
  const semana = (q: number | Horario) => (typeof q === "number" ? q : q.semana);
  const confrontos: Confronto[] = pares.map(([a, b], i) => {
    const mandante = mandoFinal(a, b);
    const outro = mandante === a ? b : a;
    const jogos =
      fase.idaEVolta && volta !== undefined
        ? [
            agendar(agenda, fase.nome, i, ida, outro, mandante),
            agendar(agenda, fase.nome, i, volta, mandante, outro),
          ]
        : [agendar(agenda, fase.nome, i, ida, mandante, outro)];
    if (neutro) for (const id of jogos) agenda.jogos[id]!.neutro = true;
    return { a, b, jogos, mandoFinal: mandante, vencedor: null };
  });
  return {
    tipo: "mataMata",
    nome: fase.nome,
    confrontos,
    rodadaInicial: semana(ida),
    rodadaFinal: semana(volta ?? ida),
    encerrada: false,
  };
}

/** Pênaltis: 5 cobranças e alternadas, com leve vantagem para o mais forte. */
export function cobrarPenaltis(rng: Rng, forcaA: number, forcaB: number): [number, number] {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 5; i++) {
    if (rng.proximo() < 0.75 + (forcaA - forcaB) / 200) a++;
    if (rng.proximo() < 0.75 + (forcaB - forcaA) / 200) b++;
  }
  while (a === b) {
    if (rng.proximo() < 0.75) a++;
    if (rng.proximo() < 0.75) b++;
  }
  return [a, b];
}

/** Saldo no agregado (ou placar do jogo único) e, empatado, pênaltis. */
export function decidirConfronto(
  confronto: Confronto,
  jogos: Record<string, JogoAgendado>,
  rng: Rng,
  forca: (id: string) => number,
): void {
  let ga = 0;
  let gb = 0;
  for (const id of confronto.jogos) {
    const j = jogos[id]!;
    if (!j.placar) throw new Error(`Jogo ${id} ainda não tem placar`);
    if (j.casa === confronto.a) {
      ga += j.placar[0];
      gb += j.placar[1];
    } else {
      gb += j.placar[0];
      ga += j.placar[1];
    }
  }
  confronto.agregado = [ga, gb];
  if (ga !== gb) {
    confronto.vencedor = ga > gb ? confronto.a : confronto.b;
    return;
  }
  const p = cobrarPenaltis(rng, forca(confronto.a), forca(confronto.b));
  confronto.penaltis = p;
  confronto.vencedor = p[0] > p[1] ? confronto.a : confronto.b;
}

export function registrarNaLiga(fase: EstadoFaseLiga, jogo: JogoAgendado): void {
  if (!jogo.placar) return;
  registrarResultado(fase.tabelas[jogo.grupo]!, jogo.casa, jogo.visitante, jogo.placar[0], jogo.placar[1]);
}

export function classificacaoDoGrupo(fase: EstadoFaseLiga, grupo: number): string[] {
  return classificacao(fase.grupos[grupo]!, fase.tabelas[grupo]!);
}

/** Campanha somando todas as fases (critério da CBF para ordenar e definir mando). */
export function campanha(jogos: Iterable<JogoAgendado>, ids: readonly string[]): Tabela {
  const tabela = novaTabela(ids);
  for (const j of jogos)
    if (j.placar) registrarResultado(tabela, j.casa, j.visitante, j.placar[0], j.placar[1]);
  return tabela;
}

export function ordenarPorCampanha(ids: readonly string[], tabela: Tabela): string[] {
  return classificacao(ids, tabela);
}

/** Fase de liga com grupos e jogos definidos (tabela real): cada jogo conta no grupo do mandante. */
export function montarFaseLigaComGrupos(
  nome: string,
  grupos: string[][],
  jogos: readonly { data: string; casa: string; fora: string }[],
  agenda: Agenda,
): EstadoFaseLiga {
  const grupoDe = new Map(grupos.flatMap((g, i) => g.map((id) => [id, i] as const)));
  const semanas: number[] = [];
  for (const j of jogos) {
    const h = horarioDaData(j.data);
    semanas.push(h.semana);
    agendar(agenda, nome, grupoDe.get(j.casa) ?? 0, h, j.casa, j.fora);
  }
  return {
    tipo: "liga",
    nome,
    grupos,
    tabelas: grupos.map((g) => novaTabela(g)),
    rodadaInicial: Math.min(...semanas),
    rodadaFinal: Math.max(...semanas),
    encerrada: false,
  };
}
