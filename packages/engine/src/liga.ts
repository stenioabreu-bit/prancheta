import { type Rng, embaralhar } from "./rng";
import type { Clube } from "./tipos";

export interface LinhaTabela {
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  pts: number;
  /** Últimos 5 resultados: V, E ou D. */
  forma: ("V" | "E" | "D")[];
}

export type Tabela = Record<string, LinhaTabela>;

export interface Jogo {
  casa: string;
  visitante: string;
}

export function novaTabela(ids: readonly string[]): Tabela {
  const t: Tabela = {};
  for (const id of ids) t[id] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0, forma: [] };
  return t;
}

function anotar(linha: LinhaTabela, gp: number, gc: number) {
  linha.j++;
  linha.gp += gp;
  linha.gc += gc;
  const r = gp > gc ? "V" : gp < gc ? "D" : "E";
  if (r === "V") {
    linha.v++;
    linha.pts += 3;
  } else if (r === "E") {
    linha.e++;
    linha.pts++;
  } else {
    linha.d++;
  }
  linha.forma.push(r);
  if (linha.forma.length > 5) linha.forma.shift();
}

export function registrarResultado(
  tabela: Tabela,
  casa: string,
  visitante: string,
  gc: number,
  gv: number,
): void {
  const lc = tabela[casa];
  const lv = tabela[visitante];
  if (!lc || !lv) return;
  anotar(lc, gc, gv);
  anotar(lv, gv, gc);
}

/** Critérios: pontos, vitórias, saldo, gols pró. */
export function classificacao(ids: readonly string[], tabela: Tabela): string[] {
  return ids.slice().sort((x, y) => {
    const a = tabela[x]!;
    const b = tabela[y]!;
    return b.pts - a.pts || b.v - a.v || b.gp - b.gc - (a.gp - a.gc) || b.gp - a.gp;
  });
}

/** Rodízio (método do círculo): cada clube enfrenta todos uma vez. Número ímpar ganha folga. */
export function rodadasTodosContraTodos(ids: readonly string[]): Jogo[][] {
  const arr: (string | null)[] = ids.slice();
  if (arr.length % 2) arr.push(null);
  const n = arr.length;
  const rodadas: Jogo[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const jogos: Jogo[] = [];
    for (let i = 0; i < n / 2; i++) {
      let casa = arr[i]!;
      let visitante = arr[n - 1 - i]!;
      if ((r + i) % 2) [casa, visitante] = [visitante, casa];
      if (casa && visitante) jogos.push({ casa, visitante });
    }
    rodadas.push(jogos);
    arr.splice(1, 0, arr.pop()!);
  }
  return rodadas;
}

/** Pontos corridos em turno e returno, com a ordem do turno sorteada e o returno espelhado. */
export function calendarioPontosCorridos(rng: Rng, ids: readonly string[]): Jogo[][] {
  const turno = embaralhar(rng, rodadasTodosContraTodos(ids));
  const returno = turno.map((r) => r.map((j) => ({ casa: j.visitante, visitante: j.casa })));
  return turno.concat(returno);
}

/** Recuperação entre rodadas: condição, contagem de lesões e cumprimento de suspensões. */
export function recuperarEntreRodadas(clubes: Iterable<Clube>): void {
  for (const clube of clubes) {
    for (const j of clube.jogadores) {
      j.cond = Math.min(100, j.cond + 38);
      if (j.lesao > 0 && !j.recemLesionado) j.lesao--;
      j.recemLesionado = false;
      if (j.susp > 0 && j.cumprindoSuspensao) j.susp--;
      j.cumprindoSuspensao = j.susp > 0;
    }
  }
}
