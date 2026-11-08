import { publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import type { OpcaoDeResposta } from "../carreira/tipos";
import { escalarAutomatico, forcaDoClube } from "../clube";
import { divisaoDo } from "../competicao/temporada";
import type { Divisao } from "../competicao/tipos";
import { type Rng, limitar } from "../rng";
import type { Clube, Jogador } from "../tipos";
import type { EfeitoDeMercado, Indicacao } from "./tipos";
import {
  PESO_DIVISAO_NO_MERCADO,
  type SetorDoMercado,
  formatarDinheiro,
  janelaAberta,
  proximaJanela,
  setorDaPosicao,
  valorDeMercado,
} from "./valores";

export interface ItemDoMercado {
  jogador: Jogador;
  clube: Clube;
  divisao: Divisao;
  valor: number;
}

export interface FiltroDoMercado {
  divisao?: Divisao;
  setor?: SetorDoMercado;
  valorMaximo?: number;
  limite?: number;
}

export function clubeDoJogador(estado: EstadoJogo, jogadorId: string): Clube | null {
  return (
    Object.values(estado.temporada.clubes).find((c) => c.jogadores.some((j) => j.id === jogadorId)) ?? null
  );
}

export function valorNoClube(estado: EstadoJogo, j: Jogador, clube: Clube): number {
  return valorDeMercado(j, divisaoDo(estado.temporada, clube.id));
}

/** Jogadores dos outros clubes, do maior overall para o menor. */
export function buscarNoMercado(estado: EstadoJogo, f: FiltroDoMercado = {}): ItemDoMercado[] {
  const t = estado.temporada;
  const itens: ItemDoMercado[] = [];
  for (const clube of Object.values(t.clubes)) {
    if (clube.id === estado.carreira.clubeId) continue;
    const divisao = divisaoDo(t, clube.id);
    if (!divisao || (f.divisao && f.divisao !== divisao)) continue;
    for (const j of clube.jogadores) {
      if (f.setor && setorDaPosicao(j.pos) !== f.setor) continue;
      const valor = valorDeMercado(j, divisao);
      if (f.valorMaximo !== undefined && valor > f.valorMaximo) continue;
      itens.push({ jogador: j, clube, divisao, valor });
    }
  }
  return itens.sort((a, b) => b.jogador.ovr - a.jogador.ovr).slice(0, f.limite ?? 40);
}

/** Peso do clube no mercado: divisão e tamanho da torcida. */
export function forcaDeMercado(estado: EstadoJogo, clubeId: string): number {
  const d = divisaoDo(estado.temporada, clubeId) ?? "D";
  return (estado.mercado.grandes.includes(clubeId) ? 1.3 : 1) * PESO_DIVISAO_NO_MERCADO[d];
}

const LIMITE_DE_INDICACOES = 5;

/** O técnico pede para a diretoria vender um jogador; ela procura comprador na janela. */
export function indicarVenda(estado: EstadoJogo, jogadorId: string): string {
  const meu = estado.carreira.clubeId ? estado.temporada.clubes[estado.carreira.clubeId] : null;
  const j = meu?.jogadores.find((x) => x.id === jogadorId);
  if (!j) return "Jogador não encontrado.";
  estado.mercado.vendasIndicadas ??= [];
  const lista = estado.mercado.vendasIndicadas;
  if (lista.includes(jogadorId)) return `${j.nome} já está à venda.`;
  lista.push(jogadorId);
  return janelaAberta(estado.temporada.rodada)
    ? `${j.nome} colocado à venda. A diretoria procura comprador.`
    : `${j.nome} colocado à venda. As propostas chegam quando a janela abrir.`;
}

/** O técnico indica um jogador; a diretoria decide quando a janela estiver aberta. */
export function indicar(estado: EstadoJogo, jogadorId: string): string {
  const m = estado.mercado;
  const pendentes = m.indicacoes.filter((i) => i.status === "pendente");
  if (pendentes.some((i) => i.jogadorId === jogadorId)) return "Você já indicou esse jogador.";
  if (pendentes.length >= LIMITE_DE_INDICACOES) {
    return "Você já tem 5 indicações em aberto. Espere a diretoria responder.";
  }
  const clube = clubeDoJogador(estado, jogadorId);
  const j = clube?.jogadores.find((x) => x.id === jogadorId);
  if (!clube || !j || clube.id === estado.carreira.clubeId) return "Jogador não encontrado.";
  const rodada = estado.temporada.rodada;
  m.indicacoes.push({
    jogadorId,
    nome: j.nome,
    clubeId: clube.id,
    rodada: rodada + 1,
    valor: valorNoClube(estado, j, clube),
    status: "pendente",
  });
  if (janelaAberta(rodada)) return `${j.nome} indicado. A diretoria responde nas próximas rodadas.`;
  const proxima = proximaJanela(rodada);
  return `${j.nome} indicado. A janela está fechada; a diretoria analisa quando abrir (${proxima !== null ? `rodada ${proxima + 1}` : "na pré-temporada"}).`;
}

/** Passa o jogador de clube (o id continua o mesmo, então promessas e indicações seguem válidas). */
export function transferir(j: Jogador, de: Clube, para: Clube): void {
  de.jogadores = de.jogadores.filter((x) => x !== j);
  delete de.instrucoes[j.id];
  if (de.titulares.includes(j.id)) {
    const nomes = de.titulares
      .filter((id) => id !== j.id)
      .map((id) => de.jogadores.find((x) => x.id === id)?.nome ?? "");
    de.titulares = escalarAutomatico(de, de.esquema, nomes);
  }
  j.moral = limitar(j.moral + 5, 0, 100);
  j.semJogar = 0;
  para.jogadores.push(j);
  de.forca = forcaDoClube(de);
  para.forca = forcaDoClube(para);
}

export function contratar(estado: EstadoJogo, jogadorId: string, custo: number): Jogador | null {
  const de = clubeDoJogador(estado, jogadorId);
  const meu = estado.carreira.clubeId ? estado.temporada.clubes[estado.carreira.clubeId] : null;
  const j = de?.jogadores.find((x) => x.id === jogadorId);
  if (!de || !meu || !j || de === meu) return null;
  transferir(j, de, meu);
  const f = estado.mercado.financas;
  f.orcamento = Math.max(0, Math.round((f.orcamento - custo) * 10) / 10);
  return j;
}

/** Venda: metade do valor entra no orçamento (um quarto com presidente econômico). */
export function vender(estado: EstadoJogo, jogadorId: string, valor: number, comprador: string): void {
  const meu = estado.temporada.clubes[estado.carreira.clubeId!]!;
  const j = meu.jogadores.find((x) => x.id === jogadorId);
  if (!j) return;
  const f = estado.mercado.financas;
  f.orcamento = Math.round((f.orcamento + valor * (f.perfil === "economico" ? 0.25 : 0.5)) * 10) / 10;
  const destino = Object.values(estado.temporada.clubes).find((c) => c.nome === comprador);
  if (destino) transferir(j, meu, destino);
  else {
    meu.jogadores = meu.jogadores.filter((x) => x !== j);
    if (meu.titulares.includes(j.id)) {
      const nomes = meu.titulares
        .filter((id) => id !== j.id)
        .map((id) => meu.jogadores.find((x) => x.id === id)?.nome ?? "");
      meu.titulares = escalarAutomatico(meu, meu.esquema, nomes);
    }
    meu.forca = forcaDoClube(meu);
  }
  publicarNoticia(
    estado.carreira,
    estado.temporada.rodada,
    "Mercado",
    `${j.nome} deixa o ${meu.nome} rumo a ${comprador} por ${formatarDinheiro(valor)}.`,
    "ruim",
  );
}

export interface RespostaDaDiretoria {
  texto: string;
  opcoes?: OpcaoDeResposta[];
  fechou: boolean;
}

/**
 * A diretoria analisa a indicação: cabe no orçamento? (senão, sugere alguém mais
 * barato do mesmo setor), aprova o gasto?, o clube vende?, o jogador quer vir?
 */
export function avaliarIndicacao(estado: EstadoJogo, ind: Indicacao, rng: Rng): RespostaDaDiretoria {
  const t = estado.temporada;
  const de = t.clubes[ind.clubeId];
  const j = de?.jogadores.find((x) => x.id === ind.jogadorId);
  const meu = t.clubes[estado.carreira.clubeId!]!;
  if (!de || !j) {
    ind.status = "indisponivel";
    return {
      texto: `${ind.nome} já não está no ${de?.nome ?? "clube"}. Negociação encerrada.`,
      fechou: false,
    };
  }
  const titular = de.titulares.includes(j.id);
  const custo = Math.round(valorNoClube(estado, j, de) * (titular ? 1.25 : 1) * 10) / 10;
  const minhaForca = forcaDeMercado(estado, meu.id);
  const forcaDele = forcaDeMercado(estado, de.id);
  const clubeVende = forcaDele > minhaForca * 1.2 ? 0.12 : titular ? 0.4 : 0.75;
  const jogadorQuer = minhaForca >= forcaDele ? 0.9 : minhaForca >= forcaDele * 0.6 ? 0.55 : 0.25;
  const f = estado.mercado.financas;
  const economico = f.perfil === "economico";
  if (custo > f.orcamento * 1.6) {
    ind.status = "recusada";
    const opcoes = buscarNoMercado(estado, {
      setor: setorDaPosicao(j.pos),
      valorMaximo: Math.max(0.3, f.orcamento * 0.5),
      limite: 60,
    })
      .filter((x) => Math.abs(x.jogador.ovr - j.ovr) <= 10)
      .sort(
        (x, y) =>
          Number(y.jogador.pos === j.pos) - Number(x.jogador.pos === j.pos) || y.jogador.ovr - x.jogador.ovr,
      )
      .slice(0, 4);
    const mesmaPosicao = opcoes.filter((x) => x.jogador.pos === j.pos);
    const lista = mesmaPosicao.length ? mesmaPosicao : opcoes;
    const alternativa = lista[Math.floor(rng.proximo() * lista.length)];
    const caro = `${j.nome} custaria cerca de ${formatarDinheiro(custo)}, muito acima do orçamento (${formatarDinheiro(f.orcamento)}).`;
    if (!alternativa) return { texto: `${caro} Pedido negado.`, fechou: false };
    const a = alternativa;
    return {
      texto: `${caro} A diretoria sugere ${a.jogador.nome} (${a.jogador.pos}, ${a.clube.nome}), por cerca de ${formatarDinheiro(a.valor)}.`,
      opcoes: [
        {
          texto: `Aceitar ${a.jogador.nome}`,
          efeito: {},
          mercado: { contratar: { jogadorId: a.jogador.id, custo: a.valor } },
        },
        { texto: "Não quero esse jogador", efeito: { diretoria: -1 } },
      ],
      fechou: false,
    };
  }
  const aprova = custo <= f.orcamento ? (economico ? 0.6 : 0.85) : economico ? 0.15 : 0.35;
  if (rng.proximo() > aprova) {
    ind.status = "recusada";
    return {
      texto: `A diretoria não quis investir ${formatarDinheiro(custo)} em ${j.nome} agora.${economico ? " O presidente quer cortar custos." : ""}`,
      fechou: false,
    };
  }
  if (rng.proximo() > clubeVende) {
    ind.status = "recusada";
    return { texto: `O ${de.nome} recusou vender ${j.nome}.`, fechou: false };
  }
  if (rng.proximo() > jogadorQuer) {
    ind.status = "recusada";
    return { texto: `${j.nome} não quis se transferir para o ${meu.nome}.`, fechou: false };
  }
  contratar(estado, j.id, custo);
  ind.status = "contratado";
  return {
    texto: `Negócio fechado: ${j.nome} (${j.pos}, ${j.ovr}) chega do ${de.nome} por ${formatarDinheiro(custo)}. Orçamento restante: ${formatarDinheiro(f.orcamento)}.`,
    fechou: true,
  };
}

/** Efeitos de mercado de uma resposta (contratar, vender, segurar, ouvir). Assumir clube fica com a carreira. */
export function aplicarEfeitoDeMercado(estado: EstadoJogo, ef: EfeitoDeMercado, rng: Rng): string[] {
  const reacoes: string[] = [];
  const f = estado.mercado.financas;
  if (ef.ouvir) f.ouvir = limitar(f.ouvir + ef.ouvir, 0, 100);
  if (ef.contratar) {
    const j = contratar(estado, ef.contratar.jogadorId, ef.contratar.custo);
    if (j)
      reacoes.push(
        `${j.nome} agora é jogador do ${estado.temporada.clubes[estado.carreira.clubeId!]!.nome}.`,
      );
  }
  if (ef.vender) {
    const nome = estado.temporada.clubes[estado.carreira.clubeId!]?.jogadores.find(
      (j) => j.id === ef.vender!.jogadorId,
    )?.nome;
    vender(estado, ef.vender.jogadorId, ef.vender.valor, ef.vender.comprador);
    if (nome) reacoes.push(`${nome} foi vendido.`);
  }
  if (ef.segurar) {
    const meu = estado.temporada.clubes[estado.carreira.clubeId!]!;
    const j = meu.jogadores.find((x) => x.id === ef.segurar!.jogadorId);
    if (j) {
      const segura =
        estado.carreira.diretoria >= 55 && (!ef.segurar.tendeAVender || rng.proximo() < f.ouvir / 100);
      if (segura) {
        reacoes.push(`A diretoria segurou ${j.nome}.`);
        if (j.perso === "temperamental" || rng.proximo() < 0.4) {
          j.moral = limitar(j.moral - 12, 0, 100);
          reacoes.push(`${j.nome} ficou chateado por perder a chance.`);
        } else {
          j.moral = limitar(j.moral + 3, 0, 100);
        }
      } else {
        vender(estado, j.id, ef.segurar.valor, ef.segurar.comprador);
        reacoes.push(`A diretoria ignorou seu pedido e vendeu ${j.nome}.`);
        f.ouvir = limitar(f.ouvir - 5, 0, 100);
      }
    }
  }
  return reacoes;
}
