import {
  type Clube,
  ESQUEMAS,
  ESQUEMA_POSTOS,
  type Esquema,
  FUNCOES,
  INSTRUCOES,
  type Instrucao,
  type Nivel,
  type Posicao,
  type Tatica as TaticaDoClube,
  disponivel,
  escalarAutomatico,
  familiaridade,
  forcaDoClube,
  instrucaoDoJogador,
} from "@prancheta/engine";
import { useState } from "react";
import { Folha } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";

const MENTALIDADES = [
  { v: -2, nome: "Retranca" },
  { v: -1, nome: "Cautela" },
  { v: 0, nome: "Equilíbrio" },
  { v: 1, nome: "Ofensiva" },
  { v: 2, nome: "Tudo ao ataque" },
];

const NIVEIS_TATICOS: {
  chave: Exclude<keyof TaticaDoClube, "mentalidade" | "contra">;
  nome: string;
  niveis: [string, string, string];
}[] = [
  { chave: "pressao", nome: "Pressão", niveis: ["Baixa", "Média", "Alta"] },
  { chave: "linha", nome: "Linha defensiva", niveis: ["Recuada", "Normal", "Alta"] },
  { chave: "largura", nome: "Largura", niveis: ["Fechada", "Normal", "Aberta"] },
  { chave: "ritmo", nome: "Ritmo", niveis: ["Cadenciado", "Normal", "Rápido"] },
];

/** Controles de tática do time (usados também na prancheta durante a partida). */
export function ControlesTaticos({
  tatica,
  aoMudar,
}: { tatica: TaticaDoClube; aoMudar: (t: TaticaDoClube) => void }) {
  return (
    <div className="stack">
      <div className="field">
        <span className="small" style={{ fontWeight: 600 }}>
          Mentalidade
        </span>
        <div className="seg" role="group" aria-label="Mentalidade">
          {MENTALIDADES.map((m) => (
            <button
              key={m.v}
              type="button"
              aria-pressed={tatica.mentalidade === m.v}
              onClick={() => aoMudar({ ...tatica, mentalidade: m.v })}
            >
              {m.nome}
            </button>
          ))}
        </div>
      </div>
      {NIVEIS_TATICOS.map((n) => (
        <div key={n.chave} className="field">
          <span className="small" style={{ fontWeight: 600 }}>
            {n.nome}
          </span>
          <div className="seg" role="group" aria-label={n.nome}>
            {n.niveis.map((rotulo, i) => (
              <button
                key={rotulo}
                type="button"
                aria-pressed={tatica[n.chave] === i}
                onClick={() => aoMudar({ ...tatica, [n.chave]: i as Nivel })}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="toggle">
        <span className="small" style={{ fontWeight: 600 }}>
          Explorar contra-ataques
        </span>
        <button
          type="button"
          className="switch"
          aria-pressed={tatica.contra}
          aria-label="Explorar contra-ataques"
          onClick={() => aoMudar({ ...tatica, contra: !tatica.contra })}
        />
      </div>
    </div>
  );
}

function FolhaDoPosto({ clube, indice, aoFechar }: { clube: Clube; indice: number; aoFechar: () => void }) {
  const mexer = useLoja((s) => s.mexer);
  const posto = ESQUEMA_POSTOS[clube.esquema][indice]![0] as Posicao;
  const atualId = clube.titulares[indice]!;
  const atual = clube.jogadores.find((j) => j.id === atualId)!;
  const instr = instrucaoDoJogador(clube, atualId, posto);
  const candidatos = clube.jogadores
    .map((j) => ({ j, valor: j.ovr * familiaridade(j, posto) }))
    .sort((a, b) => b.valor - a.valor);

  function escolher(id: string) {
    mexer(() => {
      const outro = clube.titulares.indexOf(id);
      if (outro >= 0) clube.titulares[outro] = atualId;
      clube.titulares[indice] = id;
      clube.forca = forcaDoClube(clube);
    });
    aoFechar();
  }
  function mudarInstrucao(mudanca: Partial<Instrucao>) {
    mexer(() => {
      clube.instrucoes[atualId] = { ...clube.instrucoes[atualId], ...mudanca };
    });
  }
  return (
    <Folha titulo={`${posto} · ${atual.nome}`} aoFechar={aoFechar}>
      <div className="field">
        <label htmlFor="funcao">Função</label>
        <select
          id="funcao"
          value={instr.funcao ?? FUNCOES[posto][0]![0]}
          onChange={(e) => {
            const funcao = FUNCOES[posto].find(([nome]) => nome === e.target.value)!;
            mudarInstrucao({
              apoio: 0,
              cruz: 0,
              chute: 0,
              drible: 0,
              passe: 0,
              desarme: 0,
              pressao: 0,
              alvo: 0,
              ...funcao[1],
              funcao: funcao[0],
            });
          }}
        >
          {FUNCOES[posto].map(([nome]) => (
            <option key={nome}>{nome}</option>
          ))}
        </select>
      </div>
      {posto !== "GOL" &&
        INSTRUCOES.map((i) => (
          <div key={i.chave} className="field">
            <span className="small" style={{ fontWeight: 600 }}>
              {i.nome}
            </span>
            <div className="seg" role="group" aria-label={i.nome}>
              {i.niveis.map((rotulo, k) => (
                <button
                  key={rotulo}
                  type="button"
                  aria-pressed={instr[i.chave] === k - 1}
                  onClick={() => mudarInstrucao({ [i.chave]: k - 1 })}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <span className="hint">{i.dica}</span>
          </div>
        ))}
      <h3>Trocar jogador</h3>
      <div className="plist">
        {candidatos.map(({ j, valor }) => (
          <button
            key={j.id}
            type="button"
            className="prow"
            disabled={j.id === atualId}
            onClick={() => escolher(j.id)}
          >
            <span className={`pos ${j.pos}`}>{j.pos}</span>
            <span style={{ minWidth: 0 }}>
              <div className="nm">
                {j.nome} {clube.titulares.includes(j.id) && <span className="tag xi">XI</span>}{" "}
                {!disponivel(j) && <span className="tag les">FORA</span>}
              </div>
              <div className="meta">
                rende {Math.round(valor)} aqui · cond. {j.cond}%
              </div>
            </span>
            <span />
            <span className="ovr">{j.ovr}</span>
          </button>
        ))}
      </div>
    </Folha>
  );
}

export function Campo({ clube, aoEscolher }: { clube: Clube; aoEscolher?: (indice: number) => void }) {
  const postos = ESQUEMA_POSTOS[clube.esquema];
  return (
    <div className="pitch" role="group" aria-label={`Escalação no ${clube.esquema}`}>
      <div className="area" />
      <div className="mid" />
      <div className="circ" />
      {postos.map(([posto, x, y], i) => {
        const j = clube.jogadores.find((p) => p.id === clube.titulares[i]);
        const ruim = !j || !disponivel(j) || familiaridade(j, posto) < 0.85;
        return (
          <button
            key={`${posto}-${x}-${y}`}
            type="button"
            className={`slot${posto === "GOL" ? " gk" : ""}${ruim ? " bad" : ""}`}
            style={{ left: `${x}%`, bottom: `${7 + y * 0.86}%` }}
            onClick={() => aoEscolher?.(i)}
            aria-label={`${posto}: ${j?.nome ?? "vazio"}`}
          >
            <span className="shirt">{j?.ovr ?? "?"}</span>
            <span className="lbl">{j?.nome.split(" ").slice(-1)[0] ?? "—"}</span>
            <span className="sp">{posto}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Tatica() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const [posto, setPosto] = useState<number | null>(null);
  const clubeId = jogo.carreira.clubeId;
  if (!clubeId) return <p className="vazio">Sem clube, sem prancheta.</p>;
  const clube = jogo.temporada.clubes[clubeId]!;
  const entrosamento = Math.round(jogo.carreira.entrosamento[clube.esquema] ?? 45);

  function mudarEsquema(esquema: Esquema) {
    mexer(() => {
      const nomes = clube.titulares.map((id) => clube.jogadores.find((j) => j.id === id)?.nome ?? "");
      clube.esquema = esquema;
      clube.titulares = escalarAutomatico(clube, esquema, nomes);
      clube.forca = forcaDoClube(clube);
    });
  }
  return (
    <div className="grade duas">
      <section className="panel stack">
        <div className="linha-entre">
          <h2>Escalação</h2>
          <span className="small muted">entrosamento {entrosamento}%</span>
        </div>
        <div className="field">
          <label htmlFor="esquema">Esquema</label>
          <select
            id="esquema"
            value={clube.esquema}
            onChange={(e) => mudarEsquema(e.target.value as Esquema)}
          >
            {ESQUEMAS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>
        <Campo clube={clube} aoEscolher={setPosto} />
        <p className="small muted" style={{ margin: 0 }}>
          Toque num jogador para trocar, definir a função e dar instruções. Contorno vermelho: fora de posição
          ou indisponível.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() =>
            mexer(() => {
              clube.titulares = escalarAutomatico(clube, clube.esquema);
              clube.forca = forcaDoClube(clube);
            })
          }
        >
          Escalar automaticamente
        </button>
      </section>
      <section className="panel stack">
        <h2>Como o time joga</h2>
        <ControlesTaticos
          tatica={clube.tatica}
          aoMudar={(t) =>
            mexer(() => {
              clube.tatica = t;
            })
          }
        />
      </section>
      {posto !== null && <FolhaDoPosto clube={clube} indice={posto} aoFechar={() => setPosto(null)} />}
    </div>
  );
}
