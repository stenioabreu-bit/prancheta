# Datasets locais (`dados/`)

Tudo em `dados/` fica fora do git (ver `.gitignore`), exceto este arquivo. Não redistribuir com o jogo sem rever a licença.

## FC26.csv
- Origem: cópia pública em https://github.com/ismailoksuz/EAFC26-DataHub (`data/players.csv`, commit de 2025-12-02),
  que reproduz o Kaggle `rovnez/fc-26-fifa-26-player-data` (versão 3).
- Obtido em: 2026-11-08, download direto sem autenticação. 10.978.051 bytes, SHA-256 `cb46c2a57eff44f3…`.
- Conteúdo: 18.405 jogadores (IDs únicos), 110 colunas, sem linhas malformadas. Versão do jogo FC 26, update 4
  (2025-09-19). Campos: identificação (nome curto/completo, nascimento, nacionalidade, pé, altura), clube/liga,
  overall/potencial e 34 atributos detalhados + 6 agregados.
- Licença: o Kaggle declara CC BY 4.0, "para fins educacionais e de pesquisa"; os dados foram raspados do sofifa.com
  e os atributos são criação da EA. O repositório do GitHub não tem licença. Uso local para referência e conversão;
  não embarcar o CSV nem copiar avaliações.
- Ressalva: os 14 clubes brasileiros (liga 7, "Série A") têm jogadores fictícios (nomes trocados, nascimento 29/02).
  Descartar a liga 7 em qualquer cruzamento.

## transfermarkt/
- Origem: Transfermarkt Datasets (https://github.com/dcaribou/transfermarkt-datasets), arquivos em
  `https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/<tabela>.csv.gz`.
- Obtido em: 2026-11-08. Tabelas: players, clubs, competitions, appearances, transfers, games, player_valuations,
  club_games, game_lineups.
- Dados até 2026-07-06 (atualização pausada). Para ligas de ano civil, a temporada "2025" do Transfermarkt é a de 2026.
- Licença: CC0 1.0 (LICENSE do repositório).

## ogol-cache/ e auditoria-ogol.json
- Origem: https://www.ogol.com.br (ZOS, Lda.). Páginas de competição, edição 2026 e clube; sem fichas de jogador.
- Obtido em: 2026-11-08, 1 requisição a cada 3 s, robots.txt respeitado (só bloqueia `/zzmap_v3.php`).
- Licença: "Todos os direitos reservados"; Termos e Condições não ficam acessíveis no site. Empresa da UE, sujeita ao
  direito sui generis de bases de dados. Uso só para auditoria/consulta; coleta em massa e redistribuição dependem de
  autorização.
