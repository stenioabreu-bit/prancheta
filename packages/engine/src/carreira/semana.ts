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
