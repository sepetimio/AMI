import { describe, expect, it } from "vitest";
import { ehLinkInterno } from "@/lib/sanity/link";

describe("ehLinkInterno", () => {
  it("trata caminho do próprio site como navegação interna", () => {
    /* O ramo que existe para isto ficou inalcançável enquanto a anotação de
       link do Studio recusava endereço relativo: nenhum valor que passasse
       pela validação chegava aqui. É o caso que a secretaria mais usa, uma
       página institucional linkando outra. */
    expect(ehLinkInterno("/associacao/diretoria")).toBe(true);
    expect(ehLinkInterno("/medicos/cardiologia?ordem=nome")).toBe(true);
  });

  it("manda e-mail e telefone para a âncora comum", () => {
    /* Interceptar `mailto:` ou `tel:` com o roteador do Next impede o
       celular de abrir o cliente de e-mail e o discador. */
    expect(ehLinkInterno("mailto:contato@ami.org.br")).toBe(false);
    expect(ehLinkInterno("tel:+5599999999999")).toBe(false);
  });

  it("manda endereço de outro site para a âncora comum", () => {
    expect(ehLinkInterno("https://portal.cfm.org.br")).toBe(false);
    expect(ehLinkInterno("http://portal.cfm.org.br")).toBe(false);
  });

  it("não confunde endereço protocol-relative com caminho interno", () => {
    /* "//" começa com barra e é outro site. Sem esta distinção, o `<Link>`
       do Next tentaria rotear para uma página que não existe neste site. */
    expect(ehLinkInterno("//ami.org.br/estatuto")).toBe(false);
  });

  it("manda âncora e relativo sem barra para a âncora comum", () => {
    expect(ehLinkInterno("#fontes")).toBe(false);
    expect(ehLinkInterno("diretoria")).toBe(false);
  });
});
