import { describe, expect, it } from "vitest";
import {
  chave,
  distanciaDeEdicao,
  maisParecido,
  paraSlug,
  semAcento,
} from "@/lib/importador/texto";

describe("semAcento", () => {
  it("tira acento sem mexer no resto", () => {
    expect(semAcento("Juçara")).toBe("Jucara");
    expect(semAcento("São João")).toBe("Sao Joao");
  });
});

describe("chave", () => {
  it("é a mesma para escritas diferentes do mesmo bairro", () => {
    expect(chave("Nova Imperatriz")).toBe(chave("nova imperatriz"));
    expect(chave("  JUÇARA  ")).toBe(chave("Juçara"));
  });

  it("colapsa espaço do meio, que a biblioteca de planilha não apara", () => {
    expect(chave("Rua  Coriolano   Milhomem")).toBe("rua coriolano milhomem");
  });
});

describe("paraSlug", () => {
  it("gera o mesmo formato que o banco já usa", () => {
    expect(paraSlug("Juçara")).toBe("jucara");
    expect(paraSlug("Maranhão Novo")).toBe("maranhao-novo");
    expect(paraSlug("Parque do Buriti")).toBe("parque-do-buriti");
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(paraSlug("  Centro!  ")).toBe("centro");
    expect(paraSlug("Vila Lobão -")).toBe("vila-lobao");
  });
});

describe("distanciaDeEdicao", () => {
  it("conta as trocas mínimas", () => {
    expect(distanciaDeEdicao("imperatriz", "imperatris")).toBe(1);
    expect(distanciaDeEdicao("centro", "centro")).toBe(0);
    expect(distanciaDeEdicao("bacuri", "bacurizinho")).toBe(5);
  });
});

describe("maisParecido", () => {
  it("acha o erro de digitação", () => {
    expect(maisParecido("Nova Imperatris", ["Centro", "Nova Imperatriz"])).toBe(
      "Nova Imperatriz",
    );
  });

  it("não inventa parentesco entre bairros diferentes de verdade", () => {
    expect(maisParecido("Bacurizinho", ["Centro", "Bacuri"])).toBe(null);
  });

  it("não compara nome curto, onde uma letra já é outro bairro", () => {
    expect(maisParecido("Sol", ["Sul"])).toBe(null);
  });

  it("ignora acento e caixa ao comparar", () => {
    expect(maisParecido("jucara", ["Juçara"])).toBe("Juçara");
  });
});
