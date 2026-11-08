import {
  type Divisao,
  type EstadoFase,
  type EstadoFaseMataMata,
  type EstadoJogo,
  type TipoDeRanking,
  chaveDoLogo,
  classificacaoDoGrupo,
  competicoesAtivas,
  divisaoDo,
  nomeDaCompeticao,
  ranking,
} from "@prancheta/engine";
import { useState } from "react";
import { LogoCompeticao } from "../componentes/LogoCompeticao";
import { Escudo, NomeClube } from "../componentes/basicos";
import { useJogo } from "../estado/loja";

type Competicao = Divisao | "copa";

const RANKINGS: { id: TipoDeRanking; nome: string; formato: (v: number) => string }[] = [
  { id: "gols", nome: "Artilharia", formato: (v) => String(v) },
  { id: "assistencias", nome: "Assistências", formato: (v) => String(v) },
  { id: "goleiros", nome: "Goleiros", formato: (v) => `${v.toFixed(2)} gols/j` },
  { id: "notas", nome: "Notas", formato: (v) => v.toFixed(2) },
];

/** Cor da faixa à esquerda: acesso/libertadores (azul), sul-americana (verde), rebaixamento (vermelho). */
function zona(competicao: Divisao, fase: string, pos: number, total: number): string {
  if (competicao === "A")
    return pos <= 4 ? "g4" : pos <= 6 ? "g6" : pos <= 12 ? "sula" : pos > total - 4 ? "z4" : "";
  if (competicao === "B") return pos <= 4 ? "g4" : pos > total - 4 ? "z4" : "";
  if (competicao === "C" && fase === "1ª fase") return pos <= 8 ? "g4" : pos > total - 6 ? "z4" : "";
  if (competicao === "C") return pos <= 2 ? "g4" : "";
  if (competicao === "D" && fase === "1ª fase") return pos <= 4 ? "g4" : "";
  return "";
}

function TabelaDaFase({
  jogo,
  competicao,
  fase,
  grupo,
}: { jogo: EstadoJogo; competicao: Divisao; fase: EstadoFase; grupo: number }) {
  if (fase.tipo !== "liga") return null;
  const t = jogo.temporada;
  const ordem = classificacaoDoGrupo(fase, grupo);
  const tabela = fase.tabelas[grupo]!;
  return (
    <div className="tblwrap">
      <table>
        <thead>
          <tr>
            <th aria-label="Zona" />
            <th>#</th>
            <th>Clube</th>
            <th>P</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>SG</th>
            <th>GP</th>
          </tr>
        </thead>
        <tbody>
          {ordem.map((id, i) => {
            const l = tabela[id]!;
            return (
              <tr key={id} className={id === jogo.carreira.clubeId ? "me" : undefined}>
                <td className={`z ${zona(competicao, fase.nome, i + 1, ordem.length)}`} />
                <td>{i + 1}</td>
                <td>
                  <NomeClube clube={t.clubes[id]!} tamanho={16} />
                </td>
                <td>
                  <b>{l.pts}</b>
                </td>
                <td>{l.j}</td>
                <td>{l.v}</td>
                <td>{l.e}</td>
                <td>{l.d}</td>
                <td>{l.gp - l.gc}</td>
                <td>{l.gp}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Confrontos({ jogo, fase }: { jogo: EstadoJogo; fase: EstadoFaseMataMata }) {
  const t = jogo.temporada;
  const meu = jogo.carreira.clubeId;
  return (
    <ul className="lista-limpa stack" style={{ gap: 4 }}>
      {fase.confrontos.map((c) => {
        const a = t.clubes[c.a]!;
        const b = t.clubes[c.b]!;
        const destaque = c.a === meu || c.b === meu;
        const placares = c.jogos.map((id) => t.jogos[id]!).filter((j) => j.placar);
        const parcial =
          !c.vencedor && placares.length
            ? placares.map((j) => `${j.placar![0]}x${j.placar![1]}`).join(", ")
            : null;
        return (
          <li key={`${c.a}${c.b}`} className="res small" style={destaque ? { fontWeight: 700 } : undefined}>
            <span className="rh" style={c.vencedor === c.a ? { fontWeight: 700 } : undefined}>
              {a.nome} <Escudo clube={a} tamanho={16} />
            </span>
            <b className="num">
              {c.agregado ? `${c.agregado[0]} x ${c.agregado[1]}` : (parcial ?? "x")}
              {c.penaltis ? ` (p ${c.penaltis[0]}x${c.penaltis[1]})` : ""}
            </b>
            <span className="ra" style={c.vencedor === c.b ? { fontWeight: 700 } : undefined}>
              <Escudo clube={b} tamanho={16} /> {b.nome}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Rankings({ jogo, divisao }: { jogo: EstadoJogo; divisao: Divisao }) {
  const [tipo, setTipo] = useState<TipoDeRanking>("gols");
  const config = RANKINGS.find((r) => r.id === tipo)!;
  const linhas = ranking(jogo.temporada, divisao, tipo, 15);
  return (
    <section className="panel stack">
      <h3>Rankings · Série {divisao}</h3>
      <div className="filters" role="group" aria-label="Ranking">
        {RANKINGS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="chip"
            aria-pressed={tipo === r.id}
            onClick={() => setTipo(r.id)}
          >
            {r.nome}
          </button>
        ))}
      </div>
      {linhas.length === 0 ? (
        <p className="vazio">Ainda sem dados.</p>
      ) : (
        <div className="plist">
          {linhas.map((l, i) => (
            <div key={l.jogador.id} className="prow rk">
              <span className="num muted">{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <div className="nm">{l.jogador.nome}</div>
                <div className="meta">
                  <NomeClube clube={l.clube} tamanho={13} /> · {l.jogos} j
                </div>
              </span>
              <b className="num">{config.formato(l.valor)}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Tabela() {
  const jogo = useJogo();
  const t = jogo.temporada;
  const meu = jogo.carreira.clubeId;
  const minhaDivisao = (meu && divisaoDo(t, meu)) || "A";
  const [competicao, setCompeticao] = useState<Competicao>(minhaDivisao);
  const fases: EstadoFase[] = competicao === "copa" ? t.copa.fases : t.divisoes[competicao].fases;
  const [faseEscolhida, setFaseEscolhida] = useState<string | null>(null);
  const fase = fases.find((f) => f.nome === faseEscolhida) ?? fases[fases.length - 1];
  const grupoDoUsuario =
    fase?.tipo === "liga"
      ? Math.max(
          0,
          fase.grupos.findIndex((g) => !!meu && g.includes(meu)),
        )
      : 0;
  const [grupoEscolhido, setGrupoEscolhido] = useState<number | null>(null);
  const grupo = grupoEscolhido ?? grupoDoUsuario;
  const divisaoDoRanking = competicao === "copa" ? minhaDivisao : competicao;

  return (
    <div className="grade lateral">
      <section className="panel stack">
        <div className="filters" role="group" aria-label="Competição">
          {(competicoesAtivas(t) as Competicao[]).map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={competicao === c}
              onClick={() => {
                setCompeticao(c);
                setFaseEscolhida(null);
                setGrupoEscolhido(null);
              }}
            >
              <span className="comp-rotulo">
                <LogoCompeticao competicao={chaveDoLogo(t, c)} tamanho={18} />
                {nomeDaCompeticao(t, c)}
              </span>
            </button>
          ))}
        </div>
        <h2 className="comp-rotulo">
          <LogoCompeticao competicao={chaveDoLogo(t, competicao)} tamanho={44} />
          {nomeDaCompeticao(t, competicao)}
          {fase ? ` · ${fase.nome}` : ""}
        </h2>
        {fases.length > 1 && (
          <div className="subabas" role="group" aria-label="Fase">
            {fases.map((f) => (
              <button
                key={f.nome}
                type="button"
                className="chip"
                aria-pressed={fase?.nome === f.nome}
                onClick={() => {
                  setFaseEscolhida(f.nome);
                  setGrupoEscolhido(null);
                }}
              >
                {f.nome}
              </button>
            ))}
          </div>
        )}
        {fase?.tipo === "liga" && fase.grupos.length > 1 && (
          <div className="field">
            <label htmlFor="grupo">Grupo</label>
            <select id="grupo" value={grupo} onChange={(e) => setGrupoEscolhido(Number(e.target.value))}>
              {fase.grupos.map((g, i) => (
                <option key={g[0]} value={i}>
                  Grupo {String.fromCharCode(65 + i)}
                  {meu && g.includes(meu) ? " (seu)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {!fase && <p className="vazio">Ainda não começou.</p>}
        {fase?.tipo === "liga" && competicao !== "copa" && (
          <TabelaDaFase jogo={jogo} competicao={competicao} fase={fase} grupo={grupo} />
        )}
        {fase?.tipo === "mataMata" && <Confrontos jogo={jogo} fase={fase} />}
        {competicao === "A" && fase?.tipo === "liga" && (
          <div className="legend">
            <span style={{ ["--c" as string]: "var(--blue)" }}>Libertadores</span>
            <span style={{ ["--c" as string]: "var(--good)" }}>Sul-Americana</span>
            <span style={{ ["--c" as string]: "var(--red)" }}>Rebaixamento</span>
          </div>
        )}
      </section>
      <Rankings jogo={jogo} divisao={divisaoDoRanking} />
    </div>
  );
}
