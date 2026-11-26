/**
 * Vida do atleta fora de campo: o dia a dia do CT e de casa (escolhas pequenas que mexem no próximo
 * jogo) e as polêmicas pessoais (ex que expõe conversas, apostas, blitz, parças morando em casa,
 * chantagem...). Mesmo formato de `conteudo/atleta.ts`. As marcas de jogo (`focado`, `ressaca`,
 * `confiante`, `abalado`...) somam ou tiram chance em todos os lances da partida seguinte.
 */
import type { ContextoAtleta, DefEvento } from "../atleta/motor";
import { divisaoDo } from "../competicao/temporada";

/** Joga fora do país do pacote (clube das ligas do mundo). */
const noExterior = (c: ContextoAtleta) => !divisaoDo(c.estado.temporada, c.clube.id);
const comprometido = ["namorando", "casado"] as ("namorando" | "casado")[];

export const EVENTOS_ATLETA_VIDA: DefEvento[] = [
  // ───────────── Dia a dia no CT ─────────────
  {
    id: "cafe-do-ct",
    categoria: "rotina",
    titulo: "O pão de queijo sumiu",
    texto:
      "A nova nutricionista tirou o pão de queijo do café da manhã do CT. No lugar, uma travessa de ovos mexidos sem sal e uma placa: “Proteína é vida”. O vestiário inteiro está de cara fechada.",
    peso: 3,
    intervalo: 60,
    opcoes: [
      {
        texto: "Seguir o cardápio novo sem reclamar",
        dica: "Forma melhora; ninguém vai te agradecer",
        efeito: { vida: { forma: 3, tecnico: 2, moral: -1 } },
        resultado: "Duas semanas depois, a balança e o GPS do treino mostraram a diferença.",
        auto: true,
      },
      {
        texto: "Trazer pão de queijo de casa escondido na mochila",
        dica: "Se pegarem, vira piada no grupo",
        efeito: { vida: { moral: 3, elenco: 3 } },
        resultado: "Você virou o fornecedor oficial do vestiário. A nutricionista desconfia de tudo.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { tecnico: -3, elenco: 2, imprensa: -1 } },
            resultado: "Flagrado no refeitório com a sacola. O vídeo foi parar no grupo da diretoria.",
          },
        },
      },
      {
        texto: "Puxar um abaixo-assinado pela volta do pão de queijo",
        dica: "O grupo vai gostar; a comissão, nem tanto",
        efeito: { vida: { elenco: 7, tecnico: -3, fama: 1 } },
        resultado: "Trinta assinaturas, incluindo a do roupeiro. O pão de queijo voltou às sextas.",
      },
    ],
  },
  {
    id: "mais-um-episodio",
    categoria: "rotina",
    titulo: "Só mais um episódio",
    texto:
      "Meia-noite e quarenta. A série chegou no penúltimo episódio da temporada, o celular está com 9% e amanhã tem treino às 8h, com coletivo valendo vaga.",
    peso: 3,
    intervalo: 40,
    opcoes: [
      {
        texto: "Desligar a TV e dormir",
        dica: "Mais inteiro para o próximo jogo",
        efeito: { vida: { forma: 2 }, marcar: { descansado: 2 } },
        resultado: "Oito horas de sono. No coletivo, você chegou em todas.",
        auto: true,
      },
      {
        texto: "Ver só mais um",
        dica: "Uma hora a menos de sono pesa",
        efeito: { vida: { moral: 2 } },
        resultado: "Valeu cada minuto. Você bocejou no aquecimento, mas ninguém viu.",
        sorte: {
          p: 0.65,
          senao: {
            efeito: { vida: { moral: 1, tecnico: -2 }, marcar: { cansado: 2 } },
            resultado: "Você chegou atrasado ao café e lento no coletivo. O técnico anotou alguma coisa.",
          },
        },
      },
      {
        texto: "Maratonar até o fim",
        dica: "Moral sobe; as pernas vão sentir",
        efeito: { vida: { moral: 4, forma: -5 }, marcar: { cansado: 2 } },
        resultado: "O final foi chocante. O coletivo também, mas por outro motivo.",
      },
    ],
  },
  {
    id: "banheira-de-gelo",
    categoria: "rotina",
    titulo: "Banheira de gelo",
    texto:
      "O fisiologista colocou na parede do vestiário uma tabela com o nome de todo mundo: quinze minutos de banheira de gelo depois de cada treino. Seu nome é o único sem nenhum xis.",
    peso: 3,
    intervalo: 50,
    opcoes: [
      {
        texto: "Encarar o gelo todo dia",
        dica: "Recuperação melhor; dói só de pensar",
        efeito: { vida: { forma: 5, tecnico: 2, moral: -2 }, marcar: { "cuida-do-corpo": 26 } },
        resultado: "Na terceira semana você já fazia piada lá dentro. As pernas agradeceram.",
      },
      {
        texto: "Comprar uma banheira para casa",
        dica: "Caro, mas no seu horário",
        efeito: { meses: -0.4, vida: { forma: 6 }, marcar: { "cuida-do-corpo": 52 } },
        resultado: "A banheira ocupou metade da lavanderia. Sua mãe acha um absurdo.",
      },
      {
        texto: "Continuar fugindo da tabela",
        dica: "Ninguém morre por isso... até a coxa reclamar",
        efeito: {
          vida: { moral: 1, tecnico: -2 },
          agendar: [{ evento: "corpo-cobra", em: [3, 10], chance: 0.3 }],
        },
        resultado: "O fisiologista desistiu de cobrar. Ou parou de cobrar em voz alta.",
        auto: true,
      },
    ],
  },
  {
    id: "crianca-no-sinal",
    categoria: "rotina",
    titulo: "A camisa no sinal vermelho",
    texto:
      "No sinal perto do CT, um menino de uns dez anos vende bala usando uma camisa do {clube} com o seu nome escrito à mão nas costas. Ele ainda não te reconheceu dentro do carro.",
    peso: 3,
    intervalo: 70,
    opcoes: [
      {
        texto: "Baixar o vidro e chamar ele pelo nome da camisa",
        dica: "Pode virar vídeo; pode atrasar o treino",
        efeito: { vida: { torcida: 4, fama: 2, moral: 3 } },
        resultado: "Ele gritou tão alto que o sinal abriu e fechou duas vezes. Alguém filmou.",
        sorte: {
          p: 0.8,
          senao: {
            efeito: { vida: { torcida: 3, tecnico: -2 } },
            resultado: "Valeu a pena, mas você chegou dez minutos atrasado e pagou a multinha do grupo.",
          },
        },
      },
      {
        texto: "Dar a chuteira do último jogo para ele",
        dica: "Gesto bonito; ninguém vai saber, ou todo mundo vai",
        efeito: { vida: { torcida: 6, fama: 4, reputacao: 3, moral: 4 } },
        resultado: "O vídeo do menino abraçando a chuteira passou no jornal da noite.",
      },
      {
        texto: "Seguir direto",
        efeito: { vida: { moral: -1 } },
        resultado: "Você pensou nele durante o treino inteiro.",
        auto: true,
      },
    ],
  },
  {
    id: "visual-novo",
    categoria: "rotina",
    titulo: "O cabeleireiro tem uma ideia",
    texto:
      "O seu cabeleireiro chegou com a máquina e um sorriso perigoso: “Platinado. Confia. Se você marcar no domingo, o Brasil inteiro copia na segunda.”",
    peso: 2,
    intervalo: 70,
    opcoes: [
      {
        texto: "Platinado, com desenho do lado",
        dica: "Se der certo em campo, vira moda; se não, vira meme",
        efeito: { vida: { fama: 5, moral: 4 }, marcar: { confiante: 3 } },
        resultado: "As barbearias da cidade ficaram sem descolorante na segunda-feira.",
        sorte: {
          p: 0.55,
          senao: {
            efeito: { vida: { fama: 3, moral: -3, imprensa: -2 }, marcar: { abalado: 2 } },
            resultado: "Você foi mal no domingo e o cabelo virou figurinha em todos os grupos.",
          },
        },
      },
      {
        texto: "Só aparar, como sempre",
        efeito: {},
        resultado: "O cabeleireiro guardou a tinta, decepcionado.",
        auto: true,
      },
      {
        texto: "Raspar tudo",
        dica: "Recado de seriedade",
        efeito: { vida: { tecnico: 2, reputacao: 1, fama: 1 } },
        resultado: "Na entrevista, perguntaram se era promessa. Você só sorriu.",
      },
    ],
  },
  {
    id: "churrasco-de-domingo",
    categoria: "rotina",
    titulo: "Churrasco de domingo",
    texto:
      "Seu tio acendeu a churrasqueira às dez da manhã. Tem picanha, linguiça, pão de alho e a família inteira esperando você. O nutricionista mandou uma mensagem às 9h59: “Lembra do plano.”",
    peso: 3,
    intervalo: 50,
    opcoes: [
      {
        texto: "Comer de tudo e ficar até a noite",
        dica: "Família feliz, balança nem tanto",
        efeito: { vida: { familia: 7, moral: 4, forma: -4 } },
        resultado: "Você ganhou do seu primo no truco e perdeu dois quilos de vantagem na balança.",
      },
      {
        texto: "Ir, comer pouco e sair cedo",
        efeito: { vida: { familia: 3, forma: 1 } },
        resultado: "Sua avó achou que você estava doente. Explicar a dieta não ajudou.",
        auto: true,
      },
      {
        texto: "Mandar áudio e ir à academia",
        dica: "Corpo em dia, família magoada",
        efeito: { vida: { forma: 3, familia: -6 }, marcar: { focado: 2 } },
        resultado: "Sua mãe ouviu o áudio e não respondeu. Na academia, você estava sozinho.",
      },
    ],
  },
  {
    id: "carona-do-garoto",
    categoria: "rotina",
    titulo: "Carona para o garoto",
    texto:
      "Um garoto de 16 anos que subiu para treinar com o profissional pega dois ônibus para chegar ao CT. Ele pergunta, sem olhar nos seus olhos, se pode ir com você.",
    peso: 2,
    intervalo: 80,
    opcoes: [
      {
        texto: "Levar todo dia",
        dica: "O vestiário repara nessas coisas",
        efeito: { vida: { elenco: 5, reputacao: 3, moral: 2 }, marcar: { mentor: 30 } },
        resultado: "Ele fala sem parar no carro. Você descobriu que ele imita a sua comemoração.",
        auto: true,
      },
      {
        texto: "Pagar um carro de aplicativo para ele",
        efeito: { meses: -0.1, vida: { elenco: 2 } },
        resultado: "Ele agradeceu. Mas no carro você é que ia gostar de conversar.",
      },
      {
        texto: "Dizer que não dá, você sai muito cedo",
        efeito: { vida: { elenco: -3 } },
        resultado: "Ele disse que tudo bem. No ônibus, ele ficou pensando que você é diferente na TV.",
      },
    ],
  },
  {
    id: "pescaria-dos-veteranos",
    categoria: "rotina",
    titulo: "Pescaria dos veteranos",
    texto:
      "Os três jogadores mais velhos do elenco têm uma tradição: na folga, pescaria num açude a duas horas da cidade, com isopor, rádio de pilha e histórias que ninguém confirma. Pela primeira vez, chamaram você.",
    peso: 2,
    intervalo: 80,
    requer: { idade: [17, 28] },
    opcoes: [
      {
        texto: "Ir e ouvir as histórias",
        dica: "Respeito no vestiário; a família fica de lado no domingo",
        efeito: { vida: { elenco: 8, moral: 3, familia: -3 } },
        resultado: "Você não pegou um peixe. Voltou sabendo quem manda de verdade no vestiário.",
        auto: true,
      },
      {
        texto: "Levar o seu filho junto",
        so: (c) => c.a.filhos > 0,
        efeito: { vida: { elenco: 5, familia: 7, moral: 4 } },
        resultado: "Seu filho pegou o maior peixe do dia. Os veteranos adotaram ele.",
      },
      {
        texto: "Agradecer e ficar em casa",
        efeito: { vida: { familia: 2, elenco: -2 } },
        resultado: "Não chamaram de novo.",
      },
    ],
  },
  {
    id: "aulas-de-idioma",
    categoria: "rotina",
    titulo: "Aulas de idioma",
    texto:
      "Três meses no {clube} e você ainda pede comida apontando para o cardápio. O clube oferece professora particular duas vezes por semana, depois do treino.",
    peso: 4,
    intervalo: 70,
    requer: { teste: noExterior },
    opcoes: [
      {
        texto: "Aula todo dia, até sonhar no idioma",
        dica: "Técnico e grupo vão notar",
        efeito: { vida: { tecnico: 5, elenco: 6, moral: -1, forma: -1 }, marcar: { idioma: null } },
        resultado: "Na quinta semana, você fez o grupo rir com uma piada de propósito.",
      },
      {
        texto: "O básico, duas vezes por semana",
        efeito: { vida: { elenco: 2, tecnico: 1 } },
        resultado: "“Bom dia”, “obrigado”, “passa a bola”. Funciona.",
        auto: true,
      },
      {
        texto: "Deixar o intérprete resolver",
        dica: "Mais tempo livre; o técnico fala com você por tradução",
        efeito: { vida: { elenco: -4, tecnico: -3, moral: 1 } },
        resultado: "Na preleção, você entende metade, sempre com três segundos de atraso.",
      },
    ],
  },
  {
    id: "saudade-de-casa",
    categoria: "familia",
    titulo: "Saudade de casa",
    texto:
      "Escurece às quatro da tarde, a comida não tem gosto de nada e o grupo da família no celular está cheio de fotos de um almoço em que você não estava.",
    peso: 4,
    intervalo: 50,
    requer: { teste: noExterior },
    opcoes: [
      {
        texto: "Trazer a família para morar com você",
        dica: "Caro, mas a casa volta a ter barulho",
        efeito: { meses: -1, vida: { familia: 12, moral: 8 }, marcar: { "familia-perto": null } },
        resultado: "Sua mãe trouxe na mala tempero, café e uma imagem de santo para a sala.",
      },
      {
        texto: "Voar para casa na folga de três dias",
        dica: "Vinte horas de avião antes do jogo",
        efeito: { vida: { familia: 8, moral: 5, forma: -5, tecnico: -3 }, marcar: { cansado: 2 } },
        resultado: "Um dia e meio em casa e muito avião. Valeu, mas o corpo cobrou.",
      },
      {
        texto: "Aguentar calado",
        efeito: {
          vida: { moral: -7 },
          marcar: { abalado: 2 },
          agendar: [{ evento: "psicologo", em: [2, 6], chance: 0.5 }],
        },
        resultado: "Você passou a treinar e voltar direto para o apartamento vazio.",
        auto: true,
      },
    ],
  },
  {
    id: "palestra-na-escola",
    categoria: "rotina",
    titulo: "Palestra na escola onde você estudou",
    texto:
      "A diretora da sua escola municipal mandou uma carta à mão: os alunos querem ouvir você. A data cai no seu único dia de folga do mês.",
    peso: 2,
    intervalo: 90,
    opcoes: [
      {
        texto: "Ir e contar a história como ela foi",
        dica: "Um dia de folga a menos",
        efeito: { vida: { reputacao: 5, fama: 2, familia: 3, forma: -1 } },
        resultado:
          "Um menino perguntou quanto você ganha. Uma menina perguntou se você teve medo. Essa doeu.",
        auto: true,
      },
      {
        texto: "Doar uniformes e mandar um vídeo",
        efeito: { meses: -0.15, vida: { reputacao: 3, torcida: 1 } },
        resultado: "O vídeo passou no pátio. Os uniformes chegaram antes dos Jogos Escolares.",
      },
      {
        texto: "Pedir para a assessoria responder",
        efeito: { vida: { reputacao: -1 } },
        resultado: "A diretora recebeu um e-mail com a sua assinatura digital.",
      },
    ],
  },
  {
    id: "gravacao-do-patrocinador",
    categoria: "rotina",
    titulo: "Gravação às 7h na folga",
    texto:
      "A marca de chuteira marcou uma gravação para o seu dia de folga, às 7h, num estúdio a uma hora de casa. O contrato diz que é obrigatório; o seu corpo diz outra coisa.",
    peso: 3,
    intervalo: 50,
    requer: { min: { fama: 40 } },
    opcoes: [
      {
        texto: "Ir e gravar sorrindo",
        efeito: { vida: { empresario: 3, fama: 2, forma: -2 } },
        resultado: "Doze takes de você chutando uma bola que não existe. O comercial ficou bom.",
        auto: true,
      },
      {
        texto: "Pedir para mudar o dia",
        dica: "A marca pode aceitar ou multar",
        efeito: { vida: { empresario: 1, forma: 1 } },
        resultado: "Mudaram para terça à tarde. Ninguém morreu.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { meses: -0.25, vida: { empresario: -5 } },
            resultado: "A marca aplicou a multa do contrato. Seu empresário passou o dia no telefone.",
          },
        },
      },
      {
        texto: "Não aparecer",
        efeito: { meses: -0.4, vida: { empresario: -9, forma: 2, reputacao: -3 } },
        resultado: "Multa e um e-mail seco da marca. Você dormiu até as dez.",
      },
    ],
  },
  {
    id: "cachorro-no-ct",
    categoria: "rotina",
    titulo: "Um cachorro na porta do CT",
    texto:
      "Há uma semana, um vira-lata caramelo dorme na guarita do CT. Ele escolheu você: senta do lado do seu carro todo dia e só sai quando você vai embora.",
    peso: 2,
    intervalo: 120,
    unico: true,
    opcoes: [
      {
        texto: "Adotar e levar para casa",
        dica: "Vai roer o sofá; vai mudar o seu humor",
        efeito: { vida: { moral: 7, familia: 4, fama: 2, torcida: 2 }, marcar: { "tem-cachorro": null } },
        resultado: "Você o chamou de Gandula. A foto dele com a sua camisa passou de um milhão de curtidas.",
        auto: true,
      },
      {
        texto: "Levar a uma ONG e pagar o tratamento",
        efeito: { meses: -0.05, vida: { reputacao: 2, moral: 2 } },
        resultado: "Ele foi adotado por uma família do interior. Mandam foto todo mês.",
      },
      {
        texto: "Deixar o pessoal da guarita cuidar",
        efeito: { vida: { moral: -1 } },
        resultado: "Ele continuou esperando do lado do seu carro.",
      },
    ],
  },
  {
    id: "aniversario-do-companheiro",
    categoria: "festa",
    titulo: "Aniversário na terça",
    texto:
      "O lateral faz aniversário numa terça e alugou um salão com pagode ao vivo. Quarta tem jogo. O convite diz “só um brinde”, mas todo mundo sabe como isso termina.",
    peso: 3,
    intervalo: 40,
    opcoes: [
      {
        texto: "Ir, brindar e sair antes das onze",
        dica: "Presença marcada, sono garantido",
        efeito: { vida: { elenco: 4, moral: 2 } },
        resultado: "Você cantou o parabéns, comeu um salgado e saiu antes do pagode esquentar.",
        auto: true,
      },
      {
        texto: "Ficar até o fim",
        dica: "Grupo unido; pernas pesadas na quarta",
        efeito: {
          vida: { elenco: 8, moral: 5, forma: -6, vicios: 2 },
          marcar: { ressaca: 2 },
          agendar: [{ evento: "foto-balada", em: [1, 2], chance: 0.25 }],
        },
        resultado: "Você subiu no palco e cantou. Tem vídeo. Muitos vídeos.",
      },
      {
        texto: "Mandar presente e não ir",
        efeito: { vida: { elenco: -3, forma: 1 }, marcar: { descansado: 2 } },
        resultado: "O lateral agradeceu pelo presente com um emoji só.",
      },
    ],
  },
  {
    id: "homenagem-ao-roupeiro",
    categoria: "vestiario",
    titulo: "O roupeiro vai se aposentar",
    texto:
      "Seu Zé lava a roupa do {clube} há 31 anos. Ele conhece cada jogador pelo cheiro da chuteira e chora quando o time perde. O grupo vai fazer uma vaquinha de despedida.",
    peso: 2,
    intervalo: 150,
    unico: true,
    opcoes: [
      {
        texto: "Organizar uma homenagem no gramado",
        dica: "O vestiário inteiro vai lembrar",
        efeito: { vida: { elenco: 9, torcida: 4, imprensa: 3, tecnico: 2 } },
        resultado:
          "Corredor de jogadores, estádio de pé e Seu Zé recebendo a camisa 31. Ninguém segurou o choro.",
      },
      {
        texto: "Dar uma quantia alta na vaquinha",
        efeito: { meses: -0.3, vida: { elenco: 5, reputacao: 2 } },
        resultado: "A vaquinha pagou a reforma da casa dele. Ele não sabe quem deu mais.",
        auto: true,
      },
      {
        texto: "Dar o mesmo que todo mundo",
        efeito: { vida: { elenco: 1 } },
        resultado: "Seu Zé apertou a sua mão na saída e disse: “Cuida da camisa”.",
      },
    ],
  },
  {
    id: "penaltis-do-treino",
    categoria: "treino",
    titulo: "Pênaltis valendo churrasco",
    texto:
      "Fim de treino, disputa de pênaltis entre os jogadores: quem perder paga o churrasco do grupo. Chegou a sua vez de bater, e o goleiro reserva está provocando.",
    peso: 3,
    intervalo: 40,
    opcoes: [
      {
        texto: "Bater de cavadinha",
        dica: "Se entrar, você vira lenda do treino",
        efeito: { vida: { elenco: 4, moral: 3, fama: 1 }, marcar: { confiante: 2 } },
        resultado: "Cavadinha perfeita. O goleiro reserva ficou sentado no chão, rindo.",
        sorte: {
          p: (c) => 0.35 + c.j.at.CTL / 250,
          senao: {
            efeito: { meses: -0.05, vida: { elenco: 2, moral: -2 } },
            resultado: "Ele ficou parado e segurou. O churrasco é por sua conta.",
          },
        },
      },
      {
        texto: "Bater forte no canto",
        efeito: { vida: { elenco: 1 } },
        resultado: "Na rede. Sem graça, mas na rede.",
        sorte: {
          p: (c) => 0.6 + c.j.at.FIN / 300,
          senao: {
            efeito: { meses: -0.05, vida: { moral: -1 } },
            resultado: "Na trave. O churrasco é seu.",
          },
        },
        auto: true,
      },
      {
        texto: "Pagar o churrasco sem bater",
        efeito: { meses: -0.05, vida: { elenco: 3 } },
        resultado: "“Rico é outra coisa”, gritaram. A picanha estava ótima.",
      },
    ],
  },
  {
    id: "fa-na-porta",
    categoria: "polemica",
    titulo: "Uma fã na porta de casa",
    texto:
      "Há cinco dias a mesma moça espera na frente do seu condomínio com um cartaz. Hoje ela tentou entrar atrás do seu carro. O porteiro pergunta o que fazer.",
    peso: 2,
    intervalo: 100,
    requer: { min: { fama: 55 } },
    opcoes: [
      {
        texto: "Descer e conversar com ela com a segurança junto",
        dica: "Pode resolver; pode piorar",
        efeito: { vida: { reputacao: 2, moral: 1 } },
        resultado: "Ela só queria um autógrafo para a irmã internada. Foi embora chorando de alegria.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { imprensa: -4, moral: -3 } },
            resultado: "Ela publicou um vídeo dizendo que vocês têm um relacionamento. Não têm.",
          },
        },
      },
      {
        texto: "Pedir ao condomínio que chame a polícia",
        efeito: { vida: { imprensa: -2, moral: -1 } },
        resultado: "A viatura chegou em vinte minutos. Os sites contaram a história do jeito deles.",
      },
      {
        texto: "Ignorar e entrar pela garagem",
        efeito: { vida: { moral: -1 } },
        resultado: "Ela continua lá.",
        auto: true,
      },
    ],
  },
  {
    id: "radar-160",
    categoria: "polemica",
    titulo: "Radar a 160 km/h",
    texto:
      "A multa chegou: 160 km/h numa via de 80, às 2h14 da madrugada, com o seu carro. É suspensão da carteira na certa. O seu motorista se oferece para dizer que era ele.",
    peso: 2,
    intervalo: 80,
    opcoes: [
      {
        texto: "Assumir, pagar e ficar sem dirigir",
        efeito: {
          meses: -0.05,
          vida: { reputacao: -2, imprensa: -2 },
          gastoFixo: { motivo: "Motorista", fracao: 0.02, semanas: 26 },
        },
        resultado: "Seis meses de banco de trás. A imprensa noticiou numa nota de rodapé.",
        auto: true,
      },
      {
        texto: "Deixar o motorista assumir",
        dica: "Se descobrirem, vira escândalo",
        efeito: { vida: { moral: 1 } },
        resultado: "Ele assumiu. Você deu um bônus a ele e não tocou mais no assunto.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: {
              vida: { reputacao: -12, imprensa: -10, torcida: -6 },
              noticia: {
                texto: "Câmera mostra jogador ao volante; motorista tinha assumido a multa.",
                tipo: "ruim",
              },
            },
            resultado: "Uma câmera de posto mostrou você ao volante. A história virou fraude.",
          },
        },
      },
      {
        texto: "Contratar motorista de vez",
        efeito: { vida: { forma: 1, reputacao: 1 }, gastoFixo: { motivo: "Motorista", fracao: 0.03 } },
        resultado: "Você nunca mais dirigiu de madrugada. Nem de dia.",
      },
    ],
  },
  {
    id: "futevolei-na-praia",
    categoria: "rotina",
    titulo: "Futevôlei na folga",
    texto:
      "Domingo de sol, folga do clube e um convite para um futevôlei na praia com um ex-jogador famoso e dois campeões mundiais da modalidade. O contrato proíbe esportes de risco.",
    peso: 2,
    intervalo: 60,
    opcoes: [
      {
        texto: "Jogar",
        dica: "Diversão e vídeo bonito; o tornozelo que se cuide",
        efeito: { vida: { moral: 6, fama: 3 } },
        resultado: "Você fez um ponto de shark attack que rodou o país.",
        sorte: {
          p: 0.85,
          senao: {
            efeito: { vida: { tecnico: -8, reputacao: -4, moral: -4 }, lesao: 2 },
            resultado: "Torceu o tornozelo na areia. O departamento médico não achou graça.",
          },
        },
      },
      {
        texto: "Só assistir com uma água de coco",
        efeito: { vida: { moral: 2 } },
        resultado: "Você deu palpite de fora o jogo inteiro.",
        auto: true,
      },
      {
        texto: "Ficar em casa descansando",
        efeito: { vida: { forma: 2 }, marcar: { descansado: 2 } },
        resultado: "Sofá, ar-condicionado e jogo na TV.",
      },
    ],
  },
  {
    id: "insonia-antes-do-jogo",
    categoria: "saude",
    titulo: "Três da manhã, olho aberto",
    texto:
      "Véspera de jogo, hotel da concentração. Três da manhã e você ainda está contando as manchas do teto. O médico deixou um comprimido para dormir na mesa de cabeceira, “só se precisar”.",
    peso: 3,
    intervalo: 30,
    opcoes: [
      {
        texto: "Tomar o comprimido",
        dica: "Dorme; pode acordar grogue",
        efeito: { vida: { forma: 1 } },
        resultado: "Você dormiu como pedra e acordou novo.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { vida: { moral: -2 }, marcar: { cansado: 2 } },
            resultado: "Dormiu, mas acordou com a cabeça pesada até o aquecimento.",
          },
        },
      },
      {
        texto: "Ouvir aquela meditação guiada",
        efeito: { vida: { moral: 2 }, marcar: { focado: 2 } },
        resultado: "Você não lembra do fim da meditação. Bom sinal.",
        auto: true,
      },
      {
        texto: "Jogar videogame até o sono vir",
        efeito: { vida: { moral: 2, forma: -2 }, marcar: { cansado: 2 } },
        resultado: "O sono veio às cinco e meia. O despertador, às oito.",
      },
    ],
  },
  {
    id: "celular-na-concentracao",
    categoria: "treino",
    titulo: "Celular recolhido",
    texto:
      "{tecnico} decidiu recolher os celulares na concentração. Só que hoje à noite sai o resultado do exame da sua mãe, e ela disse que ligaria.",
    peso: 2,
    intervalo: 80,
    opcoes: [
      {
        texto: "Entregar o celular e pedir para o roupeiro avisar se ligarem",
        efeito: { vida: { tecnico: 3, familia: -2, moral: -2 } },
        resultado: "O roupeiro bateu na sua porta às 22h: o exame deu bom. Você dormiu em paz.",
        auto: true,
      },
      {
        texto: "Esconder um segundo celular na mala",
        dica: "Se pegarem, o técnico não esquece",
        efeito: { vida: { familia: 3 } },
        resultado: "Ninguém viu. Sua mãe ligou, estava tudo bem.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { tecnico: -9, elenco: -2, familia: 3 }, marcar: { barrado: 1 } },
            resultado: "O celular tocou no meio da preleção. Você começou o jogo no banco.",
          },
        },
      },
      {
        texto: "Explicar a situação ao técnico",
        dica: "Depende da relação de vocês",
        efeito: { vida: { tecnico: 3, familia: 3 } },
        resultado: "{tecnico} devolveu o celular e disse: “Família primeiro”.",
        sorte: {
          p: (c) => 0.3 + c.a.vida.tecnico / 120,
          senao: {
            efeito: { vida: { tecnico: -2, moral: -3, familia: -2 } },
            resultado: "“Regra é regra.” Você passou a noite olhando para a porta.",
          },
        },
      },
    ],
  },
  {
    id: "jantar-com-o-presidente",
    categoria: "carreira",
    titulo: "Jantar com o presidente",
    texto:
      "O presidente do {clube} convidou você para jantar no restaurante dele. Entre um vinho e outro, ele pergunta o que falta para o time ganhar alguma coisa.",
    peso: 2,
    intervalo: 70,
    requer: { min: { fama: 45 } },
    opcoes: [
      {
        texto: "Pedir reforços de verdade",
        dica: "A torcida vai saber que foi você",
        efeito: { vida: { tecnico: -3, torcida: 4, reputacao: 3, elenco: 2 } },
        resultado: "Na semana seguinte, o clube anunciou um centroavante. O técnico entendeu o recado.",
      },
      {
        texto: "Defender o técnico",
        efeito: { vida: { tecnico: 7, reputacao: 2 } },
        resultado: "O presidente anotou no guardanapo. O técnico soube no dia seguinte.",
        auto: true,
      },
      {
        texto: "Falar do seu contrato",
        dica: "Pode render; pode soar mercenário",
        efeito: { vida: { empresario: 4 }, marcar: { "renovacao-tratada": -1 } },
        resultado: "Ele riu e prometeu conversar. O empresário ficou orgulhoso.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { torcida: -4, imprensa: -3 } },
            resultado: "Vazou que você falou de dinheiro no jantar. Pegou mal.",
          },
        },
      },
    ],
  },

  // ───────────── Polêmicas da vida pessoal ─────────────
  {
    id: "ex-expoe-conversas",
    categoria: "polemica",
    titulo: "A ex expõe tudo",
    texto:
      "Às 23h, a sua ex publicou capturas de tela das conversas de vocês, com a legenda: “Pra quem acha que ele é santo”. Seu celular não para de vibrar.",
    peso: 2,
    intervalo: 90,
    requer: {
      teste: (c) =>
        (c.a.vezes?.separacao ?? 0) + (c.a.vezes?.ultimato ?? 0) + (c.a.vezes?.["conhecer-alguem"] ?? 0) > 0,
    },
    opcoes: [
      {
        texto: "Responder com as conversas inteiras",
        dica: "Pode virar o jogo; pode virar novela",
        efeito: { vida: { fama: 5, torcida: 3, moral: 2 } },
        resultado: "As conversas completas contavam outra história. A internet mudou de lado.",
        sorte: {
          p: 0.4,
          senao: {
            efeito: {
              vida: { imprensa: -10, reputacao: -8, familia: -5, moral: -5 },
              marcar: { abalado: 3 },
              noticia: { texto: "Briga de jogador com a ex nas redes vira assunto nacional.", tipo: "ruim" },
            },
            resultado: "A troca de prints durou três dias. Ninguém saiu bem, você menos ainda.",
          },
        },
      },
      {
        texto: "Entrar com processo e não dizer nada",
        efeito: { meses: -0.4, vida: { reputacao: 3, imprensa: -2, moral: -3 } },
        resultado: "Os advogados mandaram notificação. As publicações sumiram em uma semana.",
      },
      {
        texto: "Ficar em silêncio",
        efeito: { vida: { moral: -5, imprensa: -2 }, marcar: { abalado: 2 } },
        resultado: "O assunto morreu sozinho, mas não dentro de você.",
        auto: true,
      },
    ],
  },
  {
    id: "paparazzi-solteiro",
    categoria: "relacionamento",
    titulo: "Flagra com a apresentadora",
    texto:
      "Um site publicou fotos suas saindo de um restaurante com uma apresentadora de TV famosa. Vocês só se conheceram há duas semanas, mas o país já escolheu o nome do casal.",
    peso: 2,
    intervalo: 100,
    requer: { relacionamento: ["solteiro"], min: { fama: 50 } },
    opcoes: [
      {
        texto: "Assumir o namoro",
        dica: "Fama nas alturas; a vida vira pauta",
        efeito: {
          relacionamento: "namorando",
          vida: { fama: 10, moral: 6, imprensa: 4, familia: 3 },
          marcar: { namoro: null, "namoro-famoso": 52 },
          agendar: [{ evento: "ciume-publico", em: [8, 20], chance: 0.5 }],
        },
        resultado: "Foto no tapete vermelho e meio milhão de seguidores novos em uma noite.",
      },
      {
        texto: "Dizer que são só amigos",
        efeito: { vida: { fama: 3, imprensa: 1 } },
        resultado: "Ninguém acreditou, mas o assunto esfriou.",
        auto: true,
      },
      {
        texto: "Parar de ver ela",
        efeito: { vida: { moral: -3, reputacao: 1 } },
        resultado: "Ela entendeu. As fotos ficaram.",
      },
    ],
  },
  {
    id: "paparazzi-comprometido",
    categoria: "polemica",
    titulo: "Fotos que não deviam existir",
    texto:
      "Um colunista diz ter fotos suas jantando com uma influenciadora num restaurante discreto. Em casa, ninguém sabia desse jantar. A coluna sai amanhã às 7h.",
    peso: 2,
    intervalo: 90,
    requer: { relacionamento: comprometido, min: { fama: 45 } },
    opcoes: [
      {
        texto: "Contar tudo em casa antes da coluna sair",
        dica: "Uma noite difícil, mas é você quem conta",
        efeito: { vida: { familia: -6, moral: -4, reputacao: 2 } },
        resultado: "Foi uma conversa longa. De manhã, vocês leram a coluna juntos.",
        sorte: {
          p: (c) => 0.35 + c.a.vida.familia / 150,
          senao: {
            efeito: {
              vida: { familia: -14, moral: -8 },
              agendar: [{ evento: "separacao", em: [2, 6], chance: 0.55 }],
            },
            resultado: "A conversa terminou com a porta do quarto trancada.",
          },
        },
      },
      {
        texto: "Dizer que foi um jantar de trabalho",
        dica: "Se surgirem mais fotos, acabou",
        efeito: { vida: { imprensa: -3 } },
        resultado: "A versão colou. A influenciadora confirmou que era “sobre uma campanha”.",
        sorte: {
          p: 0.45,
          senao: {
            efeito: {
              vida: { familia: -10, imprensa: -8, reputacao: -6 },
              marcar: { caso: 20 },
              agendar: [{ evento: "traicao-descoberta", em: [1, 2], chance: 1 }],
            },
            resultado: "Saiu uma segunda foto, bem menos “de trabalho”.",
          },
        },
      },
      {
        texto: "Pedir ao empresário para comprar as fotos",
        dica: "Caro, e o colunista não esquece",
        efeito: { meses: -1.5, vida: { empresario: -3 } },
        resultado: "As fotos sumiram. O colunista agora te cumprimenta pelo nome.",
        auto: true,
      },
    ],
  },
  {
    id: "ciume-publico",
    categoria: "relacionamento",
    titulo: "Ciúme ao vivo",
    texto:
      "Num programa de TV, perguntaram para a sua namorada famosa sobre um ex dela. Ela riu e disse que “ele beijava melhor”. O vídeo está em todo lugar e o seu vestiário não perdoa.",
    agendado: true,
    requer: { relacionamento: ["namorando"], marcas: ["namoro-famoso"] },
    opcoes: [
      {
        texto: "Rir junto e postar uma resposta engraçada",
        efeito: { vida: { fama: 4, moral: 2, elenco: 2, familia: 2 } },
        resultado: "Sua resposta teve mais curtidas que o vídeo original. O casal ficou mais forte.",
        auto: true,
      },
      {
        texto: "Cobrar em particular",
        efeito: { vida: { familia: -4, moral: -2 } },
        resultado: "Ela pediu desculpas, você aceitou, e os dois ficaram um pouco mais distantes.",
      },
      {
        texto: "Terminar pelas redes",
        dica: "A internet vai amar; você, nem tanto",
        efeito: {
          relacionamento: "solteiro",
          desmarcar: ["namoro", "namoro-famoso"],
          vida: { fama: 6, imprensa: -6, moral: -6, reputacao: -4 },
        },
        resultado: "Um story de doze segundos acabou com um namoro de um ano.",
      },
    ],
  },
  {
    id: "tatuagem-no-rosto",
    categoria: "polemica",
    titulo: "Tatuagem no rosto",
    texto:
      "O seu tatuador desenhou uma coroa pequena, logo abaixo do olho esquerdo. “Quem é rei, marca o rosto”, ele diz. Sua mãe já avisou que deserda.",
    peso: 2,
    intervalo: 150,
    unico: true,
    opcoes: [
      {
        texto: "Fazer a coroa",
        dica: "Assinatura forte; patrocinador conservador foge",
        efeito: { vida: { fama: 6, moral: 4, reputacao: -4, familia: -3 } },
        resultado: "Virou a sua marca. Duas empresas desistiram de você; uma de streetwear apareceu.",
      },
      {
        texto: "Fazer no braço, onde a camisa cobre",
        efeito: { vida: { fama: 2, moral: 2 } },
        resultado: "Ficou bonita e discreta. Sua mãe aprovou com ressalvas.",
        auto: true,
      },
      {
        texto: "Não fazer",
        efeito: { vida: { familia: 2 } },
        resultado: "O tatuador guardou o desenho “para quando você ganhar a Bola de Ouro”.",
      },
    ],
  },
  {
    id: "tatuagem-do-nome",
    categoria: "relacionamento",
    titulo: "O nome dela na pele",
    texto:
      "Seis meses de namoro e você está decidido: o nome dela, em letra cursiva, no peito, do lado do coração. O tatuador pergunta se você tem certeza. Duas vezes.",
    peso: 2,
    intervalo: 150,
    requer: { relacionamento: ["namorando"] },
    opcoes: [
      {
        texto: "Fazer a tatuagem",
        dica: "Prova de amor... enquanto durar",
        efeito: { vida: { familia: 8, moral: 4, fama: 1 }, marcar: { "tatuou-nome": null } },
        resultado: "Ela chorou quando viu. O vestiário fez uma reunião para debater a sua sanidade.",
      },
      {
        texto: "Fazer a data em que vocês se conheceram",
        efeito: { vida: { familia: 5, moral: 2 } },
        resultado: "Mais discreta. E números, ao contrário de nomes, não terminam namoro.",
        auto: true,
      },
      {
        texto: "Desistir na cadeira",
        efeito: { vida: { familia: -2 } },
        resultado: "Você saiu do estúdio com um adesivo de coração. Ela achou fofo, por enquanto.",
      },
    ],
  },
  {
    id: "cobrir-tatuagem",
    categoria: "relacionamento",
    titulo: "O nome que ficou",
    texto:
      "O namoro acabou, mas o nome dela continua no seu peito, em letra cursiva. No vestiário, alguém colou um esparadrapo em cima com a palavra “ex”.",
    peso: 6,
    intervalo: 200,
    requer: { relacionamento: ["solteiro"], marcas: ["tatuou-nome"] },
    opcoes: [
      {
        texto: "Cobrir com um leão enorme",
        efeito: { meses: -0.1, vida: { moral: 4 }, desmarcar: ["tatuou-nome"] },
        resultado: "Ficou um leão muito bravo. Ninguém sabe o que tem por baixo.",
        auto: true,
      },
      {
        texto: "Deixar como está",
        dica: "Faz parte da sua história",
        efeito: { vida: { moral: -2, fama: 2 } },
        resultado: "Virou tema de entrevista. Você responde: “Faz parte”.",
      },
      {
        texto: "Remover a laser",
        efeito: { meses: -0.2, vida: { moral: 1, forma: -1 }, desmarcar: ["tatuou-nome"] },
        resultado: "Dez sessões, dor de verdade e uma lição sobre letras cursivas.",
      },
    ],
  },
  {
    id: "post-antigo",
    categoria: "polemica",
    titulo: "O post de 2019",
    texto:
      "Alguém desenterrou um post seu de quando você tinha 15 anos: uma piada preconceituosa, com erro de português e tudo. Já tem hashtag pedindo a sua cabeça.",
    peso: 2,
    intervalo: 200,
    unico: true,
    requer: { min: { fama: 45 } },
    opcoes: [
      {
        texto: "Pedir desculpas de verdade, sem “mas”",
        efeito: { vida: { imprensa: 3, reputacao: -2, torcida: -1 } },
        resultado:
          "Você gravou um vídeo sem roteiro. A maioria aceitou; quem não aceitou, não aceitaria nunca.",
        auto: true,
      },
      {
        texto: "Dizer que a conta foi hackeada",
        dica: "Em 2019? Difícil de colar",
        efeito: { vida: { imprensa: -2 } },
        resultado: "Por algum milagre, colou.",
        sorte: {
          p: 0.2,
          senao: {
            efeito: {
              vida: { imprensa: -12, reputacao: -10, torcida: -6 },
              noticia: {
                texto: "Jogador diz que foi hackeado em 2019; prints mostram o contrário.",
                tipo: "ruim",
              },
            },
            resultado: "Apareceram mais três posts da mesma época. A mentira virou a manchete.",
          },
        },
      },
      {
        texto: "Apagar a conta e sumir das redes",
        efeito: { vida: { fama: -5, imprensa: -5, moral: -2 } },
        resultado: "Você sumiu. O assunto ficou.",
      },
    ],
  },
  {
    id: "casa-de-apostas",
    categoria: "dinheiro",
    titulo: "Casa de apostas quer você",
    texto:
      "Uma casa de apostas oferece um contrato de garoto-propaganda que paga mais que o seu salário no clube. O roteiro do comercial termina com você piscando e dizendo: “Aposta que dá”.",
    peso: 2,
    intervalo: 100,
    requer: { min: { fama: 50 } },
    opcoes: [
      {
        texto: "Assinar",
        dica: "Dinheiro alto; imagem arranhada",
        efeito: {
          meses: 8,
          vida: { reputacao: -7, imprensa: -3, empresario: 6 },
          marcar: { "garoto-bet": 52 },
          agendar: [{ evento: "proposta-de-cartao", em: [6, 20], chance: 0.35 }],
        },
        resultado: "O comercial passa no intervalo de todos os jogos, inclusive dos seus.",
      },
      {
        texto: "Topar só uma campanha de jogo responsável",
        efeito: { meses: 2, vida: { reputacao: 1, imprensa: 2 } },
        resultado: "Menos dinheiro, nenhuma piscadinha. A campanha ganhou prêmio.",
      },
      {
        texto: "Recusar",
        efeito: { vida: { reputacao: 3, empresario: -3 } },
        resultado: "Seu empresário fez as contas em voz alta. Você não mudou de ideia.",
        auto: true,
      },
    ],
  },
  {
    id: "proposta-de-cartao",
    categoria: "polemica",
    titulo: "Um amarelo por dinheiro",
    texto:
      "Um homem que você nunca viu te aborda na saída de um restaurante: R$ 500 mil em dinheiro vivo se você levar um cartão amarelo no primeiro tempo do próximo jogo. “Ninguém sai machucado.”",
    peso: 1,
    intervalo: 200,
    requer: { idade: [19, 36] },
    capital: true,
    opcoes: [
      {
        texto: "Recusar e denunciar ao clube e à polícia",
        dica: "O certo; pode atrair gente perigosa",
        efeito: {
          vida: { reputacao: 10, imprensa: 6, torcida: 4, moral: -2 },
          agendar: [{ evento: "ameaca-apostador", em: [2, 8], chance: 0.3 }],
          noticia: { texto: "Jogador denuncia tentativa de aliciamento por apostadores.", tipo: "bom" },
        },
        resultado: "A polícia abriu inquérito. O clube elogiou publicamente a sua atitude.",
        auto: true,
      },
      {
        texto: "Recusar e esquecer o assunto",
        efeito: { vida: { moral: -1 } },
        resultado: "Você mudou de calçada e não olhou para trás.",
      },
      {
        texto: "Aceitar",
        dica: "Dinheiro fácil. Será?",
        efeito: {
          meses: 4,
          vida: { vicios: 4, moral: -3 },
          marcar: { "aceitou-esquema": 104 },
          agendar: [{ evento: "operacao-policial", em: [8, 30], chance: 0.6 }],
        },
        resultado: "No primeiro tempo, uma falta boba e o amarelo. Na mala do carro, um envelope pesado.",
      },
    ],
  },
  {
    id: "operacao-policial",
    categoria: "polemica",
    titulo: "Operação às 6h da manhã",
    texto:
      "A campainha tocou às 6h: polícia federal, mandado de busca e o seu nome numa investigação sobre manipulação de resultados. As câmeras da TV já estão no portão.",
    agendado: true,
    capital: true,
    requer: { marcas: ["aceitou-esquema"] },
    opcoes: [
      {
        texto: "Colaborar e confessar",
        dica: "Punição menor, carreira marcada",
        efeito: {
          meses: -6,
          suspensao: 12,
          vida: { reputacao: -25, imprensa: -15, torcida: -15, moral: -15, tecnico: -10 },
          desmarcar: ["aceitou-esquema"],
          noticia: {
            texto: "Jogador confessa participação em esquema de apostas e é suspenso.",
            tipo: "ruim",
          },
        },
        resultado: "Doze jogos de suspensão, multa pesada e um pedido de desculpas que ninguém quis ouvir.",
        auto: true,
      },
      {
        texto: "Negar tudo e contratar o melhor advogado",
        dica: "Se as provas forem fracas, você escapa",
        efeito: { meses: -3, vida: { imprensa: -8, moral: -8 }, desmarcar: ["aceitou-esquema"] },
        resultado: "O inquérito foi arquivado por falta de provas. A dúvida vai te acompanhar para sempre.",
        sorte: {
          p: 0.35,
          senao: {
            efeito: {
              meses: -10,
              suspensao: 30,
              vida: { reputacao: -35, imprensa: -20, torcida: -20, moral: -20, tecnico: -15 },
              desmarcar: ["aceitou-esquema"],
              noticia: { texto: "Mensagens derrubam a defesa e jogador pega longa suspensão.", tipo: "ruim" },
            },
            resultado: "As mensagens do seu celular estavam no processo. Suspensão longa e multa enorme.",
          },
        },
      },
    ],
  },
  {
    id: "ameaca-apostador",
    categoria: "polemica",
    titulo: "Recado no para-brisa",
    texto:
      "Um bilhete no para-brisa do seu carro, no estacionamento do CT: “Quem fala demais aprende a ficar quieto”. A câmera do estacionamento estava desligada.",
    agendado: true,
    opcoes: [
      {
        texto: "Contratar segurança e seguir a vida",
        efeito: {
          vida: { moral: -3, familia: -2 },
          gastoFixo: { motivo: "Segurança", fracao: 0.05, semanas: 26 },
        },
        resultado: "Dois seguranças, carro blindado e a sensação de nunca estar sozinho.",
        auto: true,
      },
      {
        texto: "Levar o bilhete a público",
        dica: "Proteção pela exposição",
        efeito: { vida: { reputacao: 4, imprensa: 5, moral: -2, familia: -4 } },
        resultado:
          "O sindicato dos atletas e o clube saíram em sua defesa. O bilhete foi parar no inquérito.",
      },
    ],
  },
  {
    id: "suplemento-milagroso",
    categoria: "saude",
    titulo: "O suplemento do personal",
    texto:
      "O seu personal trainer particular trouxe um pote sem rótulo: “Natural, importado, todo mundo da Europa usa. Em duas semanas você voa.” O médico do clube não sabe que esse pote existe.",
    peso: 2,
    intervalo: 100,
    opcoes: [
      {
        texto: "Tomar",
        dica: "Pode funcionar; tem antidoping no caminho",
        efeito: {
          vida: { forma: 6 },
          treino: 3,
          marcar: { inspirado: 3 },
          agendar: [{ evento: "antidoping", em: [2, 8], chance: 0.4 }],
        },
        resultado: "Você nunca se sentiu tão leve num treino.",
      },
      {
        texto: "Levar o pote ao médico do clube",
        efeito: { vida: { tecnico: 2, reputacao: 2 } },
        resultado: "O médico leu o laudo e ficou pálido: substância proibida. Você demitiu o personal.",
        auto: true,
      },
      {
        texto: "Recusar e não tocar no assunto",
        efeito: {},
        resultado: "O pote ficou na mochila do personal.",
      },
    ],
  },
  {
    id: "antidoping",
    categoria: "saude",
    titulo: "Exame antidoping",
    texto:
      "O resultado do antidoping depois do último jogo chegou ao clube: positivo para uma substância proibida.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Assumir que tomou o suplemento",
        dica: "Suspensão menor por boa-fé",
        efeito: {
          suspensao: 8,
          vida: { reputacao: -14, imprensa: -10, torcida: -8, moral: -10 },
          noticia: { texto: "Jogador é suspenso após antidoping positivo e culpa suplemento.", tipo: "ruim" },
        },
        resultado: "Oito jogos de suspensão. Você passou a treinar sozinho, ouvindo os jogos pelo rádio.",
        auto: true,
      },
      {
        texto: "Pedir a contraprova",
        dica: "Uma chance pequena de erro do laboratório",
        efeito: { vida: { reputacao: 4, moral: 6 } },
        resultado: "A contraprova deu negativo: contaminação na amostra. Absolvido.",
        sorte: {
          p: 0.15,
          senao: {
            efeito: {
              suspensao: 16,
              meses: -1,
              vida: { reputacao: -20, imprensa: -14, torcida: -12, moral: -14 },
              noticia: { texto: "Contraprova confirma doping e suspensão de jogador dobra.", tipo: "ruim" },
            },
            resultado: "A contraprova confirmou. A suspensão dobrou.",
          },
        },
      },
    ],
  },
  {
    id: "confusao-na-boate",
    categoria: "polemica",
    titulo: "Confusão na boate",
    texto:
      "Na pista, um sujeito esbarra em você de propósito pela terceira vez, com o celular filmando: “E aí, craque, vai fazer o quê?”. Os amigos dele riem atrás.",
    peso: 2,
    intervalo: 60,
    requer: { teste: (c) => c.a.vida.vicios >= 18 || (c.a.marcas.baladeiro ?? -1) >= c.a.semana },
    opcoes: [
      {
        texto: "Pegar o casaco e ir embora",
        efeito: { vida: { reputacao: 3, moral: -2 } },
        resultado: "Você saiu sem olhar para trás. O vídeo dele terminou com você indo embora.",
        auto: true,
      },
      {
        texto: "Chamar os seguranças",
        efeito: { vida: { moral: -1 } },
        resultado: "Os seguranças retiraram o grupo. A noite acabou ali.",
      },
      {
        texto: "Partir para cima",
        dica: "É exatamente o que ele quer",
        efeito: { vida: { moral: 3, torcida: 2 } },
        resultado: "Um empurrão, e os seguranças separaram antes de virar briga. O vídeo não pegou nada.",
        sorte: {
          p: 0.3,
          senao: {
            efeito: {
              vida: { reputacao: -14, imprensa: -12, tecnico: -9, torcida: -5 },
              marcar: { barrado: 2 },
              noticia: { texto: "Vídeo mostra jogador em briga dentro de boate.", tipo: "ruim" },
            },
            resultado: "O vídeo tem 40 segundos e não favorece você. O clube te afastou por dois jogos.",
          },
        },
      },
    ],
  },
  {
    id: "blitz-da-lei-seca",
    categoria: "polemica",
    titulo: "Blitz na volta da festa",
    texto:
      "Três da manhã, volta da festa. Uma blitz da Lei Seca no meio da avenida. O agente reconhece você antes de pedir os documentos e sorri: “Sopra aqui, craque”.",
    peso: 2,
    intervalo: 80,
    requer: { teste: (c) => c.a.vida.vicios >= 22 || (c.a.marcas.baladeiro ?? -1) >= c.a.semana },
    opcoes: [
      {
        texto: "Fazer o teste do bafômetro",
        dica: "Depende de quanto você bebeu",
        efeito: { vida: { reputacao: 2 } },
        resultado: "Zero. O agente pediu uma foto e liberou.",
        sorte: {
          p: (c) => 1 - c.a.vida.vicios / 70,
          senao: {
            efeito: {
              meses: -0.3,
              vida: { reputacao: -15, imprensa: -12, torcida: -8, familia: -6, tecnico: -6 },
              gastoFixo: { motivo: "Motorista", fracao: 0.03, semanas: 52 },
              noticia: {
                texto: "Jogador é flagrado dirigindo alcoolizado em blitz da Lei Seca.",
                tipo: "ruim",
              },
            },
            resultado: "Positivo. Carteira suspensa, carro guinchado e o seu nome em todos os jornais.",
          },
        },
      },
      {
        texto: "Recusar o teste",
        efeito: {
          meses: -0.3,
          vida: { reputacao: -7, imprensa: -7 },
          gastoFixo: { motivo: "Motorista", fracao: 0.03, semanas: 52 },
        },
        resultado: "Recusar também tira a carteira. E a manchete foi sobre a recusa.",
        auto: true,
      },
      {
        texto: "“Você sabe com quem está falando?”",
        dica: "Péssima ideia",
        efeito: { vida: { moral: 1 } },
        resultado: "O agente ficou constrangido e liberou. Você foi para casa sem acreditar.",
        sorte: {
          p: 0.1,
          senao: {
            efeito: {
              meses: -0.5,
              vida: { reputacao: -20, imprensa: -16, torcida: -12, familia: -8, tecnico: -8 },
              marcar: { barrado: 2 },
              noticia: { texto: "Jogador dá “carteirada” em blitz e vídeo revolta o país.", tipo: "ruim" },
            },
            resultado: "Um agente filmou tudo. A frase virou meme e o clube te afastou.",
          },
        },
      },
    ],
  },
  {
    id: "chantagem",
    categoria: "polemica",
    titulo: "Chantagem",
    texto:
      "Uma mensagem de um número desconhecido: fotos suas de uma noite que você preferia esquecer, e um pedido de dinheiro para elas não chegarem à imprensa. Prazo: 48 horas.",
    peso: 2,
    intervalo: 120,
    requer: {
      teste: (c) =>
        (c.a.marcas.caso ?? -1) >= c.a.semana ||
        (c.a.marcas.baladeiro ?? -1) >= c.a.semana ||
        c.a.vida.vicios >= 30,
    },
    opcoes: [
      {
        texto: "Pagar e torcer para acabar",
        dica: "Quem chantageia uma vez...",
        efeito: { meses: -2, vida: { moral: -4 } },
        resultado: "O número sumiu. Por enquanto.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: {
              meses: -2,
              vida: { moral: -6 },
              agendar: [{ evento: "chantagem", em: [6, 14], chance: 0.6 }],
            },
            resultado: "Dois meses depois, o mesmo número: “Agora o dobro”.",
          },
        },
      },
      {
        texto: "Ir à polícia",
        dica: "Pode prender o chantagista; as fotos podem vazar",
        efeito: { vida: { reputacao: 4, moral: 2 } },
        resultado: "A polícia rastreou o número e prendeu o chantagista em flagrante.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { familia: -10, imprensa: -10, fama: 5, moral: -8 } },
            resultado: "Prenderam o sujeito, mas antes ele mandou as fotos para três sites.",
          },
        },
        auto: true,
      },
      {
        texto: "Contar tudo publicamente antes dele",
        efeito: { vida: { familia: -6, imprensa: 2, reputacao: 3, moral: -3 } },
        resultado: "Sem segredo, não tem chantagem. Doeu, mas acabou.",
      },
    ],
  },
  {
    id: "parcas-em-casa",
    categoria: "polemica",
    titulo: "Os parças se mudaram",
    texto:
      "Cinco amigos de infância vieram passar um fim de semana na sua casa. Isso foi há dois meses. Tem colchão na sala, churrasco toda noite e um deles já se apresenta como seu “assessor”.",
    peso: 3,
    intervalo: 90,
    requer: { idade: [18, 30] },
    opcoes: [
      {
        texto: "Deixar ficar, amigo é amigo",
        dica: "Moral alta; casa sem regra",
        efeito: {
          vida: { moral: 5, vicios: 4, familia: -2 },
          gastoFixo: { motivo: "Parças", fracao: 0.06, semanas: 40 },
          marcar: { parcas: 40 },
          agendar: [{ evento: "festa-dos-parcas", em: [3, 10], chance: 0.55 }],
        },
        resultado: "A casa nunca está vazia. O silêncio também não.",
      },
      {
        texto: "Arrumar emprego para eles no seu instituto",
        efeito: {
          vida: { moral: 2, reputacao: 2, familia: 1 },
          gastoFixo: { motivo: "Instituto (parças)", fracao: 0.04, semanas: 52 },
        },
        resultado: "Dois viraram professores na escolinha. Três voltaram para casa com passagem paga.",
        auto: true,
      },
      {
        texto: "Mandar todo mundo embora",
        dica: "Eles sabem muita coisa sobre você",
        efeito: {
          vida: { moral: -5, familia: 3 },
          agendar: [{ evento: "parca-fala", em: [4, 12], chance: 0.35 }],
        },
        resultado: "Saíram com raiva. Um deles disse que você mudou.",
      },
    ],
  },
  {
    id: "festa-dos-parcas",
    categoria: "polemica",
    titulo: "A festa na sua casa virou notícia",
    texto:
      "Os parças deram uma festa na sua casa enquanto você estava concentrado. Vizinhos chamaram a polícia às 4h e um vídeo mostra a piscina cheia de gente que você nunca viu.",
    agendado: true,
    requer: { marcas: ["parcas"] },
    opcoes: [
      {
        texto: "Botar todo mundo para fora no mesmo dia",
        efeito: { vida: { moral: -4, reputacao: 4, familia: 3, vicios: -4 }, desmarcar: ["parcas"] },
        resultado: "Você trocou a senha do portão e do wi-fi. A casa ficou grande de novo.",
        auto: true,
      },
      {
        texto: "Assumir a culpa pelos amigos",
        efeito: { vida: { imprensa: -6, torcida: -5, tecnico: -4, moral: 2 } },
        resultado: "Os parças te chamam de irmão. O técnico te chama para conversar.",
      },
      {
        texto: "Dizer que não sabia de nada",
        efeito: { vida: { imprensa: -3, moral: -2 } },
        resultado: "Ninguém acredita que o dono da casa não sabia. Mas é verdade.",
      },
    ],
  },
  {
    id: "parca-fala",
    categoria: "polemica",
    titulo: "O ex-amigo dá entrevista",
    texto:
      "Um dos parças que você mandou embora deu entrevista a um podcast de fofoca: três horas falando da sua vida, das suas namoradas e das suas noites.",
    agendado: true,
    opcoes: [
      {
        texto: "Processar",
        efeito: { meses: -0.4, vida: { reputacao: 2, imprensa: -3, moral: -3 } },
        resultado: "O episódio saiu do ar. Os cortes, não.",
        auto: true,
      },
      {
        texto: "Ligar para ele",
        dica: "Pode reatar; pode virar mais um episódio",
        efeito: { vida: { moral: 4, reputacao: 2 } },
        resultado: "Ele chorou no telefone e pediu desculpas. Gravou outro episódio, agora te defendendo.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { imprensa: -8, moral: -6 } },
            resultado: "Ele gravou a ligação e publicou como “episódio bônus”.",
          },
        },
      },
      {
        texto: "Não ouvir e não responder",
        efeito: { vida: { moral: -2, imprensa: -2 } },
        resultado: "Você não ouviu. Todo mundo que você conhece ouviu.",
      },
    ],
  },
  {
    id: "pai-quer-ser-empresario",
    categoria: "familia",
    titulo: "Seu pai quer ser seu empresário",
    texto:
      "No almoço de domingo, seu pai anuncia: largou o emprego, fez um curso on-line de agente FIFA e quer cuidar da sua carreira. “Ninguém vai te roubar mais.”",
    peso: 2,
    intervalo: 200,
    unico: true,
    opcoes: [
      {
        texto: "Aceitar e demitir o empresário atual",
        dica: "Família no comando; mercado desconfiado",
        efeito: {
          vida: { familia: 10, empresario: -20, moral: 3 },
          marcar: { "pai-empresario": null },
          agendar: [{ evento: "pai-briga-com-diretoria", em: [10, 30], chance: 0.55 }],
        },
        resultado: "Seu pai mandou fazer cartão de visita dourado.",
      },
      {
        texto: "Dar um cargo de conselheiro, sem caneta",
        efeito: {
          meses: -0.2,
          vida: { familia: 5, empresario: -2 },
          gastoFixo: { motivo: "Salário do pai", fracao: 0.03 },
        },
        resultado: "Ele participa das reuniões, opina sobre tudo e não assina nada.",
        auto: true,
      },
      {
        texto: "Dizer não",
        efeito: { vida: { familia: -9, moral: -3 } },
        resultado: "Ele terminou o almoço calado e foi embora sem sobremesa.",
      },
    ],
  },
  {
    id: "pai-briga-com-diretoria",
    categoria: "empresario",
    titulo: "Seu pai brigou com a diretoria",
    texto:
      "Numa reunião sobre renovação, seu pai bateu na mesa, chamou o diretor de “amador” e saiu dizendo que você vai embora de graça no fim do contrato. O clube quer saber se isso é verdade.",
    agendado: true,
    requer: { marcas: ["pai-empresario"] },
    opcoes: [
      {
        texto: "Pedir desculpas ao clube e voltar ao empresário antigo",
        efeito: { vida: { familia: -10, empresario: 15, tecnico: 2 }, desmarcar: ["pai-empresario"] },
        resultado: "Seu pai ficou dois meses sem falar com você. O mercado respirou aliviado.",
        auto: true,
      },
      {
        texto: "Bancar o pai",
        dica: "A diretoria não esquece",
        efeito: { vida: { familia: 8, torcida: -5, tecnico: -4 }, marcar: { "sem-renovacao": 60 } },
        resultado: "Você confirmou: sai no fim do contrato. A torcida já canta o seu nome com menos vontade.",
      },
    ],
  },
  {
    id: "oferta-na-igreja",
    categoria: "familia",
    titulo: "A oferta especial",
    texto:
      "O pastor da igreja da sua família pediu uma “oferta especial” para a construção do novo templo, no culto de domingo, na frente de todos. Sua mãe olha para você.",
    peso: 2,
    intervalo: 120,
    opcoes: [
      {
        texto: "Doar alto",
        efeito: { meses: -1.5, vida: { familia: 6, moral: 5 } },
        resultado: "A nova igreja vai ter uma placa com o seu nome na entrada.",
        auto: true,
      },
      {
        texto: "Doar o que acha justo, sem plateia",
        efeito: { meses: -0.2, vida: { familia: 2, moral: 2 } },
        resultado: "Você deixou um envelope na secretaria na segunda-feira.",
      },
      {
        texto: "Dizer que a sua fé não se mede em dinheiro",
        efeito: { vida: { familia: -5, reputacao: 1 } },
        resultado: "O almoço depois do culto foi silencioso.",
      },
    ],
  },
  {
    id: "moeda-digital",
    categoria: "dinheiro",
    titulo: "Uma moeda digital com o seu nome",
    texto:
      "Uma empresa de tecnologia quer lançar uma moeda digital com o seu rosto: “Os torcedores compram, a moeda sobe, todo mundo ganha”. Você fica com 20% das moedas.",
    peso: 2,
    intervalo: 200,
    unico: true,
    requer: { min: { fama: 55 } },
    opcoes: [
      {
        texto: "Lançar",
        dica: "Pode ficar rico; pode virar réu",
        efeito: { meses: 6, vida: { fama: 4, empresario: 4 } },
        resultado: "A moeda subiu 900% na primeira semana e você vendeu a sua parte no topo.",
        sorte: {
          p: 0.3,
          senao: {
            efeito: {
              vida: { reputacao: -16, imprensa: -12, torcida: -10 },
              meses: -1,
              noticia: {
                texto: "Moeda digital de jogador despenca e torcedores falam em golpe.",
                tipo: "ruim",
              },
            },
            resultado: "A moeda caiu 98% em três dias. Os torcedores que compraram querem explicações.",
          },
        },
      },
      {
        texto: "Recusar",
        efeito: { vida: { reputacao: 2 } },
        resultado: "Seis meses depois, os donos da empresa sumiram. Você sorriu ao ler a notícia.",
        auto: true,
      },
    ],
  },
  {
    id: "harmonizacao",
    categoria: "polemica",
    titulo: "Harmonização facial",
    texto:
      "Metade do vestiário fez harmonização facial nas férias. O mesmo doutor oferece a você “um ajuste no queixo, nada demais”, de graça, em troca de um post.",
    peso: 2,
    intervalo: 200,
    unico: true,
    opcoes: [
      {
        texto: "Fazer",
        dica: "Pode ficar bom; pode virar meme",
        efeito: { vida: { fama: 3, moral: 4 } },
        resultado: "Ficou natural. Ninguém percebeu, o que era o objetivo.",
        sorte: {
          p: 0.55,
          senao: {
            efeito: { vida: { fama: 4, moral: -6, imprensa: -3 }, marcar: { abalado: 2 } },
            resultado:
              "O queixo ficou quadrado demais. As montagens com personagens de desenho foram cruéis.",
          },
        },
      },
      {
        texto: "Recusar",
        efeito: {},
        resultado: "Seu queixo segue sendo o seu queixo.",
        auto: true,
      },
    ],
  },
  {
    id: "ofensa-racista",
    categoria: "vestiario",
    titulo: "Ofensa na arquibancada",
    texto:
      "No segundo tempo, um torcedor atrás do gol imita um macaco para o seu companheiro de time, que congela. O árbitro não viu. O jogo segue, e o seu companheiro olha para você.",
    peso: 2,
    intervalo: 250,
    opcoes: [
      {
        texto: "Parar o jogo e levar o caso ao árbitro",
        dica: "Posição firme; o jogo vai esperar",
        efeito: {
          vida: { reputacao: 9, elenco: 9, imprensa: 6, moral: 2 },
          marcar: { "luta-antirracismo": null },
          noticia: {
            texto: "Jogadores param partida após ofensa racista e torcedor é identificado.",
            tipo: "bom",
          },
        },
        resultado:
          "O jogo parou por oito minutos. O torcedor foi identificado e preso. O abraço do seu companheiro você não esquece.",
        auto: true,
      },
      {
        texto: "Registrar na súmula depois do jogo",
        efeito: { vida: { reputacao: 3, elenco: 3 } },
        resultado: "O caso foi ao tribunal. O seu companheiro agradeceu, mas queria que fosse na hora.",
      },
      {
        texto: "Seguir o jogo",
        efeito: { vida: { elenco: -8, reputacao: -5, moral: -3 } },
        resultado: "Você continuou correndo. No vestiário, o seu companheiro não olhou para você.",
      },
    ],
  },
  {
    id: "organizada-na-porta",
    categoria: "polemica",
    titulo: "A organizada na porta do CT",
    texto:
      "Depois da sequência ruim, uns quarenta torcedores de uniforme esperam na porta do CT. Pedem para falar com “os medalhões”. Seu nome está numa das faixas.",
    peso: 3,
    intervalo: 50,
    requer: { max: { torcida: 42 } },
    opcoes: [
      {
        texto: "Descer e conversar",
        dica: "Pode acalmar; pode virar confusão",
        efeito: { vida: { torcida: 9, moral: 2, reputacao: 2 } },
        resultado:
          "Vinte minutos de cobrança dura e um aperto de mão. Na semana seguinte, cantaram o seu nome.",
        sorte: {
          p: 0.55,
          senao: {
            efeito: { vida: { moral: -9, forma: -2, imprensa: -4, familia: -4 }, marcar: { abalado: 3 } },
            resultado: "Empurra-empurra, um copo voando e a polícia chegando. Você saiu escoltado.",
          },
        },
      },
      {
        texto: "Sair pelos fundos",
        efeito: { vida: { torcida: -4, moral: -3 } },
        resultado: "Eles viram o seu carro saindo pelo portão dos fundos.",
        auto: true,
      },
      {
        texto: "Postar que respeita a torcida e vai responder em campo",
        efeito: { vida: { torcida: 2, imprensa: 2 }, marcar: { pressionado: 2 } },
        resultado: "O post foi bem recebido. Agora você precisa responder em campo.",
      },
    ],
  },
  {
    id: "organizada-pede-ingressos",
    categoria: "polemica",
    titulo: "A organizada pede uma força",
    texto:
      "O presidente da maior organizada do {clube} te liga: precisa de cem ingressos e “uma ajuda” para o ônibus da caravana. “A gente nunca esquece quem ajuda.”",
    peso: 2,
    intervalo: 90,
    requer: { min: { fama: 45 } },
    opcoes: [
      {
        texto: "Ajudar com ingressos e ônibus",
        dica: "Proteção nas arquibancadas; o clube não aprova",
        efeito: {
          meses: -0.3,
          vida: { torcida: 8, reputacao: -4, tecnico: -2 },
          marcar: { "amigo-da-organizada": 52 },
        },
        resultado: "Na partida seguinte, uma faixa enorme com o seu rosto.",
      },
      {
        texto: "Doar ingressos para um projeto social, não para eles",
        efeito: { meses: -0.1, vida: { reputacao: 4, torcida: -2 } },
        resultado: "Cem crianças foram ao estádio pela primeira vez.",
        auto: true,
      },
      {
        texto: "Recusar",
        efeito: { vida: { torcida: -5, reputacao: 2 } },
        resultado: "“Tá bom, craque.” A ligação terminou num tom que você não gostou.",
      },
    ],
  },
  {
    id: "festa-do-rival",
    categoria: "polemica",
    titulo: "Festa na casa do craque rival",
    texto:
      "O camisa 10 do maior rival do {clube} faz aniversário numa mansão e convidou você. Vocês jogaram juntos na seleção de base. A torcida não sabe disso — ainda.",
    peso: 2,
    intervalo: 90,
    opcoes: [
      {
        texto: "Ir",
        dica: "Amizade é amizade; torcida é torcida",
        efeito: { vida: { fama: 3, moral: 4, elenco: -1 } },
        resultado: "Ninguém postou nada. Milagre.",
        sorte: {
          p: 0.45,
          senao: {
            efeito: { vida: { torcida: -12, imprensa: -5, fama: 4 }, marcar: { pressionado: 3 } },
            resultado: "Uma foto de vocês dois abraçados, com a camisa do rival ao fundo, rodou a cidade.",
          },
        },
      },
      {
        texto: "Mandar um presente e não ir",
        efeito: { vida: { fama: 1 } },
        resultado: "Ele te mandou um áudio rindo: “Medroso”.",
        auto: true,
      },
      {
        texto: "Recusar e postar uma provocação",
        efeito: { vida: { torcida: 6, fama: 3, imprensa: -2 }, marcar: { pressionado: 2 } },
        resultado: "A torcida amou. O próximo clássico ficou mais quente.",
      },
    ],
  },
  {
    id: "pedido-no-gramado",
    categoria: "relacionamento",
    titulo: "O pedido no gramado",
    texto:
      "O anel está no bolso do agasalho há três semanas. O clube topou: depois do jogo de domingo, ela vai estar no gramado e o telão vai mostrar vocês dois.",
    peso: 3,
    intervalo: 100,
    requer: { relacionamento: ["namorando"], marcas: ["namoro"] },
    capital: true,
    opcoes: [
      {
        texto: "Pedir no gramado, com o estádio inteiro olhando",
        dica: "Inesquecível, para o bem ou para o mal",
        efeito: {
          relacionamento: "casado",
          meses: -2,
          vida: { familia: 14, moral: 10, fama: 7, torcida: 5 },
        },
        resultado: "Ela disse sim antes de você terminar a frase. O estádio inteiro aplaudiu de pé.",
        sorte: {
          p: (c) => 0.45 + c.a.vida.familia / 120,
          senao: {
            efeito: {
              relacionamento: "solteiro",
              desmarcar: ["namoro"],
              vida: { moral: -18, fama: 8, familia: -10 },
              marcar: { abalado: 4 },
            },
            resultado:
              "Ela ficou parada, com 40 mil pessoas olhando, e disse baixinho: “Aqui não”. O vídeo tem 50 milhões de visualizações.",
          },
        },
      },
      {
        texto: "Pedir num jantar a dois",
        efeito: { relacionamento: "casado", meses: -1, vida: { familia: 12, moral: 8 } },
        resultado: "Ela disse sim e só contou para a família no dia seguinte.",
        auto: true,
      },
      {
        texto: "Esperar mais um pouco",
        efeito: { vida: { familia: -2 } },
        resultado: "O anel voltou para a gaveta.",
      },
    ],
  },
  {
    id: "sogra-vem-morar",
    categoria: "familia",
    titulo: "A sogra vem morar",
    texto:
      "Sua esposa avisa, já com as malas da mãe dela no corredor: “É só até ela se recuperar da cirurgia”. A previsão de recuperação é “indefinida”.",
    peso: 2,
    intervalo: 150,
    requer: { relacionamento: ["casado"] },
    opcoes: [
      {
        texto: "Receber de braços abertos",
        efeito: { vida: { familia: 8, moral: -3 } },
        resultado: "Ela reorganizou a sua cozinha inteira e assiste aos seus jogos comentando os erros.",
        auto: true,
      },
      {
        texto: "Comprar um apartamento para ela no mesmo prédio",
        efeito: { meses: -3, vida: { familia: 10, moral: 3 } },
        resultado: "Perto, mas cada um na sua casa. Diplomacia imobiliária.",
      },
      {
        texto: "Dizer que não dá",
        efeito: { vida: { familia: -10 }, agendar: [{ evento: "crise-casal", em: [2, 8], chance: 0.5 }] },
        resultado: "A mala voltou para o carro. O clima, não.",
      },
    ],
  },
  {
    id: "vamos-ser-pais",
    categoria: "relacionamento",
    titulo: "Vocês vão ser pais",
    texto:
      "Sua companheira te espera na porta de casa com um embrulho pequeno. Dentro, um par de sapatinhos e um exame. Vocês vão ser pais.",
    peso: 2,
    intervalo: 150,
    requer: { relacionamento: comprometido, idade: [21, 36] },
    opcoes: [
      {
        texto: "Comemorar como gol em final",
        efeito: {
          vida: { familia: 12, moral: 10 },
          marcar: { "bebe-a-caminho": 40, inspirado: 2 },
          agendar: [{ evento: "nascimento", em: [20, 34], chance: 1 }],
        },
        resultado: "Você chorou, riu e ligou para a sua mãe. Nessa ordem.",
        auto: true,
      },
      {
        texto: "Ficar em choque",
        efeito: {
          vida: { familia: 4, moral: 2 },
          marcar: { "bebe-a-caminho": 40 },
          agendar: [{ evento: "nascimento", em: [20, 34], chance: 1 }],
        },
        resultado: "“Mas... agora?” Ela riu da sua cara. Você também, depois.",
      },
    ],
  },
  {
    id: "nascimento",
    categoria: "familia",
    titulo: "O bebê vai nascer hoje",
    texto:
      "A bolsa estourou às 10h. Você está no hotel da concentração e o jogo começa às 16h. O médico diz que o parto deve ser no fim da tarde.",
    agendado: true,
    capital: true,
    requer: { marcas: ["bebe-a-caminho"] },
    opcoes: [
      {
        texto: "Ir para a maternidade agora",
        dica: "Você perde o jogo; não perde o nascimento",
        efeito: {
          filho: true,
          vida: { familia: 16, moral: 10, tecnico: -3 },
          marcar: { "ausente-jogo": 1, inspirado: 3 },
          desmarcar: ["bebe-a-caminho"],
        },
        resultado: "Você cortou o cordão e esqueceu completamente que tinha jogo.",
        auto: true,
      },
      {
        texto: "Jogar e correr para lá no apito final",
        dica: "Se fizer gol, já sabe a comemoração",
        efeito: {
          filho: true,
          vida: { familia: -4, moral: 4, tecnico: 3 },
          marcar: { inspirado: 2 },
          desmarcar: ["bebe-a-caminho"],
        },
        resultado: "Você chegou à maternidade de chuteira. O bebê tinha nascido havia vinte minutos.",
      },
    ],
  },
  {
    id: "filho-sofre-na-escola",
    categoria: "familia",
    titulo: "Zoaram o seu filho na escola",
    texto:
      "Depois do seu pênalti perdido no fim de semana, os colegas passaram a semana zoando o seu filho na escola. Ele chegou em casa dizendo que não quer mais usar a sua camisa.",
    peso: 2,
    intervalo: 100,
    requer: { filhos: true },
    opcoes: [
      {
        texto: "Ir à escola falar com a turma",
        efeito: { vida: { familia: 8, moral: 3, forma: -1 } },
        resultado: "Você deu uma aula de educação física. Agora o seu filho é o mais popular da sala.",
        auto: true,
      },
      {
        texto: "Postar um desabafo",
        dica: "Pode emocionar; pode expor outras crianças",
        efeito: { vida: { familia: 3, fama: 2, imprensa: 3 } },
        resultado: "O texto emocionou o país. A escola fez uma campanha contra bullying.",
        sorte: {
          p: 0.6,
          senao: {
            efeito: { vida: { imprensa: -6, familia: -3 } },
            resultado: "Os pais dos colegas se sentiram expostos. Virou briga de grupo de WhatsApp.",
          },
        },
      },
      {
        texto: "Ensinar ele a bater pênalti",
        efeito: { vida: { familia: 6, moral: 4 } },
        resultado: "Ele bate melhor que você. Pelo menos em casa.",
      },
    ],
  },
  {
    id: "irmao-preso",
    categoria: "familia",
    titulo: "Seu irmão foi preso",
    texto:
      "Seu irmão mais novo foi preso numa confusão de trânsito que terminou em agressão. Sua mãe liga chorando. A imprensa ainda não sabe.",
    peso: 1,
    intervalo: 200,
    unico: true,
    // Só depois de o irmão já ter dado trabalho (pedido de dinheiro).
    requer: { teste: (c) => (c.a.vezes?.["irmao-dinheiro"] ?? 0) > 0 },
    opcoes: [
      {
        texto: "Pagar o melhor advogado",
        efeito: { meses: -2, vida: { familia: 8, moral: -2 } },
        resultado: "Ele respondeu em liberdade. Na saída da delegacia, os fotógrafos estavam lá.",
        auto: true,
      },
      {
        texto: "Deixar a Justiça seguir o curso",
        dica: "Princípio firme; família dividida",
        efeito: { vida: { familia: -12, reputacao: 4, moral: -4 } },
        resultado: "Ele ficou três semanas preso. Sua mãe não te perdoou ainda.",
      },
      {
        texto: "Pagar o advogado e cobrar dele uma mudança de vida",
        efeito: {
          meses: -2,
          vida: { familia: 5, moral: 1 },
          agendar: [{ evento: "irmao-dinheiro", em: [20, 40], chance: 0.3 }],
        },
        resultado: "Ele prometeu. Prometer ele sempre promete.",
      },
    ],
  },
  {
    id: "presente-de-luxo",
    categoria: "relacionamento",
    titulo: "O presente de aniversário",
    texto:
      "Faltam três dias para o aniversário dela, e no celular dela está aberta, “sem querer”, a foto de um carro importado na cor que ela ama.",
    peso: 2,
    intervalo: 100,
    requer: { relacionamento: comprometido },
    opcoes: [
      {
        texto: "Dar o carro, com laço vermelho",
        efeito: { meses: -1.5, vida: { familia: 8, moral: 3 } },
        resultado: "O vídeo da surpresa foi o mais curtido do perfil dela.",
      },
      {
        texto: "Uma viagem a dois na próxima folga",
        efeito: { meses: -0.5, vida: { familia: 7, forma: -1 } },
        resultado: "Três dias numa ilha sem sinal de celular. Vocês voltaram mais perto.",
        auto: true,
      },
      {
        texto: "“Dinheiro não cai do céu”",
        efeito: { vida: { familia: -6 }, agendar: [{ evento: "crise-casal", em: [3, 10], chance: 0.35 }] },
        resultado: "Ela riu sem achar graça.",
      },
    ],
  },
  {
    id: "mensagem-da-mulher-do-companheiro",
    categoria: "polemica",
    titulo: "A mensagem que você não devia ler",
    texto:
      "Meia-noite, uma mensagem no direct: é a esposa de um companheiro de time. “Você não sai da minha cabeça desde a festa de fim de ano.” Ele senta do seu lado no vestiário.",
    peso: 1,
    intervalo: 200,
    requer: { idade: [20, 34], min: { fama: 40 } },
    opcoes: [
      {
        texto: "Não responder e bloquear",
        efeito: { vida: { reputacao: 1 } },
        resultado: "Você bloqueou e apagou. Na manhã seguinte, o companheiro te deu bom dia como sempre.",
        auto: true,
      },
      {
        texto: "Responder",
        dica: "O vestiário é pequeno demais para segredo",
        efeito: { vida: { moral: 3, vicios: 2 }, marcar: { caso: 30 } },
        resultado: "Ninguém soube. Você passou a evitar olhar para o lado no vestiário.",
        sorte: {
          p: 0.4,
          senao: {
            efeito: {
              marcar: { caso: 30 },
              agendar: [{ evento: "vestiario-descobre", em: [1, 4], chance: 1 }],
            },
            resultado: "Ela deixou o celular desbloqueado na mesa do jantar. Ele leu tudo.",
          },
        },
      },
      {
        texto: "Mostrar a mensagem para o companheiro",
        dica: "Honesto; pode explodir mesmo assim",
        efeito: { vida: { elenco: 4, reputacao: 3 } },
        resultado: "Ele ficou em silêncio, te abraçou e disse que já desconfiava.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { elenco: -8, moral: -4 }, marcar: { abalado: 2 } },
            resultado:
              "Ele achou que você estava se defendendo antes de ser descoberto. Não fala mais com você.",
          },
        },
      },
    ],
  },
  {
    id: "vestiario-descobre",
    categoria: "polemica",
    titulo: "O vestiário descobriu",
    texto:
      "No treino, o companheiro traído entrou numa dividida para machucar. Ninguém separou na hora. O vestiário inteiro já sabe, e a imprensa está perto de saber.",
    agendado: true,
    capital: true,
    opcoes: [
      {
        texto: "Pedir ao empresário uma saída do clube",
        dica: "Recomeçar longe",
        efeito: {
          vida: { elenco: -10, moral: -8, empresario: 3 },
          marcar: { "quer-sair": 26 },
          desmarcar: ["caso"],
        },
        resultado: "O empresário já está ligando para os clubes. Até lá, você treina separado.",
      },
      {
        texto: "Pedir desculpas ao grupo",
        efeito: { vida: { elenco: -6, reputacao: -4, moral: -6, familia: -5 }, desmarcar: ["caso"] },
        resultado: "Ele não aceitou. O grupo aceitou pela metade.",
        auto: true,
      },
      {
        texto: "Encarar e não dar satisfação",
        efeito: {
          vida: { elenco: -18, tecnico: -8, imprensa: -6 },
          marcar: { barrado: 3 },
          desmarcar: ["caso"],
          noticia: {
            texto: "Clima pesado no vestiário: briga entre jogadores teria motivo pessoal.",
            tipo: "ruim",
          },
        },
        resultado: "O técnico tirou os dois do time para “preservar o grupo”.",
      },
    ],
  },
  {
    id: "acusado-de-gato",
    categoria: "polemica",
    titulo: "“Ele é gato”",
    texto:
      "Um jornalista diz num programa de TV que você tem dois anos a mais do que diz a sua certidão, e mostra uma foto sua “com barba aos 14”. O assunto pegou.",
    peso: 2,
    intervalo: 200,
    unico: true,
    requer: { idade: [17, 21], min: { fama: 35 } },
    opcoes: [
      {
        texto: "Mostrar a certidão e as fotos de bebê",
        efeito: { vida: { reputacao: 2, imprensa: 2 } },
        resultado: "Você publicou foto de bebê, da primeira comunhão e do RG. O jornalista pediu desculpas.",
        auto: true,
      },
      {
        texto: "Responder com humor: “Pelo menos me chamaram de gato”",
        efeito: { vida: { fama: 4, imprensa: 4, moral: 2 } },
        resultado: "A resposta virou camiseta.",
      },
      {
        texto: "Processar o jornalista",
        efeito: { meses: -0.3, vida: { imprensa: -6, reputacao: 1 } },
        resultado: "Ganhou na Justiça e perdeu todos os amigos da imprensa esportiva.",
      },
    ],
  },
  {
    id: "dor-antes-da-decisao",
    categoria: "saude",
    titulo: "A dor que ninguém vê",
    texto:
      "Você sente uma fisgada no tornozelo no último treino antes do jogo. Ninguém viu. Se contar ao médico, ele te tira do jogo. Se não contar...",
    peso: 2,
    intervalo: 40,
    opcoes: [
      {
        texto: "Contar ao médico",
        efeito: { vida: { tecnico: 2, forma: 3 }, marcar: { "ausente-jogo": 1 } },
        resultado: "Um jogo fora por precaução. O tornozelo agradeceu.",
        auto: true,
      },
      {
        texto: "Tomar uma infiltração e jogar",
        dica: "Resolve hoje; pode cobrar depois",
        efeito: { vida: { tecnico: 3, torcida: 2 } },
        resultado: "Você jogou sem sentir nada. Depois do jogo, sentiu tudo, mas passou.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { lesao: 6, vida: { moral: -8, tecnico: -2 } },
            resultado: "O tornozelo cedeu no aquecimento. Seis semanas fora.",
          },
        },
      },
      {
        texto: "Esconder e jogar assim mesmo",
        efeito: { marcar: { dor: 2 }, agendar: [{ evento: "lesao-grave", em: [1, 3], chance: 0.2 }] },
        resultado: "Você vai jogar no sacrifício, mancando por dentro.",
      },
    ],
  },
  {
    id: "meme-do-gol-perdido",
    categoria: "imprensa",
    titulo: "Você virou meme",
    texto:
      "O gol que você perdeu sem goleiro no último jogo virou meme: alguém colocou a cena com música de circo, e já tem até dancinha no aplicativo de vídeo.",
    peso: 3,
    intervalo: 60,
    opcoes: [
      {
        texto: "Postar o vídeo dançando a dancinha",
        dica: "Ou você ri junto, ou riem de você",
        efeito: { vida: { fama: 5, imprensa: 4, moral: 3 } },
        resultado: "Rir de si mesmo virou o melhor marketing da sua carreira.",
        sorte: {
          p: 0.7,
          senao: {
            efeito: { vida: { tecnico: -4, torcida: -4, fama: 2 } },
            resultado: "A torcida achou que você não estava levando a sério. O técnico também.",
          },
        },
      },
      {
        texto: "Fechar os comentários",
        efeito: { vida: { moral: -3 }, marcar: { abalado: 2 } },
        resultado: "Você ficou uma semana sem abrir as redes.",
        auto: true,
      },
      {
        texto: "Treinar finalização dobrado",
        efeito: { vida: { tecnico: 3 }, treino: 1, marcar: { focado: 2 } },
        resultado: "Duzentos chutes depois do treino. O goleiro reserva pediu aumento.",
      },
    ],
  },
  {
    id: "aniversario-proprio",
    categoria: "festa",
    titulo: "Seu aniversário",
    texto:
      "É o seu aniversário e cai numa folga. Sua assessoria sugere uma festa com 300 convidados, DJ e patrocinador; sua mãe sugere bolo de cenoura e a família em casa.",
    peso: 3,
    intervalo: 52,
    opcoes: [
      {
        texto: "Festão com 300 convidados",
        dica: "A noite do ano; a semana mais pesada",
        efeito: {
          meses: -1,
          vida: { fama: 5, moral: 6, forma: -5, vicios: 3 },
          marcar: { ressaca: 2, baladeiro: 8 },
          agendar: [{ evento: "foto-balada", em: [1, 2], chance: 0.3 }],
        },
        resultado: "Teve show surpresa, fogos e um bolo de seis andares em formato de chuteira.",
      },
      {
        texto: "Bolo de cenoura com a família",
        efeito: { vida: { familia: 8, moral: 3 }, marcar: { descansado: 2 } },
        resultado: "Sua avó cantou o parabéns mais alto que todo mundo.",
        auto: true,
      },
      {
        texto: "Jantar com o elenco",
        efeito: { meses: -0.2, vida: { elenco: 6, moral: 3 } },
        resultado: "Você pagou a conta. O grupo ainda fala dessa noite.",
      },
    ],
  },
  {
    id: "salto-de-paraquedas",
    categoria: "rotina",
    titulo: "Salto de paraquedas",
    texto:
      "Nas férias, um amigo marcou um salto de paraquedas duplo para vocês dois. O contrato com o clube proíbe atividades de risco. Ninguém precisa saber, ele diz.",
    peso: 2,
    intervalo: 150,
    opcoes: [
      {
        texto: "Saltar",
        dica: "Adrenalina pura; cláusula de contrato",
        efeito: { vida: { moral: 8, fama: 2 } },
        resultado: "Três minutos de queda livre e um vídeo que você assiste toda semana.",
        sorte: {
          p: 0.85,
          senao: {
            efeito: { lesao: 5, vida: { tecnico: -10, reputacao: -6, imprensa: -5, moral: -6 } },
            resultado: "Pouso torto e o joelho torcido. O clube abriu processo por quebra de contrato.",
          },
        },
      },
      {
        texto: "Ficar no chão filmando",
        efeito: { vida: { moral: 2 } },
        resultado: "Você fez o vídeo do amigo. Ficou ótimo.",
        auto: true,
      },
    ],
  },
  {
    id: "jogo-beneficente",
    categoria: "rotina",
    titulo: "Jogo beneficente com lendas",
    texto:
      "Um ídolo do futebol que você tinha em pôster no quarto convida você para o jogo beneficente de fim de ano dele. É no seu único fim de semana livre.",
    peso: 2,
    intervalo: 52,
    opcoes: [
      {
        texto: "Ir e jogar do lado do seu ídolo",
        efeito: { vida: { reputacao: 5, fama: 4, moral: 5, forma: -1, familia: -2 } },
        resultado:
          "Ele te deu um passe e disse: “Agora a gente tá quite”. Você não sabe o que ele quis dizer, mas guardou.",
        auto: true,
      },
      {
        texto: "Doar e não ir",
        efeito: { meses: -0.3, vida: { reputacao: 2 } },
        resultado: "A doação comprou cadeiras de rodas para um hospital.",
      },
      {
        texto: "Ficar com a família",
        efeito: { vida: { familia: 5, forma: 1 } },
        resultado: "Um fim de semana sem chuteira.",
      },
    ],
  },
  {
    id: "convite-para-novela",
    categoria: "imprensa",
    titulo: "Participação na novela",
    texto:
      "A novela das nove quer você numa participação especial: três cenas, um jogador que salva a mocinha de um assalto. A gravação é na sua folga.",
    peso: 2,
    intervalo: 150,
    requer: { min: { fama: 60 } },
    opcoes: [
      {
        texto: "Aceitar",
        dica: "Ator nato ou meme nacional",
        efeito: { meses: 0.5, vida: { fama: 6, moral: 3, tecnico: -2 } },
        resultado: "A cena teve mais audiência que a final do campeonato. Os críticos elogiaram.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { meses: 0.5, vida: { fama: 5, imprensa: -3, moral: -3 } },
            resultado: "Sua fala “Larga ela, meliante!” virou o meme do ano.",
          },
        },
      },
      {
        texto: "Recusar",
        efeito: { vida: { tecnico: 1 } },
        resultado: "A emissora chamou outro jogador. Ele foi muito mal.",
        auto: true,
      },
    ],
  },
  {
    id: "gravar-pagode",
    categoria: "festa",
    titulo: "Gravar um pagode",
    texto:
      "Um cantor de pagode famoso quer gravar uma música com você no refrão. O estúdio está marcado para a noite antes de um treino.",
    peso: 2,
    intervalo: 120,
    requer: { min: { fama: 45 } },
    opcoes: [
      {
        texto: "Gravar",
        dica: "Pode ser hit, pode ser vergonha",
        efeito: { meses: 1, vida: { fama: 6, moral: 5, forma: -2 } },
        resultado: "Virou hit de verão. O vestiário canta no ônibus.",
        sorte: {
          p: 0.45,
          senao: {
            efeito: { vida: { fama: 3, imprensa: -3, moral: -2, forma: -2 } },
            resultado: "Você desafinou no refrão. A versão “acapella” vazou.",
          },
        },
      },
      {
        texto: "Só aparecer no clipe",
        efeito: { vida: { fama: 3, moral: 2 } },
        resultado: "Você dança no fundo. Dançar você sabe.",
        auto: true,
      },
      {
        texto: "Recusar",
        efeito: {},
        resultado: "O cantor chamou outro jogador.",
      },
    ],
  },
  {
    id: "amigo-da-base",
    categoria: "familia",
    titulo: "O amigo que não chegou",
    texto:
      "Seu melhor amigo da base, que era melhor que você aos 15 anos, te liga. Ele largou o futebol depois de uma lesão, está desempregado e pergunta se você consegue um teste para ele em algum clube.",
    peso: 2,
    intervalo: 150,
    unico: true,
    opcoes: [
      {
        texto: "Usar o seu nome para arrumar o teste",
        dica: "Se ele for mal, o seu nome vai junto",
        efeito: { vida: { moral: 6, reputacao: 3, empresario: -2 } },
        resultado: "Ele passou no teste de um clube da Série D. Mandou foto da carteira assinada.",
        sorte: {
          p: 0.5,
          senao: {
            efeito: { vida: { moral: -2, empresario: -3 } },
            resultado: "Ele foi mal no teste. Vocês ainda se falam, mas menos.",
          },
        },
      },
      {
        texto: "Ajudar com dinheiro",
        efeito: { meses: -0.5, vida: { moral: 3 } },
        resultado: "Ele aceitou com vergonha e prometeu pagar. Você disse que não precisa.",
        auto: true,
      },
      {
        texto: "Dizer que não pode ajudar",
        efeito: { vida: { moral: -4 } },
        resultado: "Ele disse que entendia. Você não acredita que ele entendeu.",
      },
    ],
  },
  {
    id: "cassino-nas-ferias",
    categoria: "festa",
    titulo: "Cassino nas férias",
    texto:
      "Férias em Las Vegas com os amigos. Na terceira noite, um gerente do cassino oferece uma mesa privada de blackjack, limite alto, drinque por conta da casa.",
    peso: 2,
    intervalo: 150,
    opcoes: [
      {
        texto: "Sentar e apostar alto",
        dica: "Pode voltar rico; pode voltar com um vício",
        efeito: { meses: 2, vida: { moral: 6, vicios: 6 }, marcar: { jogatina: 16 } },
        resultado: "Você quebrou a banca e saiu com fichas nos bolsos. O gerente pediu uma foto.",
        sorte: {
          p: 0.35,
          senao: {
            efeito: {
              meses: -4,
              vida: { moral: -6, vicios: 8 },
              marcar: { jogatina: 16 },
              agendar: [{ evento: "divida-de-jogo", em: [2, 6], chance: 0.4 }],
            },
            resultado: "Perdeu em duas horas o que ganha em quatro meses.",
          },
        },
      },
      {
        texto: "Apostar só um pouco, por diversão",
        efeito: { vida: { moral: 3 } },
        resultado: "Perdeu o que tinha separado para perder e foi dormir.",
        auto: true,
      },
      {
        texto: "Trocar o cassino por um show",
        efeito: { vida: { moral: 4, familia: 1 } },
        resultado: "Você assistiu a um show de mágica e saiu sem entender como ele fez.",
      },
    ],
  },
  {
    id: "noticia-falsa",
    categoria: "imprensa",
    titulo: "Notícia falsa",
    texto:
      "Um site de fofoca publicou que você e {tecnico} saíram no braço no vestiário. Nunca aconteceu. Mesmo assim, a manchete tem 2 milhões de cliques.",
    peso: 3,
    intervalo: 60,
    opcoes: [
      {
        texto: "Gravar um vídeo abraçado com o técnico",
        dica: "Depende de ele topar",
        efeito: { vida: { tecnico: 4, imprensa: 4, fama: 2 } },
        resultado: "Vocês gravaram rindo. O site apagou a matéria.",
        sorte: {
          p: (c) => 0.3 + c.a.vida.tecnico / 120,
          senao: {
            efeito: { vida: { tecnico: -3, imprensa: -2 } },
            resultado: "{tecnico} disse que não grava vídeo para site de fofoca. Ficou parecendo verdade.",
          },
        },
      },
      {
        texto: "Processar o site",
        efeito: { meses: -0.2, vida: { reputacao: 2, imprensa: -2 } },
        resultado: "O site publicou uma retratação em letra minúscula.",
        auto: true,
      },
      {
        texto: "Ignorar",
        efeito: { vida: { tecnico: -2 } },
        resultado: "Na falta de desmentido, metade do país acreditou.",
      },
    ],
  },
  {
    id: "mae-na-tv",
    categoria: "familia",
    titulo: "Sua mãe na TV",
    texto:
      "Sua mãe deu entrevista num programa de domingo, contou que você fazia xixi na cama até os 9 anos e mostrou as suas fotos de criança vestido de anjo.",
    peso: 2,
    intervalo: 150,
    requer: { min: { fama: 50 } },
    opcoes: [
      {
        texto: "Ligar para ela rindo",
        efeito: { vida: { familia: 6, fama: 3, elenco: 2 } },
        resultado: "O vestiário colou a foto do anjo no seu armário. Você deixou.",
        auto: true,
      },
      {
        texto: "Pedir para ela não dar mais entrevistas",
        efeito: { vida: { familia: -6, imprensa: 1 } },
        resultado: "Ela concordou, magoada. Na semana seguinte, deu entrevista sobre a mágoa.",
      },
    ],
  },
  {
    id: "vizinhos-reclamam",
    categoria: "rotina",
    titulo: "O síndico tem uma reclamação",
    texto:
      "O síndico do condomínio mandou uma carta: o seu chute de treino na quadra do prédio quebrou o vidro do apartamento 302, pela terceira vez. A moradora quer falar com você pessoalmente.",
    peso: 2,
    intervalo: 150,
    opcoes: [
      {
        texto: "Ir lá, pagar o vidro e levar uma camisa autografada",
        efeito: { meses: -0.05, vida: { reputacao: 2, moral: 1 } },
        resultado: "Ela era torcedora do rival. Saiu de lá torcedora sua.",
        auto: true,
      },
      {
        texto: "Mandar o motorista pagar",
        efeito: { meses: -0.05 },
        resultado: "O vidro foi trocado. A moradora contou no grupo do prédio que você não apareceu.",
      },
      {
        texto: "Comprar uma casa com campo",
        dica: "Caro, mas é seu",
        efeito: { meses: -6, vida: { moral: 5, familia: 4, forma: 2 }, marcar: { "tem-campo": null } },
        resultado: "Agora você tem um campo de society nos fundos. Os vidros estão a salvo.",
      },
    ],
  },
];
