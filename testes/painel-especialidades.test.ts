import { describe, expect, it } from "vitest";
import { avisoDeRqeFaltando, validarRqe } from "@/lib/painel/especialidades";

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
