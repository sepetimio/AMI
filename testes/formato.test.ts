import { describe, expect, it } from "vitest";
import {
  contagem,
  formatarTelefone,
  identificacaoMedica,
} from "@/lib/formato";

describe("formatarTelefone", () => {
  it("formata celular de 11 dígitos", () => {
    expect(formatarTelefone("99988887777")).toBe("(99) 98888-7777");
  });

  it("formata fixo de 10 dígitos", () => {
    expect(formatarTelefone("9933334444")).toBe("(99) 3333-4444");
  });

  it("ignora o que não for dígito na entrada", () => {
    expect(formatarTelefone("+55 (99) 98888-7777")).toBe("(99) 98888-7777");
  });

  it("devolve a entrada quando o tamanho não é reconhecido", () => {
    expect(formatarTelefone("123")).toBe("123");
  });
});

describe("identificacaoMedica", () => {
  it("acompanha o CRM da palavra MÉDICO, como exige a CFM 2.336/2023", () => {
    expect(identificacaoMedica("12345", "MA")).toBe("MÉDICO · CRM/MA 12345");
  });

  it("normaliza a UF para maiúscula", () => {
    expect(identificacaoMedica("999", "ma")).toBe("MÉDICO · CRM/MA 999");
  });
});

describe("contagem", () => {
  it("usa o singular quando há exatamente um", () => {
    expect(contagem(1, "médico", "médicos")).toBe("1 médico");
  });

  it("usa o plural nos demais casos, inclusive zero", () => {
    expect(contagem(0, "médico", "médicos")).toBe("0 médicos");
    expect(contagem(24, "médico", "médicos")).toBe("24 médicos");
  });
});
