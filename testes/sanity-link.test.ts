import { describe, expect, it } from "vitest";
import { ehLinkInterno, hrefSeguro } from "@/lib/sanity/link";

describe("hrefSeguro", () => {
  it("aceita http, https, mailto, tel, o caminho do site e a âncora", () => {
    for (const href of [
      "https://portal.cfm.org.br",
      "http://portal.cfm.org.br",
      "HTTPS://portal.cfm.org.br",
      "mailto:contato@ami.org.br",
      "tel:+5599999999999",
      "/associacao/diretoria",
      "#fontes",
    ]) {
      expect(hrefSeguro(href), href).toBe(href);
    }
  });

  it("tira os espaços das pontas, como o navegador", () => {
    expect(hrefSeguro("  /associacao  ")).toBe("/associacao");
    expect(hrefSeguro("\n https://portal.cfm.org.br\t")).toBe("https://portal.cfm.org.br");
  });

  it("barra javascript:, data: e vbscript:, em qualquer caixa e com espaço", () => {
    for (const href of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "  javascript:alert(1)",
      "\tjavascript:alert(1)",
      "\njavascript:alert(1)",
      "java\tscript:alert(1)",
      "java\nscript:alert(1)",
      "java script:alert(1)",
      "javascript :alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "DATA:text/html;base64,PHNjcmlwdD4=",
      " Data:text/html,x",
      "vbscript:msgbox(1)",
      "VBScript:msgbox(1)",
      "  VBSCRIPT:msgbox(1)",
    ]) {
      expect(hrefSeguro(href), JSON.stringify(href)).toBeNull();
    }
  });

  it("o resto também sai sem link: outro esquema, relativo sem barra, vazio ou sem endereço", () => {
    for (const href of ["ftp://x.org", "file:///c:/x", "diretoria", "", "   ", undefined, null, 42]) {
      expect(hrefSeguro(href), JSON.stringify(href)).toBeNull();
    }
  });
});

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
