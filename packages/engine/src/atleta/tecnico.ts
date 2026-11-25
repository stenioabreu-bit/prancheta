/**
 * Pós-carreira: o atleta aposentado pode virar técnico no mesmo mundo. O save passa a ser uma
 * carreira de técnico comum (com o histórico de jogador guardado em `atleta`).
 */
import { publicarNoticia } from "../carreira/efeitos";
import type { EstadoJogo } from "../carreira/jogo";
import { escalarAutomatico, forcaDoClube } from "../clube";
import { divisaoDo } from "../competicao/temporada";
import { assumir } from "../mercado/tecnico";
import { criarRng, limitar } from "../rng";
import type { Clube } from "../tipos";
import { marcaAtiva } from "./motor";

export interface PropostaDeTecnico {
  clubeId: string;
  nome: string;
  /** Por que o clube chamou (ídolo da casa, aposta, projeto). */
  motivo: string;
}

/** Nível de clube que confia num ex-jogador sem experiência como técnico. */
function alcanceDoNovoTecnico(estado: EstadoJogo): number {
  const a = estado.atleta!;
  const v = a.vida;
  const licenca = marcaAtiva(a, "licenca-tecnico") ? 5 : 0;
  return 52 + licenca + (v.reputacao - 50) / 4 + (v.fama - 40) / 6 + (v.elenco - 50) / 10;
}

function elegivel(c: Clube): boolean {
  return c.jogadores.length >= 16;
}

/** Até três clubes chamam o recém-aposentado: o clube onde ele mais jogou (se gostam dele) e apostas menores. */
export function propostasDeTecnico(estado: EstadoJogo): PropostaDeTecnico[] {
  const a = estado.atleta;
  if (!a?.aposentado || a.virouTecnico) return [];
  const t = estado.temporada;
  const r: PropostaDeTecnico[] = [];
  const jogosPorClube = new Map<string, number>();
  for (const h of a.historico) jogosPorClube.set(h.clubeId, (jogosPorClube.get(h.clubeId) ?? 0) + h.jogos);
  const [casa] = [...jogosPorClube.entries()].sort((x, y) => y[1] - x[1]);
  if (casa && casa[1] >= 40 && a.vida.reputacao >= 45) {
    const c = t.clubes[casa[0]];
    if (c && elegivel(c))
      r.push({
        clubeId: c.id,
        nome: c.nome,
        motivo: `Ídolo da casa: ${casa[1]} jogos com a camisa do clube.`,
      });
  }
  const alvo = alcanceDoNovoTecnico(estado);
  // Ordem estável entre telas: sorteio pela semente do save, sem gastar o RNG do jogo.
  const rng = criarRng((t.rng ^ 0x7ec1) >>> 0);
  const candidatos = Object.values(t.clubes)
    .filter((c) => elegivel(c) && !r.some((p) => p.clubeId === c.id) && c.forca <= alvo + 2)
    .map((c) => ({ c, nota: Math.abs(c.forca - alvo) + rng.proximo() * 6 }))
    .sort((x, y) => x.nota - y.nota);
  for (const { c } of candidatos) {
    if (r.length >= 3) break;
    const div = divisaoDo(t, c.id);
    r.push({
      clubeId: c.id,
      nome: c.nome,
      motivo: div
        ? `Aposta da diretoria na Série ${div}: querem um nome conhecido para o vestiário.`
        : "Projeto no exterior, com elenco modesto e paciência para o novato.",
    });
  }
  return r;
}

/** O ex-jogador assume o clube como técnico; daqui em diante o jogo segue no modo técnico. */
export function virarTecnico(estado: EstadoJogo, clubeId: string): boolean {
  const a = estado.atleta;
  if (!a?.aposentado || a.virouTecnico) return false;
  if (!propostasDeTecnico(estado).some((p) => p.clubeId === clubeId)) return false;
  const t = estado.temporada;
  // O jogador sai do elenco onde estava.
  for (const c of Object.values(t.clubes)) {
    if (!c.jogadores.some((j) => j.id === a.jogadorId)) continue;
    c.jogadores = c.jogadores.filter((j) => j.id !== a.jogadorId);
    if (c.titulares.includes(a.jogadorId)) c.titulares = escalarAutomatico(c, c.esquema);
    if (c.reservas) c.reservas = c.reservas.filter((id) => id !== a.jogadorId);
    c.forca = forcaDoClube(c);
  }
  const car = estado.carreira;
  car.tecnico = a.nome;
  car.reputacao = Math.round(limitar(34 + (a.vida.reputacao - 50) / 3 + a.vida.fama / 8, 30, 62));
  car.caixa = [];
  estado.mercado.passagens = [];
  const rng = criarRng(t.rng);
  assumir(estado, clubeId, rng);
  t.rng = rng.estado();
  a.virouTecnico = true;
  const clube = t.clubes[clubeId]!;
  a.posCarreira =
    `${a.posCarreira ?? ""} Pouco depois, aceitou o convite do ${clube.nome} e virou técnico.`.trim();
  publicarNoticia(
    car,
    t.rodada,
    "Imprensa",
    `Ex-jogador, ${a.nome} estreia como técnico no ${clube.nome}.`,
    "bom",
  );
  return true;
}
