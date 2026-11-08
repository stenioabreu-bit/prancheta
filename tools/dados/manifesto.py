"""Gera assets/logos/competicoes/manifest.json a partir do catálogo TS, dos downloads e das decisões de fonte.
Uso: python -I manifesto.py <competicoes.ts> <baixados.json> <manifest.json>"""
import json, re, sys

sys.stdout.reconfigure(encoding="utf-8")
ts, baixados, saida = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8")), sys.argv[3]
src = open(ts, encoding="utf-8").read()
catalogo = []
for m in re.finditer(r'(nacional|estadual|exterior)\((?:"(\w+)", )?"([a-z0-9-]+)", "([^"]+)", "([^"]+)"\)', src):
    tipo, extra, cid, nome, curto = m.groups()
    cat = {"nacional": "brasil/nacionais", "estadual": "brasil/estaduais", "exterior": "america-do-sul"}[tipo]
    catalogo.append((cid, nome, cat, "BRA" if tipo != "exterior" else extra, extra if tipo == "estadual" else None))
for m in re.finditer(r'\{ id: "([a-z-]+)", nomeOficial: "([^"]+)"', src):
    catalogo.append((m.group(1), m.group(2), "continentais", "CONMEBOL", None))
assert len(catalogo) == 43, len(catalogo)

MARCA = ("Marca registrada da entidade organizadora. Uso no jogo depende de autorização do titular; "
         "arquivo público não concede licença de marca.")
WP_NF = "Wikipédia: arquivo não livre (uso restrito/fair use na Wikipédia); não cobre uso em jogo."
F = {  # fonte original, temporada/versão, licença/observação, verificação, fundo
    "brasileirao-serie-a": ("https://commons.wikimedia.org/wiki/File:Campeonato_Brasileiro_S%C3%A9rie_A_logo_(2024%E2%80%932026).svg",
                            "2024–2026 (Brasileirão Betano)", "Commons: domínio público (PD-textlogo). " + MARCA,
                            "Vetorização de terceiros (crédito: logos.fandom.com); a CBF não publica o arquivo. Conferida visualmente contra a marca usada em 2026.", "claro"),
    "brasileirao-serie-b": ("https://pt.wikipedia.org/wiki/Ficheiro:Campeonato_Brasileiro_de_Futebol_S%C3%A9rie_B.png",
                            "2025–2026", WP_NF + " " + MARCA, "Origem: perfil oficial @BrasileiraoB (X). Versão para fundo escuro.", "escuro"),
    "brasileirao-serie-c": ("https://pt.wikipedia.org/wiki/Ficheiro:Campeonato_Brasileiro_de_Futebol_de_2022_-_S%C3%A9rie_C.png",
                            "2022–2026", WP_NF + " " + MARCA, "Origem: pasta oficial de marcas da CBF (transfer.cbf.com.br, hoje fora do ar).", "claro"),
    "brasileirao-serie-d": ("https://pt.wikipedia.org/wiki/Ficheiro:Campeonato_Brasileiro_de_Futebol_de_2022_-_S%C3%A9rie_D.png",
                            "2022–2026", WP_NF + " " + MARCA, "Origem: pasta oficial de marcas da CBF (transfer.cbf.com.br, hoje fora do ar).", "claro"),
    "copa-do-brasil": ("https://commons.wikimedia.org/wiki/File:Copa_do_Brasil_logo_(2018).svg", "2018–2026",
                       "Commons: domínio público (PD-textlogo). " + MARCA,
                       "Vetorização de terceiros (crédito: vetores.org); a CBF não publica o arquivo. Conferida visualmente.", "claro"),
    "campeonato-paulista": ("https://pt.wikipedia.org/wiki/Ficheiro:Paulist%C3%A3o_2026.png", "2026 (Paulistão Casas Bahia)",
                            WP_NF + " " + MARCA, "Origem declarada: FPF.", "claro"),
    "campeonato-carioca": ("https://pt.wikipedia.org/wiki/Ficheiro:Carioca2026.jpg", "2026 (Carioca Superbet)", WP_NF + " " + MARCA,
                           "JPEG sem transparência (fundo próprio do arquivo); não havia PNG/SVG oficial acessível.", "proprio"),
    "campeonato-gaucho": ("https://fgf.com.br/marcas/Gauchao25.zip", "2025 (pacote de marcas da FGF; vigente em 2026)",
                          "Distribuído pela FGF na página de marcas. " + MARCA,
                          "Oficial. Pacote preservado em originais/campeonato-gaucho-Gauchao25.zip; usado o símbolo colorido sem alteração.", "claro"),
    "campeonato-paranaense": ("https://pt.wikipedia.org/wiki/Ficheiro:ParanaenseFutebol.png", "vigente (sem ano no arquivo)",
                              WP_NF + " " + MARCA, "Origem declarada: federacaopr.com.br.", "claro"),
    "campeonato-catarinense": ("https://commons.wikimedia.org/wiki/File:Campeonatocatarinense2026.jpg", "2026 (Catarinense Fort Atacadista)",
                               "Commons declara CC0, mas a arte é da FCF; tratar como marca de terceiros. " + MARCA,
                               "Origem: fcf.com.br (página da Série A 2026). JPEG sem transparência.", "proprio"),
    "campeonato-cearense": ("https://pt.wikipedia.org/wiki/Ficheiro:Campeonato_Cearense_2026.png", "2026 (Cearense Superbet)",
                            WP_NF + " " + MARCA, "Origem declarada: divulgação oficial da FCF.", "claro"),
    "campeonato-alagoano": ("https://pt.wikipedia.org/wiki/Ficheiro:Campeonato_Alagoano_2026.png", "2026", WP_NF + " " + MARCA,
                            "Origem declarada: Federação Alagoana de Futebol. Arquivo inclui moldura própria.", "claro"),
    "campeonato-paraibano": ("https://pt.wikipedia.org/wiki/Ficheiro:Paraibano_2026_logo.png", "2026", WP_NF + " " + MARCA,
                             "Origem declarada: federacaopbfutebol.com.br.", "claro"),
    "campeonato-amazonense": ("https://pt.wikipedia.org/wiki/Ficheiro:Barez%C3%A3o_de_2026.png", "2026 (Barezão Sicredi)", WP_NF + " " + MARCA,
                              "Origem declarada: FAF. Elementos brancos: pede fundo escuro.", "escuro"),
    "primera-division-argentina": ("https://www.ligaprofesional.ar/wp-content/uploads/2026/01/LPF-Favicon-2026-2.png", "2026",
                                   "Arquivo do site oficial da LPF. " + MARCA, "Oficial (ícone da marca LPF 2026).", "claro"),
    "primera-division-chile": ("https://www.campeonatochileno.cl/wp-content/uploads/2024/12/LOGO-CAMPEONATO-02@2x.png", "2025–2026",
                               "Arquivo do site oficial da ANFP. " + MARCA, "Oficial; marca monocromática branca.", "escuro"),
    "primera-a-colombia": ("https://commons.wikimedia.org/wiki/File:BetPlay-Dimayor_logo.svg", "Liga BetPlay DIMAYOR (vigente)",
                           "Commons: domínio público (PD-textlogo). " + MARCA, "Origem declarada: dimayor.com.co.", "claro"),
    "serie-a-equador": ("https://ligapro.ec/wp-content/uploads/2025/03/logolproblk@2x.png", "2025–2026",
                        "Arquivo do site oficial da LigaPro. " + MARCA, "Oficial (versão escura do logotipo).", "claro"),
    "primera-division-uruguai": ("https://commons.wikimedia.org/wiki/File:Liga_AUF_Uruguaya_-_logo_azul.png", "Liga AUF Uruguaya (desde 2025)",
                                 "Commons: CC BY-SA 4.0 declarado pelo autor do envio. " + MARCA, "Origem declarada: auf.org.uy.", "claro"),
    "primera-division-venezuela": ("https://ligafutve.org/wp-content/uploads/2024/08/cropped-logo-liga-web-micro.png", "2024–2026",
                                   "Arquivo do site oficial da Liga FUTVE. " + MARCA, "Oficial (ícone do site, 512 px).", "proprio"),
    "libertadores": ("https://en.wikipedia.org/wiki/File:Copa_Libertadores_logo.svg", "2017– (identidade atual)",
                     "Wikipédia (en): fair use. " + MARCA, "Extraído do manual de marca oficial da CONMEBOL. Usado também pela Pré-Libertadores.", "claro"),
    "sul-americana": ("https://en.wikipedia.org/wiki/File:CONMEBOL_Sudamericana_logo_(2017).svg", "2017– (identidade atual)",
                      "Wikipédia (en): fair use. " + MARCA, "Origem declarada: conmebol.com/documentos.", "claro"),
}
PENDENTE = {
    "campeonato-mineiro": "FMF não publica o logo do Módulo I; Wikipédia só tem o escudo da federação (rejeitado).",
    "campeonato-baiano": "FBF publica apenas card promocional (card-baiano_2026.jpg), não o logo.",
    "campeonato-pernambucano": "Sem logo no site da FPF-PE nem na Wikipédia (só bandeira do estado).",
    "campeonato-goiano": "Site da FGF (GO) sem o logo; Wikipédia sem arquivo.",
    "campeonato-potiguar": "Site da FNF sem o logo; Wikipédia sem arquivo.",
    "campeonato-sergipano": "Site da FSF com certificado inválido; Wikipédia sem arquivo.",
    "campeonato-maranhense": "Único arquivo (Wikipédia) vem do TheSportsDB; autenticidade não verificável.",
    "campeonato-piauiense": "Site da FFP com certificado inválido; Wikipédia sem arquivo.",
    "campeonato-paraense": "Arquivo da Wikipédia é captura de transmissão (YouTube); rejeitado.",
    "campeonato-rondoniense": "Site da FFER sem logo identificável; Wikipédia sem arquivo.",
    "campeonato-acriano": "Site da FFAC sem o logo; Wikipédia sem arquivo.",
    "campeonato-amapaense": "Site da FAF (AP) sem o logo; Wikipédia só bandeira.",
    "campeonato-tocantinense": "Site da FTF sem conteúdo acessível; Wikipédia só bandeira.",
    "campeonato-sul-mato-grossense": "Site da federação não localizado; Wikipédia sem arquivo.",
    "campeonato-mato-grossense": "Site da FMF-MT sem o logo; Wikipédia só bandeira.",
    "campeonato-brasiliense": "Site da FFDF sem o logo; Wikipédia só bandeira.",
    "campeonato-capixaba": "Site da FES sem o logo; Wikipédia sem arquivo.",
    "campeonato-roraimense": "Site da federação não localizado; Wikipédia só bandeira.",
    "division-profesional-bolivia": "Site da FBF (Bolívia) sem o logo da División Profesional; Wikipédia sem arquivo.",
    "primera-division-paraguai": "Arquivo do Commons é 'trabalho próprio' de usuário (CC BY-SA); origem oficial não verificável.",
    "liga-1-peru": "SVG do Commons vem de footylogos.com; site liga1.pe sem arquivo acessível.",
}
INTEGRADOS = {"brasileirao-serie-a", "brasileirao-serie-b", "brasileirao-serie-c", "brasileirao-serie-d", "copa-do-brasil"}
manifesto = {"versao": 1, "obtido_em": "2026-11-08", "base": "/assets/logos/competicoes/",
             "aliases": {"pre-libertadores": "libertadores"}, "competicoes": []}
for cid, nome, cat, pais, uf in catalogo:
    b = baixados.get(cid)
    if b:
        fonte, temporada, licenca, verif, fundo = F[cid]
        manifesto["competicoes"].append({
            "id": cid, "nomeOficial": nome, "categoria": cat, "pais": pais, **({"uf": uf} if uf else {}),
            "arquivo": b["arquivo"], "fonte": fonte, "urlArquivo": b["url"], "temporada": temporada,
            "formato": b["arquivo"].rsplit(".", 1)[-1], "largura": b["largura"], "altura": b["altura"],
            "transparencia": b["transparencia"], "fundo": fundo, "sha256": b["sha256"], "obtidoEm": "2026-11-08",
            "licenca": licenca, "verificacao": verif, "status": "integrado" if cid in INTEGRADOS else "encontrado"})
    else:
        manifesto["competicoes"].append({
            "id": cid, "nomeOficial": nome, "categoria": cat, "pais": pais, **({"uf": uf} if uf else {}),
            "arquivo": None, "status": "pendente", "motivo": PENDENTE[cid]})
json.dump(manifesto, open(saida, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
from collections import Counter
print(Counter(c["status"] for c in manifesto["competicoes"]))
