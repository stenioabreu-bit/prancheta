import { dataDoHorario } from "../competicao/calendario";
import type { EstadoTemporada } from "../competicao/temporada";
import { type Rng, limitar } from "../rng";
import type { Clube } from "../tipos";
import { gerarGarotos } from "./base";
import { membroDaFuncao } from "./comissao";
import { posicaoNaTabela } from "./diretoria";
import { enviarMensagem } from "./efeitos";
import type { EstadoCarreira } from "./tipos";
import { FOCOS, reporDesfalques, semanaDeTreino } from "./treino";

/** O que o técnico fez na rodada que acabou (para cobrar promessas e reagir). */
export interface ResumoDaRodada {
  titulares: string[];
  jogaram: string[];
  resultado: "V" | "E" | "D" | null;
  classico: boolean;
}

function cobrarPromessas(carreira: EstadoCarreira, clube: Clube, rodada: number, r: ResumoDaRodada) {
  for (const p of carreira.promessas.filter((x) => x.status === "aberta")) {
    if (p.tipo === "minutos" && p.jogadorId && r.jogaram.includes(p.jogadorId)) p.feitos++;
    if (p.tipo === "titular" && p.jogadorId && r.titulares.includes(p.jogadorId)) p.feitos++;
    if (p.tipo === "base" && r.jogaram.some((id) => clube.jogadores.find((j) => j.id === id)?.daBase))
      p.feitos++;
    const jogador = p.jogadorId ? clube.jogadores.find((j) => j.id === p.jogadorId) : undefined;
    if (p.feitos >= p.meta) {
      p.status = "cumprida";
      if (p.jogadorId) {
        if (jogador) jogador.moral = limitar(jogador.moral + 6, 0, 100);
        enviarMensagem(carreira, rodada, {
          de: p.nome,
          assunto: "Promessa cumprida",
          texto: `${p.nome} agradeceu por você ter cumprido o que prometeu.`,
        });
      } else {
        carreira.diretoria = limitar(carreira.diretoria + 5, 0, 100);
        enviarMensagem(carreira, rodada, {
          de: "Presidência",
          assunto: "Base valorizada",
          texto: "Gostamos de ver os garotos da base em campo. Bom trabalho.",
        });
      }
    } else if (rodada + 1 >= p.ate) {
      p.status = "quebrada";
      if (p.jogadorId) {
        if (jogador) jogador.moral = limitar(jogador.moral - 18, 0, 100);
        for (const lider of clube.jogadores.filter((j) => j.perso === "lider"))
          lider.moral = limitar(lider.moral - 3, 0, 100);
        enviarMensagem(carreira, rodada, {
          de: p.nome,
          assunto: "Promessa quebrada",
          texto: `${p.nome} está revoltado: você prometeu e não cumpriu. Os líderes do elenco também não gostaram.`,
        });
      } else {
        carreira.diretoria = limitar(carreira.diretoria - 8, 0, 100);
        enviarMensagem(carreira, rodada, {
          de: "Presidência",
          assunto: "Pedido ignorado",
          texto: "Pedimos espaço para a base e não fomos atendidos. Isso pesa na avaliação.",
        });
      }
    }
  }
}

/**
 * A semana depois de cada rodada: promessas, treino, desfalques, pedidos de
 * jogadores, conversa do líder após má fase, cobranças e avaliações da diretoria,
 * e uma nova leva de garotos na base a cada 10 rodadas.
 */
export function semana(carreira: EstadoCarreira, estado: EstadoTemporada, r: ResumoDaRodada, rng: Rng): void {
  if (!carreira.clubeId) return;
  const clube = estado.clubes[carreira.clubeId]!;
  const rodada = estado.rodada;
  cobrarPromessas(carreira, clube, rodada, r);

  eventoAleatorio(carreira, clube, rodada, rng);
  feriado(carreira, clube, rodada, estado.temporada);
  const treino = semanaDeTreino(carreira, clube, rng);
  const relato: string[] = treino.lesionados.map(
    (l) => `${l.nome} se machucou no treino e desfalca por ${l.rodadas} rodada(s).`,
  );
  if (treino.evoluiram.length) {
    relato.push(
      `Evoluíram nos treinos: ${treino.evoluiram.slice(0, 5).join(", ")}${treino.evoluiram.length > 5 ? " e outros" : ""}.`,
    );
  }
  for (const t of reporDesfalques(clube))
    relato.push(`${t.entrou} entra no lugar de ${t.saiu} na escalação.`);
  const auxiliar = membroDaFuncao(carreira, "auxiliar");
  enviarMensagem(carreira, rodada, {
    de: auxiliar.nome,
    assunto: `Relatório da semana · treino ${FOCOS[carreira.treino.foco].nome.toLowerCase()}`,
    texto: `${relato.join(" ") || "Semana tranquila, sem novidades."} Entrosamento no ${clube.esquema}: ${Math.round(carreira.entrosamento[clube.esquema] ?? 0)}%.`,
  });

  const insatisfeito = clube.jogadores.find(
    (j) =>
      j.ovr >= 69 &&
      j.semJogar >= 3 &&
      j.moral < 58 &&
      (j.ultimoPedido === undefined || rodada - j.ultimoPedido >= 5) &&
      !carreira.promessas.some((p) => p.jogadorId === j.id && p.status === "aberta"),
  );
  if (insatisfeito) {
    const j = insatisfeito;
    j.ultimoPedido = rodada;
    const calmo = j.perso === "veterano" || j.perso === "profissional";
    enviarMensagem(carreira, rodada, {
      de: j.nome,
      assunto: "Quer conversar sobre minutos",
      texto: `${j.nome} bateu na sua sala: está há ${j.semJogar} jogos sem entrar e quer saber qual é a dele no elenco.`,
      opcoes: [
        {
          texto: "Prometer minutos nas próximas rodadas",
          efeito: {
            jogador: { id: j.id, moral: 10 },
            promessa: { tipo: "minutos", jogadorId: j.id, nome: j.nome, meta: 2, prazo: 4 },
          },
        },
        {
          texto: "Pedir que ele espere a vez dele",
          efeito: { jogador: { id: j.id, moral: calmo ? 2 : -4 } },
        },
        {
          texto: "Dizer que ele não está nos planos",
          efeito: { jogador: { id: j.id, moral: -20 }, elenco: -1 },
        },
      ],
    });
  }

  const ultimos = carreira.historico.filter((h) => h.competicao !== "Copa do Brasil").slice(-3);
  const marcaLider = `lider${estado.temporada}-${rodada}`;
  if (
    ultimos.length === 3 &&
    ultimos.every((h) => h.golsPro < h.golsContra) &&
    carreira.marcas[marcaLider] === undefined
  ) {
    carreira.marcas[marcaLider] = rodada;
    const lider =
      clube.jogadores.filter((j) => j.perso === "lider").sort((a, b) => b.ovr - a.ovr)[0] ??
      clube.jogadores[0]!;
    enviarMensagem(carreira, rodada, {
      de: lider.nome,
      assunto: "O grupo está tenso",
      texto: `${lider.nome}, uma das lideranças, veio dizer que o vestiário está pesado depois de três derrotas seguidas.`,
      opcoes: [
        { texto: "Vou conversar com todo mundo", efeito: { elenco: 3 } },
        { texto: "Vamos treinar mais forte", efeito: { elenco: -1, diretoria: 2, intensidade: 2 } },
        { texto: "Confio no grupo, é fase", efeito: { elenco: 2, jogador: { id: lider.id, moral: 3 } } },
      ],
    });
  }

  if (rodada === 6 && carreira.marcas[`pedidoBase${estado.temporada}`] === undefined) {
    carreira.marcas[`pedidoBase${estado.temporada}`] = rodada;
    enviarMensagem(carreira, rodada, {
      de: "Presidência",
      assunto: "Espaço para a base",
      texto:
        "O conselho quer ver garotos da base em campo. Pode colocar algum jovem da base para jogar em 3 partidas até a rodada 16?",
      opcoes: [
        {
          texto: "Pode deixar, vou dar minutos à base",
          efeito: { diretoria: 3, promessa: { tipo: "base", nome: "Presidência", meta: 3, prazo: 10 } },
        },
        { texto: "Agora não é o momento", efeito: { diretoria: -3 } },
      ],
    });
  }
  if (rodada > 0 && rodada % 8 === 0) {
    const pos = posicaoNaTabela(estado, clube.id);
    if (pos !== null) {
      const ok = pos <= carreira.meta.posicao;
      enviarMensagem(carreira, rodada, {
        de: "Presidência",
        assunto: `Avaliação após ${rodada} rodadas`,
        texto: ok
          ? `Estamos em ${pos}º, dentro da meta. Continue assim.`
          : `Estamos em ${pos}º, fora da meta (${carreira.meta.texto.toLowerCase()}). Esperamos reação imediata.`,
      });
    }
  }
  if (carreira.marcas.prometeuClassico !== undefined && r.classico) {
    const { prometeuClassico: _cumprida, ...outras } = carreira.marcas;
    carreira.marcas = outras;
    if (r.resultado === "D") {
      carreira.torcida = limitar(carreira.torcida - 4, 0, 100);
      enviarMensagem(carreira, rodada, {
        de: "Torcida",
        assunto: "Cobrança",
        texto: "Você prometeu ir pra cima no clássico e perdeu. A torcida não esqueceu.",
      });
    }
  }
  if (rodada > 0 && rodada % 10 === 0) {
    const novos = gerarGarotos(carreira, 2, rng);
    carreira.base.push(...novos);
    enviarMensagem(carreira, rodada, {
      de: membroDaFuncao(carreira, "base").nome,
      assunto: "Novos garotos na base",
      texto: `Subiram para o sub-20: ${novos.map((j) => `${j.nome} (${j.pos})`).join(" e ")}.`,
    });
  }
}

/* ---------- eventos aleatórios do clube ---------- */

interface EventoDoClube {
  de: string;
  assunto: string;
  texto: (alvo: string) => string;
  diretoria: number;
  torcida: number;
  /** Mudança de moral de todo o elenco. */
  moral: number;
  /** Só o jogador citado. */
  moralAlvo?: number;
}

const EVENTOS: readonly EventoDoClube[] = [
  {
    de: "Imprensa",
    assunto: "Escândalo na diretoria",
    texto: () =>
      "Vazaram áudios do vice-presidente negociando comissão em transferências. A torcida protesta na porta do CT.",
    diretoria: -8,
    torcida: -10,
    moral: -4,
  },
  {
    de: "Presidência",
    assunto: "Salários atrasados",
    texto: () => "O clube atrasou o salário do mês. O elenco está insatisfeito e cobra explicações.",
    diretoria: -4,
    torcida: -3,
    moral: -9,
  },
  {
    de: "Imprensa",
    assunto: "Jogador flagrado em festa",
    texto: (a) =>
      `${a} foi flagrado em uma festa de madrugada às vésperas do jogo. A diretoria pede punição.`,
    diretoria: -5,
    torcida: -6,
    moral: -2,
    moralAlvo: -15,
  },
  {
    de: "Presidência",
    assunto: "Crise política",
    texto: () => "Conselheiros pedem o impeachment do presidente. O clima nos bastidores pesou.",
    diretoria: -10,
    torcida: -4,
    moral: -3,
  },
  {
    de: "Imprensa",
    assunto: "Briga no treino",
    texto: (a) => `${a} se desentendeu com um companheiro no treino. O vestiário ficou rachado.`,
    diretoria: -3,
    torcida: -2,
    moral: -6,
    moralAlvo: -10,
  },
  {
    de: "Torcida organizada",
    assunto: "Protesto no CT",
    texto: () => "A organizada invadiu o treino e cobrou o elenco. Os jogadores ficaram abalados.",
    diretoria: -2,
    torcida: -8,
    moral: -7,
  },
  {
    de: "Presidência",
    assunto: "Novo patrocinador",
    texto: () => "Fechamos um patrocínio master. A diretoria está animada com o projeto.",
    diretoria: 6,
    torcida: 3,
    moral: 3,
  },
  {
    de: "Imprensa",
    assunto: "Ídolo elogia o trabalho",
    texto: () => "Um ídolo histórico do clube elogiou publicamente o seu trabalho. A torcida abraçou.",
    diretoria: 2,
    torcida: 8,
    moral: 4,
  },
  {
    de: "Presidência",
    assunto: "Premiação extra prometida",
    texto: () => "A diretoria prometeu bicho dobrado se o time vencer a próxima. O elenco se animou.",
    diretoria: 1,
    torcida: 0,
    moral: 7,
  },
];

/** Bastidores imprevisíveis: escândalos e boas notícias que mexem com diretoria, torcida e vestiário. */
function eventoAleatorio(carreira: EstadoCarreira, clube: Clube, rodada: number, rng: Rng): void {
  if (rodada < 2 || rng.proximo() >= 0.09) return;
  const ev = EVENTOS[Math.floor(rng.proximo() * EVENTOS.length)]!;
  const alvo = clube.jogadores[Math.floor(rng.proximo() * clube.jogadores.length)];
  carreira.diretoria = limitar(carreira.diretoria + ev.diretoria, 0, 100);
  carreira.torcida = limitar(carreira.torcida + ev.torcida, 0, 100);
  for (const j of clube.jogadores) j.moral = limitar(j.moral + ev.moral, 0, 100);
  if (alvo && ev.moralAlvo) alvo.moral = limitar(alvo.moral + ev.moralAlvo, 0, 100);
  const ruim = ev.moral < 0 || ev.diretoria < 0;
  enviarMensagem(carreira, rodada, {
    de: ev.de,
    assunto: ev.assunto,
    texto: `${ev.texto(alvo?.nome ?? "Um jogador")}${ruim ? " Só resultado em campo acalma o ambiente." : ""}`,
  });
}

/** Domingo de Páscoa (algoritmo de Meeus/Butcher), como "MM-DD". */
function pascoa(ano: number): string {
  const a = ano % 19,
    b = Math.floor(ano / 100),
    c = ano % 100;
  const d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31),
    dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function somarDias(mmdd: string, ano: number, dias: number): string {
  const d = new Date(Date.UTC(ano, Number(mmdd.slice(0, 2)) - 1, Number(mmdd.slice(3)) + dias));
  return d.toISOString().slice(5, 10);
}

/** N-ésimo domingo do mês, como "MM-DD". */
function domingo(ano: number, mes: number, n: number): string {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const dia = 1 + ((7 - primeiro) % 7) + (n - 1) * 7;
  return `${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

interface Feriado {
  data: string;
  de: string;
  assunto: string;
  texto: string;
  moral: number;
  torcida: number;
}

function feriadosDoAno(ano: number): Feriado[] {
  const p = pascoa(ano);
  return [
    {
      data: somarDias(p, ano, -47),
      de: "Departamento de futebol",
      assunto: "Carnaval",
      texto:
        "É Carnaval! A comissão liberou o elenco por uma noite, com toque de recolher. Juízo, rapaziada.",
      moral: 4,
      torcida: 1,
    },
    {
      data: p,
      de: "Presidência",
      assunto: "Feliz Páscoa!",
      texto:
        "A diretoria distribuiu ovos de chocolate para o elenco e para os filhos dos funcionários. Feliz Páscoa!",
      moral: 3,
      torcida: 1,
    },
    {
      data: "05-01",
      de: "Presidência",
      assunto: "Dia do Trabalhador",
      texto:
        "Homenagem aos funcionários do CT: roupeiros, cozinheiros, seguranças e jardineiros ganharam camisa autografada.",
      moral: 2,
      torcida: 1,
    },
    {
      data: domingo(ano, 5, 2),
      de: "Departamento de marketing",
      assunto: "Dia das Mães",
      texto: "Os jogadores entraram em campo com o nome das mães na camisa. A torcida aplaudiu de pé.",
      moral: 3,
      torcida: 3,
    },
    {
      data: "06-12",
      de: "Departamento de marketing",
      assunto: "Dia dos Namorados",
      texto: "Ação de Dia dos Namorados: casal de torcedores ganhou jantar com o capitão. As redes bombaram.",
      moral: 1,
      torcida: 3,
    },
    {
      data: domingo(ano, 8, 2),
      de: "Departamento de marketing",
      assunto: "Dia dos Pais",
      texto: "Os filhos dos jogadores entraram com o time no Dia dos Pais. Clima leve no vestiário.",
      moral: 3,
      torcida: 2,
    },
    {
      data: "09-07",
      de: "Presidência",
      assunto: "Independência do Brasil",
      texto: "Feriado da Independência: o clube fez treino aberto com a torcida no CT.",
      moral: 2,
      torcida: 3,
    },
    {
      data: "10-12",
      de: "Departamento de marketing",
      assunto: "Dia das Crianças",
      texto:
        "Dia das Crianças: o elenco visitou um hospital infantil e distribuiu brinquedos. Ninguém saiu de lá igual.",
      moral: 4,
      torcida: 4,
    },
    {
      data: "10-31",
      de: "Imprensa",
      assunto: "Halloween no CT",
      texto:
        "Alguém apareceu fantasiado de árbitro de vídeo no treino e assustou metade do elenco. Risada geral.",
      moral: 2,
      torcida: 1,
    },
    {
      data: "12-25",
      de: "Presidência",
      assunto: "Feliz Natal!",
      texto:
        "A diretoria deseja um Feliz Natal a você, à comissão e a todo o elenco. Teve amigo secreto no CT e o goleiro tirou o roupeiro.",
      moral: 5,
      torcida: 2,
    },
    {
      data: "12-31",
      de: "Presidência",
      assunto: "Feliz Ano Novo!",
      texto: "Feliz Ano Novo! Que venha uma temporada de títulos. A diretoria conta com você.",
      moral: 3,
      torcida: 2,
    },
  ];
}

/** Mensagens comemorativas nas semanas de feriados famosos (com um pequeno ânimo no elenco). */
function feriado(carreira: EstadoCarreira, clube: Clube, rodada: number, ano: number): void {
  const domingoDaSemana = dataDoHorario(rodada, false);
  const dias = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(domingoDaSemana) - (6 - i) * 86_400_000).toISOString().slice(5, 10),
  );
  for (const f of feriadosDoAno(ano)) {
    if (!dias.includes(f.data)) continue;
    carreira.torcida = limitar(carreira.torcida + f.torcida, 0, 100);
    for (const j of clube.jogadores) j.moral = limitar(j.moral + f.moral, 0, 100);
    enviarMensagem(carreira, rodada, { de: f.de, assunto: f.assunto, texto: f.texto });
  }
}
