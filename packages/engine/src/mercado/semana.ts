import { devolverEmprestimos } from "./emprestimos";
import { resolverOlheiro } from "./olheiro";
import { enviarMensagem, publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import { forcaDoClube } from "../clube";
import { divisaoDo } from "../competicao/temporada";
import { type Rng, inteiroEntre, sortear } from "../rng";
import { semanaDosTecnicos } from "./tecnico";
import {
  avaliarIndicacao,
  buscarNoMercado,
  forcaDeMercado,
  importanciaNoTime,
  resolverDecisoesPendentes,
  transferir,
  valorNoClube,
} from "./transferencias";
import { arredondar, formatarDinheiro, janelaAberta } from "./valores";

/**
 * Semana do mercado: com a janela aberta, a diretoria responde até 2 indicações,
 * o presidente econômico às vezes contrata por conta própria, chegam propostas
 * pelos seus jogadores e os clubes da IA negociam entre si. Sempre: especulação
 * na imprensa e o movimento dos técnicos.
 */
export function semanaDoMercado(estado: EstadoJogo, rng: Rng): void {
  const t = estado.temporada;
  const c = estado.carreira;
  const m = estado.mercado;
  const rodada = t.rodada;
  const meu = c.clubeId ? t.clubes[c.clubeId]! : null;
  resolverOlheiro(estado);
  devolverEmprestimos(estado);

  for (const r of resolverDecisoesPendentes(estado, rng)) {
    enviarMensagem(c, rodada, {
      de: "Diretoria de futebol",
      assunto: "Resposta da diretoria",
      texto: r.texto,
    });
  }
  if (meu && janelaAberta(rodada)) {
    for (const ind of m.indicacoes.filter((i) => i.status === "pendente" && i.rodada <= rodada).slice(0, 2)) {
      const r = avaliarIndicacao(estado, ind, rng);
      enviarMensagem(c, rodada, {
        de: "Diretoria de futebol",
        assunto: `Indicação: ${ind.nome}`,
        texto: r.texto,
        ...(r.opcoes ? { opcoes: r.opcoes } : {}),
      });
      if (r.fechou) publicarNoticia(c, rodada, "Mercado", r.texto, "bom");
    }

    if (m.financas.perfil === "economico" && rng.proximo() < 0.22) {
      const media = forcaDoClube(meu);
      const alvos = buscarNoMercado(estado, { valorMaximo: 0.1, limite: 200 }).filter(
        (x) =>
          (x.divisao === "C" || x.divisao === "D") &&
          x.jogador.ovr >= media - 12 &&
          x.jogador.ovr <= media - 4,
      );
      const a = alvos[Math.floor(rng.proximo() * Math.min(10, alvos.length))];
      if (a) {
        enviarMensagem(c, rodada, {
          de: "Presidência",
          assunto: "Reforço contratado",
          texto: `Fechamos com ${a.jogador.nome} (${a.jogador.pos}, ${a.jogador.ovr}), do ${a.clube.nome} (Série ${a.divisao}), por ${formatarDinheiro(a.valor)}. Barato e com potencial, na nossa avaliação.`,
          opcoes: [
            {
              texto: "Tudo bem, vou observar",
              efeito: {},
              mercado: { contratar: { jogadorId: a.jogador.id, custo: a.valor } },
            },
            {
              texto: "Não pedi esse jogador",
              efeito: { diretoria: -2 },
              mercado: { contratar: { jogadorId: a.jogador.id, custo: a.valor }, ouvir: 12 },
            },
          ],
        });
      }
    }

    const aVenda = m.vendasIndicadas ?? [];
    const idVenda = aVenda.shift();
    const vendido = idVenda ? meu.jogadores.find((x) => x.id === idVenda) : undefined;
    if (vendido) {
      const compradores = [...t.divisoes.A.clubes, ...t.divisoes.B.clubes].filter(
        (id) => id !== meu.id && forcaDeMercado(estado, id) >= forcaDeMercado(estado, meu.id) * 0.4,
      );
      const comprador = compradores.length
        ? t.clubes[sortear(rng, compradores)]!.nome
        : "um clube do exterior";
      const oferta = arredondar(valorNoClube(estado, vendido, meu) * (0.75 + rng.proximo() * 0.45));
      enviarMensagem(c, rodada, {
        de: "Diretoria de futebol",
        assunto: `Proposta por ${vendido.nome}`,
        texto: `Achamos interessado: ${comprador} oferece ${formatarDinheiro(oferta)} por ${vendido.nome}. Fechamos?`,
        opcoes: [
          {
            texto: "Vender",
            efeito: {},
            mercado: { vender: { jogadorId: vendido.id, valor: oferta, comprador } },
          },
          { texto: "Recusar a proposta", efeito: {} },
        ],
      });
    }
    if (rng.proximo() < 0.25) {
      // Diretoria criteriosa: não abre negociação de titular que está rendendo.
      const alvos = meu.jogadores
        .filter((j) => j.ovr >= 72 && importanciaNoTime(meu, j) < 0.75)
        .filter((j) => !(m.decisoesPendentes ?? []).some((d) => d.jogadorId === j.id))
        .sort((a, b) => b.ovr - a.ovr);
      const j = alvos[Math.floor(rng.proximo() * Math.min(6, alvos.length))];
      if (j) {
        const maiores = t.divisoes.A.clubes.filter(
          (id) => id !== meu.id && forcaDeMercado(estado, id) >= forcaDeMercado(estado, meu.id),
        );
        const comprador =
          rng.proximo() < 0.5 || !maiores.length
            ? "um clube do exterior"
            : t.clubes[sortear(rng, maiores)]!.nome;
        const valor = valorNoClube(estado, j, meu);
        const oferta = arredondar(valor * (0.9 + rng.proximo() * 0.6));
        const tende =
          importanciaNoTime(meu, j) < 0.5 && (m.financas.perfil === "economico" || oferta > valor * 1.2);
        enviarMensagem(c, rodada, {
          de: "Diretoria de futebol",
          assunto: `Proposta por ${j.nome}`,
          texto: `Chegou uma proposta de ${comprador} de ${formatarDinheiro(oferta)} por ${j.nome}. A diretoria ${tende ? "tende a aceitar" : "está dividida"}. Qual a sua posição?`,
          opcoes: [
            {
              texto: "Pode vender",
              efeito: {},
              mercado: { vender: { jogadorId: j.id, valor: oferta, comprador } },
            },
            {
              texto: "Peço para segurar o jogador",
              efeito: {},
              mercado: { segurar: { jogadorId: j.id, valor: oferta, comprador, tendeAVender: tende } },
            },
          ],
        });
      }
    }
  }

  if (janelaAberta(rodada)) {
    const ids = [...t.divisoes.A.clubes, ...t.divisoes.B.clubes].filter((id) => id !== c.clubeId);
    for (let i = 0; i < 2; i++) {
      const comprador = t.clubes[sortear(rng, ids)]!;
      const vendedor =
        t.clubes[
          sortear(
            rng,
            ids.filter((id) => id !== comprador.id),
          )
        ]!;
      if (vendedor.jogadores.length <= 16) continue;
      const j = vendedor.jogadores.slice().sort((a, b) => b.ovr - a.ovr)[inteiroEntre(rng, 2, 8)];
      if (
        j &&
        forcaDeMercado(estado, comprador.id) >= forcaDeMercado(estado, vendedor.id) * 0.8 &&
        rng.proximo() < 0.5
      ) {
        transferir(j, vendedor, comprador);
        publicarNoticia(
          c,
          rodada,
          "Mercado",
          `${comprador.nome} anuncia ${j.nome}, que estava no ${vendedor.nome}.`,
        );
      }
    }
  }

  if (rng.proximo() < 0.6) {
    const interessado =
      t.clubes[
        sortear(
          rng,
          t.divisoes.A.clubes.filter((id) => id !== c.clubeId),
        )
      ]!;
    const outros = Object.keys(t.clubes).filter(
      (id) => id !== interessado.id && id !== c.clubeId && divisaoDo(t, id),
    );
    const dono = t.clubes[sortear(rng, outros.slice(0, 60))]!;
    const j = dono.jogadores.slice().sort((a, b) => b.ovr - a.ovr)[inteiroEntre(rng, 0, 4)];
    if (j)
      publicarNoticia(
        c,
        rodada,
        "Imprensa",
        `Especulação: ${interessado.nome} estaria de olho em ${j.nome}, do ${dono.nome}.`,
      );
  }
  if (meu && rng.proximo() < 0.18) {
    const destaques = meu.jogadores.filter((j) => j.ovr >= 73);
    if (destaques.length) {
      const j = sortear(rng, destaques);
      publicarNoticia(
        c,
        rodada,
        "Imprensa",
        `Especulação: ${j.nome} teria sondagens de clubes do exterior. ${janelaAberta(rodada) ? "Janela aberta." : "Proposta só na próxima janela."}`,
      );
    }
  }
  semanaDosTecnicos(estado, rng);
}
