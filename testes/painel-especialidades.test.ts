import { describe, expect, it } from "vitest";
import { avisoDeRqeFaltando, validarRqe } from "@/lib/painel/especialidades";
import { fonte, semComentarios } from "@/testes/apoio";

describe("validarRqe", () => {
  it("aceita vazio, porque clínico geral sem RQE é caso normal", () => {
    const r = validarRqe("");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("espaço em branco também vira nulo", () => {
    const r = validarRqe("   ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("guarda só os dígitos", () => {
    const r = validarRqe("RQE 12345");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBe("12345");
  });

  it("recusa texto sem nenhum dígito", () => {
    const r = validarRqe("não tenho");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("número");
  });
});

describe("avisoDeRqeFaltando", () => {
  it("sem nome nenhum, não avisa", () => {
    expect(avisoDeRqeFaltando([])).toBeNull();
  });

  it("com um nome, avisa citando ele", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia"]);
    expect(aviso).toContain("Cardiologia");
  });

  it("com dois nomes, cita os dois", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia", "Pediatria"]);
    expect(aviso).toContain("Cardiologia");
    expect(aviso).toContain("Pediatria");
  });
});

describe("acoes-especialidade.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-especialidade.ts"));

  it("toda gravação pede as linhas afetadas de volta", () => {
    const escritas = [...codigo.matchAll(/\.(insert|update|delete)\s*\(/g)];
    expect(escritas.length).toBeGreaterThan(0);
    /* Uma chamada de `.select(` por escrita, no mínimo. */
    const selects = [...codigo.matchAll(/\.select\s*\(/g)];
    expect(selects.length).toBeGreaterThanOrEqual(escritas.length);
  });

  it("confere se veio linha antes de invalidar", () => {
    expect(codigo).toContain("if (!data)");
    expect(codigo.indexOf("if (!data)")).toBeLessThan(codigo.indexOf("revalidatePath("));
  });

  it("chama exigirAdmin antes de qualquer escrita", () => {
    const guarda = codigo.indexOf("exigirAdmin(");
    const escrita = codigo.search(/\.(insert|update|delete)\s*\(/);
    expect(guarda).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(guarda);
  });

  it("só remove de profissional_especialidade", () => {
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|$)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) {
        expect(tabela).toBe("profissional_especialidade");
      }
    }
  });
});
