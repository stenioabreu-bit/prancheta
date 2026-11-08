"""Auditoria de cobertura no oGol: participantes 2026 de cada competição e tamanho do elenco 2026.
Só páginas de competição, edição e clube (sem fichas de jogador). 1 requisição a cada 3 s, com cache.
Uso: python -I auditoria_ogol.py <pasta_cache> <saida.json>
"""
import html, json, os, re, sys, time, urllib.request, hashlib, threading
from concurrent.futures import ThreadPoolExecutor

BASE = "https://www.ogol.com.br"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
CACHE, SAIDA = sys.argv[1], sys.argv[2]
os.makedirs(CACHE, exist_ok=True)

COMPETICOES = {
    "BRA": {"Série A": "brasileirao/51", "Série B": "brasileirao-serie-b/154", "Série C": "brasileirao-serie-c/208",
            "Série D": "brasileirao-serie-d/631"},
    "Estaduais": {"AC": "campeonato-acreano/2468", "AL": "campeonato-alagoano/908", "AP": "campeonato-amapaense/2378",
                  "AM": "campeonato-amazonense/306", "BA": "campeonato-baiano/1796", "CE": "campeonato-cearense/1816",
                  "DF": "campeonato-candango/1781", "ES": "campeonato-capixaba/1790", "GO": "campeonato-goiano/2586",
                  "MA": "campeonato-maranhense/311", "MT": "mato-grosso/318", "MS": "mato-grosso-do-sul/317",
                  "MG": "campeonato-mineiro/784", "PA": "campeonato-paraense/1789", "PB": "campeonato-paraibano/1791",
                  "PR": "campeonato-paranaense/959", "PE": "campeonato-pernambucano/1782", "PI": "campeonato-piauiense/1943",
                  "RJ": "campeonato-carioca/893", "RN": "campeonato-potiguar/1784", "RS": "campeonato-gaucho/904",
                  "RO": "campeonato-rondoniense/2335", "RR": "campeonato-roraimense/337", "SC": "campeonato-catarinense/1234",
                  "SP": "campeonato-paulista/555", "SE": "campeonato-sergipano/1857", "TO": "campeonato-tocantinense/1792"},
    "Exterior": {"ARG": "campeonato-argentino/70", "BOL": "liga-boliviana/280", "CHI": "liga-chilena/265",
                 "COL": "liga-colombiana-apertura/1469", "COL-F": "liga-colombiana-finalizacion/1470", "EQU": "liga-equatoriana/274", "PAR": "liga-paraguaia-apertura/1506", "PAR-C": "liga-paraguaia-clausura/1507",
                 "PER": "liga-peruana/241", "URU": "liga-uruguaia/237", "VEN": "1-divisao-venezuelana/272"},
    "Continentais": {"Libertadores": "copa-libertadores/58", "Sul-Americana": "copa-sul-americana/269"},
}

ultima = [0.0]
TRAVA = threading.Lock()
INTERVALO = 0.7


def baixar(caminho):
    arq = os.path.join(CACHE, hashlib.sha1(caminho.encode()).hexdigest() + ".html")
    if os.path.exists(arq):
        return open(arq, encoding="utf-8", errors="ignore").read()
    with TRAVA:
        espera = INTERVALO - (time.time() - ultima[0])
        if espera > 0:
            time.sleep(espera)
        ultima[0] = time.time()
    req = urllib.request.Request(BASE + caminho, headers={"User-Agent": UA, "Accept-Language": "pt-BR"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            s = r.read().decode("utf-8", errors="ignore")
            final = r.geturl()
    except Exception as erro:
        return f"<!--ERRO {erro}-->"
    if final.rstrip("/").endswith("equipas.php"):
        s = "<!--REDIRECIONADO-->"
    open(arq, "w", encoding="utf-8").write(s)
    return s


def edicoes_2026(slug):
    s = baixar(f"/competicao/{slug}")
    links = sorted(set(re.findall(r'href="(/edicao/[^"/]*2026[^"/]*/\d+)"', s)))
    return [l for l in links if "2026-27" not in l and "26-27" not in l]


def equipes(edicao):
    s = baixar(edicao + "/equipes")
    achados = re.findall(r'<div class="text"><a href="/equipe/([^"/?]+/?\d*)\?epoca_id=(\d+)">([^<]+)</a>', s)
    if True:
        cartoes = re.findall(r'<a href="/equipe/([^"?]+)">\s*<div class="names">\s*<span class="first_name"[^>]*>\s*([^<]+?)\s*</span>', s)
        achados += [(slug, "155", nome) for slug, nome in cartoes]
    vistos, saida = set(), []
    for slug, epoca, nome in achados:
        if slug not in vistos:
            vistos.add(slug)
            saida.append({"slug": slug, "epoca": epoca, "nome": html.unescape(nome)})
    return saida


def elenco(slug, epoca):
    s = baixar(f"/equipe/{slug}?epoca_id={epoca}")
    jogadores = []
    for b in re.findall(r'<div class="staff">(.*?)</span></div></div>', s, re.S):
        j = re.search(r'href="/jogador/([^/"]+)/(\d+)\?epoca_id=(\d+)">([^<]+)</a>', b)
        if not j:
            continue
        nac = re.search(r'<a title="([^"]+)" href="/pais/', b)
        idade = re.search(r"<span>(\d+) anos", b)
        jogadores.append({"id": j.group(2), "nome": html.unescape(j.group(4)), "nac": nac and nac.group(1),
                          "idade": idade and int(idade.group(1))})
    return jogadores


resultado = {"obtido_em": time.strftime("%Y-%m-%d"), "competicoes": {}, "clubes": {}}
for grupo, comps in COMPETICOES.items():
    for nome, slug in comps.items():
        if slug.endswith("/0"):
            s = baixar("/competicao/" + slug.split("/")[0])
            m = re.search(r'href="/competicao/(liga-equatoriana[^"]*|serie-a-equador[^"]*|campeonato-equatoriano[^"]*)"', s)
            slug = m.group(1) if m else slug
        eds = edicoes_2026(slug)
        participantes = []
        for ed in eds:
            for e in equipes(ed):
                participantes.append(e)
        unicos = {e["slug"]: e for e in participantes}
        resultado["competicoes"][f"{grupo}|{nome}"] = {"slug": slug, "edicoes": eds, "clubes": list(unicos)}
        for e in unicos.values():
            resultado["clubes"].setdefault(e["slug"], {"nome": e["nome"], "epoca": e["epoca"]})
        print(grupo, nome, len(eds), "edições", len(unicos), "clubes", flush=True)

pendentes = [(slug, c) for slug, c in resultado["clubes"].items() if "jogadores" not in c]
with ThreadPoolExecutor(6) as ex:
    for i, ((slug, c), jogs) in enumerate(zip(pendentes, ex.map(lambda sc: elenco(sc[0], sc[1]["epoca"]), pendentes))):
        c["jogadores"] = jogs
        if i % 50 == 0:
            print("clubes", i, len(pendentes), flush=True)
json.dump(resultado, open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False)
print("fim", len(resultado["clubes"]), "clubes")
