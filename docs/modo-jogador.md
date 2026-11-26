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

## Implementado (2026-11-25)
- Engine em `packages/engine/src/atleta/`: `tipos.ts` (estado e vida), `motor.ts` (eventos declarativos, marcas com
  prazo, consequências agendadas com chance, RNG do save), `partida.ts` (técnico decide titular/banco/fora; lances
  com chance visível; placar rápido sem a parte do atleta + o que ele faz), `mercado.ts` (propostas na janela,
  renovação, fim de contrato, seleção, aposentadoria e pós-carreira), `jogo.ts` (criação e `avancarAtleta` nos 3 ritmos).
- Conteúdo: `packages/engine/src/conteudo/atleta.ts` (48 eventos; cadeias como festa → caso → gravidez → DNA/pensão,
  balada → fotos → vídeo, faltar treino → técnico desconfiado → banco).
- Tela: `apps/web/src/telas/Atleta.tsx` (Semana, Vida, Carreira, Comp, Notícias); modo Técnico/Jogador no Novo jogo.
- Testes: `packages/engine/test/atleta.test.ts` (inclui carreira inteira até a aposentadoria e reprodutibilidade).

- Jogos do atleta no motor de partida completo (`montarJogo`): o técnico decide a escalação, o jogo roda minuto a
  minuto, e as jogadas em que o atleta aparece (finalizações, passes, chances do adversário na zona dele, faltas)
  viram os lances; os gols do motor que passaram por ele saem do placar-base e voltam pelas escolhas. O resto dos
  elencos recebe os números do motor; a tela mostra os gols e expulsões do jogo junto com os lances.
- Pós-carreira como técnico (`atleta/tecnico.ts`): até três convites (o clube onde mais jogou, se for ídolo, e
  apostas menores; a licença de treinador amplia o alcance). Aceitando, o save segue no modo técnico.
- +18 eventos em `conteudo/atletaExtras.ts` (pôquer → dívida → agiota, documentário, licença de técnico,
  afilhado da base, salários atrasados, assalto, redes sociais etc.).

## Estilo Copero e ligas do mundo (2026-11-25)
- Criação: ficha (nome na camisa, número, pé, começo, posição no campo) e três **propostas da base** com
  minutos previstos (`atleta/criacao.ts`); o OVR inicial não depende do clube.
- Tela: carta com OVR e números da carreira, barra da temporada, faixa das competições e abas Decisão,
  Torneios, Carreira (linha por idade até 40) e Status (indicadores com o efeito de cada um, valor, contrato,
  galeria). Dilemas mostram a chance de cada opção; a resposta abre o cartão "A escolha deu certo/errado"
  com o que mudou (`ultimoResultado`).
- Ritmo "momentos decisivos" (padrão): para em todos os dilemas (menos frequentes) e só nos lances de jogos
  grandes ou do fim apertado.
- **Ligas do mundo** (só no modo jogador): `packages/data/packs/mundo/mundo.json`, gerado do EA FC 26 por
  `tools/dados/gerar_mundo.py` (18 ligas: Inglaterra, Espanha, Itália, Alemanha e França com 2ª divisão,
  Portugal, Países Baixos, Bélgica, Turquia, Escócia, Arábia Saudita, MLS, Argentina). Elas correm em paralelo
  como os estaduais (`est-mundo-xxx`, `adicionarLigaParalela`), e os clubes entram nas propostas pelo mercado.
  Convites de técnico continuam só com clubes do pacote base.
- Chances dos lances pela qualidade (`n(atributo)` de 45 a 95) e pela diferença entre o overall do atleta e a
  força do adversário (até +40%). Para os gols não inflarem, só parte das chances desperdiçadas pelo motor e das
  faltas sofridas vira lance, e um passe certo vira assistência em 65% das vezes. Calibração com o Flamengo:
  ATA 92 ≈ 0,85 gol/jogo, ATA 80 ≈ 0,55.
- Assédio dos grandes (`assedio` em `atleta/mercado.ts`): atleta cobiçado (80+, ou bem acima do time, ou
  jovem 76+) recebe na janela um leilão com três gigantes e a contraproposta do clube; fora da janela, sondagens.

## Vida completa, prêmios e sala de troféus (2026-11-25)
- **Dia a dia e polêmicas** (`conteudo/atletaVida.ts`, ~55 eventos): café do CT, série até tarde, banheira de
  gelo, churrasco de família, carona para o garoto da base, aulas de idioma e saudade de casa (no exterior),
  aniversário na terça, multa a 160 km/h, ex que expõe conversas, flagra com a apresentadora, tatuagem no
  rosto, post antigo, casa de apostas → proposta de cartão → operação da polícia, suplemento → antidoping,
  briga na boate, blitz, chantagem, parças morando em casa, pai empresário, organizada na porta, pedido no
  gramado, bebê nascendo no dia do jogo, ofensa racista na arquibancada etc.
- **Momentos** (`conteudo/atletaMomentos.ts` + `atleta/marcos.ts`): marcos da carreira (estreia, primeiro
  gol, hat-trick, gol 50/100/200..., jogo 100/250..., primeiro título, estreia na seleção), a semana antes de
  um jogo grande (clássico, final, mata-mata, reencontro com ex-clube), Copa do Mundo e Copa América, a
  cerimônia da Bola de Ouro, a volta da lesão, o impedimento que ninguém viu e o clube que te revelou.
- **Escolhas que mudam o jogo**: marcas de jogo (`EFEITOS_DE_JOGO` em `motor.ts`: focado, estudou o rival,
  descansado, inspirado, confiante, cansado, ressaca, pressionado, abalado, jogando no sacrifício) somam ou
  tiram até 15% das chances de todos os lances; as de um jogo somem depois dele. O próximo jogo mostra os
  efeitos ativos. Rotina ganhou a **folga** (família, descanso, noite, negócios).
- **Menos repetição**: o peso de um evento cai a cada vez que ele sai, e o tema dos três últimos eventos
  perde vez; chance semanal maior nos ritmos jogo a jogo (60%) e decisivos (45%).
- **Conquistas** (`atleta/conquistas.ts`): títulos registrados na semana em que saem; no fim da temporada,
  artilharia, rei das assistências, craque, seleção e revelação de cada campeonato, e os prêmios do mundo
  (Bola de Ouro com ranking até o 30º, Chuteira de Ouro, Melhor Jovem, Luva de Ouro, Seleção do Ano, Gol do
  Ano). O ranking pesa o prestígio da liga (grandes da Europa 1, outras elites e Série A 0,8, acesso 0,35–0,5)
  e os títulos do clube. Torneios de seleções em anos de Copa (2026, 2030...) e Copa América (2028...).
- **Tela**: aviso dourado a cada conquista (`AvisoDeConquista`, um por vez) e aba **Troféus** com a estante
  de títulos e prêmios (×N e temporadas), a Bola de Ouro ano a ano, a seleção e os marcos.
- **Mercado mais realista**: teto de salário (2,2× o de mercado), cada clube paga conforme a riqueza da liga,
  leilão no máximo a cada temporada e meia e nunca logo depois de uma contratação.
- Calibração com 50 carreiras simuladas (robô com perfis profissional, baladeiro, família e caótico):
  ~18 decisões por temporada no ritmo decisivos e ~125 eventos diferentes por carreira.

## Aposentadoria com legado e menos repetição (2026-11-25)
- **Legado** (`atleta/legado.ts`): patamar da carreira (Jornada honesta → Carreira sólida → Craque → Ídolo →
  Lenda → O maior de todos os tempos, este com 90+ de overall e 5 Bolas de Ouro, ou 3 com 25 títulos), a
  distância até o topo da história (800 gols, 8 Bolas de Ouro, 40 títulos, uma Copa do Mundo, overall 94),
  rótulos da vida (ídolo de um clube, rodou o mundo, campeão do mundo, polêmico, pai de família,
  endividado...), trajetória por clube, melhor temporada e frase de despedida.
- **Tela da aposentadoria**: cor e efeito pelo patamar (dourado com brilho e confete para lenda e o maior de
  todos os tempos, prata para ídolo, bronze para craque), estante, barras rumo ao topo e trajetória.
- **Repetição**: evento comum sai no máximo duas vezes na carreira, ou uma vez por cena quando tem variações
  (`conteudo/atletaVariantes.ts`, 30+ eventos com outras cenas, inclusive noite da Bola de Ouro, reencontro,
  lista da Copa, marcos e leilão). Peso cai mais rápido a cada aparição.
- Garotos gerados para repor elencos de elite podem ter teto até 93, então o mundo continua formando
  estrelas depois que os craques do pacote se aposentam.
