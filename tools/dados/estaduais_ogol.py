"""Baixa do oGol a tabela real 2026 de cada estadual (data, mandante, visitante, fase) e grava dados/estaduais-2026-jogos.json.
Uso: python -I tools/dados/estaduais_ogol.py dados/auditoria-ogol.json dados/estaduais-2026-jogos.json"""
import html, json, re, sys, time, urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
aud = json.load(open(sys.argv[1], encoding="utf-8"))
LINHA = re.compile(
    r'<td class="date" >(\d{4}-\d\d-\d\d)</td><td>([^<]*)</td><td class="text home"><a href="/equipe/([^"?]+)[^"]*">(?:<b>)?([^<]+)'
    r'.*?<td class="result">(.*?)</td>.*?<td class="text away"><a href="/equipe/([^"?]+)[^"]*">(?:<b>)?([^<]+).*?<td class="phase">([^<]*)</td>',
    re.S,
)
saida = {"fonte": "oGol (calendário de cada edição)", "obtido_em": time.strftime("%Y-%m-%d"), "estaduais": {}}
for chave, comp in aud["competicoes"].items():
    if not chave.startswith("Estaduais|"):
        continue
    uf, ed = chave.split("|")[1], comp["edicoes"][0]
    jogos, vistos, pagina = [], set(), 1
    while pagina < 15:
        time.sleep(2)
        url = f"https://www.ogol.com.br{ed}/calendario?page={pagina}"
        s = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40).read().decode("utf-8", "ignore")
        novos = 0
        for data, hora, ca, nca, res, fo, nfo, fase in LINHA.findall(s):
            k = (data, ca, fo)
            if k in vistos:
                continue
            vistos.add(k)
            novos += 1
            gols = re.search(r">(\d+)-(\d+)<", res)
            jogos.append({"data": data, "hora": hora.strip(), "casa": ca, "fora": fo, "nomeCasa": html.unescape(nca).strip(),
                          "nomeFora": html.unescape(nfo).strip(), "fase": fase.strip(),
                          "placar": [int(gols.group(1)), int(gols.group(2))] if gols else None})
        if not novos:
            break
        pagina += 1
    jogos.sort(key=lambda j: j["data"])
    saida["estaduais"][uf] = {"edicao": ed, "jogos": jogos}
    fases = {}
    for j in jogos:
        fases[j["fase"]] = fases.get(j["fase"], 0) + 1
    print(uf, len(jogos), "jogos", jogos[0]["data"] if jogos else "-", jogos[-1]["data"] if jogos else "-", fases, flush=True)
json.dump(saida, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
