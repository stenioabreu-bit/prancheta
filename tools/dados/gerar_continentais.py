"""Gera Libertadores (com a Pré) e Sul-Americana 2026 no pacote do Brasileirão a partir da tabela real (oGol).
Uso: python -I tools/dados/gerar_continentais.py dados/continentais-2026-jogos.json dados/elencos-2026.json packages/data/packs/teste-real/pacote.json
"""
import json, re, sys, unicodedata
from collections import Counter

JOGOS, ELENCOS, PACOTE = sys.argv[1:4]
dados = json.load(open(JOGOS, encoding="utf-8"))["estaduais"]
elencos = json.load(open(ELENCOS, encoding="utf-8"))["clubes"]
pacote = json.load(open(PACOTE, encoding="utf-8"))
no_pacote = {c["id"] for d in pacote["divisoes"].values() for c in d}
extras = {c["id"]: c for c in pacote.get("clubesExtras", [])}
GRUPOS = list("ABCDEFGH")


def sigla(nome):
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().upper()
    p = [x for x in re.findall(r"[A-Z]+", s) if x not in {"CLUB", "CA", "CD", "FC", "DE", "LA", "EL", "SC", "CS", "Y", "ATLETICO"}]
    return (p[0][:3] if p else s[:3]).ljust(3, "X")


def cid(slug, nome):
    e = elencos.get(slug, {})
    if e.get("pacote_id") in no_pacote:
        return e["pacote_id"]
    i = "og-" + slug.replace("/", "-")
    if i not in extras:
        reais = [[j["nome"], j["posicao"], int(j["overall"] or 60), {"id": j["id"], "fonte": j["overall_fonte"], **({"idade": j["idade"]} if j.get("idade") else {})}]
                 for j in sorted(e.get("elenco", []), key=lambda j: -(j["overall"] or 0))[:30]]
        extras[i] = {"id": i, "nome": e.get("nome", nome), "sigla": sigla(e.get("nome", nome)), "elenco": reais,
                     "nivel": round(sum(j[2] for j in reais) / len(reais)) if reais else 62,
                     **({"completarAte": 16} if len(reais) < 16 else {})}
    return i


def ids(j):
    return cid(j["casa"], j["nomeCasa"]), cid(j["fora"], j["nomeFora"])


def mata(nome, lista, venc_de=None, anterior=None, neutro=False):
    """Confrontos reais; quem jogou a fase anterior vira VENC:<fase anterior>:<i>."""
    pares, ordem = Counter(), []
    for j in sorted(lista, key=lambda j: j["data"]):
        k = tuple(sorted(ids(j)))
        if k not in pares:
            ordem.append(ids(j))
        pares[k] += 1
    ida_volta = max(pares.values()) >= 2
    datas = sorted({j["data"] for j in lista})
    def troca(x):
        if anterior:
            for i, (a, b) in enumerate(anterior):
                if x in (a, b):
                    return f"VENC:{venc_de}:{i}"
        return x
    reais = [list(p) for p in ordem]
    return ({"tipo": "mataMata", "nome": nome, "idaEVolta": ida_volta, "datas": [datas[0], datas[-1]] if ida_volta else [datas[0]],
             "pares": [[troca(a), troca(b)] for a, b in reais], **({"neutro": True} if neutro else {})}, reais)


def grupos_de(jogos, fim, anterior_reais, venc_de, perdedores=None):
    grupos, lista = [], []
    for g in GRUPOS:
        js = [j for j in jogos if j["fase"] == g and j["data"] <= fim]
        membros = sorted({x for j in js for x in ids(j)})
        grupos.append(membros)
        lista += js
    def troca(x):
        for i, (a, b) in enumerate(anterior_reais or []):
            if x in (a, b):
                return f"VENC:{venc_de}:{i}"
        for i, (a, b) in enumerate((perdedores or {}).get("pares", [])):
            if x in (a, b):
                return f"PERD:{perdedores['comp']}:{perdedores['fase']}:{i}"
        return x
    return ({"tipo": "liga", "nome": "Fase de grupos", "grupos": [[troca(x) for x in g] for g in grupos],
             "jogos": [{"data": j["data"], "casa": troca(ids(j)[0]), "fora": troca(ids(j)[1])} for j in sorted(lista, key=lambda j: j["data"])]})


def por(cod, lista):
    return [j for j in lista if j["fase"] == cod]


def depois_dos_grupos(lista, cod):
    ini = min(j["data"] for j in lista if j["fase"] == "1/8")
    return [j for j in lista if j["fase"] == cod and j["data"] >= ini]


lib = dados["Libertadores"]["jogos"]
f1, r1 = mata("Fase 1", por("1E", lib))
f2, r2 = mata("Fase 2", por("2E", lib), "Fase 1", r1)
f3, r3 = mata("Fase 3", por("3E", lib), "Fase 2", r2)
fim_grupos = max(j["data"] for j in lib if j["fase"] in GRUPOS and j["data"] < min(x["data"] for x in por("1/8", lib)))
grupos = grupos_de(lib, fim_grupos, r3, "Fase 3")
oit = {"tipo": "mataMata", "nome": "Oitavas de final", "idaEVolta": True,
       "datas": [min(j["data"] for j in por("1/8", lib)), max(j["data"] for j in por("1/8", lib))],
       "lados": [{"grupoPos": 1, "fase": "Fase de grupos"}, {"grupoPos": 2, "fase": "Fase de grupos"}]}
def datas_fase(lista, cod, unico=False):
    d = sorted({j["data"] for j in lista if j["fase"] == cod})
    return [d[0]] if unico else [d[0], d[-1]]
final_lib = depois_dos_grupos(lib, "F")
libertadores = {"id": "cont-LIB", "nome": "CONMEBOL Libertadores", "logo": "libertadores", "fases": [
    f1, f2, f3, grupos, oit,
    {"tipo": "mataMata", "nome": "Quartas de final", "idaEVolta": True, "datas": datas_fase(lib, "QF")},
    {"tipo": "mataMata", "nome": "Semifinal", "idaEVolta": True, "datas": datas_fase(lib, "SF")},
    {"tipo": "mataMata", "nome": "Final", "idaEVolta": False, "neutro": True,
     "datas": [final_lib[0]["data"]] if final_lib else ["2026-11-28"]},
]}

sul = dados["Sul-Americana"]["jogos"]
s1, rs1 = mata("1ª fase", por("1F", sul))
fim_g_sul = max(j["data"] for j in sul if j["fase"] in GRUPOS and j["data"] < min(x["data"] for x in por("POff", sul)))
grupos_sul = grupos_de(sul, fim_g_sul, rs1, "1ª fase", {"comp": "cont-LIB", "fase": "Fase 3", "pares": r3})
final_sul = depois_dos_grupos(sul, "F")
sudamericana = {"id": "cont-SUL", "nome": "CONMEBOL Sudamericana", "logo": "sul-americana", "fases": [
    s1, grupos_sul,
    {"tipo": "mataMata", "nome": "Playoffs", "idaEVolta": True, "datas": datas_fase(sul, "POff"),
     "lados": [{"grupoPos": 2, "fase": "Fase de grupos"}, {"grupoPos": 3, "fase": "Fase de grupos", "competicao": "cont-LIB"}]},
    {"tipo": "mataMata", "nome": "Oitavas de final", "idaEVolta": True, "datas": datas_fase(sul, "1/8"),
     "lados": [{"grupoPos": 1, "fase": "Fase de grupos"}, {"vencedoresDe": "Playoffs"}]},
    {"tipo": "mataMata", "nome": "Quartas de final", "idaEVolta": True, "datas": datas_fase(sul, "QF")},
    {"tipo": "mataMata", "nome": "Semifinal", "idaEVolta": True, "datas": datas_fase(sul, "SF")},
    {"tipo": "mataMata", "nome": "Final", "idaEVolta": False, "neutro": True,
     "datas": [final_sul[0]["data"]] if final_sul else ["2026-11-21"]},
]}

pacote["continentais"] = [libertadores, sudamericana]
pacote["clubesExtras"] = list(extras.values())
json.dump(pacote, open(PACOTE, "w", encoding="utf-8"), ensure_ascii=False)
for c in (libertadores, sudamericana):
    print(c["nome"])
    for f in c["fases"]:
        n = len(f.get("pares", [])) or sum(len(g) for g in f.get("grupos", [])) or "lados"
        print("  ", f["nome"], f.get("datas") or f"{len(f['jogos'])} jogos de {f['jogos'][0]['data']} a {f['jogos'][-1]['data']}", n)
print("clubes extras:", len(extras))
