# Progresso da expansão

- Concluída: planejamento (`docs/plano-expansao.md`); teste de viabilidade do Transfermarkt Datasets.
- Atual: decisão sobre a fonte de jogadores fora da Série A, Argentina e Colômbia (ver pendências).
- Próxima: etapa 1 — estrutura de dados de clubes e países.
- Arquivos alterados: `docs/plano-expansao.md`, `docs/progresso.md`.

## Resultado da viabilidade
- Transfermarkt Datasets: licença CC0, download direto sem login
  (`https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/players.csv.gz`, `.../clubs.csv.gz`).
  Dados até 06/07/2026 (atualização pausada). 50.149 jogadores.
- Ligas sul-americanas cobertas: só BRA1 (Série A, ~706 jogadores), ARG1 (~954) e COL1.
  Faltam Séries B–D, estaduais, Chile, Equador, Paraguai, Peru, Uruguai, Bolívia e Venezuela.
- EA FC 26 (Kaggle): a busca não abre sem navegador/login; download exige conta e API key do Kaggle.

## Pendências
- Fonte para jogadores das ligas não cobertas (Transfermarkt site bloqueia robô).
- Credencial do Kaggle (kaggle.json) para baixar o FC 26, ou o usuário baixa o CSV manualmente.
