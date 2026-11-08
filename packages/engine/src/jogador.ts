import { MODELO_POSICAO, compatibilidade } from "./constantes";
import { hashTexto, limitar } from "./rng";
import {
  ATRIBUTOS,
  type Atributo,
  type Atributos,
  type Jogador,
  type Personalidade,
  type Posicao,
} from "./tipos";

/** Atributos e extras opcionais de um jogador no pacote de dados. */
export type ExtrasJogador = Partial<Record<Atributo, number>> & {
  alt?: Posicao[];
  perso?: Personalidade;
  /** Id permanente da base real (ex.: "og257494", do oGol). */
  id?: string;
  /** Nacionalidade, idade e potencial na temporada do pacote. */
  nac?: string;
  idade?: number;
  pot?: number;
  /** Origem do overall: "fc26", "pacote" ou estimado ("estimado-valor" | "estimado-clube" | "estimado-nivel"). */
  fonte?: string;
};

/** Formato compacto do pacote de dados: ["Nome", "POS", OVR, { extras }]. */
export type JogadorDados = readonly [string, Posicao, number, ExtrasJogador?];

const PERSONALIDADE_PADRAO: readonly Personalidade[] = [
  "profissional",
  "tranquilo",
  "profissional",
  "temperamental",
  "veterano",
  "tranquilo",
];

export function estatisticasZeradas(): Jogador["temporada"] {
  return {
    jogos: 0,
    gols: 0,
    assist: 0,
    somaNotas: 0,
    qtdNotas: 0,
    golsSofridos: 0,
    jogosNoGol: 0,
    semSofrer: 0,
    golsCopa: 0,
  };
}

/**
 * Monta o jogador a partir do pacote de dados. Atributos não informados saem
 * do overall + modelo da posição + uma variação fixa derivada do nome (−3 a +4),
 * então o mesmo jogador tem sempre os mesmos atributos.
 */
export function criarJogador(dados: JogadorDados, clubeId: string, indice: number): Jogador {
  const [nome, pos, ovr, extras = {}] = dados;
  const h = hashTexto(nome + clubeId);
  const at = {} as Atributos;
  ATRIBUTOS.forEach((a, i) => {
    const variacao = ((h >>> (i * 3)) & 7) - 3;
    const informado = extras[a];
    at[a] = limitar(informado ?? Math.round(ovr + MODELO_POSICAO[pos][a] + variacao), 20, 95);
  });
  return {
    id: `${clubeId}_${indice}`,
    nome,
    pos,
    ovr,
    alt: extras.alt ?? [],
    perso: extras.perso ?? PERSONALIDADE_PADRAO[h % 6]!,
    at,
    cond: 100,
    moral: 62,
    lesao: 0,
    recemLesionado: false,
    susp: 0,
    cumprindoSuspensao: false,
    amarelos: 0,
    semJogar: 0,
    notas: [],
    temporada: estatisticasZeradas(),
  };
}

/** Rendimento do jogador no posto (1 na posição de origem, 0,97 nas alternativas). */
export function familiaridade(j: Jogador, posto: Posicao): number {
  if (j.pos === posto) return 1;
  if (j.alt.includes(posto)) return 0.97;
  return compatibilidade(j.pos, posto);
}

export function disponivel(j: Jogador): boolean {
  return j.lesao === 0 && j.susp === 0;
}
