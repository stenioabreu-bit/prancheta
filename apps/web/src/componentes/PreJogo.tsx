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
  const [escolher, setEscolher] = useState(false);
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
          <LogoCompeticao competicao={chaveDoLogo(t, proximo.competicao)} tamanho={22} />
          <div className="prejogo-texto">
            <b>
              {t.clubes[proximo.casa]?.sigla} x {t.clubes[proximo.visitante]?.sigla}
            </b>
            <span className="small muted" style={{ display: "block" }}>
              {dataPorExtenso(dataDoJogo(proximo))}
              {fora > 0 ? ` · ${fora} fora` : ""}
              {cansados > 0 ? ` · ${cansados} cansado(s)` : ""}
            </span>
          </div>
          <button type="button" className="btn primary" onClick={() => setEscolher(true)}>
            Jogar
          </button>
          <button
            type="button"
            className="fechar-x"
            aria-label="Sair do pré-jogo"
            onClick={() => setPreJogo(false)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </section>
      )}
      {proximo && escolher && !rapida && (
        <div className="modal-desfocado" role="dialog" aria-modal="true" aria-label="Escolher simulação">
          <div className="modal-simulacao">
            <button
              type="button"
              className="fechar-x canto"
              aria-label="Fechar"
              onClick={() => setEscolher(false)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <LogoCompeticao competicao={chaveDoLogo(t, proximo.competicao)} tamanho={44} />
            <h2>
              {t.clubes[proximo.casa]?.nome} x {t.clubes[proximo.visitante]?.nome}
            </h2>
            <span className="small muted">
              {nomeDaCompeticao(t, proximo.competicao)} · {dataPorExtenso(dataDoJogo(proximo))}
            </span>
            <span className="eyebrow" style={{ marginTop: 6 }}>
              Como você quer jogar?
            </span>
            <button type="button" className="btn primary big opcao-sim" onClick={() => assistir("campo")}>
              Simulação em campo
              <span className="small">Assiste no campinho e mexe no time durante o jogo</span>
            </button>
            <button type="button" className="btn big opcao-sim" onClick={() => assistir("texto")}>
              Simulação em texto
              <span className="small muted">Mesma partida, só com a narração</span>
            </button>
            <button type="button" className="btn big opcao-sim" onClick={() => setRapida(true)}>
              Simulação rápida
              <span className="small muted">Resultado em 5 segundos, com súmula e estatísticas</span>
            </button>
          </div>
        </div>
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
