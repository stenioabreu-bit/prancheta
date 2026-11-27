/**
 * Copas europeias (Champions League, Europa League e Conference League) no formato atual da UEFA: fase de
 * liga com 36 clubes e 8 jogos cada (sorteio por potes de `uefa.ts`), playoffs entre 9º e 24º, oitavas com
 * os oito primeiros, quartas, semifinal e final em campo neutro. Os clubes saem das ligas europeias do
 * save (vagas por país, pela tabela da temporada anterior; na primeira, pela força). Usa o mesmo motor
 * das copas continentais ("cont-…"), então serve tanto para o modo jogador quanto para o técnico.
 */
import type { Rng } from "../rng";
import type { FaseContinental, FormatoContinental } from "./continental";
import type { IdCompeticao } from "./tipos";
import { type ClubeUefa, sortearLigaUefa } from "./uefa";

export interface CopaEuropeia {
  id: IdCompeticao;
  nome: string;
  logo: string;
  /** Dias depois da terça da Champions (Europa e Conference jogam na quinta). */
  deslocamento: number;
  /** Final (data do calendário-modelo). */
  final: string;
}

export const COPAS_EUROPEIAS: readonly CopaEuropeia[] = [
  {
    id: "cont-UCL",
    nome: "UEFA Champions League",
    logo: "uefa-champions-league",
    deslocamento: 0,
    final: "2026-09-12",
  },
  {
    id: "cont-UEL",
    nome: "UEFA Europa League",
    logo: "uefa-europa-league",
    deslocamento: 2,
    final: "2026-09-02",
  },
  {
    id: "cont-UECL",
    nome: "UEFA Conference League",
    logo: "uefa-conference-league",
    deslocamento: 2,
    final: "2026-08-27",
  },
];

/**
 * Vagas por país (Champions, Europa League, Conference), pela ordem da tabela. Soma 36 em cada copa:
 * os cinco grandes levam mais vagas na Champions, os outros completam Europa e Conference.
 */
export const VAGAS_EUROPEIAS: Record<string, [number, number, number]> = {
  eng: [5, 3, 2],
  esp: [5, 3, 2],
  ita: [4, 3, 3],
  ger: [4, 3, 3],
  fra: [3, 4, 3],
  por: [3, 4, 4],
  ned: [3, 4, 4],
  bel: [3, 4, 5],
  tur: [3, 4, 5],
  sco: [3, 4, 5],
};

const CLUBES_POR_COPA = 36;

/** Terças da fase de liga e das idas/voltas do mata-mata (calendário-modelo de 2026). */
const DATAS_DA_LIGA = [
  "2026-02-17",
  "2026-03-03",
  "2026-03-17",
  "2026-03-31",
  "2026-04-14",
  "2026-04-28",
  "2026-05-12",
  "2026-05-26",
];
const DATAS_DO_MATA_MATA: Record<string, [string, string]> = {
  Playoffs: ["2026-06-16", "2026-06-23"],
  Oitavas: ["2026-07-07", "2026-07-14"],
  Quartas: ["2026-07-28", "2026-08-04"],
  Semifinal: ["2026-08-11", "2026-08-18"],
};

function somarDias(data: string, n: number): string {
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * Distribui as vagas: `ranking` é a ordem de cada liga (chave do país → ids, do 1º ao último). País
 * ausente cede as vagas para os melhores que sobraram dos outros, pela força.
 */
export function vagasEuropeias(
  ranking: Readonly<Record<string, readonly string[]>>,
  forca: (id: string) => number,
): [string[], string[], string[]] {
  const copas: [string[], string[], string[]] = [[], [], []];
  const usados = new Set<string>();
  for (const [pais, vagas] of Object.entries(VAGAS_EUROPEIAS)) {
    const ordem = ranking[pais];
    if (!ordem) continue;
    let k = 0;
    vagas.forEach((n, copa) => {
      for (let i = 0; i < n && k < ordem.length; i++, k++) {
        copas[copa]!.push(ordem[k]!);
        usados.add(ordem[k]!);
      }
    });
  }
  // Completa cada copa até 36 com os melhores que ficaram de fora (dos países com vaga).
  const sobra = Object.keys(VAGAS_EUROPEIAS)
    .flatMap((p) => ranking[p] ?? [])
    .filter((id) => !usados.has(id))
    .sort((x, y) => forca(y) - forca(x));
  for (const copa of copas) while (copa.length < CLUBES_POR_COPA && sobra.length) copa.push(sobra.shift()!);
  return copas;
}

/** Oito rodadas com adversários diferentes (todos contra todos cortado), se o sorteio por potes falhar. */
function jogosDeReserva(ids: readonly string[]): { jornada: number; casa: string; visitante: string }[] {
  const lista = [...ids];
  const n = lista.length;
  const jogos: { jornada: number; casa: string; visitante: string }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i]!;
      const b = lista[n - 1 - i]!;
      jogos.push(
        r % 2 === 0 ? { jornada: r + 1, casa: a, visitante: b } : { jornada: r + 1, casa: b, visitante: a },
      );
    }
    lista.splice(1, 0, lista.pop()!);
  }
  return jogos;
}

/** Formato de uma copa europeia com os 36 participantes já definidos. */
export function formatoEuropeu(
  copa: CopaEuropeia,
  participantes: readonly ClubeUefa[],
  rng: Rng,
): FormatoContinental {
  let partidas: { jornada: number; casa: string; visitante: string }[];
  try {
    partidas = sortearLigaUefa(participantes, rng).partidas;
  } catch {
    partidas = jogosDeReserva(participantes.map((c) => c.id));
  }
  const d = copa.deslocamento;
  const fase = (nome: string): Pick<FaseContinental, "datas" | "idaEVolta"> => ({
    datas: DATAS_DO_MATA_MATA[nome]!.map((x) => somarDias(x, d)),
    idaEVolta: true,
  });
  const fases: FaseContinental[] = [
    {
      tipo: "liga",
      nome: "Fase de liga",
      grupos: [participantes.map((c) => c.id)],
      jogos: partidas.map((p) => ({
        data: somarDias(DATAS_DA_LIGA[p.jornada - 1]!, d),
        casa: p.casa,
        fora: p.visitante,
      })),
    },
    {
      tipo: "mataMata",
      nome: "Playoffs",
      ...fase("Playoffs"),
      lados: [
        { posicoes: [9, 16], fase: "Fase de liga" },
        { posicoes: [17, 24], fase: "Fase de liga" },
      ],
    },
    {
      tipo: "mataMata",
      nome: "Oitavas",
      ...fase("Oitavas"),
      lados: [{ posicoes: [1, 8], fase: "Fase de liga" }, { vencedoresDe: "Playoffs" }],
    },
    { tipo: "mataMata", nome: "Quartas", ...fase("Quartas") },
    { tipo: "mataMata", nome: "Semifinal", ...fase("Semifinal") },
    { tipo: "mataMata", nome: "Final", datas: [copa.final], neutro: true },
  ];
  return { id: copa.id, nome: copa.nome, logo: copa.logo, fases };
}

/** As três copas, a partir do ranking das ligas europeias. */
export function formatosEuropeus(
  ranking: Readonly<Record<string, readonly string[]>>,
  forca: (id: string) => number,
  rng: Rng,
): FormatoContinental[] {
  const pais = new Map<string, string>();
  for (const [p, ids] of Object.entries(ranking)) for (const id of ids) pais.set(id, p.toUpperCase());
  return vagasEuropeias(ranking, forca)
    .map((ids, i) => ({ ids, copa: COPAS_EUROPEIAS[i]! }))
    .filter(({ ids }) => ids.length === CLUBES_POR_COPA)
    .map(({ ids, copa }) =>
      formatoEuropeu(
        copa,
        ids.map((id) => ({ id, associacao: pais.get(id) ?? "EUR", coeficiente: forca(id) })),
        rng,
      ),
    );
}

export function ehCopaEuropeia(c: string): boolean {
  return COPAS_EUROPEIAS.some((x) => x.id === c);
}
