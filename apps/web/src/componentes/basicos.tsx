import { type Clube, hashTexto } from "@prancheta/engine";
import { type ReactNode, useEffect, useRef } from "react";
import { useLoja } from "../estado/loja";

/** Distintivo genérico (não é o escudo oficial); usa a imagem do pacote do jogador quando houver. */
export function Escudo({ clube, tamanho = 22 }: { clube: Clube; tamanho?: number }) {
  const url = useLoja((s) => s.escudos[clube.id]);
  if (url) {
    return (
      <img className="escudo-img" src={url} alt="" width={tamanho} height={tamanho} aria-hidden="true" />
    );
  }
  const estilo = hashTexto(clube.nome) % 3;
  const c1 = clube.cores.principal;
  const c2 = clube.cores.secundaria;
  const claro = ["#ffffff", "#fff", "#e8e8e8"].includes(c1.toLowerCase());
  const corTexto = estilo === 0 ? (claro ? "#111" : c2) : estilo === 2 ? c1 : "#111";
  const contorno = "M2 2h20v9c0 6.5-5 10.5-10 12C7 21.5 2 17.5 2 11z";
  return (
    <svg className="crest-svg" width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
      <path d={contorno} fill={c1} />
      {estilo === 1 && <path d="M12 2h10v9c0 6.5-5 10.5-10 12z" fill={c2} opacity=".9" />}
      {estilo === 2 && <rect x="2" y="9" width="20" height="5" fill={c2} opacity=".85" />}
      <path d={contorno} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <text
        x="12"
        y={estilo === 2 ? 13.4 : 13.6}
        textAnchor="middle"
        fontFamily="Barlow Condensed,Arial Narrow,sans-serif"
        fontWeight="700"
        fontSize="7.2"
        fill={corTexto}
        {...(estilo === 1 ? { stroke: "#fff", strokeWidth: 0.6, paintOrder: "stroke" } : {})}
      >
        {clube.sigla.slice(0, 3)}
      </text>
    </svg>
  );
}

export function NomeClube({ clube, tamanho = 18 }: { clube: Clube; tamanho?: number }) {
  return (
    <span className="cn">
      <Escudo clube={clube} tamanho={tamanho} />
      <span>{clube.nome}</span>
    </span>
  );
}

export function Medidor({ rotulo, valor }: { rotulo: string; valor: number }) {
  const classe = valor < 30 ? "bar bad" : valor < 45 ? "bar warn" : "bar";
  return (
    <div className="meter">
      <span>
        {rotulo} <b className="num">{Math.round(valor)}</b>
      </span>
      <div
        className={classe}
        role="meter"
        aria-valuenow={Math.round(valor)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={rotulo}
      >
        <i style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

export function Forma({ resultados }: { resultados: ("V" | "E" | "D")[] }) {
  if (!resultados.length) return <span className="muted">—</span>;
  return (
    <span className="form-pills" aria-label={`Forma: ${resultados.join(" ")}`}>
      {resultados.map((r, i) => (
        <span key={`${i}${r}`} className={`fp ${r}`}>
          {r}
        </span>
      ))}
    </span>
  );
}

/** Painel deslizante (celular) ou janela (PC). Fecha com Esc e clicando fora. */
export function Folha({
  titulo,
  aoFechar,
  children,
}: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      anterior?.focus?.();
    };
  }, [aoFechar]);
  return (
    <div
      className="sheet-bg"
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref}>
        <div className="linha-entre">
          <h2>{titulo}</h2>
          <button type="button" className="x" onClick={aoFechar}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Aviso() {
  const aviso = useLoja((s) => s.aviso);
  if (!aviso) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {aviso}
    </div>
  );
}

export function Atributo({ nome, valor }: { nome: string; valor: number }) {
  const cor =
    valor >= 80 ? "var(--good)" : valor >= 65 ? "var(--accent)" : valor >= 50 ? "var(--gold)" : "var(--red)";
  return (
    <div className="attr">
      <span>{nome}</span>
      <div className="b">
        <i style={{ width: `${valor}%`, background: cor }} />
      </div>
      <b className="num">{valor}</b>
    </div>
  );
}
