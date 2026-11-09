/**
 * Olheiro: o técnico descreve o perfil (posição, atributo em destaque, faixa de preço, idade, origem) e o
 * olheiro volta duas rodadas depois com um relatório dos melhores nomes que encontrou, no Brasil ou nos
 * clubes estrangeiros das copas continentais.
 */
import { enviarMensagem } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import { type FiltroDoMercado, buscarNoMercado } from "./transferencias";
import { formatarDinheiro } from "./valores";

const PRAZO = 2;
const LIMITE_DE_PEDIDOS = 6;

export function pedirAoOlheiro(estado: EstadoJogo, filtro: FiltroDoMercado, descricao: string): string {
  const m = estado.mercado;
  m.olheiro ??= [];
  if (m.olheiro.filter((p) => !p.resultado).length >= 3)
    return "O olheiro já está com três buscas em andamento. Espere um relatório chegar.";
  const id = (m.olheiro.reduce((a, p) => Math.max(a, p.id), 0) ?? 0) + 1;
  m.olheiro.unshift({
    id,
    descricao,
    filtro: { ...filtro, limite: 8 },
    pronto: estado.temporada.rodada + PRAZO,
  });
  if (m.olheiro.length > LIMITE_DE_PEDIDOS) m.olheiro.length = LIMITE_DE_PEDIDOS;
  return `Olheiro a caminho: ${descricao}. Relatório em ${PRAZO} rodadas.`;
}

/** Fecha as buscas vencidas e manda o relatório para a caixa de mensagens. */
export function resolverOlheiro(estado: EstadoJogo): void {
  const rodada = estado.temporada.rodada;
  for (const p of estado.mercado.olheiro ?? []) {
    if (p.resultado || p.pronto > rodada) continue;
    const itens = buscarNoMercado(estado, p.filtro);
    p.resultado = itens.map((i) => i.jogador.id);
    enviarMensagem(estado.carreira, rodada, {
      de: "Olheiro",
      assunto: `Relatório: ${p.descricao}`,
      texto: itens.length
        ? `Encontrei estes nomes: ${itens
            .map(
              (i) =>
                `${i.jogador.nome} (${i.jogador.pos}, ${i.jogador.ovr}, ${i.clube.nome}, ${formatarDinheiro(i.valor)})`,
            )
            .join("; ")}. Os detalhes estão no mercado, em Olheiro.`
        : "Rodei bastante e não achei ninguém com esse perfil. Vale abrir a faixa de preço ou a idade.",
    });
  }
}
