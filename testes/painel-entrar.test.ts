import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

describe("entrar", () => {
  const acoes = semComentarios(fonte("../app/painel/entrar/acoes.ts"));

  it("é ação de servidor", () => {
    expect(acoes.trimStart().startsWith('"use server"')).toBe(true);
  });

  it("a mensagem de erro não diz qual dos dois campos errou", () => {
    /*
      Dizer "este e-mail não existe" entrega a lista de quem tem conta. A
      mensagem é uma só para os dois casos.
    */
    expect(acoes).toContain("E-mail ou senha não conferem");
    expect(acoes).not.toMatch(/e-?mail\s+n[ãa]o\s+(existe|cadastrado)/i);
    expect(acoes).not.toMatch(/senha\s+(incorreta|errada|inv[áa]lida)/i);
  });

  it("não devolve ao navegador o erro que veio do Supabase", () => {
    /* A mensagem do provedor distingue os casos, e devolvê-la desfaz a
       decisão acima. */
    expect(acoes).not.toMatch(/error\.message|erro\.message/);
  });
});

describe("o formulário de entrar", () => {
  const form = fonte("../components/painel/FormularioEntrar.tsx");

  it("usa useActionState, que é a forma do Next 16", () => {
    expect(form).toContain("useActionState");
  });

  it("desabilita o botão enquanto envia", () => {
    expect(form).toMatch(/disabled=\{pendente\}/);
  });

  it("anuncia o erro a leitor de tela", () => {
    expect(form).toContain('aria-live="polite"');
  });
});
