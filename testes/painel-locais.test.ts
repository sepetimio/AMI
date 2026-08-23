import { describe, expect, it } from "vitest";
import { validarLocal } from "@/lib/painel/locais";

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
