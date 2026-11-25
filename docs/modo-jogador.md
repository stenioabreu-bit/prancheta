# Modo jogador (carreira de atleta)

Pedido do usuário em 2026-11-25. Começar numa sessão nova a partir deste arquivo.

## Ideia
Simulador de vida de jogador: escolhas do dia a dia (treino, família, festa, relacionamentos, dinheiro, imprensa,
empresário) geram cadeias de consequências que aparecem semanas ou temporadas depois, boas ou ruins.
Ex.: faltar treino para ficar com a família → moral alta, técnico desconfiado → menos minutos depois.
Ex.: caso casual depois de um contrato grande → chance de gravidez meses depois → pensão, imprensa, foco.
Tom: adulto, mas narrativo (sem conteúdo explícito).

## Decisões já tomadas
- Mesmo universo do modo técnico: mesmos clubes, jogadores reais, competições e calendário. O jogador do usuário é
  mais um `Jogador` num clube; a IA (técnicos, diretorias) reage a ele.
- Três ritmos de simulação: jogo a jogo; só momentos decisivos (lances capitais, finais, propostas, crises);
  temporada a temporada (resumo com as decisões mais importantes).

## Núcleo técnico (proposta)
1. **Estado do atleta** (`engine/src/atleta/`): atributos do jogador + vida: dinheiro, fama, moral, forma física,
   relação com técnico/elenco/torcida/imprensa, família, relacionamento, empresário, vícios, reputação.
2. **Eventos declarativos** em arquivos de conteúdo: condição (gatilho), texto, opções; cada opção aplica efeitos
   imediatos e **agenda consequências** (marcas com prazo e probabilidade) que disparam outros eventos depois.
   Cadeias = eventos que exigem marcas de eventos anteriores. Aleatoriedade com a semente do save (reproduzível).
3. **Decisões em campo**: na partida do motor, nos lances do jogador do usuário (chutar/passar, driblar/tocar,
   provocar/ignorar, simular falta) — muda nota, gol, cartão e reputação.
4. **Carreira**: minutos dados pelo técnico (nota, forma, relação), propostas pelo mercado existente, renovação,
   seleção, lesões, aposentadoria, pós-carreira.
5. **Tela**: feed da semana com os dilemas, agenda, status da vida e a partida com os lances decisivos.

## Ordem sugerida
1. Estado do atleta e criação do jogador. 2. Motor de eventos com consequências agendadas + 30 eventos iniciais.
3. Minutos e decisões em campo. 4. Os três ritmos de simulação. 5. Mercado/propostas/renovação. 6. Telas. 7. Testes.
