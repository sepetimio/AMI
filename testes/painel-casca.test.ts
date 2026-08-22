import { describe, expect, it } from "vitest";
import { metadata } from "@/app/painel/layout";
import { fonte, semComentarios } from "@/testes/apoio";

describe("a casca do painel", () => {
  it("declara noindex", () => {
    /*
      `app/robots.ts` já lista /painel/ em disallow e o comentário de lá diz
      que aquela é "a segunda tranca". Esta é a primeira: um rastreador que
      chegue à página por um link ainda lê a meta tag.
    */
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("o layout não confere permissão — isso é de cada página", () => {
    /*
      O guia de autenticação do Next 16 é explícito: layout não roda de novo
      a cada navegação, então proteger nele deixa buraco entre telas.
    */
    expect(semComentarios(fonte("../app/painel/layout.tsx"))).not.toContain("exigirAdmin");
  });

  it("a casca tem o botão de sair", () => {
    /*
      O computador da sede da AMI é compartilhado. Sem este botão, a única
      forma de encerrar a sessão é esperar ela expirar.
    */
    const codigo = semComentarios(fonte("../app/painel/layout.tsx"));
    expect(codigo).toContain("action={sair}");
    expect(codigo).toContain("Sair");
  });
});

describe("lib/painel/sessao.ts", () => {
  it("usa getUser, nunca getSession", () => {
    /* getSession lê o cookie e acredita nele; getUser confere com o servidor
       de autenticação. Para decidir permissão, só o segundo serve. */
    const codigo = semComentarios(fonte("../lib/painel/sessao.ts"));
    expect(codigo).toContain("getUser()");
    expect(codigo).not.toContain("getSession()");
  });

  it("encerra a sessão da conta sem papel antes de desviar", () => {
    /* Sem isto, a conta volta logada para a tela de entrar e o laço reabre. */
    const codigo = semComentarios(fonte("../lib/painel/sessao.ts"));
    expect(codigo).toContain("signOut()");
  });
});
