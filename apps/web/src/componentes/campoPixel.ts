/**
 * Campo em pixel (porte do anim.js do protótipo): 22 jogadores e a bola num
 * canvas 160×104, animando cada minuto a partir dos eventos tipados do motor.
 */
import type { EventoPartida, LadoPartida, Partida, PostoEmCampo } from "@prancheta/engine";

export const LARGURA = 160;
export const ALTURA = 104;
const CORES_GOLEIRO = ["#ff8c1a", "#22d3ee", "#e040fb", "#c6ff00"];

interface Ponto {
  x: number;
  y: number;
}
interface Roteiro {
  dur: number;
  pts: (Ponto & { t: number })[];
  flash: { t: number; txt: string; dur: number; em?: Ponto } | null;
  foco: { id: string; alvo: Ponto } | null;
  posse: "casa" | "visitante";
}

const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function luminancia(h: string): number {
  let c = h.replace("#", "");
  if (c.length === 3) c = [...c].map((x) => x + x).join("");
  const n = Number.parseInt(c, 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

export class CampoPixel {
  private pontos = new Map<string, Ponto>();
  private bola: Ponto = { x: LARGURA / 2, y: ALTURA / 2 };
  private posse: "casa" | "visitante" = "casa";
  private cores: { casa: [string, string]; fora: [string, string]; gkCasa: string; gkFora: string };
  private quadro = 0;

  constructor(
    private m: Partida,
    private ctx: CanvasRenderingContext2D,
  ) {
    const c = m.casa.clube.cores;
    const v = m.visitante.clube.cores;
    // Visitante com cor parecida usa a secundária (uniforme reserva).
    const fora: [string, string] =
      Math.abs(luminancia(c.principal) - luminancia(v.principal)) < 60
        ? [v.secundaria, v.principal]
        : [v.principal, v.secundaria];
    const gks = CORES_GOLEIRO.filter((g) => Math.abs(luminancia(g) - luminancia(c.principal)) > 30);
    this.cores = {
      casa: [c.principal, c.secundaria],
      fora,
      gkCasa: gks[0] ?? "#ff8c1a",
      gkFora: gks[1] ?? "#22d3ee",
    };
    for (const lado of [m.casa, m.visitante])
      for (const p of lado.emCampo) this.pontos.set(p.atual.jogador.id, this.base(p, lado));
  }

  private base(p: PostoEmCampo, lado: LadoPartida): Ponto {
    const prof = 4 + p.y * 0.9;
    const lat = 6 + p.x * 0.88;
    const casa = lado === this.m.casa;
    return {
      x: casa ? (prof / 100) * LARGURA : LARGURA - (prof / 100) * LARGURA,
      y: casa ? (lat / 100) * ALTURA : ALTURA - (lat / 100) * ALTURA,
    };
  }

  private lado(l: "casa" | "visitante" | null): LadoPartida {
    return l === "visitante" ? this.m.visitante : this.m.casa;
  }

  private onde(id: string | undefined): Ponto | null {
    return id ? (this.pontos.get(id) ?? null) : null;
  }

  private roteiro(novos: EventoPartida[]): Roteiro {
    const pts: Roteiro["pts"] = [{ t: 0, ...this.bola }];
    let t = 0;
    const add = (p: Ponto, dt: number) => {
      t += dt;
      pts.push({ t, x: p.x, y: p.y });
    };
    let flash: Roteiro["flash"] = null;
    let foco: Roteiro["foco"] = null;
    const lance = novos.find((e) => e.tipo === "lance");
    if (lance?.lado) {
      const atk = this.lado(lance.lado);
      const dir = atk === this.m.casa ? 1 : -1;
      const [chuta, cria] = lance.jogadores;
      add({ x: LARGURA / 2 - dir * 10, y: ALTURA * (0.3 + Math.random() * 0.4) }, 0.5);
      if (lance.lance === "parada")
        add({ x: dir > 0 ? LARGURA - 2 : 2, y: Math.random() < 0.5 ? 2 : ALTURA - 2 }, 0.6);
      else {
        const pc = this.onde(cria);
        if (pc) add({ x: limitar(pc.x + dir * 6, 4, LARGURA - 4), y: pc.y }, 0.6);
      }
      if (lance.lance === "cruz")
        add({ x: dir > 0 ? LARGURA - 14 : 14, y: Math.random() < 0.5 ? 8 : ALTURA - 8 }, 0.6);
      const longe = lance.lance === "fora";
      const fin = {
        x: dir > 0 ? LARGURA - (longe ? 34 : 18) : longe ? 34 : 18,
        y: ALTURA / 2 + (Math.random() - 0.5) * (longe ? 20 : 16),
      };
      add(fin, 0.55);
      if (chuta) foco = { id: chuta, alvo: fin };
      const res = novos[novos.indexOf(lance) + 1];
      const lat = (Math.random() - 0.5) * 8;
      const fundo = dir > 0 ? LARGURA + 3 : -3;
      if (res?.tipo === "gol") {
        add({ x: fundo, y: ALTURA / 2 + lat * 0.6 }, 0.35);
        flash = { t, txt: "GOL!", dur: 1.6 };
        add({ x: fundo, y: ALTURA / 2 + lat * 0.6 }, 1.6);
      } else if (res?.tipo === "defesa") {
        const g = { x: (dir > 0 ? LARGURA - 1 : 1) - dir * 3, y: ALTURA / 2 + lat * 0.5 };
        add(g, 0.35);
        flash = { t, txt: "DEFESA", dur: 0.8 };
        add(g, 0.8);
      } else {
        add(
          {
            x: dir > 0 ? LARGURA + 4 : -4,
            y: ALTURA / 2 + (Math.random() < 0.5 ? -1 : 1) * (ALTURA * 0.2 + Math.random() * 8),
          },
          0.4,
        );
        add(pts[pts.length - 1]!, 0.4);
      }
      return { dur: t, pts, flash, foco, posse: lance.lado };
    }
    const lado = this.lado(this.posse);
    const vivos = lado.emCampo.filter((p) => !p.expulso && p.posto !== "GOL");
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const p = vivos[Math.floor(Math.random() * vivos.length)];
      const pp = p && this.onde(p.atual.jogador.id);
      if (pp) add(pp, 0.55 + Math.random() * 0.25);
    }
    const cartao = novos.find((e) => e.tipo === "amarelo" || e.tipo === "vermelho");
    const em = cartao && this.onde(cartao.jogadores[0]);
    if (cartao && em) {
      flash = { t, txt: cartao.tipo === "amarelo" ? "AMARELO" : "VERMELHO", dur: 1.1, em };
      add(em, 1.1);
    }
    const posse = Math.random() < 0.5 ? "casa" : "visitante";
    return { dur: Math.max(t, 0.6), pts, flash, foco, posse };
  }

  private bolaEm(r: Roteiro, t: number): Ponto {
    const p = r.pts;
    for (let i = 1; i < p.length; i++) {
      const b = p[i]!;
      if (t <= b.t) {
        const a = p[i - 1]!;
        const k = (t - a.t) / Math.max(0.001, b.t - a.t);
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
      }
    }
    return p[p.length - 1]!;
  }

  private mover(r: Roteiro, bola: Ponto) {
    for (const lado of [this.m.casa, this.m.visitante]) {
      const casa = lado === this.m.casa;
      const comBola = r.posse === (casa ? "casa" : "visitante");
      const dir = casa ? 1 : -1;
      let maisPerto: string | null = null;
      let menor = Number.POSITIVE_INFINITY;
      for (const p of lado.emCampo) {
        if (p.expulso) continue;
        const id = p.atual.jogador.id;
        const b = this.base(p, lado);
        const gol = p.posto === "GOL";
        let x = b.x + dir * (comBola ? 10 : -4) * (gol ? 0.15 : 1);
        let y = b.y;
        x += (bola.x - x) * (gol ? 0.03 : 0.18);
        y += (bola.y - y) * (gol ? 0.25 : 0.22);
        let alvo = { x: limitar(x, 2, LARGURA - 2), y: limitar(y, 2, ALTURA - 2) };
        const atual = this.pontos.get(id) ?? alvo;
        const d = (atual.x - bola.x) ** 2 + (atual.y - bola.y) ** 2;
        if (!gol && d < menor) {
          menor = d;
          maisPerto = id;
        }
        if (r.foco?.id === id) alvo = r.foco.alvo;
        this.pontos.set(id, {
          x: atual.x + (alvo.x - atual.x) * 0.12,
          y: atual.y + (alvo.y - atual.y) * 0.12,
        });
      }
      if (maisPerto && r.foco?.id !== maisPerto) {
        const a = this.pontos.get(maisPerto)!;
        const alvo = { x: bola.x - dir * (comBola ? 2 : -2), y: bola.y + 1 };
        this.pontos.set(maisPerto, { x: a.x + (alvo.x - a.x) * 0.12, y: a.y + (alvo.y - a.y) * 0.12 });
      }
    }
  }

  desenhar(r?: Roteiro, t = 0) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? "#2f7f4f" : "#2a7347";
      ctx.fillRect(Math.round((i * LARGURA) / 10), 0, Math.ceil(LARGURA / 10), ALTURA);
    }
    ctx.fillStyle = "rgba(255,255,255,.75)";
    const linha = (x: number, y: number, w: number, h: number) => ctx.fillRect(x, y, w, h);
    linha(1, 1, LARGURA - 2, 1);
    linha(1, ALTURA - 2, LARGURA - 2, 1);
    linha(1, 1, 1, ALTURA - 2);
    linha(LARGURA - 2, 1, 1, ALTURA - 2);
    linha(LARGURA / 2, 1, 1, ALTURA - 2);
    for (let a = 0; a < 360; a += 10) {
      ctx.fillRect(
        Math.round(LARGURA / 2 + Math.cos((a * Math.PI) / 180) * 11),
        Math.round(ALTURA / 2 + Math.sin((a * Math.PI) / 180) * 11),
        1,
        1,
      );
    }
    const ah = 40;
    const aw = 20;
    linha(1, (ALTURA - ah) / 2, aw, 1);
    linha(1, (ALTURA + ah) / 2, aw, 1);
    linha(aw, (ALTURA - ah) / 2, 1, ah);
    linha(LARGURA - 1 - aw, (ALTURA - ah) / 2, aw, 1);
    linha(LARGURA - 1 - aw, (ALTURA + ah) / 2, aw, 1);
    linha(LARGURA - 1 - aw, (ALTURA - ah) / 2, 1, ah);
    for (const lado of [this.m.casa, this.m.visitante]) {
      const casa = lado === this.m.casa;
      const [cor, cor2] = casa ? this.cores.casa : this.cores.fora;
      for (const p of lado.emCampo) {
        if (p.expulso) continue;
        const d = this.pontos.get(p.atual.jogador.id);
        if (!d) continue;
        const x = Math.round(d.x) - 2;
        const y = Math.round(d.y) - 2;
        const gol = p.posto === "GOL";
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(x, y + 5, 5, 1);
        ctx.fillStyle = "#0b1a10";
        ctx.fillRect(x - 1, y - 1, 6, 6);
        ctx.fillStyle = gol ? (casa ? this.cores.gkCasa : this.cores.gkFora) : cor;
        ctx.fillRect(x, y, 4, 4);
        if (!gol) {
          ctx.fillStyle = cor2;
          ctx.fillRect(x, y + 3, 4, 1);
        }
        if (lado.ehUsuario) {
          ctx.fillStyle = "#ffd84a";
          ctx.fillRect(x + 1, y - 3, 2, 1);
        }
      }
    }
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillRect(Math.round(this.bola.x), Math.round(this.bola.y) + 1, 2, 1);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(this.bola.x), Math.round(this.bola.y), 2, 2);
    if (r?.flash && t >= r.flash.t && t <= r.flash.t + r.flash.dur) {
      const pisca = Math.floor((t - r.flash.t) * 6) % 2 === 0;
      if (r.flash.txt === "GOL!") {
        ctx.fillStyle = pisca ? "rgba(255,216,74,.22)" : "rgba(255,216,74,.08)";
        ctx.fillRect(0, 0, LARGURA, ALTURA);
      }
      if (r.flash.em && pisca) {
        ctx.fillStyle = r.flash.txt === "AMARELO" ? "#ffd84a" : "#ff5a4f";
        ctx.fillRect(Math.round(r.flash.em.x) + 3, Math.round(r.flash.em.y) - 5, 2, 3);
      }
    }
  }

  /** Anima um minuto; `escala` multiplica a duração (velocidade escolhida). */
  animar(novos: EventoPartida[], escala: number): Promise<void> {
    const r = this.roteiro(novos);
    this.posse = r.posse;
    const total = Math.max(0.6, r.dur) * 1000 * escala;
    const inicio = performance.now();
    cancelAnimationFrame(this.quadro);
    return new Promise((fim) => {
      const passo = (agora: number) => {
        const k = Math.min(1, (agora - inicio) / total);
        const t = k * r.dur;
        this.bola = this.bolaEm(r, t);
        this.mover(r, this.bola);
        this.desenhar(r, t);
        if (k < 1) this.quadro = requestAnimationFrame(passo);
        else fim();
      };
      this.quadro = requestAnimationFrame(passo);
    });
  }

  parar() {
    cancelAnimationFrame(this.quadro);
  }
}
