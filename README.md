# Prancheta

Jogo de técnico de futebol em texto, focado no futebol brasileiro. Web (PWA) primeiro, depois Android/iOS.

## Estrutura

| Pasta | O que tem |
|---|---|
| `packages/engine` | Motor em TypeScript puro (sem DOM): jogador, clube, escalação, partida minuto a minuto, simulação rápida, tabela e calendário. RNG com semente. |
| `packages/data` | Pacotes de dados. O fictício vem no repositório; o de teste com nomes reais fica em `packs/teste-real/`, fora do git. |
| `tools/calibrate` | Simula N temporadas e compara com o protótipo e com a referência do Brasileirão. |
| `apps/web` | Interface React + Vite. O motor roda num Web Worker. |

## Comandos

```bash
npm install
npm test                 # Vitest (unitários + calibração estatística)
npm run typecheck
npm run lint
npm run dev              # app em http://localhost:5173
npm run calibrar -- --temporadas 100 --prototipo <caminho do prancheta.html>
```

## Pacote de teste com nomes reais (uso pessoal)

```bash
npm run importar-prototipo -- <caminho do prancheta.html>
npm run baixar-escudos
```

O primeiro grava `packages/data/packs/teste-real/pacote.json` a partir do protótipo. O segundo baixa para
`packs/teste-real/escudos/<id-do-clube>.png` os escudos listados em `packs/teste-real/escudos-fonte.json`.
Nada disso entra no git: nomes reais e escudos oficiais não podem ser distribuídos com o jogo.
