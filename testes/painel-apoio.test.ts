import { describe, expect, it } from "vitest";
import { semComentarios } from "@/testes/apoio";

describe("semComentarios", () => {
  it("tira bloco e linha", () => {
    expect(semComentarios("/* getSession() */ const a = 1;")).not.toContain("getSession");
    expect(semComentarios("const a = 1; // getSession()")).not.toContain("getSession");
  });

  it("NÃO tira código de verdade — é o que faz a varredura continuar valendo", () => {
    const codigo = `/* explica getSession() */\ncliente.auth.getSession();`;
    expect(semComentarios(codigo)).toContain("cliente.auth.getSession()");
  });

  it("aguenta bloco de várias linhas", () => {
    const codigo = "/*\n  linha um\n  getSession()\n*/\nconst a = 1;";
    const limpo = semComentarios(codigo);
    expect(limpo).not.toContain("getSession");
    expect(limpo).toContain("const a = 1;");
  });
});
