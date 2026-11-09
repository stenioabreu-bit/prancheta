import { publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import type { OpcaoDeResposta } from "../carreira/tipos";
import { escalarAutomatico, forcaDoClube } from "../clube";
import { divisaoDo } from "../competicao/temporada";
import type { Divisao } from "../competicao/tipos";
import { type Rng, limitar } from "../rng";
import type { Atributo, Clube, Jogador, Posicao } from "../tipos";
import { pagarContratacao, receberVenda } from "./financas";
import type { DecisaoPendente, EfeitoDeMercado, Indicacao } from "./tipos";
import {
  PESO_DIVISAO_NO_MERCADO,
  arredondar,
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
  /** Série do clube; null para clubes de fora das Séries (exterior ou só estadual). */
  divisao: Divisao | null;
  valor: number;
  estrangeiro: boolean;
}

export interface FiltroDoMercado {
  divisao?: Divisao;
  setor?: SetorDoMercado;
  posicao?: Posicao;
  valorMinimo?: number;
  valorMaximo?: number;
  idadeMaxima?: number;
  idadeMinima?: number;
  /** Atributo em destaque (ex.: VEL para jogadores rápidos) e o mínimo exigido. */
  atributo?: Atributo;
  atributoMinimo?: number;
  origem?: "brasil" | "exterior";
  /** Busca pelo nome (sem acento, parte do nome). */
  nome?: string;
  limite?: number;
}

/** Clubes que não disputam Séries nem estaduais: estrangeiros das copas continentais. */
export function clubesEstrangeiros(estado: EstadoJogo): Set<string> {
  const t = estado.temporada;
  const br = new Set<string>([
    ...Object.values(t.divisoes).flatMap((d) => d.clubes),
    ...Object.values(t.estaduais ?? {}).flatMap((e) => e.clubes),
  ]);
  return new Set(Object.keys(t.clubes).filter((id) => !br.has(id)));
}

export function clubeDoJogador(estado: EstadoJogo, jogadorId: string): Clube | null {
  return (
    Object.values(estado.temporada.clubes).find((c) => c.jogadores.some((j) => j.id === jogadorId)) ?? null
  );
}

export function valorNoClube(estado: EstadoJogo, j: Jogador, clube: Clube): number {
  return valorDeMercado(j, divisaoDo(estado.temporada, clube.id) ?? "B");
}

/** Jogadores dos outros clubes, do maior overall para o menor. */
export function buscarNoMercado(estado: EstadoJogo, f: FiltroDoMercado = {}): ItemDoMercado[] {
  const t = estado.temporada;
  const itens: ItemDoMercado[] = [];
  const fora = clubesEstrangeiros(estado);
  for (const clube of Object.values(t.clubes)) {
    if (clube.id === estado.carreira.clubeId) continue;
    const divisao = divisaoDo(t, clube.id);
    const estrangeiro = fora.has(clube.id);
    if (f.divisao && f.divisao !== divisao) continue;
    if (f.origem === "exterior" && !estrangeiro) continue;
    if (f.origem === "brasil" && estrangeiro) continue;
    for (const j of clube.jogadores) {
      if (f.nome && !semAcento(j.nome).includes(semAcento(f.nome))) continue;
      if (f.setor && setorDaPosicao(j.pos) !== f.setor) continue;
      if (f.posicao && j.pos !== f.posicao && !j.alt.includes(f.posicao)) continue;
      if (f.idadeMaxima !== undefined && (j.idade ?? 99) > f.idadeMaxima) continue;
      if (f.idadeMinima !== undefined && (j.idade ?? 0) < f.idadeMinima) continue;
      if (f.atributo && j.at[f.atributo] < (f.atributoMinimo ?? 0)) continue;
      const valor = valorDeMercado(j, divisao ?? (estrangeiro ? "B" : "D"));
      if (f.valorMaximo !== undefined && valor > f.valorMaximo) continue;
      if (f.valorMinimo !== undefined && valor < f.valorMinimo) continue;
      itens.push({ jogador: j, clube, divisao, valor, estrangeiro });
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
  pagarContratacao(
    estado.mercado.financas,
    custo,
    j.nome,
    estado.temporada.temporada,
    estado.temporada.rodada,
  );
  return j;
}

/** Venda: metade do valor entra no orçamento (um quarto com presidente econômico). */
export function vender(estado: EstadoJogo, jogadorId: string, valor: number, comprador: string): void {
  const meu = estado.temporada.clubes[estado.carreira.clubeId!]!;
  const j = meu.jogadores.find((x) => x.id === jogadorId);
  if (!j) return;
  receberVenda(estado.mercado.financas, valor, j.nome, estado.temporada.temporada, estado.temporada.rodada);
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
  const custo = arredondar(valorNoClube(estado, j, de) * (titular ? 1.25 : 1));
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
      valorMaximo: Math.max(0.05, f.orcamento * 0.5),
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
      estado.mercado.decisoesPendentes ??= [];
      estado.mercado.decisoesPendentes.push({
        ...ef.segurar,
        rodada: estado.temporada.rodada + 2 + Math.floor(rng.proximo() * 2),
      });
      reacoes.push(`A diretoria vai analisar o caso de ${j.nome} e responde nas próximas rodadas.`);
    }
  }
  return reacoes;
}

/** Peso do jogador no time: titular com boas notas pesa mais na hora de segurar. */
export function importanciaNoTime(clube: { titulares: string[] }, j: Jogador): number {
  const media = j.temporada.qtdNotas ? j.temporada.somaNotas / j.temporada.qtdNotas : 6.3;
  const titular = clube.titulares.includes(j.id) ? 1 : 0;
  return titular * (0.5 + limitar((media - 6.2) / 1.2, 0, 1) * 0.5);
}

/** Resolve os pedidos de segurar que venceram nesta rodada; devolve os textos das respostas. */
export function resolverDecisoesPendentes(estado: EstadoJogo, rng: Rng): { texto: string; bom: boolean }[] {
  const m = estado.mercado;
  const rodada = estado.temporada.rodada;
  const saida: { texto: string; bom: boolean }[] = [];
  const restantes: DecisaoPendente[] = [];
  for (const d of m.decisoesPendentes ?? []) {
    if (d.rodada > rodada) {
      restantes.push(d);
      continue;
    }
    const meu = estado.temporada.clubes[estado.carreira.clubeId!];
    const j = meu?.jogadores.find((x) => x.id === d.jogadorId);
    if (!meu || !j) continue;
    const peso = importanciaNoTime(meu, j);
    const chance =
      (estado.carreira.diretoria >= 45 ? 0.35 : 0.15) +
      peso * 0.5 +
      (d.tendeAVender ? 0 : 0.2) +
      m.financas.ouvir / 400;
    if (rng.proximo() < chance) {
      saida.push({
        texto: `A diretoria analisou e decidiu manter ${j.nome}: é peça importante do time.`,
        bom: true,
      });
      if (j.perso === "temperamental" && rng.proximo() < 0.5) j.moral = limitar(j.moral - 10, 0, 100);
    } else {
      vender(estado, j.id, d.valor, d.comprador);
      m.financas.ouvir = limitar(m.financas.ouvir - 5, 0, 100);
      saida.push({
        texto: `Depois de analisar, a diretoria aceitou a proposta e vendeu ${j.nome}.`,
        bom: false,
      });
    }
  }
  m.decisoesPendentes = restantes;
  return saida;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
