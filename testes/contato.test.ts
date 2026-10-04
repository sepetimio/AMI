import { describe, expect, it } from "vitest";
import { hrefTelefone, linkDoMapaDaAmi } from "@/lib/ami";
import { buscaNoMapa, linkDoWhatsapp, numeroNacional } from "@/lib/contato";
import { formatarTelefone } from "@/lib/formato";

/*
  Uma regra só para o número brasileiro (`numeroNacional`, lib/contato.ts),
  e os três que a usam dizendo a mesma coisa: o `tel:`, o WhatsApp e o
  número na tela. O 55 do país sai só quando sobram 10 ou 11 dígitos; o DDD
  55, do Rio Grande do Sul, fica. O 0 da longa distância, pela mesma regra.
*/
const CASOS: [entrada: string, nacional: string, naTela: string][] = [
  ["99 3018-9994", "9930189994", "(99) 3018-9994"],
  ["99 98118-9994", "99981189994", "(99) 98118-9994"],
  ["55 99 3018-9994", "9930189994", "(99) 3018-9994"],
  ["5599981189994", "99981189994", "(99) 98118-9994"],
  ["55 3018-9994", "5530189994", "(55) 3018-9994"],
  ["55 98118-9994", "55981189994", "(55) 98118-9994"],
  ["+55 55 98118-9994", "55981189994", "(55) 98118-9994"],
  ["(099) 3018-9994", "9930189994", "(99) 3018-9994"],
  ["(099) 98118-9994", "99981189994", "(99) 98118-9994"],
];

describe("o número brasileiro, uma regra só", () => {
  for (const [entrada, nacional, naTela] of CASOS) {
    it(`"${entrada}"`, () => {
      expect(numeroNacional(entrada)).toBe(nacional);
      expect(hrefTelefone(entrada)).toBe(`tel:+55${nacional}`);
      expect(linkDoWhatsapp(entrada)).toBe(`https://wa.me/55${nacional}`);
      expect(formatarTelefone(entrada)).toBe(naTela);
    });
  }

  it("o 55 do começo fica quando não sobram 10 ou 11 dígitos", () => {
    expect(numeroNacional("553018999")).toBe("553018999");
    expect(numeroNacional("55993018999412")).toBe("55993018999412");
  });

  it("o 0 da longa distância fica quando não sobram 10 ou 11 dígitos", () => {
    expect(numeroNacional("030189994")).toBe("030189994");
    expect(numeroNacional("0993018999412")).toBe("0993018999412");
  });
});

describe("Como chegar", () => {
  it("a busca do Google Maps pelo endereço escrito", () => {
    expect(buscaNoMapa("Rua A, 1, Centro")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%201%2C%20Centro",
    );
  });

  it("a sede da AMI: o endereço em uma linha, com o CEP, o mesmo link do desenho", () => {
    expect(linkDoMapaDaAmi()).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        "Rua%20Coriolano%20Milhomem%2C%2039%2C%20Centro%2C%20Imperatriz%20-%20MA%2C%2065900-330",
    );
  });
});
