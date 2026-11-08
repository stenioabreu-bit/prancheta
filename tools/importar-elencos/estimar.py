"""Overall estimado para quem não tem FC 26 (marcado em `overall_fonte`, nunca misturado com o real).

1. valor: ajuste por mínimos quadrados  overall ~ log10(valor) + idade + idade²  nos jogadores com FC 26 e valor do oGol;
2. clube: mediana dos overalls (reais ou por valor) do clube, com desconto pela idade;
3. nivel: clube sem base usa o degrau da divisão/liga (mediana dos clubes daquele nível com base, ou o nível acima menos DEGRAU).
Posição detalhada sem FC 26 fica pelo grupo do oGol (GOL/ZAG/MC/ATA) e segue pendente.

Uso (na raiz): python -I tools/importar-elencos/estimar.py   (depois de importar.py)
"""
import json, math, os, statistics

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ARQ = os.path.join(RAIZ, "dados", "elencos-2026.json")
DEGRAU = 4
GRUPO_POS = {"GOL": "GOL", "DEF": "ZAG", "MEI": "MC", "ATA": "ATA"}
ESCADA_BR = ["BRA|Série A", "BRA|Série B", "BRA|Série C", "BRA|Série D", "Estaduais"]

d = json.load(open(ARQ, encoding="utf-8"))
jogadores = [j for c in d["clubes"].values() for j in c["elenco"]]


def linha(j):
    a = j["idade"]
    return [1.0, math.log10(j["valor_eur"]), a, a * a]


def resolve(A, b):
    n = len(b)
    M = [A[i][:] + [b[i]] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]
                M[r] = [x - f * y for x, y in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


base = [j for j in jogadores if j["overall"] is not None and j["valor_eur"] and j["idade"]]
X = [linha(j) for j in base]
y = [j["overall"] for j in base]
XtX = [[sum(r[i] * r[k] for r in X) for k in range(4)] for i in range(4)]
Xty = [sum(r[i] * v for r, v in zip(X, y)) for i in range(4)]
coef = resolve(XtX, Xty)
prever = lambda j: sum(c * x for c, x in zip(coef, linha(j)))
erro = statistics.mean(abs(prever(j) - j["overall"]) for j in base)


def ajuste_idade(a):
    return -4 if a and a < 20 else -2 if a and a < 23 else -1 if a and a > 34 else 0


limita = lambda v: max(40, min(85, round(v)))
for j in jogadores:
    j["overall_fonte"] = "fc26" if j["overall"] is not None else None
    if j["overall"] is None and j["valor_eur"] and j["idade"]:
        j["overall"], j["overall_fonte"] = limita(prever(j)), "estimado-valor"

nivel = lambda c: "Estaduais" if c["competicoes"][0].startswith("Estaduais") else c["competicoes"][0]
medianas = {}
for slug, c in d["clubes"].items():
    o = [j["overall"] for j in c["elenco"] if j["overall"] is not None]
    if len(o) >= 5:
        medianas[slug] = statistics.median(o)
por_nivel = {}
for slug, m in medianas.items():
    por_nivel.setdefault(nivel(d["clubes"][slug]), []).append(m)
degraus = {k: statistics.median(v) for k, v in por_nivel.items() if len(v) >= 3}
for i, k in enumerate(ESCADA_BR):  # BR: cada nível no máximo DEGRAU abaixo do anterior; sem base, nível acima - DEGRAU
    # Da Série C para baixo só os clubes maiores têm valor de mercado; a mediana medida sairia inflada.
    if i >= 2 or (i and (k not in degraus or degraus[k] > degraus[ESCADA_BR[i - 1]] - 1)):
        degraus[k] = degraus[ESCADA_BR[i - 1]] - DEGRAU

contagem = {}
for slug, c in d["clubes"].items():
    ref, fonte = (medianas[slug], "estimado-clube") if slug in medianas else (degraus[nivel(c)] - 2, "estimado-nivel")
    for j in c["elenco"]:
        if j["overall"] is None:
            j["overall"], j["overall_fonte"] = limita(ref - 1 + ajuste_idade(j["idade"])), fonte
        if j["posicao"] is None:
            j["posicao"] = GRUPO_POS[j["grupo"]]
            j["posicao_estimada"] = True
        contagem[j["overall_fonte"]] = contagem.get(j["overall_fonte"], 0) + 1

d["estimativa"] = {"coeficientes": [round(x, 4) for x in coef], "erro_medio_ajuste": round(erro, 2),
                   "amostra_ajuste": len(base), "degraus": {k: round(v, 1) for k, v in degraus.items()}}
json.dump(d, open(ARQ, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
import csv
with open(os.path.join(RAIZ, "docs", "pendencias", "jogadores.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["id", "nome", "clube_ogol", "clube", "posicao", "nacionalidade", "idade", "overall", "overall_fonte", "faltam"])
    for slug, c in d["clubes"].items():
        for j in c["elenco"]:
            faltam = ["nascimento", "pe", "altura"] + (["overall real"] if j["overall_fonte"] != "fc26" else []) \
                + (["posicao detalhada"] if j.get("posicao_estimada") else [])
            w.writerow([j["id"], j["nome"], slug, c["nome"], j["posicao"], j["nacionalidade"], j["idade"], j["overall"],
                        j["overall_fonte"], ";".join(faltam)])
print("ajuste", len(base), "jogadores, erro médio", round(erro, 2), "| coef", [round(x, 3) for x in coef])
print("degraus", {k: round(v, 1) for k, v in sorted(degraus.items())})
print(contagem)
