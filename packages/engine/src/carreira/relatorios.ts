import { jogadorDoClube } from "../clube";
import type { EstadoTemporada } from "../competicao/temporada";
import type { Divisao } from "../competicao/tipos";
import type { Clube, Estilo, Jogador } from "../tipos";

const DESCRICAO_DO_ESTILO: Record<Estilo, string> = {
  equilibrado: "Time equilibrado, sem grandes riscos.",
  posse: "Gosta de ficar com a bola e pressionar no campo de ataque.",
  intenso: "Pressão alta e muita intensidade, cansa rápido.",
  ofensivo: "Ataca com muita gente, deixa espaço atrás.",
  defensivo: "Fecha a casinha e espera o erro.",
  "contra-ataque": "Recua e sai em velocidade nos contra-ataques.",
};

export type Resultado = "V" | "E" | "D";

/** Últimos resultados do clube em qualquer competição (mais antigo primeiro). */
export function formaRecente(estado: EstadoTemporada, clubeId: string, quantidade = 5): Resultado[] {
  return Object.values(estado.jogos)
    .filter((j) => j.placar && (j.casa === clubeId || j.visitante === clubeId))
    .sort((a, b) => a.rodada - b.rodada || Number(b.meioDeSemana) - Number(a.meioDeSemana))
    .slice(-quantidade)
    .map((j) => {
      const [c, v] = j.placar!;
      const pro = j.casa === clubeId ? c : v;
      const contra = j.casa === clubeId ? v : c;
      return pro > contra ? "V" : pro === contra ? "E" : "D";
    });
}

export interface RelatorioDoAdversario {
  esquema: string;
  estilo: string;
  destaque: string;
  maisRapido: string | null;
  forca: "muito forte" | "forte" | "do mesmo nível" | "mais fraco";
  forma: Resultado[];
}

export function relatorioDoAdversario(
  estado: EstadoTemporada,
  clubeId: string,
  meuClubeId: string | null,
): RelatorioDoAdversario {
  const clube = estado.clubes[clubeId]!;
  const titulares = clube.titulares.map((id) => jogadorDoClube(clube, id));
  const destaque = titulares.slice().sort((a, b) => b.ovr - a.ovr)[0]!;
  const rapido = titulares
    .filter((j) => ["PD", "PE", "ATA"].includes(j.pos))
    .sort((a, b) => b.at.VEL - a.at.VEL)[0];
  const minha = meuClubeId ? estado.clubes[meuClubeId]!.forca : clube.forca;
  const d = clube.forca - minha;
  return {
    esquema: clube.esquema,
    estilo: DESCRICAO_DO_ESTILO[clube.estilo],
    destaque: destaque.nome,
    maisRapido: rapido?.nome ?? null,
    forca: d >= 3 ? "muito forte" : d >= 1 ? "forte" : d > -1.5 ? "do mesmo nível" : "mais fraco",
    forma: formaRecente(estado, clubeId),
  };
}

export interface LinhaDeRanking {
  jogador: Jogador;
  clube: Clube;
  valor: number;
  jogos: number;
}

export type TipoDeRanking = "gols" | "assistencias" | "goleiros" | "notas";

/**
 * Rankings da divisão na temporada (inclui os jogos simulados, pelas estatísticas
 * rápidas). Goleiros: menos gols sofridos por jogo, com pelo menos 1/3 dos jogos da rodada.
 */
export function ranking(
  estado: EstadoTemporada,
  divisao: Divisao,
  tipo: TipoDeRanking,
  limite = 20,
): LinhaDeRanking[] {
  const minimoDeJogos = Math.max(1, Math.floor(estado.rodada / 3));
  const linhas: LinhaDeRanking[] = [];
  for (const id of estado.divisoes[divisao].clubes) {
    const clube = estado.clubes[id]!;
    for (const j of clube.jogadores) {
      const t = j.temporada;
      if (tipo === "gols" && t.gols > 0) linhas.push({ jogador: j, clube, valor: t.gols, jogos: t.jogos });
      if (tipo === "assistencias" && t.assist > 0)
        linhas.push({ jogador: j, clube, valor: t.assist, jogos: t.jogos });
      if (tipo === "goleiros" && t.jogosNoGol >= minimoDeJogos) {
        linhas.push({ jogador: j, clube, valor: t.golsSofridos / t.jogosNoGol, jogos: t.jogosNoGol });
      }
      if (tipo === "notas" && t.qtdNotas >= minimoDeJogos) {
        linhas.push({ jogador: j, clube, valor: t.somaNotas / t.qtdNotas, jogos: t.qtdNotas });
      }
    }
  }
  const crescente = tipo === "goleiros";
  return linhas
    .sort((a, b) => (crescente ? a.valor - b.valor : b.valor - a.valor) || b.jogos - a.jogos)
    .slice(0, limite);
}

/** Todos os rankings existem em qualquer competição (números guardados por competição). */
export function rankingsDaCompeticao(_competicao: string): TipoDeRanking[] {
  return ["gols", "assistencias", "goleiros", "notas"];
}

/** Ranking de uma competição só com os jogos dela (sem misturar estadual, Série, Copa e continentais). */
export function rankingDaCompeticao(
  estado: EstadoTemporada,
  competicao: string,
  tipo: TipoDeRanking,
  limite = 20,
): LinhaDeRanking[] {
  const ids = new Set<string>();
  for (const j of Object.values(estado.jogos)) {
    if (j.competicao !== competicao) continue;
    ids.add(j.casa);
    ids.add(j.visitante);
  }
  const jogosDoClube = new Map<string, number>();
  for (const j of Object.values(estado.jogos)) {
    if (j.competicao !== competicao || !j.placar) continue;
    for (const c of [j.casa, j.visitante]) jogosDoClube.set(c, (jogosDoClube.get(c) ?? 0) + 1);
  }
  const linhas: LinhaDeRanking[] = [];
  for (const id of ids) {
    const clube = estado.clubes[id];
    if (!clube) continue;
    const minimo = Math.max(1, Math.floor((jogosDoClube.get(id) ?? 0) / 3));
    for (const j of clube.jogadores) {
      const pc = j.temporada.porCompeticao?.[competicao];
      if (!pc) continue;
      if (tipo === "gols" && pc.gols > 0) linhas.push({ jogador: j, clube, valor: pc.gols, jogos: pc.jogos });
      if (tipo === "assistencias" && pc.assist > 0)
        linhas.push({ jogador: j, clube, valor: pc.assist, jogos: pc.jogos });
      if (tipo === "goleiros" && (pc.jogosNoGol ?? 0) >= minimo)
        linhas.push({
          jogador: j,
          clube,
          valor: (pc.golsSofridos ?? 0) / pc.jogosNoGol!,
          jogos: pc.jogosNoGol!,
        });
      if (tipo === "notas" && (pc.qtdNotas ?? 0) >= minimo)
        linhas.push({ jogador: j, clube, valor: pc.somaNotas! / pc.qtdNotas!, jogos: pc.qtdNotas! });
    }
  }
  const crescente = tipo === "goleiros";
  return linhas
    .sort((a, b) => (crescente ? a.valor - b.valor : b.valor - a.valor) || b.jogos - a.jogos)
    .slice(0, limite);
}
