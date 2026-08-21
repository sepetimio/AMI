import { describe, expect, it } from "vitest";
import { saoDadosDeDemonstracao } from "@/lib/demonstracao";

describe("saoDadosDeDemonstracao", () => {
  it("só libera com a palavra exata 'false'", () => {
    expect(saoDadosDeDemonstracao("false")).toBe(false);
  });

  it("mantém a trava quando a variável não está configurada", () => {
    /* Quem clona o repositório e roda sem `.env.local` fica com o site
       fechado para o Google e com o aviso no rodapé. É o erro barato: o
       contrário publicaria 24 perfis fabricados como médicos de verdade. */
    expect(saoDadosDeDemonstracao(undefined)).toBe(true);
    expect(saoDadosDeDemonstracao("")).toBe(true);
  });

  it("mantém a trava diante de um valor que só parece 'false'", () => {
    /* "False", "FALSE" e "0" são o que alguém digita de memória ao querer
       desligar a trava. Nenhum deles vale: liberar o rastreador é decisão
       que precisa ser escrita exatamente. */
    for (const valor of ["False", "FALSE", " false", "0", "no"]) {
      expect(saoDadosDeDemonstracao(valor)).toBe(true);
    }
  });
});
