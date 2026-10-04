import { describe, expect, it } from "vitest";
import { AMI } from "@/lib/ami";
import { canaisDeContato, perfilDoInstagram } from "@/lib/paginaDeContato";

/*
  Os canais da página de contato, em função pura: os três cartões, na
  ordem do desenho, com os dados de lib/ami.ts. O desenho deles é testado
  por renderização em testes/contato-na-tela.test.ts.
*/

describe("os canais de contato", () => {
  it("telefone da sede, celular e Instagram, nessa ordem, com o texto do desenho", () => {
    expect(canaisDeContato()).toEqual([
      {
        chave: "fixo",
        icone: "telefone",
        rotulo: "Telefone da sede",
        dado: "(99) 3524-3716",
        longo: false,
        nota: "Linha fixa, na sede da AMI.",
        acao: {
          tipo: "ligar",
          href: "tel:+559935243716",
          texto: "Ligar",
          rotulo: "Ligar para a sede da AMI, (99) 3524-3716",
        },
      },
      {
        chave: "celular",
        icone: "celular",
        rotulo: "Celular",
        dado: "(99) 98802-0205",
        longo: false,
        nota: "Linha de celular da AMI.",
        acao: {
          tipo: "ligar",
          href: "tel:+5599988020205",
          texto: "Ligar",
          rotulo: "Ligar para o celular da AMI, (99) 98802-0205",
        },
      },
      {
        chave: "instagram",
        icone: "instagram",
        rotulo: "Instagram",
        dado: "@associacaomedicadeimperatriz",
        longo: true,
        nota: "O perfil da associação.",
        acao: {
          tipo: "abrir",
          href: "https://www.instagram.com/associacaomedicadeimperatriz/",
          texto: "Abrir o Instagram",
          rotulo: "Abrir o Instagram da AMI",
        },
      },
    ]);
  });

  it("sem e-mail e sem WhatsApp, enquanto lib/ami.ts não tiver nenhum dos dois", () => {
    expect(JSON.stringify(canaisDeContato())).not.toMatch(/whatsapp|wa\.me|mailto|e-mail/i);
  });

  it("os dados são os de lib/ami.ts, e não uma cópia", () => {
    const [fixo, celular] = AMI.telefones;
    expect(canaisDeContato().map((c) => c.dado)).toEqual([
      fixo,
      celular,
      perfilDoInstagram(AMI.redes.instagram),
    ]);
  });
});

describe("o perfil do Instagram", () => {
  it("o nome do perfil, tirado do endereço, com a arroba", () => {
    expect(perfilDoInstagram("https://www.instagram.com/associacaomedicadeimperatriz/")).toBe(
      "@associacaomedicadeimperatriz",
    );
    expect(perfilDoInstagram("https://instagram.com/ami")).toBe("@ami");
  });
});
