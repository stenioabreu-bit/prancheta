import type { PacoteDados } from "@prancheta/data";
import {
  type ClubeParaProposta,
  type Divisao,
  type Moeda,
  type OrigemAtleta,
  type PeDominante,
  type Posicao,
  type PropostaDaBase,
  criarClube,
  criarRng,
  ovrInicial,
  propostasDaBase,
} from "@prancheta/engine";
import { useMemo, useState } from "react";
import { Escudo } from "../componentes/basicos";
import { useLoja } from "../estado/loja";

/** Postos no campo deitado (gol à esquerda), em % da largura e da altura. */
const POSTOS_NO_CAMPO: { pos: Posicao; x: number; y: number; nome: string }[] = [
  { pos: "GOL", x: 7, y: 50, nome: "Goleiro" },
  { pos: "ZAG", x: 23, y: 50, nome: "Zagueiro" },
  { pos: "LE", x: 31, y: 16, nome: "Lateral-esquerdo" },
  { pos: "LD", x: 31, y: 84, nome: "Lateral-direito" },
  { pos: "VOL", x: 41, y: 50, nome: "Volante" },
  { pos: "MC", x: 55, y: 50, nome: "Meio-campista" },
  { pos: "MEI", x: 71, y: 50, nome: "Meia-atacante" },
  { pos: "PE", x: 82, y: 16, nome: "Ponta-esquerda" },
  { pos: "PD", x: 82, y: 84, nome: "Ponta-direita" },
  { pos: "ATA", x: 90, y: 50, nome: "Centroavante" },
];

const DIVISOES: Divisao[] = ["A", "B", "C"];

function clubesDoPacote(pacote: PacoteDados): ClubeParaProposta[] {
  return DIVISOES.flatMap((d, i) =>
    (pacote.divisoes[d] ?? []).map((dados) => ({
      dados,
      divisao: i + 1,
      liga: pacote.formatos?.[d]?.nome ?? `Série ${d}`,
    })),
  );
}

function Barrinhas({ nivel }: { nivel: number }) {
  return (
    <span className="ca-nivel" role="img" aria-label={`Nível ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= nivel ? "on" : undefined} />
      ))}
    </span>
  );
}

export function CriarAtleta({ pacote, pacoteId }: { pacote: PacoteDados; pacoteId: string }) {
  const comecar = useLoja((s) => s.comecar);
  const avisar = useLoja((s) => s.avisar);
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState(10);
  const [pe, setPe] = useState<PeDominante>("direito");
  const [pos, setPos] = useState<Posicao>("ATA");
  const [origem, setOrigem] = useState<OrigemAtleta>("base");
  const [moeda, setMoeda] = useState<Moeda>("BRL");
  const [semente, setSemente] = useState<number | null>(null);
  const [comecando, setComecando] = useState<string | null>(null);

  const ovr = semente === null ? null : ovrInicial(origem, semente);
  const propostas = useMemo<PropostaDaBase[]>(
    () =>
      semente === null || ovr === null ? [] : propostasDaBase(clubesDoPacote(pacote), pos, ovr, semente),
    [pacote, pos, ovr, semente],
  );
  const clubes = useMemo(() => {
    const m = new Map<string, ReturnType<typeof criarClube>>();
    for (const p of propostas) {
      const dados = clubesDoPacote(pacote).find((c) => c.dados.id === p.clubeId)?.dados;
      if (dados) m.set(p.clubeId, criarClube(dados, criarRng(1)));
    }
    return m;
  }, [pacote, propostas]);
  const posto = POSTOS_NO_CAMPO.find((p) => p.pos === pos)!;

  async function entrar(p: PropostaDaBase) {
    setComecando(p.clubeId);
    try {
      await comecar({
        pacoteId,
        tecnico: nome,
        clubeId: p.clubeId,
        moeda,
        semente: semente!,
        atleta: { pos, origem, ritmo: "decisivos", numero, pe },
      });
    } catch (e) {
      avisar((e as Error).message);
      setComecando(null);
    }
  }

  if (semente !== null && ovr !== null) {
    return (
      <section className="ca stack" aria-label="Propostas da base">
        <div className="ca-carta">
          <b className="ca-ovr num">{ovr}</b>
          <div>
            <b>{nome.trim().toUpperCase()}</b>
            <span className="small muted">
              #{numero} {pos} · pé {pe}
            </span>
          </div>
        </div>
        <header className="stack" style={{ gap: 2 }}>
          <h2 className="ca-titulo">{origem === "base" ? "Propostas da base" : "Primeiras propostas"}</h2>
          <p className="muted small" style={{ margin: 0 }}>
            Três clubes querem você. Escolha onde a sua carreira começa.
          </p>
        </header>
        <ol className="lista-limpa ca-propostas">
          {propostas.map((p) => {
            const clube = clubes.get(p.clubeId);
            return (
              <li key={p.clubeId} className="ca-proposta">
                <div className="ca-proposta-clube">
                  {clube && <Escudo clube={clube} tamanho={40} />}
                  <div>
                    <b className="ca-proposta-nome">{p.nome}</b>
                    <span className="small muted">{p.liga}</span>
                    <span className="small">{p.descricao}</span>
                  </div>
                </div>
                <div className="ca-proposta-lado">
                  <button
                    type="button"
                    className="btn ca-entrar"
                    disabled={!!comecando}
                    onClick={() => void entrar(p)}
                  >
                    {comecando === p.clubeId
                      ? "Assinando…"
                      : origem === "base"
                        ? "Entrar na base"
                        : "Assinar"}
                  </button>
                  <Barrinhas nivel={p.nivel} />
                  <span className="ca-minutos num">
                    ~{p.minutos.toLocaleString("pt-BR")} <small>MIN</small>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <button type="button" className="btn" disabled={!!comecando} onClick={() => setSemente(null)}>
          Voltar e mudar o jogador
        </button>
      </section>
    );
  }

  return (
    <section className="ca stack" aria-label="Crie o seu jogador">
      <div className="ca-linha">
        <label className="ca-campo grow">
          <span className="small muted">Nome na camisa</span>
          <input
            className="ca-nome"
            value={nome}
            placeholder="SOBRENOME"
            maxLength={24}
            autoComplete="off"
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <div className="ca-campo">
          <span className="small muted">Número</span>
          <div className="ca-numero">
            <button
              type="button"
              aria-label="Diminuir número"
              onClick={() => setNumero((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <b className="num">{numero}</b>
            <button
              type="button"
              aria-label="Aumentar número"
              onClick={() => setNumero((n) => Math.min(99, n + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="ca-campo">
          <span className="small muted">Pé dominante</span>
          <div className="seg" role="group" aria-label="Pé dominante">
            <button type="button" aria-pressed={pe === "esquerdo"} onClick={() => setPe("esquerdo")}>
              Esquerdo
            </button>
            <button type="button" aria-pressed={pe === "direito"} onClick={() => setPe("direito")}>
              Direito
            </button>
          </div>
        </div>
      </div>
      <div className="ca-linha">
        <div className="ca-campo grow">
          <span className="small muted">Começo</span>
          <div className="seg" role="group" aria-label="Começo">
            <button type="button" aria-pressed={origem === "base"} onClick={() => setOrigem("base")}>
              Joia da base · 17 anos
            </button>
            <button
              type="button"
              aria-pressed={origem === "profissional"}
              onClick={() => setOrigem("profissional")}
            >
              Profissional · 21 anos
            </button>
          </div>
        </div>
        <label className="ca-campo">
          <span className="small muted">Moeda</span>
          <select className="inp" value={moeda} onChange={(e) => setMoeda(e.target.value as Moeda)}>
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </label>
      </div>
      <div className="ca-campo">
        <span className="small muted ca-rotulo-pos">
          Posição <b>{posto.nome}</b>
        </span>
        <div className="ca-gramado" role="group" aria-label="Posição">
          <span className="ca-meio" aria-hidden="true" />
          <span className="ca-area esq" aria-hidden="true" />
          <span className="ca-area dir" aria-hidden="true" />
          {POSTOS_NO_CAMPO.map((p) => (
            <button
              key={p.pos}
              type="button"
              className="ca-posto"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-pressed={pos === p.pos}
              aria-label={p.nome}
              onClick={() => setPos(p.pos)}
            >
              {p.pos}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="btn primary big"
        disabled={!nome.trim()}
        onClick={() => setSemente(crypto.getRandomValues(new Uint32Array(1))[0]!)}
      >
        Confirmar jogador →
      </button>
    </section>
  );
}
