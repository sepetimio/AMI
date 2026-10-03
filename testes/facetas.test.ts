import { describe, expect, it } from "vitest";
import { paragrafoDeAbertura, resumirFaceta, type ResumoFaceta } from "@/lib/dados/facetas";
import type { Medico } from "@/lib/dados/tipos";

const base: ResumoFaceta = {
  especialidade: "Cardiologia",
  total: 7,
  totalLocais: 9,
  comMaisDeUmEndereco: 2,
};

describe("paragrafoDeAbertura", () => {
  it("traz os números reais, não redondos", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("7 cardiologistas");
    expect(p).toContain("9 endereços");
  });

  it("muda de conteúdo quando os dados mudam — não é molde com palavra trocada", () => {
    const outro = paragrafoDeAbertura({ ...base, especialidade: "Pediatria", total: 3, comMaisDeUmEndereco: 0 });
    expect(outro).not.toBe(paragrafoDeAbertura(base));
    expect(outro).toContain("Cada um atende em um endereço só");
  });

  it("não fala de bairro, telemedicina, acessibilidade nem associado", () => {
    /* Os quatro saíram do site em 03/10/2026 (spec de Encontre um médico,
       itens 1.2, 1.7 e 1.8). */
    for (const resumo of [base, { ...base, total: 1, totalLocais: 1, comMaisDeUmEndereco: 0 }]) {
      const p = paragrafoDeAbertura(resumo).toLowerCase();
      for (const fora of ["bairro", "telemedicina", "cadeirante", "acessibilidade", "associad"]) {
        expect(p, fora).not.toContain(fora);
      }
    }
  });

  it("concorda o singular, reescrevendo a frase", () => {
    const p = paragrafoDeAbertura({ ...base, total: 1, totalLocais: 1, comMaisDeUmEndereco: 0 });
    expect(p).toContain("1 cardiologista ");
    expect(p).not.toContain("1 cardiologistas");
    expect(p).toContain("um único endereço de atendimento");
    expect(p).toContain("O atendimento acontece em um endereço só");
  });

  it("no singular, nenhuma frase usa partitivo plural", () => {
    const p = paragrafoDeAbertura({ ...base, total: 1, totalLocais: 2, comMaisDeUmEndereco: 1 });
    for (const partitivo of ["Desses,", "deles", "Entre eles", "Cada um"]) {
      expect(p).not.toContain(partitivo);
    }
    expect(p).toContain("O atendimento acontece em mais de um endereço");
  });

  it("no plural, mantém os partitivos e concorda", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("Entre eles, 2 atendem em mais de um endereço");
    expect(paragrafoDeAbertura({ ...base, comMaisDeUmEndereco: 1 })).toContain("1 atende em mais");
  });

  it("termina com o CRM, como exige a Resolução CFM 2.336/2023", () => {
    expect(paragrafoDeAbertura(base)).toMatch(/Conselho Regional de Medicina, como exige a Resolução CFM 2\.336\/2023\.$/);
  });

  /* Começar frase com algarismo é uma das marcas mais visíveis de texto
     gerado, e em português corrido não se faz. */
  it("nenhuma frase começa com algarismo", () => {
    for (const resumo of [base, { ...base, total: 1, totalLocais: 1, comMaisDeUmEndereco: 0 }]) {
      for (const f of paragrafoDeAbertura(resumo).split(/(?<=\.)\s+/)) {
        expect(f.trimStart()).not.toMatch(/^\d/);
      }
    }
  });
});

describe("resumirFaceta", () => {
  const local = (id: number) => ({
    id,
    logradouro: "Rua A",
    numero: "1",
    bairro: { id: 1, nome: "Centro", slug: "centro" },
    telefone: null,
    whatsapp: null,
    estacionamento: false,
    acessibilidade: [],
  });
  const medico = (id: number, locais: number[]): Medico => ({
    id,
    slug: `m${id}`,
    nome: `M ${id}`,
    crm: "1",
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [],
    locais: locais.map(local),
  });

  it("conta profissionais, endereços distintos e quem tem mais de um", () => {
    /* O consultório 2 é compartilhado: conta uma vez. */
    const r = resumirFaceta([medico(1, [1, 2]), medico(2, [2]), medico(3, [3])], "Cardiologia");
    expect(r).toEqual({ especialidade: "Cardiologia", total: 3, totalLocais: 3, comMaisDeUmEndereco: 1 });
  });
});
