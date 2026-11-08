/**
 * Gerador de números aleatórios com semente (mulberry32).
 * O estado é um único inteiro de 32 bits, então cabe no save e permite
 * reproduzir uma partida inteira a partir da semente.
 */
export interface Rng {
  /** Número em [0, 1). */
  proximo(): number;
  /** Estado atual, para salvar e retomar a sequência. */
  estado(): number;
}

export function criarRng(semente: number): Rng {
  let s = semente >>> 0;
  return {
    proximo() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    estado() {
      return s;
    },
  };
}

export function inteiroEntre(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng.proximo() * (max - min + 1));
}

export function sortear<T>(rng: Rng, itens: readonly T[]): T {
  return itens[Math.floor(rng.proximo() * itens.length)]!;
}

/** Sorteio ponderado; pesos negativos contam como zero. */
export function sortearComPeso<T>(rng: Rng, itens: readonly T[], peso: (item: T) => number): T {
  let total = 0;
  const pesos = itens.map((item) => {
    const p = Math.max(0, peso(item));
    total += p;
    return p;
  });
  let r = rng.proximo() * total;
  for (let i = 0; i < itens.length; i++) {
    r -= pesos[i]!;
    if (r <= 0) return itens[i]!;
  }
  return itens[itens.length - 1]!;
}

/** Poisson pelo método de Knuth (λ pequeno, que é o caso de gols). */
export function poisson(rng: Rng, lambda: number): number {
  const limite = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.proximo();
  } while (p > limite);
  return k - 1;
}

export function embaralhar<T>(rng: Rng, itens: T[]): T[] {
  for (let i = itens.length - 1; i > 0; i--) {
    const j = Math.floor(rng.proximo() * (i + 1));
    [itens[i], itens[j]] = [itens[j]!, itens[i]!];
  }
  return itens;
}

export function limitar(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Hash FNV-1a de 32 bits, o mesmo do protótipo (atributos derivados do nome). */
export function hashTexto(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
