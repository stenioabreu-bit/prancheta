import {
  type Partida,
  chaveDoLogo,
  dataDoJogo,
  dataDoHorario,
  type EstadoTemporada,
  fasesDaCompeticao,
  type JogoAgendado,
  disponivel,
  nomeDaCompeticao,
  proximoJogoDoUsuario,
  simularPartidaDoUsuario,
} from "@prancheta/engine";
import { useEffect, useState } from "react";
import { useJogo, useLoja } from "../estado/loja";
import { Estatisticas, Sumula } from "../telas/Partida";
import { LogoCompeticao } from "./LogoCompeticao";
import { Escudo } from "./basicos";

/** Segunda-feira da semana do calendário (a "rodada" interna do jogo é uma semana). */
export function dataDaSemana(semana: number): string {
  const quarta = new Date(`${dataDoHorario(semana, true)}T00:00:00Z`);
  quarta.setUTCDate(quarta.getUTCDate() - 2);
  return quarta.toISOString().slice(0, 10);
}

/** Rótulo da partida como no campeonato real: "13ª rodada" na liga, fase e ida/volta no mata-mata. */
export function rotuloDaPartida(t: EstadoTemporada, jogo: JogoAgendado): string {
  const fase = fasesDaCompeticao(t, jogo.competicao).find((f) => f.nome === jogo.fase);
  if (fase?.tipo === "mataMata") {
    const c = fase.confrontos[jogo.grupo];
    const perna = c && c.jogos.length > 1 ? (c.jogos[0] === jogo.id ? " · ida" : " · volta") : "";
    return `${jogo.fase}${perna}`;
  }
  const jogados = Object.values(t.jogos).filter(
    (x) =>
      x.competicao === jogo.competicao &&
      x.fase === jogo.fase &&
      x.placar &&
      (x.casa === jogo.casa || x.visitante === jogo.casa),
  ).length;
  return `${fase && fase.tipo === "liga" && fase.grupos.length > 1 ? `${jogo.fase} · ` : ""}${jogados + 1}ª rodada`;
}

export function dataPorExtenso(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const dia = new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay();
  return `${["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][dia]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
}

/**
 * Barra do pré-jogo: fica no topo enquanto o técnico ajusta tática e elenco; daí escolhe como assistir
 * (campo, só texto) ou simula rápido.
 */
export function PreJogo() {
  const jogo = useJogo();
  const setPreJogo = useLoja((s) => s.setPreJogo);
  const setModo = useLoja((s) => s.setModoPartida);
  const setEmPartida = useLoja((s) => s.setEmPartida);
  const [rapida, setRapida] = useState(false);
  const proximo = proximoJogoDoUsuario(jogo);
  if (!proximo && !rapida) return null;
  const t = jogo.temporada;
  const meu = jogo.carreira.clubeId ? t.clubes[jogo.carreira.clubeId] : null;
  const titulares = meu
    ? meu.titulares.map((id) => meu.jogadores.find((j) => j.id === id)).filter(Boolean)
    : [];
  const cansados = titulares.filter((j) => j!.cond < 70).length;
  const fora = titulares.filter((j) => !disponivel(j!)).length;
  const assistir = (modo: "campo" | "texto") => {
    setModo(modo);
    setPreJogo(false);
    setEmPartida(true);
  };
  return (
    <>
      {proximo && (
        <section className="prejogo" aria-label="Pré-jogo">
          <div className="prejogo-info">
            <LogoCompeticao competicao={chaveDoLogo(t, proximo.competicao)} tamanho={26} />
            <div>
              <b>
                {t.clubes[proximo.casa]?.nome} x {t.clubes[proximo.visitante]?.nome}
              </b>
              <div className="small muted">
                {nomeDaCompeticao(t, proximo.competicao)} · {dataPorExtenso(dataDoJogo(proximo))}
              </div>
              <div className="small">
                {fora > 0 ? <span className="aviso-ruim">{fora} titular(es) indisponível(is) · </span> : null}
                {cansados > 0 ? (
                  <span className="aviso-medio">{cansados} titular(es) cansado(s)</span>
                ) : (
                  <span className="muted">Titulares descansados</span>
                )}
              </div>
            </div>
          </div>
          <div className="prejogo-botoes">
            <button type="button" className="btn primary" onClick={() => assistir("campo")}>
              Simulação em campo
            </button>
            <button type="button" className="btn" onClick={() => assistir("texto")}>
              Simulação em texto
            </button>
            <button type="button" className="btn" onClick={() => setRapida(true)}>
              Simulação rápida
            </button>
            <button type="button" className="btn ghost" onClick={() => setPreJogo(false)}>
              Voltar
            </button>
          </div>
        </section>
      )}
      {rapida && <SimulacaoRapida aoFechar={() => (setRapida(false), setPreJogo(false))} />}
    </>
  );
}

/** Simulação rápida: 5 segundos de "simulando" e o resultado com súmula e estatísticas. */
function SimulacaoRapida({ aoFechar }: { aoFechar: () => void }) {
  const mexer = useLoja((s) => s.mexer);
  const [m, setM] = useState<Partida | null>(null);
  const [progresso, setProgresso] = useState(0);
  useEffect(() => {
    const inicio = Date.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - inicio) / 5000);
      setProgresso(p);
      if (p >= 1) {
        clearInterval(timer);
        setM(mexer((j) => simularPartidaDoUsuario(j)));
      }
    }, 100);
    return () => clearInterval(timer);
  }, [mexer]);
  return (
    <div className="comemoracao" role="dialog" aria-modal="true" aria-label="Simulação rápida">
      <div className="comemoracao-card rapida-card">
        {!m ? (
          <>
            <span className="eyebrow">Simulação rápida</span>
            <h2>Simulando a partida…</h2>
            <div className="barra-progresso" aria-hidden="true">
              <i style={{ width: `${Math.round(progresso * 100)}%` }} />
            </div>
            <span className="small muted">{Math.round(progresso * 90)}'</span>
          </>
        ) : (
          <>
            <span className="eyebrow">Fim de jogo</span>
            <div className="score rapida-placar">
              <div className="t">
                <Escudo clube={m.casa.clube} tamanho={44} />
                <span>{m.casa.clube.nome}</span>
                <Sumula m={m} lado="casa" />
              </div>
              <div className="g num">
                {m.casa.est.gols} – {m.visitante.est.gols}
              </div>
              <div className="t">
                <Escudo clube={m.visitante.clube} tamanho={44} />
                <span>{m.visitante.clube.nome}</span>
                <Sumula m={m} lado="visitante" />
              </div>
            </div>
            <Estatisticas m={m} />
            <button type="button" className="btn primary big" onClick={aoFechar}>
              Continuar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
