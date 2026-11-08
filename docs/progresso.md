# Progresso da expansão

- Concluída: planejamento; etapa 4a (auditoria de fontes de jogadores) — ver `docs/relatorio-cobertura-jogadores.md`.
- Concluída: elencos 2026 (`tools/importar-elencos/`): 12.900 jogadores em 438 clubes; overall FC 26 em 1.727,
  estimado no resto (`overall_fonte`). Nascimento, pé e altura pendentes (`docs/pendencias/jogadores.csv`).
- Concluída: elencos reais no pacote teste-real (130 clubes A–D; 26 da D seguem com `nivel`).
- Próxima: etapa 1 restante (país/UF/cidade dos clubes) e etapa 2 (clubes estaduais).
- `packages/data/packs/teste-real/pacote.json` saiu do git (ignorado); a versão antiga continua no histórico.
- Arquivos alterados: `.gitignore`, `docs/plano-expansao.md`, `docs/progresso.md`, `docs/relatorio-cobertura-jogadores.md`,
  `dados/METADADOS.md`.

## Resultado da auditoria
- Datasets locais em `dados/` (fora do git): `FC26.csv`, `transfermarkt/`, `ogol-cache/`, `auditoria-ogol.json`, `cobertura.json`.
- oGol tem elenco 2026 de todos os 438 clubes do escopo (12.905 jogadores). TM só cobre BRA1/ARG1/COL1 até 06/07/2026.
  FC 26 (baixado da cópia pública no GitHub) cobre ARG/COL e clubes licenciados; a liga brasileira do FC 26 é fictícia.
- Lacuna: 122 clubes pequenos (estaduais/Série D) com menos de 18 jogadores listados.

## Pendências
- Autorização/ritmo para baixar as fichas de jogador do oGol (termos não publicados, "todos os direitos reservados").
- Conferir participantes do Goiano, Mato-Grossense e Sul-Mato-Grossense 2026 (varredura com ruído).
