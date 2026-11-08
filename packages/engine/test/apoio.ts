import { type ClubeDados, type Rng, criarClube, criarRng } from "../src";

/** Série A fictícia mínima para os testes (o motor não depende de nomes reais). */
export function clubesDeTeste(quantidade = 20): ClubeDados[] {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: `clube-${i}`,
    nome: `Clube ${i}`,
    sigla: `C${String(i).padStart(2, "0")}`,
    nivel: 80 - Math.round((i * 14) / Math.max(1, quantidade - 1)),
  }));
}

export function doisClubes(rng: Rng = criarRng(7)) {
  const [a, b] = clubesDeTeste(2);
  return { casa: criarClube(a!, rng), visitante: criarClube(b!, rng), rng };
}
