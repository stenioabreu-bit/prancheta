import type { ClubeDados, Divisao } from "@prancheta/engine";

export type { Divisao };

/**
 * Pacote de dados: tudo que é nome, cor e elenco fica aqui, fora do motor.
 * O jogo vem com um pacote fictício; o jogador pode montar ou importar o seu.
 *
 * Escudos: se o pacote estiver numa pasta, `escudos/<id-do-clube>.png` (ou .svg)
 * substitui o distintivo genérico. O jogo nunca traz escudos oficiais.
 */
export interface PacoteDados {
  formato: 1;
  id: string;
  nome: string;
  /** Pacote só com nomes e clubes inventados (pode ser distribuído). */
  ficticio: boolean;
  /** Ano da primeira temporada. */
  temporada: number;
  /** Clubes de cada série, do mais forte ao mais fraco na lista de entrada (a D também define os grupos). */
  divisoes: Record<Divisao, ClubeDados[]>;
  /** Clubes com vaga direta na 3ª fase da Copa do Brasil da primeira temporada (até 4). */
  vagasDiretasCopa: string[];
}

/** Id estável de clube a partir do nome: "Atlético-MG" → "atletico-mg". */
export function idDoClube(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
