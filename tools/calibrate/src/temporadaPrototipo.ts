/**
 * Roda o motor original do protótipo (JavaScript do HTML, com Math.random)
 * numa sandbox, com o mesmo roteiro de temporada do port, para comparar os números.
 */
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import type { TemporadaMedida } from "./metricas";
import type { Modo } from "./temporadaPort";

function trecho(codigo: string, inicio: string, fim: string): string {
  const i = codigo.indexOf(inicio);
  const f = codigo.indexOf(fim, i);
  if (i < 0 || f < 0) throw new Error(`Trecho "${inicio}" não encontrado no protótipo`);
  return codigo.slice(i, f);
}

/** Mesmo roteiro de temporadaPort, escrito no dialeto do protótipo. */
const ROTEIRO = `
function temporadaPrototipo(modo){
  const L = buildLeague(); L.user = null;
  const forte = L.order.reduce((a,b)=>L.teams[b].forca>L.teams[a].forca?b:a);
  let golsForte=0, goleadasForte=0;
  const jogos=[];
  for(let r=0;r<38;r++){
    L.rodada=r;
    for(const f of L.fixtures[r]){
      let jogo;
      if(modo==="motor"){
        const m=newMatch(L,f.h,f.a);
        for(;;){ const res=step(m); if(res==="ht"){ m.fase="jogo"; continue; } if(res==="ft"||res===false) break; }
        finishMatch(L,m);
        const H=m.home.st, A=m.away.st;
        jogo={golsCasa:H.gols,golsVisitante:A.gols,detalhe:{amarelos:H.am+A.am,vermelhos:H.verm+A.verm,chutes:H.chutes+A.chutes,xg:H.xg+A.xg,lesoes:m.log.filter(e=>e.tipo==="lesao").length}};
      } else {
        const [gh,ga]=quickSim(L,f.h,f.a); f.gh=gh; f.ga=ga; applyResult(L,f.h,f.a,gh,ga);
        statsRapidas(L,{h:f.h,a:f.a,gh,ga});
        jogo={golsCasa:gh,golsVisitante:ga};
      }
      jogos.push(jogo);
      if(f.h===forte||f.a===forte){ const pro=f.h===forte?jogo.golsCasa:jogo.golsVisitante, contra=f.h===forte?jogo.golsVisitante:jogo.golsCasa; golsForte+=pro; if(pro-contra>=4) goleadasForte++; }
    }
    L.order.forEach(id=>L.teams[id].players.forEach(p=>{ p.cond=Math.min(100,p.cond+38); if(p.lesao>0&&!p.recemLes){p.lesao--;} p.recemLes=false; }));
    L.order.forEach(id=>L.teams[id].players.forEach(p=>{ if(p.susp>0&&p.suspCumprindo){p.susp--;} p.suspCumprindo=p.susp>0; }));
  }
  const ps=L.order.flatMap(id=>L.teams[id].players);
  const art=ps.reduce((a,b)=>(b.gols||0)>(a.gols||0)?b:a), gar=ps.reduce((a,b)=>(b.assist||0)>(a.assist||0)?b:a);
  const ordem=sortedTable(L);
  return {jogos,artilheiro:{nome:art.nome,gols:art.gols||0},garcom:{nome:gar.nome,assist:gar.assist||0},
    pontosCampeao:L.tabela[ordem[0]].pts,pontosLanterna:L.tabela[ordem[ordem.length-1]].pts,
    maisForte:{golsPorJogo:golsForte/38,goleadas:goleadasForte,pontos:L.tabela[forte].pts}};
}`;

export function carregarPrototipo(caminhoHtml: string): (modo: Modo) => TemporadaMedida {
  const html = readFileSync(caminhoHtml, "utf8");
  const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
  const motor = trecho(script, "const DB = {", "/* ================= CLUBE");
  const rapidas = trecho(script, "function statsRapidas", "function simWeek");
  const contexto = createContext({});
  runInContext(`${motor}\n${rapidas}\n${ROTEIRO}\nthis.temporadaPrototipo = temporadaPrototipo;`, contexto);
  const temporada = contexto.temporadaPrototipo as (modo: Modo) => TemporadaMedida;
  return (modo) => temporada(modo);
}
