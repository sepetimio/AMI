import { describe, expect, it } from "vitest";
import { exigir } from "@/sanity/exigir";

describe("exigir", () => {
  it("devolve o valor quando ele existe", () => {
    expect(exigir("abc123", "NEXT_PUBLIC_SANITY_PROJECT_ID")).toBe("abc123");
  });

  it("explica o que fazer quando a variável falta", () => {
    /* A mensagem é a única coisa que a pessoa vê quando o site não sobe.
       Se ela disser só "undefined", a pessoa abre o código; se disser o nome
       da variável e onde consegui-lo, ela resolve sozinha. */
    expect(() => exigir(undefined, "NEXT_PUBLIC_SANITY_PROJECT_ID")).toThrow(
      /NEXT_PUBLIC_SANITY_PROJECT_ID/,
    );
    expect(() => exigir(undefined, "NEXT_PUBLIC_SANITY_PROJECT_ID")).toThrow(
      /sanity\.io\/manage/,
    );
  });

  it("trata string vazia como ausente", () => {
    /* Uma linha `NEXT_PUBLIC_SANITY_PROJECT_ID=` no .env produz string vazia,
       não undefined. Sem esta checagem o cliente seria construído com id
       vazio e falharia bem mais adiante, com erro de rede ilegível. */
    expect(() => exigir("", "NEXT_PUBLIC_SANITY_PROJECT_ID")).toThrow();
  });
});
