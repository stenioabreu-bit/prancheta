/**
 * Outras versões dos eventos que mais voltam: na segunda ou terceira vez, a mesma escolha chega com
 * outra cena (as opções continuam valendo). O motor usa a versão pela quantidade de vezes que o evento
 * já saiu na carreira.
 */
import type { VarianteDoEvento } from "../atleta/motor";

export const VARIANTES_DO_ATLETA: Record<string, VarianteDoEvento[]> = {
  balada: [
    {
      titulo: "Festa no iate",
      texto:
        "Um empresário do ramo da noite fechou um iate para a sua turma, com DJ e open bar, na noite de sábado. O jogo é domingo às 16h.",
    },
    {
      titulo: "Show na véspera",
      texto:
        "Seu cantor de pagode favorito faz show na cidade e mandou um ingresso de camarote com o seu nome escrito à mão. É véspera de jogo.",
    },
  ],
  "treino-extra": [
    {
      titulo: "O garoto da academia",
      texto:
        "Um preparador famoso, que já treinou campeões olímpicos, oferece um mês de treinos às 5h30 na academia dele, de graça. Ele só quer postar os vídeos.",
    },
    {
      titulo: "Pré-temporada particular",
      texto:
        "Seu fisiologista sugere passar a folga das férias num centro de treinamento no Uruguai, em três semanas de treino em dois períodos.",
    },
  ],
  "provocacao-rede": [
    {
      titulo: "O meme do rival",
      texto:
        "O lateral do time adversário postou um vídeo seu errando um domínio, com música de comédia. Já são 3 milhões de visualizações.",
    },
    {
      titulo: "Indireta no podcast",
      texto:
        'Um ídolo aposentado do rival disse num podcast que você "é jogador de videogame, não de Copa". O trecho rodou o país.',
    },
  ],
  "dor-joelho": [
    {
      titulo: "O tornozelo reclama",
      texto:
        "O tornozelo esquerdo amanhece inchado depois de cada jogo. O médico quer uma semana parado; o técnico olha a tabela e respira fundo.",
    },
    {
      titulo: "A lombar",
      texto:
        "Uma dor na lombar não deixa você amarrar a chuteira sem careta. Nos exames não aparece nada grave, mas dói.",
    },
  ],
  "treino-x-familia": [
    {
      titulo: "A formatura da sua irmã",
      texto:
        "Sua irmã se forma em Medicina, a primeira da família com diploma. A cerimônia cai no dia do treino de bola parada com {tecnico}.",
    },
    {
      titulo: "Bodas dos seus avós",
      texto:
        "Seus avós completam 50 anos de casados e a família inteira vai estar no salão da igreja. É dia de treino tático.",
    },
  ],
  "irmao-dinheiro": [
    {
      titulo: "O primo do food truck",
      texto:
        "Seu primo quer comprar um food truck de hambúrguer e jura que devolve os {mesada} em seis meses.",
    },
    {
      titulo: "A loja de roupas",
      texto:
        "Sua irmã quer abrir uma loja de roupas no centro da cidade e pede {mesada} para o aluguel e o estoque.",
    },
  ],
  "entrevista-derrota": [
    {
      titulo: "Zona mista quente",
      texto:
        'Terceira derrota seguida. Na zona mista, o repórter estica o microfone: "O grupo ainda acredita em {tecnico}?"',
    },
    {
      titulo: "Coletiva depois do vexame",
      texto:
        "Goleada em casa. O assessor tentou cancelar a coletiva, mas você foi escalado para falar. A primeira pergunta é sobre o esquema.",
    },
  ],
  patrocinio: [
    {
      titulo: "Duas propostas na mesa",
      texto:
        "Seu empresário trouxe duas propostas: um site de apostas que paga o triplo e uma marca de chuteiras que quer você na campanha mundial.",
    },
    {
      titulo: "O contrato da marca",
      texto:
        "Acabou o seu contrato de material esportivo. Uma marca de chuteiras e uma casa de apostas disputam a sua imagem para os próximos anos.",
    },
  ],
  "torcida-cobra": [
    {
      titulo: "Faixa no muro do CT",
      texto:
        'Amanheceu uma faixa no muro do CT com o seu nome e a palavra "mercenário". Um grupo espera na portaria para conversar.',
    },
    {
      titulo: "Cobrança no aeroporto",
      texto:
        "Na volta de uma derrota, uns trinta torcedores esperam o elenco no desembarque do aeroporto, cantando contra os jogadores.",
    },
  ],
  "briga-treino": [
    {
      titulo: "Dividida no coletivo",
      texto:
        "No coletivo, um reserva que briga pela sua vaga chega atrasado de propósito no seu tornozelo. Todo mundo olha para você.",
    },
    {
      titulo: "Bate-boca no rachão",
      texto:
        "No rachão de sexta, um veterano te xinga depois de uma caneta. O resto do elenco faz silêncio e espera.",
    },
  ],
  "companheiro-mal": [
    {
      titulo: "O amigo que sumiu",
      texto:
        "O seu melhor amigo no elenco faltou dois treinos e não responde mensagens. A esposa dele te liga preocupada.",
    },
    {
      titulo: "O goleiro reserva",
      texto:
        "O goleiro reserva, que não joga há meses, desabafa no ônibus: acha que a carreira dele acabou e não sabe fazer outra coisa.",
    },
  ],
  nutricionista: [
    {
      titulo: "O chef particular",
      texto:
        "Um chef que cozinha para pilotos de Fórmula 1 se oferece para montar o seu cardápio. O preço assusta, mas os exames do clube pedem mudança.",
    },
    {
      titulo: "Exame de sangue",
      texto:
        "O exame de sangue da pré-temporada veio ruim: inflamação alta e gordura acima do ideal. A nutricionista quer uma dieta rígida.",
    },
  ],
  analgesicos: [
    {
      titulo: "Os comprimidos do vestiário",
      texto:
        "Você passou a tomar anti-inflamatório antes de todo jogo, sem receita, e uma taça de vinho para dormir virou meia garrafa.",
    },
    {
      titulo: "As noites em claro",
      texto:
        "Faz semanas que você só dorme com remédio. Sua mãe percebeu pela voz no telefone e perguntou se está tudo bem.",
    },
  ],
  psicologo: [
    {
      titulo: "O vazio depois do jogo",
      texto:
        "Mesmo depois das vitórias, você chega em casa e fica olhando o teto. O clube contratou um psicólogo do esporte.",
    },
    {
      titulo: "Ansiedade antes de entrar",
      texto:
        "No túnel, antes de entrar em campo, o coração dispara e as mãos suam como nunca. A psicóloga do clube deixou o cartão no seu armário.",
    },
  ],
  "crise-casal": [
    {
      titulo: "O aniversário esquecido",
      texto:
        "Você esqueceu o aniversário de namoro: estava concentrado para um jogo de quarta. Em casa, o clima congelou.",
    },
    {
      titulo: "Mensagens sem resposta",
      texto:
        "Entre viagens e concentrações, as mensagens dela ficam horas sem resposta. Ontem ela disse que se sente casada com o seu empresário.",
    },
  ],
  "aniversario-do-companheiro": [
    {
      titulo: "Churrasco do capitão",
      texto:
        "O capitão faz churrasco com pagode na casa dele, numa terça, e convidou o elenco todo. Quarta tem jogo pela copa.",
    },
  ],
  "penaltis-do-treino": [
    {
      titulo: "Desafio de faltas",
      texto:
        "Depois do treino, desafio de cobranças: quem errar mais paga o almoço do elenco. O goleiro reserva fez aposta paralela contra você.",
    },
  ],
  "insonia-antes-do-jogo": [
    {
      titulo: "Hotel barulhento",
      texto:
        "O hotel da concentração fica do lado de uma casa de show. Uma da manhã e a música ainda faz a janela tremer. O médico deixou um remédio para dormir.",
    },
  ],
  "mais-um-episodio": [
    {
      titulo: "Ranqueada até tarde",
      texto:
        "Meia-noite e meia, e você está a uma vitória de subir de divisão no videogame. Amanhã tem treino às 8h valendo vaga.",
    },
  ],
  "cafe-do-ct": [
    {
      titulo: "O refrigerante proibido",
      texto:
        "O clube cortou o refrigerante do refeitório e pôs uma máquina de água com gás e limão. O vestiário está em revolta silenciosa.",
    },
  ],
  "churrasco-de-domingo": [
    {
      titulo: "Feijoada de sábado",
      texto:
        "Sua avó fez feijoada completa no sábado, com torresmo e caipirinha. O nutricionista sabe que hoje é sábado.",
    },
  ],
  "meme-do-gol-perdido": [
    {
      titulo: "O pênalti na arquibancada",
      texto:
        "O pênalti que você mandou na arquibancada virou meme: montaram a bola caindo em Marte, na Lua e no colo de um torcedor.",
    },
  ],
  "noticia-falsa": [
    {
      titulo: "Fofoca de transferência",
      texto:
        "Um perfil de fofoca garante que você já assinou com o rival e que {tecnico} sabe. Nada disso é verdade, mas a torcida acredita.",
    },
  ],
  "semana-de-classico": [
    {
      titulo: "Clássico contra o {adversario}",
      texto:
        "A cidade só fala do clássico contra o {adversario}. No posto de gasolina, o frentista pediu um gol; na padaria, a moça do caixa pediu dois.",
    },
    {
      titulo: "O dérbi",
      texto:
        "Semana de dérbi contra o {adversario}. A última vez que vocês perderam esse jogo, a torcida apedrejou o ônibus. Ninguém esqueceu.",
    },
  ],
  "semana-de-mata-mata": [
    {
      titulo: "Tudo ou nada: {fase}",
      texto:
        'Mata-mata contra o {adversario}. O roupeiro pendurou a camisa de cada um com um bilhete escrito à mão: "Hoje é dia".',
    },
  ],
  "noite-bola-de-ouro": [
    {
      titulo: "Bola de Ouro, de novo",
      texto:
        "Mais uma vez o seu nome no telão de Paris. A plateia já levanta antes do anúncio. Desta vez, o seu filho subiu no palco com você e quer segurar o microfone.",
    },
    {
      titulo: "A noite dos recordes",
      texto:
        "Mais uma Bola de Ouro para a coleção. A organização preparou um vídeo com todos os seus gols da temporada e o teatro inteiro assistiu em silêncio.",
    },
  ],
  "cerimonia-podio": [
    {
      titulo: "De novo no pódio",
      texto:
        "Outra vez entre os três melhores do mundo, outra vez sem a Bola. Os jornalistas já perguntam se você vai à cerimônia.",
    },
  ],
  "reencontro-ex": [
    {
      titulo: "A volta ao estádio do {adversario}",
      texto:
        'Jogo contra o {adversario}. O roupeiro de lá te mandou mensagem: "Tua camisa ainda está no meu armário". Os torcedores preparam faixas, umas de carinho, outras nem tanto.',
    },
    {
      titulo: "Ex contra ex",
      texto:
        'Semana de reencontro com o {adversario}. O seu antigo técnico disse numa entrevista que você "saiu pela porta dos fundos". A imprensa quer a sua resposta.',
    },
  ],
  "lista-torneio": [
    {
      titulo: "{torneio}: mais uma lista",
      texto:
        "Você já sabe como é: a lista sai, o país para. Mesmo assim o coração acelerou quando o seu nome foi lido. A {torneio} está chegando.",
    },
    {
      titulo: "{torneio}: talvez a última",
      texto:
        "Convocado para a {torneio}. Na coletiva, perguntaram se esta é a sua última. Você ainda não sabe responder.",
    },
  ],
  "marco-gols": [
    {
      titulo: "{n} gols",
      texto:
        "Gol número {n}. O estádio parou, os companheiros fizeram uma roda em volta de você e o telão mostrou o primeiro deles, ainda garoto.",
    },
  ],
  "marco-jogos": [
    {
      titulo: "{n} jogos de carreira",
      texto:
        "Jogo número {n}. Antes da partida, o capitão do adversário veio te cumprimentar com uma camisa autografada.",
    },
  ],
  leilao: [
    {
      titulo: "Disputa pelo seu passe",
      texto:
        "Três clubes gigantes entraram na briga ao mesmo tempo. {clube0} oferece {salario0} por ano, {clube1} chega a {salario1} e {clube2} fala em {salario2}, todos por {anos} anos. O {clube} cobre com {contrapropostaTxt} por ano se você ficar.",
    },
  ],
  convocacao: [
    {
      titulo: "Lista da seleção",
      texto:
        "O técnico da seleção leu a lista numa coletiva às 11h. O seu nome foi o quinto. Seu celular explodiu.",
    },
  ],
};
