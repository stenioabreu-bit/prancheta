/**
 * Baixa os escudos listados em <pacote>/escudos-fonte.json para <pacote>/escudos/<id>.png.
 * Serve para o jogador montar o próprio pacote: o jogo nunca vem com escudos oficiais.
 *
 * escudos-fonte.json: { "baseUrl": "https://.../{id}...", "clubes": { "<id-do-clube>": "<id na fonte>" } }
 *
 * Uso: npm run baixar-escudos -- [pasta do pacote]   (padrão: packs/teste-real)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PASTA_TESTE_REAL, lerPacote } from "../src/node";

interface FonteDeEscudos {
  baseUrl: string;
  clubes: Record<string, string>;
}

const pasta = process.argv[2] ?? PASTA_TESTE_REAL;
const pacote = lerPacote(pasta);
if (!pacote) throw new Error(`Sem pacote.json em ${pasta}`);
const fonte = JSON.parse(readFileSync(join(pasta, "escudos-fonte.json"), "utf8")) as FonteDeEscudos;
const idsDoPacote = new Set(Object.values(pacote.divisoes).flatMap((d) => d.map((c) => c.id)));
const desconhecidos = Object.keys(fonte.clubes).filter((id) => !idsDoPacote.has(id));
if (desconhecidos.length) throw new Error(`Clubes fora do pacote: ${desconhecidos.join(", ")}`);

const destino = join(pasta, "escudos");
mkdirSync(destino, { recursive: true });
const falhas: string[] = [];
let baixados = 0;
for (const [clube, idFonte] of Object.entries(fonte.clubes)) {
  const arquivo = join(destino, `${clube}.png`);
  if (existsSync(arquivo)) continue;
  const resposta = await fetch(fonte.baseUrl.replace("{id}", idFonte));
  const tipo = resposta.headers.get("content-type") ?? "";
  if (!resposta.ok || !tipo.startsWith("image/png")) {
    falhas.push(`${clube} (HTTP ${resposta.status}, ${tipo})`);
    continue;
  }
  writeFileSync(arquivo, Buffer.from(await resposta.arrayBuffer()));
  baixados++;
  await new Promise((r) => setTimeout(r, 300));
}
process.stdout.write(
  `${baixados} escudos baixados em ${destino}.${falhas.length ? ` Falharam: ${falhas.join("; ")}` : ""}\n`,
);
