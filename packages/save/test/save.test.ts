import { pacoteFicticio } from "@prancheta/data";
import { novoJogo, proximoJogoDoUsuario, seguir, simularPartidaDoUsuario } from "@prancheta/engine";
import { describe, expect, it } from "vitest";
import { type Save, abrirSave, armazenamentoEmMemoria, carregar, criarSave, salvar } from "../src";

function jogo() {
  const p = pacoteFicticio();
  const estado = novoJogo({
    semente: 1,
    temporada: p.temporada,
    divisoes: p.divisoes,
    vagasDiretasCopa: p.vagasDiretasCopa,
    classicos: p.classicos,
    tecnico: "Fulano",
    clubeId: p.divisoes.A[3]!.id,
  });
  for (let i = 0; i < 5; i++) {
    if (proximoJogoDoUsuario(estado)) simularPartidaDoUsuario(estado);
    else seguir(estado);
  }
  return estado;
}

describe("save", () => {
  const estado = jogo();

  it("ida e volta preserva o estado inteiro", async () => {
    const save = await criarSave(estado);
    expect(await abrirSave(save)).toEqual(JSON.parse(JSON.stringify(estado)));
  });

  it("comprime bem (gzip)", async () => {
    const save = await criarSave(estado);
    const cru = JSON.stringify(estado).length;
    expect(save.dados.length).toBeLessThan(cru / 5);
  });

  it("alterna os slots e carrega o mais recente", async () => {
    const arm = armazenamentoEmMemoria();
    expect(await salvar(arm, estado, 1000)).toBe("A");
    expect(await salvar(arm, estado, 2000)).toBe("B");
    expect(await salvar(arm, estado, 3000)).toBe("A");
    expect((await arm.ler("A"))!.salvoEm).toBe(3000);
  });

  it("se o save mais novo estiver corrompido, abre o anterior", async () => {
    const arm = armazenamentoEmMemoria();
    await salvar(arm, estado, 1000);
    const quebrado: Save = { ...(await criarSave(estado, 2000)), dados: new Uint8Array([1, 2, 3]) };
    await arm.gravar("B", quebrado);
    const aberto = await carregar(arm);
    expect(aberto?.carreira.tecnico).toBe("Fulano");
  });

  it("recusa save de versão mais nova", async () => {
    const save = { ...(await criarSave(estado)), versao: 99 };
    await expect(abrirSave(save)).rejects.toThrow("versão mais nova");
  });
});
