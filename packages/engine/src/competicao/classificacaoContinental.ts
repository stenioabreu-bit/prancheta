/**
 * Classificação para as copas continentais do ano seguinte (2027 em diante).
 *
 * Vagas brasileiras pelo resultado da temporada, na ordem de prioridade: campeão da Libertadores, campeão da
 * Sul-Americana, campeão da Copa do Brasil e a classificação da Série A (redistribuição: quem já tem vaga
 * libera a sua para o próximo da tabela). Mesma quantidade de vagas por fase que em 2026: 6 nos grupos da
 * Libertadores, 2 na Fase 2 e 6 nos grupos da Sul-Americana.
 *
 * Clubes estrangeiros: as ligas deles não são simuladas no save do Brasileirão, então mantêm as vagas de
 * 2026; campeão continental estrangeiro entra nos grupos da Libertadores no lugar do último estrangeiro.
 * Os confrontos e grupos são sorteados de novo; as datas seguem as de 2026.
 */
import { rodadasTodosContraTodos } from "../liga";
import { type Rng, embaralhar } from "../rng";
import type { FaseContinental, FormatoContinental } from "./continental";

export interface ResultadoParaVagas {
  /** Classificação final da Série A (1º ao 20º). */
  serieA: string[];
  campeaoCopa: string | null;
  campeaoLibertadores: string | null;
  campeaoSulAmericana: string | null;
  /** Clubes brasileiros (Séries A–D). */
  brasileiros: ReadonlySet<string>;
}

const diretos = (ids: readonly string[]) => ids.filter((x) => !x.includes(":"));

function entradas(f: FaseContinental): string[] {
  return diretos([...(f.pares ?? []).flat(), ...(f.grupos ?? []).flat()]);
}

/** Pares sorteados: cada placeholder (vencedor de fase anterior) enfrenta um direto quando possível. */
function sortearPares(rng: Rng, ids: string[]): [string, string][] {
  const ph = embaralhar(
    rng,
    ids.filter((x) => x.includes(":")),
  );
  const d = embaralhar(
    rng,
    ids.filter((x) => !x.includes(":")),
  );
  const fila = [...ph.flatMap((p) => [p, d.shift()!].filter(Boolean)), ...d];
  const pares: [string, string][] = [];
  for (let i = 0; i + 1 < fila.length; i += 2) pares.push([fila[i]!, fila[i + 1]!]);
  return pares;
}

/** 8 grupos de 4: potes na ordem dada (diretos primeiro, placeholders por último). */
function sortearGrupos(rng: Rng, ids: string[]): string[][] {
  const grupos: string[][] = Array.from({ length: 8 }, () => []);
  for (let pote = 0; pote < 4; pote++) {
    const doPote = embaralhar(rng, ids.slice(pote * 8, pote * 8 + 8));
    doPote.forEach((id, g) => grupos[g]!.push(id));
  }
  return grupos;
}

/** Datas das 6 rodadas de grupo, tiradas do primeiro grupo da base. */
function datasDasRodadas(base: FaseContinental): string[] {
  const g0 = new Set(base.grupos?.[0] ?? []);
  const datas = (base.jogos ?? [])
    .filter((j) => g0.has(j.casa))
    .map((j) => j.data)
    .sort();
  const rodadas: string[] = [];
  for (let i = 0; i < datas.length; i += 2) rodadas.push(datas[i]!);
  return rodadas.slice(0, 6);
}

function jogosDosGrupos(grupos: string[][], datas: string[]) {
  const jogos: { data: string; casa: string; fora: string }[] = [];
  for (const g of grupos) {
    const turno = rodadasTodosContraTodos(g);
    const todas = turno.concat(turno.map((r) => r.map((j) => ({ casa: j.visitante, visitante: j.casa }))));
    todas.forEach((rodada, r) => {
      for (const j of rodada)
        jogos.push({ data: datas[r] ?? datas.at(-1)!, casa: j.casa, fora: j.visitante });
    });
  }
  return jogos.sort((a, b) => a.data.localeCompare(b.data));
}

export function proximasContinentais(
  base: readonly FormatoContinental[],
  r: ResultadoParaVagas,
  rng: Rng,
): FormatoContinental[] {
  const lib = base.find((f) => f.id === "cont-LIB");
  const sul = base.find((f) => f.id === "cont-SUL");
  if (!lib || !sul) return base.slice();
  const fase = (f: FormatoContinental, nome: string) => f.fases.find((x) => x.nome === nome)!;
  const br = (id: string) => r.brasileiros.has(id);

  // Estrangeiros por fase (vagas de 2026).
  const libF1 = entradas(fase(lib, "Fase 1")).filter((x) => !br(x));
  const libF2 = entradas(fase(lib, "Fase 2")).filter((x) => !br(x));
  const libG = entradas(fase(lib, "Fase de grupos")).filter((x) => !br(x));
  const sulF1 = entradas(fase(sul, "1ª fase")).filter((x) => !br(x));
  const sulG = entradas(fase(sul, "Fase de grupos")).filter((x) => !br(x));

  // Campeões continentais estrangeiros vão direto aos grupos da Libertadores.
  for (const c of [r.campeaoLibertadores, r.campeaoSulAmericana]) {
    if (!c || br(c) || libG.includes(c)) continue;
    const saiu = libG.pop()!;
    libG.push(c);
    // Troca de lugar com quem saiu dos grupos (mesmo número de vagas em cada fase).
    for (const l of [libF1, libF2, sulF1, sulG]) {
      const i = l.indexOf(c);
      if (i >= 0) l.splice(i, 1, saiu);
    }
  }

  // Brasileiros: campeões primeiro, depois a tabela da Série A (redistribuição automática).
  const fila = [r.campeaoLibertadores, r.campeaoSulAmericana, r.campeaoCopa, ...r.serieA].filter(
    (x, i, a): x is string => !!x && br(x) && a.indexOf(x) === i,
  );
  const vagasBR = {
    libG: entradas(fase(lib, "Fase de grupos")).filter(br).length,
    libF2: entradas(fase(lib, "Fase 2")).filter(br).length,
    sulG: entradas(fase(sul, "Fase de grupos")).filter(br).length,
  };
  const brLibG = fila.splice(0, vagasBR.libG);
  const brLibF2 = fila.splice(0, vagasBR.libF2);
  const brSulG = fila.splice(0, vagasBR.sulG);

  const novaLib: FormatoContinental = {
    ...lib,
    fases: lib.fases.map((f) => {
      if (f.nome === "Fase 1") return { ...f, pares: sortearPares(rng, libF1) };
      if (f.nome === "Fase 2")
        return {
          ...f,
          pares: sortearPares(rng, [...libF2, ...brLibF2, ...[0, 1, 2].map((i) => `VENC:Fase 1:${i}`)]),
        };
      if (f.nome === "Fase 3")
        return {
          ...f,
          pares: sortearPares(
            rng,
            Array.from({ length: 8 }, (_, i) => `VENC:Fase 2:${i}`),
          ),
        };
      if (f.nome === "Fase de grupos") {
        const grupos = sortearGrupos(rng, [
          ...brLibG,
          ...libG,
          ...[0, 1, 2, 3].map((i) => `VENC:Fase 3:${i}`),
        ]);
        return { ...f, grupos, jogos: jogosDosGrupos(grupos, datasDasRodadas(f)) };
      }
      return f;
    }),
  };
  const novaSul: FormatoContinental = {
    ...sul,
    fases: sul.fases.map((f) => {
      if (f.nome === "1ª fase") return { ...f, pares: sortearPares(rng, sulF1) };
      if (f.nome === "Fase de grupos") {
        const ids = [
          ...brSulG,
          ...sulG,
          ...Array.from({ length: 16 }, (_, i) => `VENC:1ª fase:${i}`),
          ...[0, 1, 2, 3].map((i) => `PERD:cont-LIB:Fase 3:${i}`),
        ];
        const grupos = sortearGrupos(rng, ids);
        return { ...f, grupos, jogos: jogosDosGrupos(grupos, datasDasRodadas(f)) };
      }
      return f;
    }),
  };
  return [novaLib, novaSul];
}
