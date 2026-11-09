# Relatório de validação do calendário 2026

## Competições verificadas

- Séries A, B, C e D e Copa do Brasil: datas conferidas contra o PDF oficial da CBF (transcrição das 38+38+27+24+14 datas em `formatos2026.ts` e `copa.ts`).
- Estaduais: 25 de 27 com tabela 2026 real (AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO). Pendentes: MT e MS (tabela não publicada na fonte).

## Datas confirmadas

- Nacionais: todas as datas de rodada/fase do calendário CBF 2026.
- Estaduais: data de cada jogo da 1ª fase e das fases de mata-mata, como disputadas em 2026.

## Datas pendentes

- Confrontos e mandos oficiais das Séries (tabela detalhada da CBF não importada): o jogo gera os confrontos nas datas oficiais.
- MT e MS: sem tabela; ficam fora da temporada até haver fonte.
- Fases dos estaduais não modeladas (repescagens, disputa de 3º lugar, rebaixamento, quadrangulares extras): ver lista por estadual em `docs/calendario-brasileiro-2026.md`.

## Conflitos encontrados e corrigidos

- Na simulação de teste (semente 11), 34 jogos de estaduais caíram em choque ou sem 2 dias de descanso com jogos de Copa/Série gerados pelo jogo e foram reagendados automaticamente para o primeiro dia livre (AC 4, ES 3, PA 7, PB 1, PI 1, RJ 4, RO 2, RR 1, SC 2, SP 4, GO 2, SE 1, MG 2). A data original fica em `adiadoDe`.
- Prioridade para manter a data: Copa > Série > estadual.
- Depois do resolvedor: zero conflitos na temporada inteira e na virada para 2027.

## Testes executados

`packages/data/test/calendario-brasil.test.ts` (pacote real, todos passando):

1. Temporada completa com os 25 estaduais com tabela: todos com campeão, nenhum conflito.
2. Estaduais na tabela real: nº de jogos da 1ª fase igual ao real, datas dentro de jan–abr.
3. Série A e B: 380 jogos cada, primeira e última datas oficiais (28/01–02/12 e 21/03–28/11).
4. Série C: 1ª fase, 2ª fase, final.
5. Série D: 1ª fase, 2ª e 3ª fases, oitavas, quartas, playoffs, semifinal e final.
6. Copa do Brasil: 9 fases, final em 06/12.
7. Clubes em estadual + Série + Copa: nenhum jogo sem descanso.
8. Duplicidade na mesma data é detectada; adiamento registra a data antiga.
9. Virada de temporada preserva o histórico e remonta o calendário sem conflitos.
10. Carreira do Palmeiras: Paulistão, Série A e Copa até o fim da temporada e virada para 2027.

Suíte completa: 104 testes passando (`npx vitest run`). Build do app ok.

## Problemas corrigidos

- Calendário fixo de 38 semanas trocado por datas reais (seg–qui = meio de semana, sex–dom = fim de semana).
- Copa do Brasil: 2ª fase passou a ida e volta, conforme o calendário de 2026.
- Janelas de transferência alinhadas às janelas de registro da CBF.
- Mata-mata cuja data já passou quando a fase anterior atrasou vai para a primeira semana possível.

## Adaptações do jogo

- 1ª fase dos estaduais com grupos (SP, MG, CE, GO, AM...) usa classificação em tabela única com os mesmos jogos reais; avançam tantos quanto entram no primeiro mata-mata.
- 110 clubes disputam só o estadual; 76 deles têm menos de 16 jogadores encontrados nas fontes e o elenco foi completado com jogadores gerados marcados como `provisorio` (lista em `dados/estaduais-2026-resumo.json`).

## Copas continentais (atualização)

- Libertadores (Fase 1, 2 e 3 da Pré, 8 grupos, oitavas a final única) e Sul-Americana (1ª fase, 8 grupos, playoffs, oitavas a final única) com tabela real 2026.
- 187 clubes fora das Séries no save do Brasileirão (estaduais + estrangeiros das continentais).
- Prioridade de data: continental > Copa do Brasil > mata-mata de estadual > Série > 1ª fase de estadual. Regra de conflito: menos de 2 dias entre jogos do mesmo clube.
- Teste de robustez: sementes 1, 2, 3, 5, 8 e 13, duas temporadas cada, zero conflitos e todas as competições encerradas.
- Corrigido: reagendamento podia cair na semana que estava fechando; fase da Copa aberta com data já passada; ida empurrada para depois da volta.
- Premiação continental paga por fase disputada e pelo título (`PREMIO_POR_FASE`).
- Pendente: classificação automática para as continentais de 2027 em diante (hoje repete os participantes de 2026).

## Classificação continental automática (2027 em diante)

- Vagas brasileiras pelo resultado: campeão da Libertadores, campeão da Sul-Americana, campeão da Copa do Brasil e tabela da Série A, nessa ordem; quem já tem vaga libera a sua para o próximo da tabela.
- Mesmo número de vagas por fase de 2026: 6 nos grupos da Libertadores, 2 na Fase 2, 6 nos grupos da Sul-Americana.
- Estrangeiros mantêm as vagas de 2026 (as ligas deles não são simuladas no save do Brasileirão); campeão continental estrangeiro entra nos grupos da Libertadores.
- Confrontos da Pré, 1ª fase da Sul-Americana e grupos sorteados de novo (potes na ordem de entrada), nas datas de 2026.
- Teste: 2027 sem clube repetido entre as copas, G4 e campeões nos grupos, 6 brasileiros na Sul-Americana, temporada completa sem conflito.
