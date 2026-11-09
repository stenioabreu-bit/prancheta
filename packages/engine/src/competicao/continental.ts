/**
 * Copas continentais (CONMEBOL Libertadores com a Pré, e Sul-Americana) a partir da tabela real de 2026:
 * confrontos e grupos reais, datas reais. Quem depende de resultado aparece como "VENC:<fase>:<i>"
 * (vencedor do confronto i daquela fase) e é trocado pelo vencedor simulado quando a fase abre.
 * Mata-matas por "lados" cruzam posições de grupos, inclusive de outra competição
 * (2º da Sul-Americana × 3º da Libertadores).
 */
import { type Rng, embaralhar } from "../rng";
import { type Horario, dataDoHorario, horarioDaData } from "./calendario";
import {
  type Agenda,
  classificacaoDoGrupo,
  decidirConfronto,
  montarFaseLigaComGrupos,
  montarFaseMataMata,
} from "./fases";
import type { EstadoFase, EstadoFaseMataMata, IdCompeticao, JogoAgendado } from "./tipos";

export type FonteContinental =
  | { vencedoresDe: string }
  | { grupoPos: number; fase: string; competicao?: IdCompeticao };

export interface FaseContinental {
  tipo: "liga" | "mataMata";
  nome: string;
  /** Mata-mata: data da ida e da volta (ou do jogo único). */
  datas?: string[];
  idaEVolta?: boolean;
  neutro?: boolean;
  /** Mata-mata com confrontos reais (ids ou "VENC:fase:i"). */
  pares?: [string, string][];
  /** Mata-mata entre dois lados: o lado A tem o mando da volta; o lado B é sorteado. */
  lados?: [FonteContinental, FonteContinental];
  /** Liga: grupos reais e jogos reais (ids ou "VENC:fase:i"). */
  grupos?: string[][];
  jogos?: { data: string; casa: string; fora: string }[];
}

export interface FormatoContinental {
  id: IdCompeticao;
  nome: string;
  /** ID do catálogo de logos. */
  logo: string;
  fases: FaseContinental[];
}

export interface EstadoContinental {
  id: IdCompeticao;
  fases: EstadoFase[];
  campeao: string | null;
  vice: string | null;
  encerrada: boolean;
}

export interface ContextoContinental {
  jogos: Record<string, JogoAgendado>;
  rng: Rng;
  forca: (id: string) => number;
  outras: Record<string, EstadoContinental>;
}

function faseDe(est: EstadoContinental, nome: string): EstadoFase | undefined {
  return est.fases.find((f) => f.nome === nome);
}

function resolver(est: EstadoContinental, id: string, ctx?: ContextoContinental): string {
  if (id.startsWith("PERD:")) {
    // Perdedor de um confronto de outra competição (eliminados da Fase 3 da Libertadores → Sul-Americana).
    const [, comp, fase, i] = id.split(":");
    const f = ctx && (faseDe(ctx.outras[comp!]!, fase!) as EstadoFaseMataMata | undefined);
    const c = f?.confrontos[Number(i)];
    if (!c?.vencedor) throw new Error(`${est.id}: ${id} ainda não foi decidido`);
    return c.vencedor === c.a ? c.b : c.a;
  }
  if (!id.startsWith("VENC:")) return id;
  const [, fase, i] = id.split(":");
  const f = faseDe(est, fase!) as EstadoFaseMataMata | undefined;
  const v = f?.confrontos[Number(i)]?.vencedor;
  if (!v) throw new Error(`${est.id}: ${id} ainda não foi decidido`);
  return v;
}

function lado(est: EstadoContinental, ctx: ContextoContinental, f: FonteContinental): string[] {
  if ("vencedoresDe" in f) {
    const fase = faseDe(est, f.vencedoresDe) as EstadoFaseMataMata;
    return fase.confrontos.map((c) => c.vencedor!);
  }
  const dono = f.competicao ? ctx.outras[f.competicao] : est;
  const fase = dono && faseDe(dono, f.fase);
  if (fase?.tipo !== "liga") return [];
  return fase.grupos.map((_, g) => classificacaoDoGrupo(fase, g)[f.grupoPos - 1]!).filter(Boolean);
}

function pronta(est: EstadoContinental, ctx: ContextoContinental, f: FaseContinental): boolean {
  const refs = [...(f.pares ?? []).flat(), ...(f.grupos ?? []).flat()].filter((x) => x.startsWith("PERD:"));
  for (const r of refs) {
    const [, comp, fase] = r.split(":");
    const outra = ctx.outras[comp!];
    if (!outra || !faseDe(outra, fase!)?.encerrada) return false;
  }
  for (const l of f.lados ?? []) {
    if ("competicao" in l && l.competicao) {
      const outra = ctx.outras[l.competicao];
      if (!outra || !faseDe(outra, l.fase)?.encerrada) return false;
    }
  }
  return true;
}

function abrir(
  formato: FormatoContinental,
  est: EstadoContinental,
  ctx: ContextoContinental,
  semanaMin: number,
) {
  const i = est.fases.length;
  const f = formato.fases[i]!;
  const agenda: Agenda = { competicao: formato.id, jogos: ctx.jogos, meioDeSemana: true };
  if (f.tipo === "liga") {
    const grupos = (f.grupos ?? []).map((g) => g.map((id) => resolver(est, id, ctx)));
    const jogos = (f.jogos ?? []).map((j) => ({
      data: j.data,
      casa: resolver(est, j.casa, ctx),
      fora: resolver(est, j.fora, ctx),
    }));
    est.fases.push(montarFaseLigaComGrupos(f.nome, grupos, jogos, agenda));
    return;
  }
  let pares: [string, string][];
  if (f.pares) pares = f.pares.map(([a, b]) => [resolver(est, a, ctx), resolver(est, b, ctx)]);
  else if (f.lados) {
    const a = lado(est, ctx, f.lados[0]);
    const b = embaralhar(ctx.rng, lado(est, ctx, f.lados[1]));
    pares = a.map((x, k) => [x, b[k]!] as [string, string]).filter(([, y]) => !!y);
  } else {
    const anterior = est.fases[i - 1] as EstadoFaseMataMata;
    const v = anterior.confrontos.map((c) => c.vencedor!);
    pares = [];
    for (let k = 0; k + 1 < v.length; k += 2) pares.push([v[k]!, v[k + 1]!]);
  }
  const horarios: Horario[] = (f.datas ?? []).map((d, k) => {
    const h = horarioDaData(d);
    const min = semanaMin + k;
    return h.semana >= min ? h : { semana: min, meio: h.meio, data: dataDoHorario(min, h.meio) };
  });
  const idaEVolta = !!f.idaEVolta && horarios.length === 2;
  est.fases.push(
    montarFaseMataMata(
      { nome: f.nome, idaEVolta },
      pares,
      idaEVolta ? horarios : horarios.slice(0, 1),
      agenda,
      (a) => a,
      f.neutro,
    ),
  );
}

export function iniciarContinental(formato: FormatoContinental, ctx: ContextoContinental): EstadoContinental {
  const est: EstadoContinental = { id: formato.id, fases: [], campeao: null, vice: null, encerrada: false };
  abrir(formato, est, ctx, 0);
  return est;
}

/** Fecha as fases que terminaram nesta semana e abre as seguintes (se as dependências já fecharam). */
export function fecharRodadaContinental(
  formato: FormatoContinental,
  est: EstadoContinental,
  rodada: number,
  ctx: ContextoContinental,
): void {
  if (est.encerrada) return;
  for (const f of est.fases) {
    if (f.encerrada || f.rodadaFinal > rodada) continue;
    if (f.tipo === "mataMata")
      for (const c of f.confrontos) decidirConfronto(c, ctx.jogos, ctx.rng, ctx.forca);
    f.encerrada = true;
  }
  while (est.fases.length < formato.fases.length && est.fases.at(-1)!.encerrada) {
    const proxima = formato.fases[est.fases.length]!;
    if (!pronta(est, ctx, proxima)) return;
    abrir(formato, est, ctx, rodada + 1);
  }
  if (est.fases.length === formato.fases.length && est.fases.every((f) => f.encerrada)) {
    const final = est.fases.at(-1) as EstadoFaseMataMata;
    const c = final.confrontos[0]!;
    est.campeao = c.vencedor;
    est.vice = c.vencedor === c.a ? c.b : c.a;
    est.encerrada = true;
  }
}

/** Participantes reais (ids sem os "VENC:"). */
export function participantesContinental(formato: FormatoContinental): string[] {
  const ids = new Set<string>();
  for (const f of formato.fases) {
    for (const [a, b] of f.pares ?? []) ids.add(a).add(b);
    for (const g of f.grupos ?? []) for (const id of g) ids.add(id);
  }
  return [...ids].filter((id) => !id.startsWith("VENC:") && !id.startsWith("PERD:"));
}
