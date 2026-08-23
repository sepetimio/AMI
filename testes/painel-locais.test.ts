import { describe, expect, it } from "vitest";
import { validarLocal } from "@/lib/painel/locais";
import { fonte, semComentarios } from "@/testes/apoio";

const BAIRROS = [1, 2, 3];

function campos(over: Partial<Parameters<typeof validarLocal>[0]> = {}) {
  return {
    logradouro: "Rua Simplício Moreira",
    numero: "1200",
    complemento: "",
    bairroId: "1",
    cep: "65900-000",
    telefone: "99 3524-3716",
    whatsapp: "",
    estacionamento: false,
    ...over,
  };
}

describe("validarLocal", () => {
  it("aceita o mínimo: logradouro e bairro", () => {
    const r = validarLocal(
      campos({ numero: "", cep: "", telefone: "", whatsapp: "" }),
      BAIRROS,
    );
    expect(r.ok).toBe(true);
  });

  it("recusa logradouro vazio", () => {
    const r = validarLocal(campos({ logradouro: "   " }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.logradouro).toBeTruthy();
  });

  it("recusa bairro que não está na lista", () => {
    const r = validarLocal(campos({ bairroId: "99" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.bairroId).toBeTruthy();
  });

  it("devolve todos os erros de uma vez", () => {
    const r = validarLocal(campos({ logradouro: "", bairroId: "99" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).length).toBe(2);
  });

  it("guarda só os dígitos do telefone", () => {
    const r = validarLocal(campos({ telefone: "(99) 3524-3716" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.telefone).toBe("9935243716");
  });

  it("campo opcional vazio vira nulo, não string vazia", () => {
    const r = validarLocal(campos({ numero: "", cep: "", whatsapp: "" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valor.numero).toBeNull();
      expect(r.valor.cep).toBeNull();
      expect(r.valor.whatsapp).toBeNull();
    }
  });

  it("recusa telefone que não tem dígito nenhum", () => {
    const r = validarLocal(campos({ telefone: "ligar de manhã" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.telefone).toBeTruthy();
  });

  it("espaço a mais no logradouro é limpo, não recusado", () => {
    const r = validarLocal(campos({ logradouro: "  Rua   Simplício   Moreira " }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.logradouro).toBe("Rua Simplício Moreira");
  });
});

describe("acoes-local.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-local.ts"));

  it("nunca remove da tabela local", () => {
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|$)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) expect(tabela).toBe("atendimento");
    }
  });

  it("toda gravação pede as linhas afetadas de volta", () => {
    const escritas = [...codigo.matchAll(/\.(insert|update|delete)\s*\(/g)];
    const selects = [...codigo.matchAll(/\.select\s*\(/g)];
    expect(escritas.length).toBeGreaterThan(0);
    expect(selects.length).toBeGreaterThanOrEqual(escritas.length);
  });

  it("cada ação confere se veio linha antes de invalidar", () => {
    /*
      Ancora na CHAMADA `invalidar()`, não em `revalidatePath(`. Medir a posição
      de `revalidatePath(` mede a DEFINIÇÃO do helper, não o momento em que ele
      roda. E confere por ação: no arquivo inteiro, o `if (!data)` de uma ação
      cobriria o `invalidar()` de outra.

      `criarLocal` e `salvarLocal` conferem sob nomes diferentes — `if
      (!criado.data)`, `if (!ligado.data)`, `if (!data)` — por isso a busca casa
      qualquer uma dessas três formas, em vez de fixar um nome de variável.
    */
    const acoes = codigo.split("export async function").slice(1);
    expect(acoes.length).toBeGreaterThan(0);

    for (const acao of acoes) {
      if (!acao.includes("invalidar()")) continue;
      const confere = acao.search(/if \(!(\w+\.)?data\)/);
      expect(confere, "ação que invalida sem conferir se veio linha").toBeGreaterThan(-1);
      expect(confere).toBeLessThan(acao.indexOf("invalidar()"));
    }
  });

  it("chama exigirAdmin antes de qualquer escrita", () => {
    const guarda = codigo.indexOf("exigirAdmin(");
    const escrita = codigo.search(/\.(insert|update|delete)\s*\(/);
    expect(guarda).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(guarda);
  });
});
