import { describe, expect, it } from "vitest";
import { etiquetasDoDocumento } from "@/lib/sanity/etiquetasDoDocumento";

describe("etiquetasDoDocumento", () => {
  it("uma notícia invalida a própria matéria e o índice", () => {
    expect(
      etiquetasDoDocumento({
        _type: "noticia",
        slug: { current: "congresso-2026" },
      }).sort(),
    ).toEqual(["noticia:congresso-2026", "noticias"]);
  });

  it("uma página institucional invalida só ela mesma", () => {
    /* Página institucional não entra em listagem nenhuma, então invalidar o
       índice de notícias por causa dela seria descartar cache útil de graça. */
    expect(
      etiquetasDoDocumento({
        _type: "paginaInstitucional",
        slug: { current: "estatuto" },
      }),
    ).toEqual(["pagina:estatuto"]);
  });

  it("um autor invalida o índice inteiro de notícias", () => {
    /* O autor aparece resolvido dentro de cada notícia. Corrigir o CRM dele
       precisa alcançar todas as matérias que assinou, e o webhook não sabe
       quais são. Invalidar o coletivo é o custo de não manter um índice
       reverso para uma correção que acontece uma vez por ano. */
    expect(etiquetasDoDocumento({ _type: "autor" })).toEqual(["noticias"]);
  });

  it("documento sem slug não produz etiqueta específica", () => {
    expect(etiquetasDoDocumento({ _type: "noticia" })).toEqual(["noticias"]);
  });

  it("tipo desconhecido não invalida nada", () => {
    /* Um tipo novo criado no Studio não deve derrubar o cache do site inteiro
       por engano. Devolver lista vazia é o comportamento seguro. */
    expect(etiquetasDoDocumento({ _type: "algoNovo" })).toEqual([]);
    expect(etiquetasDoDocumento({})).toEqual([]);
  });
});
