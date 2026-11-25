/**
 * Números para a tela do modo jogador: em que pé o clube está em cada competição, a tabela resumida
 * da liga, o progresso da temporada e o valor de mercado do atleta.
 */
import type { EstadoJogo } from "../carreira/jogo";
import { campeoes } from "../carreira/titulos";
import { classificacaoDoGrupo } from "../competicao/fases";
import {
  competicoesAtivas,
  divisaoDo,
  fasesDaCompeticao,
  nomeDaCompeticao,
  semanasDaTemporada,
} from "../competicao/temporada";
import type { IdCompeticao } from "../competicao/tipos";
import { valorDeMercado } from "../mercado/valores";
import { clubeDoAtleta, jogadorDoAtleta } from "./motor";

export interface LinhaResumida {
  clubeId: string;
  posicao: number;
  pts: number;
  j: number;
}

export interface SituacaoNaCompeticao {
  id: IdCompeticao;
  nome: string;
  /** "4º", "Oitavas", "Eliminado nas Quartas", "Campeão". */
  resumo: string;
  /** Liga: tabela do grupo do clube (todas as linhas). */
  tabela?: LinhaResumida[];
  /** Mata-mata: fase atual (ou a da eliminação). */
  fase?: string;
  eliminado?: boolean;
  campeao?: boolean;
}

/** Competições da temporada em que o clube tem jogo, com a situação dele em cada uma. */
export function competicoesDoClube(estado: EstadoJogo, clubeId: string): SituacaoNaCompeticao[] {
  const t = estado.temporada;
  const titulos = new Map(campeoes(estado).map(([c, campeao]) => [c, campeao]));
  const disputa = new Set<string>();
  for (const j of Object.values(t.jogos))
    if (j.casa === clubeId || j.visitante === clubeId) disputa.add(j.competicao);
  const r: SituacaoNaCompeticao[] = [];
  for (const c of competicoesAtivas(t)) {
    if (!disputa.has(c)) continue;
    const s: SituacaoNaCompeticao = { id: c, nome: nomeDaCompeticao(t, c), resumo: "—" };
    const fases = fasesDaCompeticao(t, c);
    for (let i = fases.length - 1; i >= 0; i--) {
      const f = fases[i]!;
      if (f.tipo === "liga") {
        const g = f.grupos.findIndex((grupo) => grupo.includes(clubeId));
        if (g < 0) continue;
        const ordem = classificacaoDoGrupo(f, g);
        s.tabela = ordem.map((id, k) => ({
          clubeId: id,
          posicao: k + 1,
          pts: f.tabelas[g]![id]?.pts ?? 0,
          j: f.tabelas[g]![id]?.j ?? 0,
        }));
        s.resumo = `${ordem.indexOf(clubeId) + 1}º`;
        // Fase de grupos encerrada e o clube não passou: eliminado.
        if (f.encerrada && i < fases.length - 1 && !fases.slice(i + 1).some((x) => participa(x, clubeId))) {
          s.eliminado = true;
          s.resumo = `Eliminado: ${f.nome}`;
        }
        break;
      }
      const confronto = f.confrontos.find((x) => x.a === clubeId || x.b === clubeId);
      if (!confronto) continue;
      s.fase = f.nome;
      if (confronto.vencedor && confronto.vencedor !== clubeId) {
        s.eliminado = true;
        s.resumo = `Eliminado: ${f.nome}`;
      } else s.resumo = f.nome;
      break;
    }
    if (titulos.get(c) === clubeId) {
      s.campeao = true;
      s.resumo = "Campeão";
    }
    r.push(s);
  }
  return r;
}

function participa(f: ReturnType<typeof fasesDaCompeticao>[number], clubeId: string): boolean {
  return f.tipo === "liga"
    ? f.grupos.some((g) => g.includes(clubeId))
    : f.confrontos.some((x) => x.a === clubeId || x.b === clubeId);
}

/** Semana atual e total de semanas da temporada (para a barra de progresso). */
export function progressoDaTemporada(estado: EstadoJogo): { semana: number; total: number } {
  const t = estado.temporada;
  const total = Math.max(1, semanasDaTemporada(t));
  return { semana: Math.min(t.rodada, total), total };
}

/** Valor de mercado do atleta (€ mi), com a reputação pesando até 6%. */
export function valorDoAtleta(estado: EstadoJogo): number {
  const a = estado.atleta!;
  const j = jogadorDoAtleta(estado);
  const clube = clubeDoAtleta(estado);
  const base = valorDeMercado(j, divisaoDo(estado.temporada, clube.id) ?? "A");
  return base * (1 + ((a.vida.reputacao - 50) / 50) * 0.06) * (1 + ((a.vida.fama - 50) / 50) * 0.1);
}
