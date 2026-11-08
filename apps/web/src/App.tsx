import { pacoteFicticio } from "@prancheta/data";
import { useEffect, useRef, useState } from "react";
import type { PedidoSimulacao, RespostaSimulacao } from "./simulador.worker";

const clubes = pacoteFicticio().divisoes.A ?? [];

/** Tela provisória da Fase 0: escolhe dois clubes fictícios e roda um jogo no Web Worker. */
export function App() {
  const [casaId, setCasaId] = useState(clubes[0]!.id);
  const [visitanteId, setVisitanteId] = useState(clubes[1]!.id);
  const [resposta, setResposta] = useState<RespostaSimulacao | null>(null);
  const [rodando, setRodando] = useState(false);
  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    const w = new Worker(new URL("./simulador.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<RespostaSimulacao>) => {
      setResposta(e.data);
      setRodando(false);
    };
    worker.current = w;
    return () => w.terminate();
  }, []);

  function simular() {
    setRodando(true);
    const pedido: PedidoSimulacao = { casaId, visitanteId, semente: Math.floor(Math.random() * 2 ** 32) };
    worker.current?.postMessage(pedido);
  }

  const r = resposta?.resultado;
  return (
    <main className="pagina">
      <header>
        <p className="sobretitulo">Fase 0 · motor portado</p>
        <h1>Prancheta</h1>
      </header>
      <section className="painel">
        <label>
          Mandante
          <select value={casaId} onChange={(e) => setCasaId(e.target.value)}>
            {clubes.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === visitanteId}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visitante
          <select value={visitanteId} onChange={(e) => setVisitanteId(e.target.value)}>
            {clubes.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === casaId}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="botao" onClick={simular} disabled={rodando}>
          {rodando ? "Simulando…" : "Simular jogo"}
        </button>
      </section>
      {resposta && r && (
        <section className="painel">
          <div className="placar">
            <span>{resposta.nomes.casa}</span>
            <strong>
              {r.golsCasa} – {r.golsVisitante}
            </strong>
            <span>{resposta.nomes.visitante}</span>
          </div>
          <p className="estatisticas">
            Posse {r.est.casa.posse}% x {r.est.visitante.posse}% · Finalizações {r.est.casa.chutes} x{" "}
            {r.est.visitante.chutes} · xG {r.est.casa.xg.toFixed(2)} x {r.est.visitante.xg.toFixed(2)}
          </p>
          <ol className="narracao" aria-live="polite">
            {resposta.eventos.map((ev, i) => (
              <li key={`${ev.min}-${i}`} className={`evento ${ev.tipo}`}>
                <span className="minuto">{ev.min}'</span> {ev.texto}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
