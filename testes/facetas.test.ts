import { describe, expect, it } from "vitest";
import { paragrafoDeAbertura } from "@/lib/dados/facetas";

describe("paragrafoDeAbertura", () => {
  it("o texto da spec, com o número e o nome do profissional", () => {
    expect(paragrafoDeAbertura("Cardiologia", 3)).toBe(
      "A Associação Médica de Imperatriz reúne 3 cardiologistas em Imperatriz, no Maranhão. " +
        "Cada perfil traz o número de registro no Conselho Regional de Medicina.",
    );
  });

  it("concorda o singular", () => {
    expect(paragrafoDeAbertura("Cardiologia", 1)).toContain("reúne 1 cardiologista em Imperatriz");
  });

  it("o nome do profissional vem da tabela de sinônimos; fora dela, o rótulo neutro", () => {
    expect(paragrafoDeAbertura("Clínica Médica", 4)).toContain("reúne 4 clínicos gerais em");
    expect(paragrafoDeAbertura("Ortopedia e Traumatologia", 2)).toContain("reúne 2 ortopedistas em");
    expect(paragrafoDeAbertura("Angiologia", 2)).toContain("reúne 2 médicos de Angiologia em");
  });

  it("não fala de bairro, telemedicina, acessibilidade nem associado", () => {
    /* Os quatro saíram do site em 03/10/2026. */
    const p = paragrafoDeAbertura("Cardiologia", 3).toLowerCase();
    for (const fora of ["bairro", "telemedicina", "cadeirante", "acessibilidade", "associad"]) {
      expect(p, fora).not.toContain(fora);
    }
  });
});
