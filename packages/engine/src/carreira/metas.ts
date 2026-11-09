/**
 * Meta por competição: Série (a meta da temporada), estadual, Copa do Brasil e continentais. A diretoria
 * define pelo tamanho do clube naquela disputa (ranking de força entre os participantes ou divisão).
 */
import { classificacaoDoGrupo } from "../competicao/fases";
import {
  type EstadoTemporada,
  divisaoDo,
  fasesDaCompeticao,
  nomeDaCompeticao,
  proximoJogoDo,
} from "../competicao/temporada";
import type { EstadoFase, IdCompeticao } from "../competicao/tipos";
import { posicaoNaTabela } from "./diretoria";
import type { EstadoCarreira } from "./tipos";

export interface MetaDaCompeticao {
  competicao: IdCompeticao;
  nome: string;
  texto: string;
  /** Situação atual (posição, fase em que está, eliminado, campeão). */
  situacao: string;
  /** true cumprindo, false fora, null ainda indefinido. */
  ok: boolean | null;
}

function participa(f: EstadoFase, id: string): boolean {
  return f.tipo === "liga"
    ? f.grupos.some((g) => g.includes(id))
    : f.confrontos.some((c) => c.a === id || c.b === id);
}

function eliminadoEm(f: EstadoFase, id: string): boolean {
  if (f.tipo !== "mataMata" || !f.encerrada) return false;
  const c = f.confrontos.find((x) => x.a === id || x.b === id);
  return !!c?.vencedor && c.vencedor !== id;
}

/** Meta de mata-mata: chegar à fase `alvo` (nome) ou ser campeão (alvo "titulo"). */
function metaDeMataMata(
  fases: EstadoFase[],
  id: string,
  alvo: string,
  campeao: string | null,
): { situacao: string; ok: boolean | null } {
  if (campeao === id) return { situacao: "Campeão!", ok: true };
  const minhas = fases.filter((f) => participa(f, id));
  const ultima = minhas.at(-1);
  if (!ultima) return { situacao: "Ainda não estreou", ok: null };
  const seguinte = fases[fases.indexOf(ultima) + 1];
  const caiuNoGrupo = ultima.tipo === "liga" && ultima.encerrada && !!seguinte && !participa(seguinte, id);
  const fora = minhas.some((f) => eliminadoEm(f, id)) || caiuNoGrupo;
  const chegou = alvo !== "titulo" && minhas.some((f) => f.nome.toLowerCase().startsWith(alvo.toLowerCase()));
  if (chegou)
    return {
      situacao: fora ? `Eliminado: ${ultima.nome.toLowerCase()}` : `Na ${ultima.nome.toLowerCase()}`,
      ok: true,
    };
  if (fora) return { situacao: `Eliminado: ${ultima.nome.toLowerCase()}`, ok: false };
  return { situacao: `Na ${ultima.nome.toLowerCase()}`, ok: null };
}

function rankDeForca(estado: EstadoTemporada, ids: string[], id: string): number {
  return (
    ids
      .slice()
      .sort((a, b) => (estado.clubes[b]?.forca ?? 0) - (estado.clubes[a]?.forca ?? 0))
      .indexOf(id) + 1
  );
}

export function metasDaTemporada(estado: EstadoTemporada, carreira: EstadoCarreira): MetaDaCompeticao[] {
  const id = carreira.clubeId;
  if (!id) return [];
  const saida: MetaDaCompeticao[] = [];
  const d = divisaoDo(estado, id);
  for (const [uf, est] of Object.entries(estado.estaduais ?? {})) {
    if (!est.clubes.includes(id)) continue;
    const c = `est-${uf}` as IdCompeticao;
    const r = rankDeForca(estado, est.clubes, id);
    const [texto, alvo] =
      r === 1
        ? ["Ser campeão estadual", "titulo"]
        : r <= 4
          ? ["Chegar à semifinal", "Semi"]
          : r <= 8
            ? ["Chegar às quartas de final", "Quartas"]
            : ["Fazer boa campanha na 1ª fase", ""];
    const m = alvo
      ? metaDeMataMata(est.fases, id, alvo, est.campeao)
      : { situacao: est.fases[0] ? `${posicaoNoGrupo(est.fases[0], id)}` : "—", ok: null };
    saida.push({ competicao: c, nome: nomeDaCompeticao(estado, c), texto, ...m });
  }
  if (d) {
    const pos = posicaoNaTabela(estado, id);
    saida.push({
      competicao: d,
      nome: nomeDaCompeticao(estado, d),
      texto: carreira.meta.texto,
      situacao: pos ? `${pos}º` : "—",
      ok: pos === null || estado.rodada < 5 ? null : pos <= carreira.meta.posicao,
    });
  }
  if (
    !estado.semCopa &&
    (Object.values(estado.copa.entram).some((l) => l.includes(id)) ||
      estado.copa.fases.some((f) => participa(f, id)))
  ) {
    const grande =
      rankDeForca(
        estado,
        Object.keys(estado.clubes).filter((x) => divisaoDo(estado, x) === "A"),
        id,
      ) <= 6;
    const [texto, alvo] =
      d === "A"
        ? grande
          ? ["Chegar às quartas de final", "Quartas"]
          : ["Chegar às oitavas de final", "Oitavas"]
        : d === "B"
          ? ["Chegar à 5ª fase", "5ª"]
          : ["Chegar à 3ª fase", "3ª"];
    saida.push({
      competicao: "copa",
      nome: "Copa do Brasil",
      texto,
      ...metaDeMataMata(estado.copa.fases, id, alvo, estado.copa.campeao),
    });
  }
  for (const [c, est] of Object.entries(estado.continentais ?? {})) {
    const fases = fasesDaCompeticao(estado, c as IdCompeticao);
    const entra = (estado.formatosContinentais ?? [])
      .find((f) => f.id === c)
      ?.fases.some((f) => [...(f.pares ?? []).flat(), ...(f.grupos ?? []).flat()].includes(id));
    if (!entra && !fases.some((f) => participa(f, id))) continue;
    const lib = c === "cont-LIB";
    const forte = d === "A" && rankDeForca(estado, estado.divisoes.A.clubes, id) <= 6;
    const [texto, alvo] = lib
      ? forte
        ? ["Chegar às quartas de final", "Quartas"]
        : ["Passar da fase de grupos", "Oitavas"]
      : ["Chegar às oitavas de final", "Oitavas"];
    saida.push({
      competicao: c as IdCompeticao,
      nome: nomeDaCompeticao(estado, c as IdCompeticao),
      texto,
      ...metaDeMataMata(fases, id, alvo, est.campeao),
    });
  }
  return saida;
}

function posicaoNoGrupo(f: EstadoFase, id: string): string {
  if (f.tipo !== "liga") return "—";
  const g = f.grupos.findIndex((x) => x.includes(id));
  if (g < 0) return "—";
  const pos = classificacaoDoGrupo(f, g).indexOf(id) + 1;
  return pos
    ? `${pos}º ${f.grupos.length > 1 ? `no grupo ${String.fromCharCode(65 + g)}` : "na 1ª fase"}`
    : "—";
}

/** Competição do próximo jogo do clube (a que está "em jogo" agora). */
export function competicaoDoMomento(estado: EstadoTemporada, carreira: EstadoCarreira): IdCompeticao | null {
  if (!carreira.clubeId) return null;
  return proximoJogoDo(estado, carreira.clubeId)?.competicao ?? null;
}
