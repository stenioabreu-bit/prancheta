import { ID_DA_COMPETICAO_DO_MOTOR } from "@prancheta/data";
import { useEffect, useState } from "react";

/** Entrada do manifesto dos logos (`public/assets/logos/competicoes/manifest.json`). */
interface LogoNoManifesto {
  id: string;
  nomeOficial: string;
  arquivo: string | null;
  fundo?: "claro" | "escuro" | "proprio";
  status: "encontrado" | "integrado" | "pendente";
}
interface Manifesto {
  base: string;
  aliases: Record<string, string>;
  competicoes: LogoNoManifesto[];
}

const BASE_PADRAO = `${import.meta.env.BASE_URL}assets/logos/competicoes/`;
let carregando: Promise<Manifesto | null> | null = null;

function carregarManifesto(): Promise<Manifesto | null> {
  carregando ??= fetch(`${BASE_PADRAO}manifest.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Manifesto>) : null))
    .catch(() => null);
  return carregando;
}

export type CompeticaoDoMotor = keyof typeof ID_DA_COMPETICAO_DO_MOTOR;

/** Aceita o ID permanente ou a competição do motor ("A".."D", "copa"). */
export function idPermanente(competicao: string): string {
  return (ID_DA_COMPETICAO_DO_MOTOR as Record<string, string>)[competicao] ?? competicao;
}

/**
 * Logo oficial da competição numa área quadrada fixa, sem deformar (object-fit: contain).
 * Sem logo no manifesto, arquivo ausente ou erro de carga: não renderiza nada.
 */
export function LogoCompeticao({ competicao, tamanho = 22 }: { competicao: string; tamanho?: number }) {
  const [logo, setLogo] = useState<{ url: string; nome: string; fundo: string } | null>(null);
  const [falhou, setFalhou] = useState(false);
  useEffect(() => {
    let vivo = true;
    setFalhou(false);
    carregarManifesto().then((m) => {
      if (!vivo || !m) return;
      const bruto = idPermanente(competicao);
      const id = m.aliases[bruto] ?? bruto;
      const e = m.competicoes.find((c) => c.id === id);
      setLogo(
        e?.arquivo ? { url: BASE_PADRAO + e.arquivo, nome: e.nomeOficial, fundo: e.fundo ?? "claro" } : null,
      );
    });
    return () => {
      vivo = false;
    };
  }, [competicao]);
  if (!logo || falhou) return null;
  return (
    <span className={`logo-comp fundo-${logo.fundo}`} style={{ width: tamanho, height: tamanho }}>
      <img src={logo.url} alt={logo.nome} title={logo.nome} loading="lazy" onError={() => setFalhou(true)} />
    </span>
  );
}
