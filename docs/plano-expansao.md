# Plano de expansão — universo sul-americano 2026

Fonte do pedido: planejamento do usuário (2026-11-08). Este arquivo é a referência; não refazer auditoria.

## Decisões
- Temporada base: 2026. Temporadas seguintes evoluem sozinhas (acesso, rebaixamento, força, idade).
- Brasil: Séries A–D (já existem) + 27 estaduais (1ª divisão estadual de 2026, regulamentos reais).
- Exterior: só a 1ª divisão de ARG, BOL, CHI, COL, EQU, PAR, PER, URU, VEN, jogável. Sem divisões inferiores; rebaixado fica no banco, fora de competição.
- Continentais: Pré-Libertadores (3 fases ida/volta), Libertadores (32 em 8 grupos; 1º/2º oitavas, 3º playoff da Sul-Americana), Sul-Americana (1ª fase nacional em jogo único, 32 em grupos, líder oitavas, 2º playoff contra 3º da Libertadores). Oitavas–semis ida e volta, final única. Participantes de 2026 = os grupos reais (lista no pedido original); depois, vagas automáticas.
- Jogadores: reais na base inicial. Nomes/datas/posições/nacionalidade/clube do Transfermarkt Datasets; atributos convertidos do EA FC 26 (Kaggle) para a escala do jogo. Sem correspondência → pendente (não inventar). Geração procedural só para novas gerações.
- Escudos: https://escudosfc.com.br/samerica.htm, associados por ID permanente (nunca só por nome). Faltou → pendência.
- Checar licença de cada dataset antes de incorporar arquivos ao repositório.

## Arquitetura atual (resumo da auditoria)
- Temporada: `engine/src/competicao/temporada.ts`; competições declarativas em `formatos2026.ts`, fases em `fases.ts`/`divisao.ts`, Copa do Brasil em `copa.ts`.
- Calendário: 38 rodadas × (fim de semana + meio de semana). Não suporta várias competições no meio de semana → migrar para slots de data com checagem de conflito por clube (preservando Brasileirão e Copa do Brasil).
- Clubes: `ClubeDados` sem UF/país/cidade; jogadores no formato `[nome, pos, ovr, extras]`.
- Histórico: só campeões/acesso por temporada; estatísticas zeradas na virada.

## Etapas (uma por sessão, cada uma testada)
1. Estrutura de dados: país, UF, cidade, nome de exibição, ID permanente no `ClubeDados`; jogador com nascimento, nacionalidade, pé, potencial.
2. Clubes estaduais brasileiros 2026 (importador em lote).
3. Clubes das 1ªs divisões estrangeiras + participantes continentais 2026.
4. Jogadores reais: importador Transfermarkt + FC 26 com conversão de atributos; pendências em `docs/pendencias/jogadores.csv`.
5. Escudos (escudosfc) por ID; pendências em `docs/pendencias/escudos.csv`.
6. Calendário em slots de data, sem conflito por clube, com pré-temporada.
7. Estaduais (formatos declarativos).
8. Ligas estrangeiras.
9. Libertadores + Pré-Libertadores.
10. Sul-Americana.
11. Classificação continental automática com redistribuição de vagas.
12. Evolução de clubes, jogadores (idade, aposentadoria) e divisões.
13. Histórico por competição (campeão, vice, artilheiro, assistências, classificação, vagas).
14. Testes de várias temporadas.

## Regras
Reaproveitar o motor de fases; formatos em configuração; não remover nada; não criar clubes fictícios; dados pesquisados uma vez e salvos em arquivos estruturados; respostas e relatórios curtos.
