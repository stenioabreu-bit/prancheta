import { formatarDinheiro, verAcessos, verTitulo } from "@prancheta/engine";
import { useJogo, useLoja } from "../estado/loja";
import { LogoCompeticao } from "./LogoCompeticao";
import { Escudo } from "./basicos";

/** Taça desenhada em SVG (sem emoji). */
export function Taca({ tamanho = 96 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true" className="taca">
      <path d="M20 8h24v14a12 12 0 0 1-24 0z" fill="#d9a646" stroke="#7a5a1c" strokeWidth="1.5" />
      <path
        d="M20 12h-7a7 7 0 0 0 7 9M44 12h7a7 7 0 0 1-7 9"
        fill="none"
        stroke="#d9a646"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M29 34h6v8h-6z" fill="#c4923a" />
      <path d="M22 42h20l2 7H20z" fill="#d9a646" stroke="#7a5a1c" strokeWidth="1.5" />
      <rect x="17" y="49" width="30" height="6" rx="1.5" fill="#3b2f1c" />
      <path d="M26 12l2 6M30 11l1 6" stroke="#fff6dc" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

/** Tela de campeão: aparece por cima de tudo enquanto houver título ainda não comemorado. */
export function Comemoracao() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const titulo = jogo.carreira.titulos?.find((x) => !x.visto);
  if (!titulo) return null;
  const clube = jogo.temporada.clubes[titulo.clubeId];
  return (
    <div className="comemoracao" role="dialog" aria-modal="true" aria-label={`Campeão: ${titulo.nome}`}>
      <div className="comemoracao-card">
        <div className="confete" aria-hidden="true" />
        <LogoCompeticao competicao={titulo.logo} tamanho={72} />
        <Taca tamanho={110} />
        <span className="eyebrow">Campeão {titulo.temporada}</span>
        <h2>{titulo.nome}</h2>
        <div className="row" style={{ justifyContent: "center", gap: 8 }}>
          {clube && <Escudo clube={clube} tamanho={32} />}
          <b>{titulo.clube}</b>
        </div>
        <dl className="kv">
          <dt>Prêmio pelo título</dt>
          <dd>{formatarDinheiro(titulo.premio)}</dd>
          <dt>Técnico</dt>
          <dd>{jogo.carreira.tecnico}</dd>
        </dl>
        <button
          type="button"
          className="btn primary big"
          onClick={() => mexer((j) => verTitulo(j, titulo.temporada, titulo.competicao))}
        >
          Levantar a taça
        </button>
      </div>
    </div>
  );
}

/** Fim de temporada: quem subiu e quem caiu em cada divisão. */
export function Acessos() {
  const jogo = useJogo();
  const mexer = useLoja((s) => s.mexer);
  const a = jogo.carreira.acessos;
  const titulo = jogo.carreira.titulos?.find((x) => !x.visto);
  if (!a || a.visto || titulo) return null;
  return (
    <div className="comemoracao" role="dialog" aria-modal="true" aria-label="Acessos e rebaixamentos">
      <div className="comemoracao-card rapida-card acessos">
        <span className="eyebrow">Fim da temporada {a.temporada}</span>
        <h2>Acessos e rebaixamentos</h2>
        <div className="acessos-lista">
          {a.divisoes.map((d) => (
            <section key={d.nome} className="acesso-div">
              <h3>{d.nome}</h3>
              {d.campeao && (
                <p className="small">
                  Campeão: <b>{d.campeao}</b>
                </p>
              )}
              {d.subiram.length > 0 && (
                <p className="small sobe">
                  <span aria-hidden="true">▲</span> Subiram: {d.subiram.join(", ")}
                </p>
              )}
              {d.cairam.length > 0 && (
                <p className="small desce">
                  <span aria-hidden="true">▼</span> Caíram: {d.cairam.join(", ")}
                </p>
              )}
            </section>
          ))}
        </div>
        <button type="button" className="btn primary big" onClick={() => mexer((j) => verAcessos(j))}>
          Começar a nova temporada
        </button>
      </div>
    </div>
  );
}
