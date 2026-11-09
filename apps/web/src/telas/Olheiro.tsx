import {
  type Atributo,
  COTACAO,
  type FiltroDoMercado,
  type Jogador,
  type Posicao,
  divisaoDo,
  formatarDinheiro,
  hashTexto,
  indicar,
  moedaEmUso,
  pedirAoOlheiro,
  valorDeMercado,
} from "@prancheta/engine";
import { useState } from "react";
import { NomeClube } from "../componentes/basicos";
import { useJogo, useLoja } from "../estado/loja";
import { FichaDoJogador, NOME_ATRIBUTO } from "./Elenco";

const POSICOES: Posicao[] = ["GOL", "ZAG", "LD", "LE", "VOL", "MC", "MEI", "PD", "PE", "ATA"];
const PERFIS: { atributo: Atributo | ""; nome: string }[] = [
  { atributo: "", nome: "Qualquer" },
  { atributo: "VEL", nome: "Rápido" },
  { atributo: "FIN", nome: "Finalizador" },
  { atributo: "PAS", nome: "Passador" },
  { atributo: "CTL", nome: "Habilidoso" },
  { atributo: "DEF", nome: "Marcador" },
  { atributo: "CAB", nome: "Forte no alto" },
  { atributo: "FIS", nome: "Físico" },
  { atributo: "RES", nome: "Resistente" },
];
const IDADES: { id: string; nome: string; min?: number; max?: number }[] = [
  { id: "todas", nome: "Qualquer" },
  { id: "jovem", nome: "Até 21", max: 21 },
  { id: "promessa", nome: "22–25", min: 22, max: 25 },
  { id: "auge", nome: "26–30", min: 26, max: 30 },
  { id: "experiente", nome: "31+", min: 31 },
];
const REGIOES = [
  { id: "todos", nome: "Brasil e exterior" },
  { id: "brasil", nome: "Brasil" },
  { id: "exterior", nome: "Exterior" },
] as const;

/** Potencial estimado pelo olheiro: uma faixa (mais larga para quem é jovem), como num relatório. */
function faixaDePotencial(j: Jogador): string {
  const idade = j.idade ?? 26;
  const teto = j.potencial ?? j.ovr + (idade <= 21 ? 8 : idade <= 24 ? 4 : idade <= 28 ? 1 : 0);
  const erro = idade <= 21 ? 4 : idade <= 24 ? 3 : 1;
  const desvio = (hashTexto(j.id) % (erro * 2 + 1)) - erro;
  const centro = Math.max(j.ovr, teto + desvio);
  const a = Math.max(j.ovr, centro - erro);
  const b = Math.min(99, centro + erro);
  return a === b ? `${a}` : `${a}–${b}`;
}

function principais(j: Jogador): [Atributo, number][] {
  return (Object.entries(j.at) as [Atributo, number][])
    .filter(([a]) => (j.pos === "GOL" ? true : a !== "GOL"))
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3);
}

function Chips<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  opcoes: readonly { id: T; nome: string }[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div className="filters" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          className="chip"
          aria-pressed={valor === o.id}
          onClick={() => aoMudar(o.id)}
        >
          {o.nome}
        </button>
      ))}
    </div>
  );
}

/** Rede de olheiros, no estilo dos modos carreira: monta a missão e recebe relatórios com cartões. */
export function Olheiro() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const avisar = useLoja((s) => s.avisar);
  const moeda = moedaEmUso();
  const [pos, setPos] = useState<Posicao | "">("ATA");
  const [perfil, setPerfil] = useState<Atributo | "">("VEL");
  const [idade, setIdade] = useState("todas");
  const [regiao, setRegiao] = useState<(typeof REGIOES)[number]["id"]>("todos");
  const [minimo, setMinimo] = useState("");
  const [maximo, setMaximo] = useState("");
  const [ficha, setFicha] = useState<string | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);
  const emEuro = (v: string) => (v.trim() ? Number(v.replace(",", ".")) / COTACAO[moeda] : undefined);
  const pedidos = jogo.mercado.olheiro ?? [];
  const indicados = new Set(jogo.mercado.indicacoes.map((i) => i.jogadorId));
  const relatorio = pedidos.find((p) => p.id === aberto) ?? pedidos.find((p) => p.resultado);

  const enviar = () => {
    const faixa = IDADES.find((x) => x.id === idade)!;
    const min = emEuro(minimo);
    const max = emEuro(maximo);
    const filtro: FiltroDoMercado = {
      ...(pos ? { posicao: pos } : {}),
      ...(perfil ? { atributo: perfil, atributoMinimo: 75 } : {}),
      ...(min !== undefined ? { valorMinimo: min } : {}),
      ...(max !== undefined ? { valorMaximo: max } : {}),
      ...(faixa.min !== undefined ? { idadeMinima: faixa.min } : {}),
      ...(faixa.max !== undefined ? { idadeMaxima: faixa.max } : {}),
      ...(regiao !== "todos" ? { origem: regiao } : {}),
    };
    const partes = [
      pos || "Qualquer posição",
      perfil ? PERFIS.find((p) => p.atributo === perfil)!.nome.toLowerCase() : "",
      idade !== "todas" ? faixa.nome.toLowerCase() : "",
      min !== undefined || max !== undefined
        ? `${min !== undefined ? formatarDinheiro(min) : "0"} a ${max !== undefined ? formatarDinheiro(max) : "sem teto"}`
        : "",
      regiao !== "todos" ? REGIOES.find((r) => r.id === regiao)!.nome.toLowerCase() : "",
    ].filter(Boolean);
    avisar(mexer((j) => pedirAoOlheiro(j, filtro, partes.join(" · "))));
  };

  const clubeDe = (id: string) =>
    Object.values(jogo.temporada.clubes).find((c) => c.jogadores.some((x) => x.id === id));

  return (
    <div className="stack olheiro">
      <section className="panel stack">
        <h2>Missão do olheiro</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Monte o perfil e o olheiro volta com um relatório em 2 rodadas. Até 3 missões ao mesmo tempo.
        </p>
        <span className="eyebrow">Posição</span>
        <div className="olheiro-posicoes">
          {(["", ...POSICOES] as (Posicao | "")[]).map((p) => (
            <button
              key={p || "todas"}
              type="button"
              className={`chip pos-chip ${p}`}
              aria-pressed={pos === p}
              onClick={() => setPos(p)}
            >
              {p || "Todas"}
            </button>
          ))}
        </div>
        <span className="eyebrow">Perfil</span>
        <Chips
          rotulo="Perfil"
          opcoes={PERFIS.map((p) => ({ id: p.atributo || "qualquer", nome: p.nome }))}
          valor={perfil || "qualquer"}
          aoMudar={(v) => setPerfil(v === "qualquer" ? "" : (v as Atributo))}
        />
        <span className="eyebrow">Idade</span>
        <Chips rotulo="Idade" opcoes={IDADES} valor={idade} aoMudar={setIdade} />
        <span className="eyebrow">Região</span>
        <Chips rotulo="Região" opcoes={REGIOES} valor={regiao} aoMudar={setRegiao} />
        <span className="eyebrow">
          Valor de mercado (em milhões de {moeda === "BRL" ? "R$" : moeda === "USD" ? "US$" : "€"})
        </span>
        <div className="row">
          <input
            className="inp"
            inputMode="decimal"
            placeholder="mínimo, em milhões (ex.: 1)"
            aria-label="Valor mínimo"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
          />
          <input
            className="inp"
            inputMode="decimal"
            placeholder="máximo, em milhões (ex.: 5)"
            aria-label="Valor máximo"
            value={maximo}
            onChange={(e) => setMaximo(e.target.value)}
          />
        </div>
        <button type="button" className="btn primary big" onClick={enviar}>
          Enviar olheiro
        </button>
        <h3 style={{ marginTop: 12 }}>Relatórios</h3>
        {pedidos.length === 0 && <p className="vazio">Nenhuma missão ainda.</p>}
        <div className="filters" role="group" aria-label="Missões">
          {pedidos.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={relatorio?.id === p.id}
              disabled={!p.resultado}
              onClick={() => setAberto(p.id)}
              title={p.descricao}
            >
              {p.resultado
                ? `${p.descricao} (${p.resultado.length})`
                : `${p.descricao} · rodada ${p.pronto + 1}`}
            </button>
          ))}
        </div>
        {relatorio?.resultado && relatorio.resultado.length === 0 && (
          <p className="vazio">
            O olheiro não achou ninguém com esse perfil. Abra a faixa de valor ou de idade.
          </p>
        )}
        <div className="cartas-olheiro">
          {relatorio?.resultado?.map((id) => {
            const c = clubeDe(id);
            const j = c?.jogadores.find((x) => x.id === id);
            if (!c || !j) return null;
            const valor = valorDeMercado(j, divisaoDo(jogo.temporada, c.id) ?? "B");
            return (
              <article key={id} className={`carta-olheiro${indicados.has(id) ? " observado" : ""}`}>
                <header>
                  <span className="ovr-grande">{j.ovr}</span>
                  <span className={`pos ${j.pos}`}>{j.pos}</span>
                </header>
                <button type="button" className="link nome" onClick={() => setFicha(id)}>
                  {j.nome}
                </button>
                <div className="small muted">
                  <NomeClube clube={c} tamanho={13} /> · {j.idade ? `${j.idade} anos` : "idade ?"}
                </div>
                <dl className="kv small">
                  <dt>Potencial</dt>
                  <dd className="num">{faixaDePotencial(j)}</dd>
                  <dt>Valor</dt>
                  <dd>{formatarDinheiro(valor)}</dd>
                </dl>
                <ul className="atributos-carta">
                  {principais(j).map(([a, v]) => (
                    <li key={a}>
                      <span>{NOME_ATRIBUTO[a]}</span>
                      <b className="num">{v}</b>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn"
                  disabled={indicados.has(id)}
                  onClick={() => avisar(mexer((jg) => indicar(jg, id)))}
                >
                  {indicados.has(id) ? "Em observação pela diretoria" : "Indicar à diretoria"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      {ficha && <FichaDoJogador jogadorId={ficha} aoFechar={() => setFicha(null)} />}
    </div>
  );
}
