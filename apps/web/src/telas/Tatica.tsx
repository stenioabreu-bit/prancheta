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
  { v: 2, nome: "Ataque total" },
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

const SETORES = ["D", "MD", "MO", "O"];
const CORREDORES = ["E", "C", "D"];
const LIMITE_DO_BANCO = 12;

type Papel = { tipo: "titular"; indice: number } | { tipo: "banco" } | { tipo: "fora" };

/** Campo horizontal (ataca para a direita) com 4 setores × 3 corredores. */
function CampoHorizontal({
  clube,
  selecionado,
  aoClicar,
}: { clube: Clube; selecionado: string | null; aoClicar: (id: string) => void }) {
  const postos = ESQUEMA_POSTOS[clube.esquema];
  return (
    <div className="campo-h" role="group" aria-label={`Escalação no ${clube.esquema}`}>
      {SETORES.map((s, i) =>
        CORREDORES.map((c, k) => (
          <span key={s + c} className="zona" style={{ left: `${i * 25}%`, top: `${k * 33.34}%` }}>
            {s + c}
          </span>
        )),
      )}
      <div className="area-h" />
      <div className="meio-h" />
      {postos.map(([posto, x, y], i) => {
        const id = clube.titulares[i]!;
        const j = clube.jogadores.find((p) => p.id === id);
        const ruim = !j || !disponivel(j) || familiaridade(j, posto) < 0.85;
        const classes = [
          "slot-h",
          posto === "GOL" ? "gk" : "",
          ruim ? "bad" : "",
          selecionado === id ? "sel" : "",
        ];
        return (
          <button
            key={`${posto}-${x}-${y}`}
            type="button"
            className={classes.filter(Boolean).join(" ")}
            style={{ left: `${5 + y * 0.9}%`, top: `${6 + x * 0.88}%` }}
            onClick={() => aoClicar(id)}
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

function ListaDeJogadores(props: {
  titulo: string;
  ids: string[];
  clube: Clube;
  selecionado: string | null;
  aoClicar: (id: string) => void;
  aoMoverPraCa: (() => void) | null;
}) {
  const { titulo, ids, clube, selecionado, aoClicar, aoMoverPraCa } = props;
  return (
    <section className="panel lista-tatica">
      <div className="linha-entre">
        <h3>{titulo}</h3>
        {aoMoverPraCa && (
          <button type="button" className="btn" onClick={aoMoverPraCa}>
            Mover para cá
          </button>
        )}
      </div>
      <div className="plist">
        {ids.map((id) => {
          const j = clube.jogadores.find((p) => p.id === id);
          if (!j) return null;
          return (
            <button
              key={id}
              type="button"
              className={selecionado === id ? "prow sel" : "prow"}
              onClick={() => aoClicar(id)}
            >
              <span className={`pos ${j.pos}`}>{j.pos}</span>
              <span className="nm">
                {j.nome} {!disponivel(j) && <span className="tag les">FORA</span>}
              </span>
              <span className="cond">
                <i style={{ width: `${j.cond}%` }} />
              </span>
              <span className="ovr">{j.ovr}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Tatica() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const [sel, setSel] = useState<string | null>(null);
  const [posto, setPosto] = useState<number | null>(null);
  const clubeId = jogo.carreira.clubeId;
  if (!clubeId) return <p className="vazio">Sem clube, sem prancheta.</p>;
  const clube = jogo.temporada.clubes[clubeId]!;
  const naoTitulares = clube.jogadores
    .filter((j) => !clube.titulares.includes(j.id))
    .sort((a, b) => b.ovr - a.ovr);
  const banco = (clube.reservas ?? naoTitulares.slice(0, LIMITE_DO_BANCO).map((j) => j.id)).filter(
    (id) => !clube.titulares.includes(id) && clube.jogadores.some((j) => j.id === id),
  );
  const fora = naoTitulares.map((j) => j.id).filter((id) => !banco.includes(id));

  const papel = (id: string): Papel => {
    const i = clube.titulares.indexOf(id);
    if (i >= 0) return { tipo: "titular", indice: i };
    return banco.includes(id) ? { tipo: "banco" } : { tipo: "fora" };
  };

  function aplicar(novoBanco: string[]) {
    clube.reservas = novoBanco;
    clube.forca = forcaDoClube(clube);
  }

  function trocar(a: string, b: string) {
    mexer(() => {
      const pa = papel(a);
      const pb = papel(b);
      const lista = [...banco];
      if (pa.tipo === "titular" && pb.tipo === "titular") {
        clube.titulares[pa.indice] = b;
        clube.titulares[pb.indice] = a;
      } else if (pa.tipo === "titular" || pb.tipo === "titular") {
        const titular = pa.tipo === "titular" ? a : b;
        const outro = titular === a ? b : a;
        const indice = (titular === a ? pa : pb) as { indice: number };
        const papelOutro = titular === a ? pb : pa;
        clube.titulares[indice.indice] = outro;
        if (papelOutro.tipo === "banco") lista[lista.indexOf(outro)] = titular;
      } else if (pa.tipo !== pb.tipo) {
        const noBanco = pa.tipo === "banco" ? a : b;
        const deFora = noBanco === a ? b : a;
        lista[lista.indexOf(noBanco)] = deFora;
      }
      aplicar(lista);
    });
  }

  function clicar(id: string) {
    if (!sel) {
      setSel(id);
      return;
    }
    if (sel !== id) trocar(sel, id);
    setSel(null);
  }

  const selPapel = sel ? papel(sel) : null;
  const moverParaBanco =
    sel && selPapel?.tipo === "fora" && banco.length < LIMITE_DO_BANCO
      ? () => {
          mexer(() => aplicar([...banco, sel]));
          setSel(null);
        }
      : null;
  const moverParaFora =
    sel && selPapel?.tipo === "banco"
      ? () => {
          mexer(() => aplicar(banco.filter((x) => x !== sel)));
          setSel(null);
        }
      : null;

  function mudarEsquema(esquema: Esquema) {
    mexer(() => {
      const nomes = clube.titulares.map((id) => clube.jogadores.find((j) => j.id === id)?.nome ?? "");
      clube.esquema = esquema;
      clube.titulares = escalarAutomatico(clube, esquema, nomes);
      aplicar(banco.filter((id) => !clube.titulares.includes(id)));
    });
  }

  return (
    <div className="tatica-grade">
      <section className="panel stack tatica-campo">
        <div className="linha-entre" style={{ flexWrap: "wrap" }}>
          <select
            aria-label="Esquema"
            value={clube.esquema}
            onChange={(e) => mudarEsquema(e.target.value as Esquema)}
            style={{ width: "auto" }}
          >
            {ESQUEMAS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <span className="small muted">
            entrosamento {Math.round(jogo.carreira.entrosamento[clube.esquema] ?? 45)}%
          </span>
          {selPapel?.tipo === "titular" && (
            <button type="button" className="btn" onClick={() => setPosto(selPapel.indice)}>
              Função e instruções
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={() =>
              mexer(() => {
                clube.titulares = escalarAutomatico(clube, clube.esquema);
                aplicar(banco.filter((id) => !clube.titulares.includes(id)));
              })
            }
          >
            Escalar automático
          </button>
        </div>
        <CampoHorizontal clube={clube} selecionado={sel} aoClicar={clicar} />
        <p className="small muted" style={{ margin: 0 }}>
          {sel
            ? "Agora toque em quem vai trocar de lugar com ele."
            : "Toque num jogador e depois em outro para trocar (campo, banco ou não relacionados)."}
        </p>
      </section>
      <div className="tatica-listas">
        <ListaDeJogadores
          titulo={`Banco · ${banco.length}/${LIMITE_DO_BANCO}`}
          ids={banco}
          clube={clube}
          selecionado={sel}
          aoClicar={clicar}
          aoMoverPraCa={moverParaBanco}
        />
        <ListaDeJogadores
          titulo="Não relacionados"
          ids={fora}
          clube={clube}
          selecionado={sel}
          aoClicar={clicar}
          aoMoverPraCa={moverParaFora}
        />
      </div>
      <section className="panel stack tatica-ctrl">
        <h3>Como o time joga</h3>
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
