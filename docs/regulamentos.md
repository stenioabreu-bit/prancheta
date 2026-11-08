# Regulamentos implementados

O jogo começa em **2026** e repete os formatos de 2026 a cada temporada (decisão de 2026-11-08). Os
formatos ficam em `packages/engine/src/competicao/formatos2026.ts` (séries) e `copa.ts` (Copa do Brasil).

## Fontes

| Competição | Fonte | O que foi conferido |
|---|---|---|
| Série D 2026 | REC Brasileiro Série D 2026 (CBF), Arts. 6, 13 a 21 | 16 grupos de 6 em turno e returno, 4 avançam; 2ª a 5ª fase, semifinal e final em ida e volta; desempate por saldo e pênaltis; playoffs entre os eliminados na 5ª fase (1º x 4º, 2º x 3º pela campanha); sobem os 4 semifinalistas e os 2 vencedores dos playoffs; mando da volta da 2ª fase para 1º e 2º colocados, depois pela campanha |
| Copa do Brasil 2026 | REC Copa do Brasil 2026 (CBF), Arts. 2, 12 a 24 | 126 clubes, 9 fases; 1ª a 4ª fase e final em jogo único (pênaltis); 5ª fase à semifinal em ida e volta (saldo, pênaltis); 20 da Série A entram na 5ª fase, 4 vagas diretas na 3ª; 1ª fase pareada 1º x 28º do ranking; 5ª fase com Bloco I x Bloco II |
| Série C 2026 | Regulamento divulgado pela imprensa (Band, Diario de Pernambuco) | Turno único com 20, 8 para dois quadrangulares em ida e volta, 2 de cada grupo sobem, final entre os líderes |
| Séries A e B | Formato conhecido de pontos corridos | 20 clubes, 38 rodadas; A rebaixa 4; B sobe 4 e rebaixa 4 |

## Adaptações do jogo

- **Tamanhos fixos**: no real, a Série C de 2026 rebaixa só 2 porque a C cresce para 24 clubes em 2027. No jogo,
  a C rebaixa 6 (o mesmo número que sobe da D) para os tamanhos ficarem 20/20/20/96 todo ano.
- **Série D sem estaduais**: no real, a D é montada todo ano pelos estaduais. No jogo, os clubes ficam e só
  trocam com a C.
- **Grupos da D**: distribuição alternada pela ordem do pacote (no real, regional, com até 3 clubes por estado).
  A 2ª fase cruza grupos vizinhos (1º x 4º, 2º x 3º); as fases seguintes seguem a chave.
- **Copa do Brasil**: o Ranking Nacional de Clubes vira "divisão, depois força"; os 102 clubes que vêm dos
  estaduais saem das Séries B, C e D; o mando de jogo único e da volta é sorteado; as vagas diretas da 2ª
  temporada em diante são campeões e vices das Séries C e D. O clube do usuário entra garantido.
- **Calendário**: 38 rodadas semanais; a Copa acontece no meio da semana antes das rodadas 2, 4, 6, 8, 11/13,
  16/18, 22/24, 28/30 e 34 (as do protótipo).

## Pendente

- Formato oficial da Série C de 2027 (24 clubes) e da D de 2027, quando a CBF publicar.
- Critérios de desempate completos (confronto direto, cartões, sorteio) nas fases de liga: hoje são pontos,
  vitórias, saldo e gols pró.
