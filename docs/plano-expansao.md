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

## Etapa 4a — auditoria de fontes de jogadores (pedido de 2026-11-08)
Ordem: FC 26 → Transfermarkt completo → oGol/oficiais em amostra → comparação com o escopo → relatório → importador.
- [x] FC 26 baixado e validado (`dados/FC26.csv`, metadados em `dados/METADADOS.md`).
- [x] Transfermarkt completo auditado: só BRA1, ARG1 e COL1 na América do Sul; sem Libertadores/Sul-Americana.
- [x] Amostra oGol: elencos 2026 em todos os países testados, incluindo clube só de estadual. BID/CBF: captcha.
- [x] Varredura do escopo no oGol: 438 clubes, 12.905 jogadores 2026; cruzamento TM × FC 26 (`dados/cobertura.json`).
- [x] `docs/relatorio-cobertura-jogadores.md` (122 clubes com elenco < 18).
- [x] Importador (sem requisições): `tools/importar-elencos/importar.py` → `dados/elencos-2026.json`,
  `docs/pendencias/jogadores.csv`, `docs/pendencias/clubes.csv`. 12.900 jogadores em 438 clubes; overall do FC 26 em
  1.727 (1.026 confirmados, 701 prováveis). Nascimento/pé/altura pendentes para todos (fichas não baixadas, decisão do usuário).
- [x] Overall estimado para os 11.173 sem FC 26 (`tools/importar-elencos/estimar.py`, campo `overall_fonte`):
  valor de mercado do oGol + idade (2.611; erro médio 2,2 no ajuste), mediana do clube (4.364), degrau da divisão
  (4.198; A 72, B 69, C 65, D 61, estaduais 57). Posição detalhada só para quem tem FC 26; o resto pelo grupo.
- [x] Elencos no pacote (`tools/importar-elencos/levar-para-pacote.py`): 130 clubes A–D com elenco real; jogador com
  `id` permanente, `nac`, `idade`, `pot`, `fonte` (tipo `ExtrasJogador`) e atributos convertidos do FC 26. 26 clubes da D
  com < 16 jogadores listados seguem com `nivel` (`docs/pendencias/clubes-sem-elenco-no-pacote.csv`).
  Backup: `packs/teste-real/pacote.antes-elencos-2026.json`. Teste `packages/data/test/teste-real.test.ts`.
- [ ] Etapa 1 restante: país/UF/cidade no `ClubeDados`; nascimento e pé quando as fichas forem baixadas.
- [ ] Ivinhema (oGol, Série D 2026) × Pantanal (pacote): conferir qual está certo.
- Proposta anterior do importador:
  Proposta: elenco = oGol (ID oGol como chave externa); nascimento/posição/pé/altura da ficha oGol; TM só para
  conferir e completar; atributos convertidos do FC 26 só com casamento por nascimento + nome; sem casamento →
  atributos pendentes em `docs/pendencias/jogadores.csv`. ID permanente do jogador gerado uma vez e mapeado a
  `ogol_id`/`tm_id`/`fc_id`.

## Logos das competições (pedido de 2026-11-08)
- [x] Catálogo de 43 competições com IDs permanentes: `packages/data/src/competicoes.ts` (motor `A`–`D`/`copa` mapeado).
- [x] Logos baixados sem alteração em `apps/web/public/assets/logos/competicoes/` + `manifest.json` (30 encontrados, 13 pendentes).
- [x] Componente `LogoCompeticao` nas telas existentes; teste manifesto × catálogo × arquivos.
- [x] `docs/relatorio-logos-competicoes.md`.
- [ ] Pendentes: 10 estaduais, Bolívia, Paraguai, Peru (ver relatório). Telas de sorteio/histórico/premiação usam o componente quando existirem.

## Próxima janela — colocar ligas e jogadores no jogo (ordem)
Dados prontos (fora do git, em `dados/`): `auditoria-ogol.json` (438 clubes 2026, elencos com nome/nacionalidade/idade e ID oGol),
`cobertura.json` (cruzamento oGol × Transfermarkt × FC 26), `FC26.csv`, `transfermarkt/`. Scripts em `tools/dados/`
(`auditoria_ogol.py` refaz a varredura usando o cache `dados/ogol-cache`; `cobertura.py` refaz o cruzamento).
1. Motor: `PacoteDados.divisoes` deixar de exigir A–D fixas → lista de divisões com formato próprio (`formatos2026.ts`).
   Sem isso nenhuma liga estrangeira entra. Copa do Brasil só quando o pacote for do Brasil.
2. Importador `packages/data/scripts/importar-ogol.ts`: lê `auditoria-ogol.json` + `cobertura.json` e gera um pacote por liga
   (`packs/<pais>/pacote.json`), ID permanente = ID oGol. Atributos: FC 26 quando houver correspondência por nascimento;
   senão pendente (não inventar). Começar pela Argentina (557 jogadores com FC 26).
3. Tela "Novo jogo" já escolhe a liga primeiro (`apps/web/src/telas/NovoJogo.tsx`); cada pacote novo aparece lá.
4. Fichas do oGol (nascimento/posição) para quem não casou com TM: decisão de coleta pendente com o usuário.
5. Depois: estaduais, continentais e calendário em slots (etapas 6–11).

## Calendário (feito em 2026-11-08)
- `competicao/calendario.ts`: semanas × 2 horários (fim de semana / meio de semana), `conflitosDeCalendario`, `horarioLivre`.
- Temporada termina quando não sobra jogo e todas as competições fecharam (sem 38 fixo); `FormatoDivisao.inicio` define a semana de estreia.
- Próximo: estaduais nas semanas 0–11 (Séries com `inicio` depois), encaixando com `horarioLivre`; teste de conflito cobre o calendário inteiro.

## Regras
Reaproveitar o motor de fases; formatos em configuração; não remover nada; não criar clubes fictícios; dados pesquisados uma vez e salvos em arquivos estruturados; respostas e relatórios curtos.
