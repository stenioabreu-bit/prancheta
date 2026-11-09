/**
 * Empréstimos como no futebol real: 6 meses, 1 ano ou 2 anos. Quem pega emprestado paga uma taxa
 * (proporcional ao valor e ao tempo) e o jogador volta sozinho ao clube de origem no fim do prazo.
 * O técnico pode pedir um jogador emprestado (passa pela diretoria, como a indicação) ou emprestar um
 * do seu elenco para ganhar minutos em outro clube.
 */
import { enviarMensagem, publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import { divisaoDo } from "../competicao/temporada";
import type { Rng } from "../rng";
import { registrar } from "./financas";
import { clubeDoJogador, importanciaNoTime, transferir, valorNoClube } from "./transferencias";
import { arredondar, formatarDinheiro, janelaAberta } from "./valores";

export type DuracaoEmprestimo = "6m" | "1a" | "2a";

export const DURACOES: readonly { id: DuracaoEmprestimo; nome: string; semanas: number; taxa: number }[] = [
  { id: "6m", nome: "6 meses", semanas: 26, taxa: 0.05 },
  { id: "1a", nome: "1 ano", semanas: 52, taxa: 0.1 },
  { id: "2a", nome: "2 anos", semanas: 104, taxa: 0.18 },
];

export interface Emprestimo {
  jogadorId: string;
  nome: string;
  /** Clube dono do jogador (para onde ele volta). */
  origem: string;
  destino: string;
  /** Semana absoluta (temporada × 52 + semana) em que o jogador volta. */
  fim: number;
  duracao: DuracaoEmprestimo;
  /** Entrada: o técnico pegou emprestado; saída: emprestou um do elenco. */
  tipo: "entrada" | "saida";
}

const semanaAbsoluta = (estado: EstadoJogo) => estado.temporada.temporada * 52 + estado.temporada.rodada;

export function taxaDeEmprestimo(estado: EstadoJogo, jogadorId: string, duracao: DuracaoEmprestimo): number {
  const de = clubeDoJogador(estado, jogadorId);
  const j = de?.jogadores.find((x) => x.id === jogadorId);
  if (!de || !j) return 0;
  return arredondar(valorNoClube(estado, j, de) * DURACOES.find((d) => d.id === duracao)!.taxa);
}

export function emprestimoDe(estado: EstadoJogo, jogadorId: string): Emprestimo | undefined {
  return estado.mercado.emprestimos?.find((e) => e.jogadorId === jogadorId);
}

/** Pede um jogador emprestado: a diretoria paga a taxa se couber no orçamento e o outro clube libera. */
export function pedirEmprestimo(
  estado: EstadoJogo,
  jogadorId: string,
  duracao: DuracaoEmprestimo,
  rng: Rng,
): string {
  const t = estado.temporada;
  const meu = estado.carreira.clubeId ? t.clubes[estado.carreira.clubeId] : null;
  const de = clubeDoJogador(estado, jogadorId);
  const j = de?.jogadores.find((x) => x.id === jogadorId);
  if (!meu || !de || !j || de === meu) return "Jogador indisponível.";
  if (!janelaAberta(t.rodada)) return "A janela de transferências está fechada.";
  if (emprestimoDe(estado, jogadorId)) return `${j.nome} já está emprestado.`;
  const d = DURACOES.find((x) => x.id === duracao)!;
  const taxa = taxaDeEmprestimo(estado, jogadorId, duracao);
  const f = estado.mercado.financas;
  if (taxa > f.orcamento)
    return `A diretoria não tem orçamento: o empréstimo custa ${formatarDinheiro(taxa)} e há ${formatarDinheiro(f.orcamento)}.`;
  const peso = importanciaNoTime(de, j);
  const libera = peso < 0.5 ? 0.85 : peso < 0.8 ? 0.45 : 0.15;
  if (rng.proximo() > libera)
    return `O ${de.nome} não aceitou emprestar ${j.nome}: ele é importante para o time.`;
  f.orcamento = arredondar(f.orcamento - taxa);
  f.caixa = arredondar((f.caixa ?? 0) - taxa);
  registrar(f, t.temporada, t.rodada, `Empréstimo de ${j.nome} (${d.nome})`, -taxa);
  transferir(j, de, meu);
  (estado.mercado.emprestimos ??= []).push({
    jogadorId,
    nome: j.nome,
    origem: de.id,
    destino: meu.id,
    fim: semanaAbsoluta(estado) + d.semanas,
    duracao,
    tipo: "entrada",
  });
  publicarNoticia(
    estado.carreira,
    t.rodada,
    "Mercado",
    `${j.nome} chega emprestado do ${de.nome} por ${d.nome}.`,
    "bom",
  );
  return `Empréstimo fechado: ${j.nome} chega do ${de.nome} por ${d.nome} (taxa de ${formatarDinheiro(taxa)}).`;
}

/** Empresta um jogador do elenco para um clube onde ele deve ter minutos; recebe metade da taxa. */
export function emprestarJogador(
  estado: EstadoJogo,
  jogadorId: string,
  duracao: DuracaoEmprestimo,
  rng: Rng,
): string {
  const t = estado.temporada;
  const meu = estado.carreira.clubeId ? t.clubes[estado.carreira.clubeId] : null;
  const j = meu?.jogadores.find((x) => x.id === jogadorId);
  if (!meu || !j) return "Jogador indisponível.";
  if (!janelaAberta(t.rodada)) return "A janela de transferências está fechada.";
  if (emprestimoDe(estado, jogadorId))
    return `${j.nome} está emprestado ao seu clube e não pode ser repassado.`;
  if (meu.jogadores.length <= 18) return "O elenco ficaria curto demais para emprestar.";
  const minha = divisaoDo(t, meu.id) ?? "D";
  const ordem = ["A", "B", "C", "D"];
  const candidatos = Object.values(t.clubes).filter((c) => {
    if (c.id === meu.id) return false;
    const d = divisaoDo(t, c.id);
    if (!d || ordem.indexOf(d) < ordem.indexOf(minha)) return false;
    const media = c.jogadores.reduce((s, x) => s + x.ovr, 0) / Math.max(1, c.jogadores.length);
    return j.ovr >= media - 1;
  });
  if (!candidatos.length) return `Nenhum clube se interessou por ${j.nome} agora.`;
  const destino = candidatos[Math.floor(rng.proximo() * candidatos.length)]!;
  const d = DURACOES.find((x) => x.id === duracao)!;
  const taxa = arredondar(taxaDeEmprestimo(estado, jogadorId, duracao) * 0.5);
  const f = estado.mercado.financas;
  f.caixa = arredondar((f.caixa ?? 0) + taxa);
  registrar(f, t.temporada, t.rodada, `Empréstimo de ${j.nome} ao ${destino.nome} (${d.nome})`, taxa);
  transferir(j, meu, destino);
  (estado.mercado.emprestimos ??= []).push({
    jogadorId,
    nome: j.nome,
    origem: meu.id,
    destino: destino.id,
    fim: semanaAbsoluta(estado) + d.semanas,
    duracao,
    tipo: "saida",
  });
  enviarMensagem(estado.carreira, t.rodada, {
    de: "Diretoria de futebol",
    assunto: `${j.nome} emprestado`,
    texto: `${j.nome} vai para o ${destino.nome} por ${d.nome} para ganhar minutos. Taxa recebida: ${formatarDinheiro(taxa)}.`,
  });
  return `${j.nome} emprestado ao ${destino.nome} por ${d.nome}.`;
}

/** Fim do prazo: o jogador volta ao clube de origem. */
export function devolverEmprestimos(estado: EstadoJogo): void {
  const t = estado.temporada;
  const agora = semanaAbsoluta(estado);
  const restantes: Emprestimo[] = [];
  for (const e of estado.mercado.emprestimos ?? []) {
    if (e.fim > agora) {
      restantes.push(e);
      continue;
    }
    const onde = clubeDoJogador(estado, e.jogadorId);
    const origem = t.clubes[e.origem];
    const j = onde?.jogadores.find((x) => x.id === e.jogadorId);
    if (onde && origem && j && onde !== origem) transferir(j, onde, origem);
    if (e.tipo === "saida" || e.destino === estado.carreira.clubeId)
      enviarMensagem(estado.carreira, t.rodada, {
        de: "Diretoria de futebol",
        assunto: `Fim do empréstimo: ${e.nome}`,
        texto:
          e.tipo === "saida"
            ? `${e.nome} terminou o empréstimo e voltou ao elenco.`
            : `${e.nome} terminou o empréstimo e voltou ao ${origem?.nome ?? "clube de origem"}.`,
      });
  }
  estado.mercado.emprestimos = restantes;
}
