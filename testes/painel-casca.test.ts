import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { metadata } from "@/app/painel/layout";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

/*
  Comentário não é código.

  Estas asserções proíbem que o arquivo CHAME certas funções, e o comentário
  que explica a proibição precisa nomeá-las para ser legível. Varrer o texto
  cru transformaria a explicação da regra na violação da regra — o que já
  aconteceu três vezes neste plano.

  Ingênuo de propósito: não entende `//` dentro de string. Nenhum arquivo do
  painel usa isso, e errar aqui deixa passar, não reprova por engano.
*/
function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

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
});

describe("lib/painel/sessao.ts", () => {
  it("usa getUser, nunca getSession", () => {
    /* getSession lê o cookie e acredita nele; getUser confere com o servidor
       de autenticação. Para decidir permissão, só o segundo serve. */
    const codigo = semComentarios(fonte("../lib/painel/sessao.ts"));
    expect(codigo).toContain("getUser()");
    expect(codigo).not.toContain("getSession()");
  });
});
