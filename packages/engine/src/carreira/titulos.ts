/**
 * Títulos do técnico: cada competição que o clube dele vence vira uma conquista (com o prêmio do título),
 * uma mensagem da presidência e uma tela de comemoração na interface (até ser vista).
 */
import { chaveDoLogo, nomeDaCompeticao } from "../competicao/temporada";
import type { IdCompeticao } from "../competicao/tipos";
import { creditar } from "../mercado/financas";
import { PREMIO_POR_FASE, premioDaLiga } from "../mercado/valores";
import { enviarMensagem, publicarNoticia } from "./efeitos";
import type { EstadoJogo } from "./jogo";

export interface Titulo {
  temporada: number;
  competicao: IdCompeticao;
  nome: string;
  /** Chave do logo da competição. */
  logo: string;
  clubeId: string;
  clube: string;
  /** Prêmio pelo título (€ mi). */
  premio: number;
  /** A tela de comemoração já foi mostrada. */
  visto: boolean;
}

function campeoes(estado: EstadoJogo): [IdCompeticao, string | null, number][] {
  const t = estado.temporada;
  const lista: [IdCompeticao, string | null, number][] = [];
  for (const d of ["A", "B", "C", "D"] as const) {
    const div = t.divisoes[d];
    if (div?.encerrada) lista.push([d, div.campeao, div.clubes.length]);
  }
  for (const [uf, est] of Object.entries(t.estaduais ?? {}))
    if (est.encerrada || est.campeao)
      lista.push([`est-${uf}` as IdCompeticao, est.campeao, est.clubes.length]);
  if (!t.semCopa) lista.push(["copa", t.copa.campeao, 0]);
  for (const [id, c] of Object.entries(t.continentais ?? {})) lista.push([id as IdCompeticao, c.campeao, 0]);
  return lista;
}

/** Registra os títulos novos do clube do usuário. Estadual paga o prêmio aqui (os outros já pagam no fluxo). */
export function registrarTitulos(estado: EstadoJogo): void {
  const c = estado.carreira;
  const t = estado.temporada;
  if (!c.clubeId) return;
  c.titulos ??= [];
  for (const [competicao, campeao, participantes] of campeoes(estado)) {
    if (campeao !== c.clubeId) continue;
    if (c.titulos.some((x) => x.temporada === t.temporada && x.competicao === competicao)) continue;
    const logo = chaveDoLogo(t, competicao);
    const nome = nomeDaCompeticao(t, competicao);
    const estadual = competicao.startsWith("est-");
    const premio =
      competicao === "copa" || competicao.startsWith("cont-")
        ? (PREMIO_POR_FASE[competicao === "copa" ? "copa-do-brasil" : logo]?.at(-1) ?? 0)
        : premioDaLiga(
            estadual
              ? logo
              : (t.formatos?.[competicao as "A"]?.id ?? `brasileirao-serie-${competicao.toLowerCase()}`),
            1,
            participantes,
          );
    const clube = t.clubes[c.clubeId]!;
    c.titulos.push({
      temporada: t.temporada,
      competicao,
      nome,
      logo,
      clubeId: clube.id,
      clube: clube.nome,
      premio,
      visto: false,
    });
    if (estadual) creditar(estado.mercado.financas, premio, `Título · ${nome}`, t.temporada, t.rodada);
    c.diretoria = Math.min(100, c.diretoria + 8);
    c.torcida = Math.min(100, c.torcida + 10);
    c.reputacao = Math.min(100, c.reputacao + (estadual ? 2 : 6));
    // Copa do Brasil e continentais já têm mensagem própria da presidência.
    if (competicao !== "copa" && !competicao.startsWith("cont-"))
      enviarMensagem(c, t.rodada, {
        de: "Presidência",
        assunto: `Campeões: ${nome}!`,
        texto: `Título do ${clube.nome} na ${nome} ${t.temporada}. A taça vai para a sala de troféus. Obrigado, professor.`,
      });
    publicarNoticia(c, t.rodada, nome, `${clube.nome} é campeão: ${nome} ${t.temporada}!`, "bom");
  }
}

/** Marca a comemoração como vista. */
export function verTitulo(estado: EstadoJogo, temporada: number, competicao: string): void {
  const x = estado.carreira.titulos?.find((y) => y.temporada === temporada && y.competicao === competicao);
  if (x) x.visto = true;
}
