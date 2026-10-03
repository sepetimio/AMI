import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/*
  A Fotografia, sem a prop `demonstracao`, obedece a chave de verdade.

  testes/molduras.test.ts passa `demonstracao` explicitamente, e por isso não
  vê o padrão da prop. Mas a página não passa nada: em produção, quem decide
  é o padrão `demonstracao = DADOS_DEMONSTRACAO`. Um padrão trocado por `true`
  deixaria a foto provisória escapar da trava com todos os outros testes
  verdes. Este arquivo existe para isso, e mora à parte porque precisa trocar
  a chave do módulo inteiro — o que, no mesmo arquivo, valeria para todos os
  outros testes também.
*/
vi.mock("@/lib/demonstracao", () => ({
  DADOS_DEMONSTRACAO: false,
  saoDadosDeDemonstracao: (v: string | undefined) => v !== "false",
}));

const { Fotografia } = await import("@/components/base/Fotografia");

describe("Fotografia com a chave falsa e sem a prop demonstracao", () => {
  it("não desenha a foto provisória", () => {
    expect(renderToString(createElement(Fotografia, { espaco: "sede" }))).toBe("");
  });
});
