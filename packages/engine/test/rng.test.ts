import { describe, expect, it } from "vitest";
import { criarRng, hashTexto, poisson, sortearComPeso } from "../src";

describe("rng com semente", () => {
  it("repete a mesma sequência para a mesma semente", () => {
    const a = criarRng(42);
    const b = criarRng(42);
    const sa = Array.from({ length: 50 }, () => a.proximo());
    const sb = Array.from({ length: 50 }, () => b.proximo());
    expect(sa).toEqual(sb);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it("retoma a sequência a partir do estado salvo", () => {
    const a = criarRng(9);
    for (let i = 0; i < 10; i++) a.proximo();
    const b = criarRng(a.estado());
    expect(b.proximo()).toBe(a.proximo());
  });

  it("Poisson tem média próxima de λ", () => {
    const rng = criarRng(1);
    const n = 20000;
    let soma = 0;
    for (let i = 0; i < n; i++) soma += poisson(rng, 1.3);
    expect(soma / n).toBeCloseTo(1.3, 1);
  });

  it("sorteio ponderado respeita os pesos e ignora pesos negativos", () => {
    const rng = criarRng(3);
    const contagem = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 10000; i++) {
      const x = sortearComPeso(rng, ["a", "b", "c"] as const, (k) => ({ a: 3, b: 1, c: -5 })[k]);
      contagem[x]++;
    }
    expect(contagem.c).toBe(0);
    expect(contagem.a / contagem.b).toBeGreaterThan(2.6);
    expect(contagem.a / contagem.b).toBeLessThan(3.4);
  });

  it("hash igual ao do protótipo (FNV-1a)", () => {
    expect(hashTexto("")).toBe(2166136261);
    expect(hashTexto("a")).toBe(0xe40c292c);
  });
});
