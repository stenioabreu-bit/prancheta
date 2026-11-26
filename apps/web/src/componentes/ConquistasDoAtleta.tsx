import { type ConquistaAtleta, conquistasNaoVistas, salaDeTrofeus, verConquista } from "@prancheta/engine";
import { useJogo, useLoja } from "../estado/loja";
import { Taca } from "./Comemoracao";
import { LogoCompeticao } from "./LogoCompeticao";
import { Escudo } from "./basicos";

/** Medalha (prêmio individual) desenhada em SVG. */
export function Medalha({ tamanho = 96, estrela = false }: { tamanho?: number; estrela?: boolean }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true" className="taca">
      <path d="M22 4h8l6 18h-8z" fill="#2e6f4e" />
      <path d="M42 4h-8l-6 18h8z" fill="#c4923a" />
      <circle cx="32" cy="40" r="18" fill="#d9a646" stroke="#7a5a1c" strokeWidth="2" />
      <circle cx="32" cy="40" r="12.5" fill="none" stroke="#fff6dc" strokeWidth="1.5" opacity=".55" />
      {estrela ? (
        <path
          d="M32 31l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L32 44.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"
          fill="#fff6dc"
        />
      ) : (
        <path d="M27 36l5-4 5 4v9H27z" fill="#fff6dc" opacity=".85" />
      )}
    </svg>
  );
}

/** Bola de Ouro desenhada em SVG. */
export function BolaDeOuro({ tamanho = 96 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true" className="taca">
      <circle cx="32" cy="27" r="19" fill="#e2b34f" stroke="#7a5a1c" strokeWidth="2" />
      <path
        d="M32 15l6 4.5-2.3 7h-7.4l-2.3-7zM19 26l5-1.5 3 6.5-3.5 5-4.5-1.5M45 26l-5-1.5-3 6.5 3.5 5 4.5-1.5M27 41l2-4h6l2 4"
        fill="none"
        stroke="#8a6420"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M24 17a13 13 0 0 1 8-3" stroke="#fff6dc" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <path d="M24 47h16l3 7H21z" fill="#d9a646" stroke="#7a5a1c" strokeWidth="1.5" />
      <rect x="18" y="54" width="28" height="5" rx="1.5" fill="#3b2f1c" />
    </svg>
  );
}

function IconeDaConquista({
  c,
  tamanho,
}: { c: { tipo: string; chave?: string; peso: number }; tamanho: number }) {
  if (c.tipo === "titulo") return <Taca tamanho={tamanho} />;
  if (c.chave === "bola-de-ouro") return <BolaDeOuro tamanho={tamanho} />;
  return <Medalha tamanho={tamanho} estrela={c.peso >= 2} />;
}

/**
 * Aviso dourado: aparece por cima de tudo a cada título ou prêmio novo do atleta, um de cada vez,
 * até o usuário receber.
 */
export function AvisoDeConquista() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const pendentes = conquistasNaoVistas(jogo);
  const c: ConquistaAtleta | undefined = pendentes[0];
  if (!c) return null;
  const clube = jogo.temporada.clubes[c.clubeId];
  const historica = c.peso >= 3;
  const titulo = c.tipo === "titulo";
  return (
    <div
      className={`comemoracao at-ouro${historica ? " historica" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${titulo ? "Campeão" : "Prêmio"}: ${c.nome}`}
    >
      <div className="comemoracao-card at-ouro-card">
        <div className="confete" aria-hidden="true" />
        <div className="at-ouro-brilho" aria-hidden="true" />
        {pendentes.length > 1 && <span className="small at-ouro-conta">1 de {pendentes.length}</span>}
        {titulo && c.logo && <LogoCompeticao competicao={c.logo} tamanho={56} />}
        <IconeDaConquista c={c} tamanho={historica ? 130 : 110} />
        <span className="eyebrow">
          {titulo ? `Campeão ${c.temporada}` : `Prêmio individual · ${c.temporada}`}
        </span>
        <h2>{c.nome}</h2>
        <div className="row" style={{ justifyContent: "center", gap: 8 }}>
          {clube && c.clube !== "Seleção" && <Escudo clube={clube} tamanho={28} />}
          <b>{c.clube}</b>
        </div>
        {c.detalhe && <p className="at-ouro-detalhe">{c.detalhe}</p>}
        <button
          type="button"
          className="btn primary big at-ouro-botao"
          onClick={() => mexer((j) => verConquista(j, c.id))}
        >
          {titulo ? "Levantar a taça" : "Receber o prêmio"}
        </button>
      </div>
    </div>
  );
}

const NOMES_DOS_MARCOS: Record<string, string> = {
  estreia: "Estreia",
  "primeiro-gol": "Primeiro gol",
  "hat-trick": "Primeiro hat-trick",
  "primeiro-titulo": "Primeiro título",
  "estreia-selecao": "Estreia pela seleção",
};

function nomeDoMarco(id: string): string | null {
  if (NOMES_DOS_MARCOS[id]) return NOMES_DOS_MARCOS[id]!;
  const g = /^gols-(\d+)$/.exec(id);
  if (g) return `${g[1]} gols`;
  const j = /^jogos-(\d+)$/.exec(id);
  if (j) return `${j[1]} jogos`;
  return null;
}

/** Sala de troféus: estante de títulos, prêmios individuais, Bola de Ouro, seleção e marcos. */
export function SalaDeTrofeus() {
  const jogo = useJogo();
  const a = jogo.atleta!;
  const { titulos, premios } = salaDeTrofeus(jogo);
  const totalTitulos = titulos.reduce((s, t) => s + t.temporadas.length, 0);
  const totalPremios = premios.reduce((s, t) => s + t.temporadas.length, 0);
  const bolas = (a.conquistas ?? []).filter((x) => x.chave === "bola-de-ouro").length;
  const ranking = [...(a.bolaDeOuro ?? [])].sort((x, y) => y.temporada - x.temporada);
  const melhor = ranking.length ? Math.min(...ranking.map((r) => r.posicao)) : null;
  const marcos = (a.marcos ?? []).map(nomeDoMarco).filter((x): x is string => !!x);
  return (
    <div className="stack">
      <section className="panel at-sala-topo">
        <dl className="at-numeros">
          <div>
            <dd className="num">{totalTitulos}</dd>
            <dt>Títulos</dt>
          </div>
          <div>
            <dd className="num">{totalPremios}</dd>
            <dt>Prêmios</dt>
          </div>
          <div>
            <dd className="num">{bolas}</dd>
            <dt>Bolas de Ouro</dt>
          </div>
          <div>
            <dd className="num">{melhor ? `${melhor}º` : "—"}</dd>
            <dt>Melhor na Bola</dt>
          </div>
          <div>
            <dd className="num">{a.selecao?.jogos ?? 0}</dd>
            <dt>Jogos na seleção</dt>
          </div>
          <div>
            <dd className="num">{a.selecao?.gols ?? 0}</dd>
            <dt>Gols na seleção</dt>
          </div>
        </dl>
      </section>

      <section className="panel stack" aria-label="Títulos">
        <span className="eyebrow">Estante de títulos</span>
        {titulos.length ? (
          <ul className="lista-limpa at-estante">
            {titulos.map((t) => (
              <li key={t.nome} className={`at-peca peso-${t.peso}`}>
                <span className="at-peca-icone">
                  {t.logo ? <LogoCompeticao competicao={t.logo} tamanho={40} /> : null}
                  <Taca tamanho={t.logo ? 34 : 48} />
                </span>
                <b>{t.nome}</b>
                <span className="at-vezes num">×{t.temporadas.length}</span>
                <span className="small muted">{t.temporadas.join(", ")}</span>
                <span className="small">{t.clubes.join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            A estante ainda está vazia. Cada taça que o seu clube levantar aparece aqui.
          </p>
        )}
      </section>

      <section className="panel stack" aria-label="Prêmios individuais">
        <span className="eyebrow">Prêmios individuais</span>
        {premios.length ? (
          <ul className="lista-limpa at-estante">
            {premios.map((p) => (
              <li key={p.nome} className={`at-peca peso-${p.peso}`} title={p.detalhes.join("\n")}>
                <span className="at-peca-icone">
                  {p.nome === "Bola de Ouro" ? (
                    <BolaDeOuro tamanho={48} />
                  ) : (
                    <Medalha tamanho={44} estrela={p.peso >= 2} />
                  )}
                </span>
                <b>{p.nome}</b>
                <span className="at-vezes num">×{p.temporadas.length}</span>
                <span className="small muted">{p.temporadas.join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Artilharia, craque do campeonato, seleção do ano, Bola de Ouro: os prêmios saem no fim de cada
            temporada.
          </p>
        )}
      </section>

      {ranking.length > 0 && (
        <section className="panel stack" aria-label="Bola de Ouro">
          <span className="eyebrow">Bola de Ouro</span>
          <table className="at-carreira">
            <thead>
              <tr>
                <th>Ano</th>
                <th>Você</th>
                <th>Vencedor</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.temporada} className={r.posicao === 1 ? "at-ouro-linha" : undefined}>
                  <td className="num">{r.temporada}</td>
                  <td className="num">{r.posicao}º</td>
                  <td>
                    {r.posicao === 1 ? (
                      <b>Você</b>
                    ) : (
                      <>
                        {r.vencedor} <span className="small muted">({r.vencedorClube})</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {marcos.length > 0 && (
        <section className="panel stack" aria-label="Marcos da carreira">
          <span className="eyebrow">Marcos da carreira</span>
          <div className="at-galeria">
            {marcos.map((m) => (
              <span key={m} className="at-trofeu">
                {m}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
