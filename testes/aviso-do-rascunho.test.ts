import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { conteudoDoRascunho, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import {
  COOKIES,
  PRIVACIDADE,
  SEJA_ASSOCIADO,
  TERMOS,
  type RascunhoLegal,
} from "@/lib/rascunhosLegais";

/*
  O aviso no alto da página de texto vem do rascunho e é trocável por
  rascunho. As três páginas legais mantêm, palavra por palavra, o aviso de
  "não revisado por advogado"; Seja associado, que não é peça jurídica e não
  vai a advogado nenhum, não pode dizer ao público que espera um.

  Renderiza com `renderToString` e lê o texto do HTML, sem clicar nem medir
  pixel (ver vitest.config.ts): a pergunta é o que a pessoa lê na tela, e
  isso inclui o componente usar mesmo o aviso do rascunho.
*/

function textoNaTela(rascunho: RascunhoLegal) {
  const html = renderToString(
    createElement(PaginaDeTexto, {
      conteudo: conteudoDoRascunho(rascunho, true),
      volta: VOLTA_INICIO,
      icone: "documento",
    }),
  );
  return html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

describe("aviso do rascunho na tela", () => {
  it.each([PRIVACIDADE, TERMOS, COOKIES])(
    "$slug mantém o aviso de texto legal de antes",
    (rascunho) => {
      const texto = textoNaTela(rascunho);
      expect(texto).toContain(
        "Este texto é um rascunho e ainda não foi revisado por advogado",
      );
      expect(texto).toContain(
        "Ele foi redigido a partir do funcionamento real deste site, para " +
          "servir de ponto de partida à revisão jurídica, e está publicado " +
          "para que a página não fique vazia. Não use como peça definitiva.",
      );
    },
  );

  it("Seja associado diz que é provisória e não fala de advogado", () => {
    const texto = textoNaTela(SEJA_ASSOCIADO);
    expect(texto).toContain("Esta página é provisória");
    expect(texto).toContain("A AMI ainda vai escrever o texto desta página.");
    expect(texto).not.toMatch(/advogad|jurídic/i);
  });

  it("Seja associado não afirma o que a AMI ainda vai decidir", () => {
    /* A AMI existe desde 1975; dizer que anuidade e critérios "ainda serão
       definidos" seria afirmar um fato sobre ela que ninguém conferiu. */
    expect(textoNaTela(SEJA_ASSOCIADO)).not.toMatch(/serão definidos/);
  });
});
