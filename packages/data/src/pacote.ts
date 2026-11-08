import type { ClubeDados } from "@prancheta/engine";

export type Divisao = "A" | "B" | "C" | "D";

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
  temporada: number;
  divisoes: Partial<Record<Divisao, ClubeDados[]>>;
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
