"""Gera os 27 estaduais 2026 do pacote do Brasileirão a partir da tabela real (oGol) e dos elencos da auditoria.
Fase 1 = confrontos e datas reais (classificação em tabela única); mata-matas com as datas reais.
Uso: python -I tools/dados/gerar_estaduais.py dados/estaduais-2026-jogos.json dados/elencos-2026.json packages/data/packs/teste-real/pacote.json
"""
import json, re, sys, unicodedata
from collections import Counter, defaultdict

JOGOS, ELENCOS, PACOTE = sys.argv[1:4]
NOMES = {
    "AC": ("campeonato-acriano", "Campeonato Acriano"), "AL": ("campeonato-alagoano", "Campeonato Alagoano"),
    "AP": ("campeonato-amapaense", "Campeonato Amapaense"), "AM": ("campeonato-amazonense", "Campeonato Amazonense"),
    "BA": ("campeonato-baiano", "Campeonato Baiano"), "CE": ("campeonato-cearense", "Campeonato Cearense"),
    "DF": ("campeonato-brasiliense", "Campeonato Brasiliense"), "ES": ("campeonato-capixaba", "Campeonato Capixaba"),
    "GO": ("campeonato-goiano", "Campeonato Goiano"), "MA": ("campeonato-maranhense", "Campeonato Maranhense"),
    "MT": ("campeonato-mato-grossense", "Campeonato Mato-Grossense"), "MS": ("campeonato-sul-mato-grossense", "Campeonato Sul-Mato-Grossense"),
    "MG": ("campeonato-mineiro", "Campeonato Mineiro"), "PA": ("campeonato-paraense", "Campeonato Paraense"),
    "PB": ("campeonato-paraibano", "Campeonato Paraibano"), "PR": ("campeonato-paranaense", "Campeonato Paranaense"),
    "PE": ("campeonato-pernambucano", "Campeonato Pernambucano"), "PI": ("campeonato-piauiense", "Campeonato Piauiense"),
    "RJ": ("campeonato-carioca", "Campeonato Carioca"), "RN": ("campeonato-potiguar", "Campeonato Potiguar"),
    "RS": ("campeonato-gaucho", "Campeonato Gaúcho"), "RO": ("campeonato-rondoniense", "Campeonato Rondoniense"),
    "RR": ("campeonato-roraimense", "Campeonato Roraimense"), "SC": ("campeonato-catarinense", "Campeonato Catarinense"),
    "SP": ("campeonato-paulista", "Campeonato Paulista"), "SE": ("campeonato-sergipano", "Campeonato Sergipano"),
    "TO": ("campeonato-tocantinense", "Campeonato Tocantinense"),
}
MATA = [("2F", "2ª fase"), ("QF", "Quartas de final"), ("SF", "Semifinal"), ("F", "Final")]
FORA_DA_LIGA = {"2F", "QF", "SF", "F", "POff", "3/4", "5/6", "&nbsp;", ""}
MIN_ELENCO = 16

jogos_uf = json.load(open(JOGOS, encoding="utf-8"))["estaduais"]
elencos = json.load(open(ELENCOS, encoding="utf-8"))["clubes"]
pacote = json.load(open(PACOTE, encoding="utf-8"))
no_pacote = {c["id"] for d in pacote["divisoes"].values() for c in d}


def sigla(nome):
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().upper()
    p = [x for x in re.findall(r"[A-Z]+", s) if x not in {"EC", "FC", "SC", "AA", "CA", "DE", "DO", "DA", "E", "AC", "CLUBE", "ESPORTE"}]
    return (p[0][:3] if p else s[:3]).ljust(3, "X")


extras, relatorio = {}, {}


def id_do_clube(slug, nome):
    e = elencos.get(slug, {})
    pid = e.get("pacote_id")
    if pid and pid in no_pacote:
        return pid
    cid = "og-" + slug.replace("/", "-")
    if cid not in extras:
        reais = [[j["nome"], j["posicao"], int(j["overall"] or 55), {"id": j["id"], "fonte": j["overall_fonte"], **({"idade": j["idade"]} if j.get("idade") else {})}]
                 for j in sorted(e.get("elenco", []), key=lambda j: -(j["overall"] or 0))[:30]]
        media = round(sum(j[2] for j in reais) / len(reais)) if reais else 52
        extras[cid] = {"id": cid, "nome": e.get("nome", nome), "sigla": sigla(e.get("nome", nome)), "elenco": reais, "nivel": media,
                       **({"completarAte": MIN_ELENCO} if len(reais) < MIN_ELENCO else {})}
    return cid


def potencia2(n):
    return n > 0 and n & (n - 1) == 0


estaduais = []
for uf, (cid, nome) in NOMES.items():
    jogos = jogos_uf.get(uf, {}).get("jogos", [])
    if not jogos:
        relatorio[uf] = {"status": "pendente", "motivo": "tabela 2026 não publicada no oGol"}
        continue
    por_fase = defaultdict(list)
    for j in jogos:
        por_fase[j["fase"]].append(j)
    inicio_mata = min((j["data"] for k, _ in MATA for j in por_fase.get(k, [])), default="9999")
    liga = [j for j in jogos if j["fase"] not in FORA_DA_LIGA and j["data"] < inicio_mata]
    # Mata-mata em cadeia fixa terminando na final: Quartas (4 confrontos), Semifinal (2), Final (1).
    # "2ª fase" só entra quando faz o papel de quartas (4 confrontos e não houver QF).
    cadeia = [("QF", "Quartas de final", 4), ("SF", "Semifinal", 2), ("F", "Final", 1)]
    if "QF" not in por_fase and len({tuple(sorted((j["casa"], j["fora"]))) for j in por_fase.get("2F", [])}) == 4:
        cadeia[0] = ("2F", "Quartas de final", 4)
    fases_mata = []
    for codigo, nome_fase, n in cadeia:
        lista = por_fase.get(codigo, [])
        if not lista:
            continue
        pares = Counter(tuple(sorted((j["casa"], j["fora"]))) for j in lista)
        ida_volta = Counter(pares.values()).most_common(1)[0][0] >= 2
        datas = sorted({j["data"] for j in lista})
        fases_mata.append({"tipo": "mataMata", "nome": nome_fase, "idaEVolta": ida_volta, "n": n,
                           "chaveamento": "melhorContraPior" if not fases_mata else "chave",
                           "datas": [datas[0], datas[-1]] if ida_volta else [datas[0]]})
    avancam = 2 * fases_mata[0].pop("n") if fases_mata else 0
    for f in fases_mata:
        f.pop("n", None)
    jogos_liga = [{"data": j["data"], "casa": id_do_clube(j["casa"], j["nomeCasa"]), "fora": id_do_clube(j["fora"], j["nomeFora"])} for j in liga]
    participantes = {x for j in jogos_liga for x in (j["casa"], j["fora"])}
    formato = {"divisao": "A", "competicao": f"est-{uf}", "id": cid, "nome": nome, "clubes": len(participantes),
               "fases": [{"tipo": "liga", "nome": "1ª fase", "grupos": 1, "distribuicao": "unico", "turnos": 1,
                          "avancamPorGrupo": avancam, "jogos": jogos_liga}] + fases_mata,
               "acesso": [], "rebaixamento": []}
    estaduais.append({"uf": uf, "formato": formato, "clubes": sorted(participantes)})
    ignoradas = sorted(k for k in por_fase if k in FORA_DA_LIGA and k not in {c for c, _ in MATA})
    relatorio[uf] = {"status": "ok", "clubes": len(participantes), "jogos_1a_fase": len(jogos_liga),
                     "mata_mata": [f'{f["nome"]} ({"ida e volta" if f["idaEVolta"] else "jogo único"}: {", ".join(f["datas"])})' for f in fases_mata],
                     "inicio": liga[0]["data"] if liga else None, "fim": max(j["data"] for j in jogos),
                     "fases_nao_modeladas": ignoradas}

pacote["estaduais"] = estaduais
pacote["clubesExtras"] = list(extras.values())
json.dump(pacote, open(PACOTE, "w", encoding="utf-8"), ensure_ascii=False)
json.dump({"estaduais": relatorio, "clubes_so_estadual": len(extras),
           "elenco_completado": {c["id"]: len(c["elenco"]) for c in extras.values() if c.get("completarAte")}},
          open("dados/estaduais-2026-resumo.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for uf, r in relatorio.items():
    print(uf, r)
print("clubes só de estadual:", len(extras), "com elenco completado:", sum(1 for c in extras.values() if c.get("completarAte")))
