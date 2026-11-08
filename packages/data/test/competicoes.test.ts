import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALIAS_DE_COMPETICAO, COMPETICOES, ID_DA_COMPETICAO_DO_MOTOR } from "../src/competicoes";

const PASTA = join(__dirname, "../../../apps/web/public/assets/logos/competicoes");
const manifesto = JSON.parse(readFileSync(join(PASTA, "manifest.json"), "utf8")) as {
  aliases: Record<string, string>;
  competicoes: { id: string; arquivo: string | null; sha256?: string; status: string }[];
};

describe("catálogo de competições e logos", () => {
  it("IDs permanentes únicos", () => {
    const ids = COMPETICOES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("manifesto cobre exatamente o catálogo", () => {
    expect(manifesto.competicoes.map((c) => c.id).sort()).toEqual(COMPETICOES.map((c) => c.id).sort());
    expect(manifesto.aliases).toEqual(ALIAS_DE_COMPETICAO);
  });

  it("competições do motor apontam para IDs do catálogo", () => {
    for (const id of Object.values(ID_DA_COMPETICAO_DO_MOTOR)) {
      expect(COMPETICOES.some((c) => c.id === id)).toBe(true);
    }
  });

  it("arquivos existem, batem com o hash e não se repetem; pendentes não têm arquivo", () => {
    const hashes = new Set<string>();
    for (const c of manifesto.competicoes) {
      if (c.status === "pendente") {
        expect(c.arquivo).toBeNull();
        continue;
      }
      const caminho = join(PASTA, c.arquivo!);
      expect(existsSync(caminho), c.id).toBe(true);
      const hash = createHash("sha256").update(readFileSync(caminho)).digest("hex");
      expect(hash, c.id).toBe(c.sha256);
      expect(hashes.has(hash), c.id).toBe(false);
      hashes.add(hash);
      expect(c.arquivo!.endsWith(`/${c.id}.${c.arquivo!.split(".").pop()}`), c.id).toBe(true);
    }
  });
});
