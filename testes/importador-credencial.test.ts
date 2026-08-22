import { describe, expect, it } from "vitest";
import { NOME_DA_VARIAVEL, chaveDoAmbiente } from "@/scripts/credencial";

describe("NOME_DA_VARIAVEL", () => {
  it("não leva o prefixo que joga o valor no navegador", () => {
    expect(NOME_DA_VARIAVEL.startsWith("NEXT_PUBLIC_")).toBe(false);
  });
});

describe("chaveDoAmbiente", () => {
  it("lê a variável quando ela existe", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "sb_secret_abc" })).toBe("sb_secret_abc");
  });

  it("devolve nulo quando não existe, para o comando perguntar", () => {
    expect(chaveDoAmbiente({})).toBeNull();
  });

  it("trata string vazia e só-espaço como ausente", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "" })).toBeNull();
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "   " })).toBeNull();
  });

  it("apara espaço colado junto na hora de copiar", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: " sb_secret_abc \n" })).toBe("sb_secret_abc");
  });

  it("recusa a chave pública, que não escreve e não daria erro claro depois", () => {
    expect(() => chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "sb_publishable_abc" })).toThrow(
      /pública/i,
    );
  });

  it("recusa a chave antiga em formato JWT, seja anon ou service_role", () => {
    expect(() =>
      chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x.y" }),
    ).toThrow(/JWT/i);
  });

  it("recusa chave que se identifica como anônima sem o prefixo novo", () => {
    expect(() => chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "chave-anon-do-projeto" })).toThrow(
      /pública/i,
    );
  });

  it("aceita a chave secreta dedicada", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "sb_secret_abc" })).toBe("sb_secret_abc");
  });
});
