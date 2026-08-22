import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

describe("salvarMedico", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes.ts"));

  it("é ação de servidor e confere permissão antes de gravar", () => {
    expect(codigo.trimStart().startsWith('"use server"')).toBe(true);
    expect(codigo.indexOf(".update(")).toBeGreaterThan(codigo.indexOf("exigirAdmin"));
  });

  it("valida no servidor, e não só no navegador", () => {
    expect(codigo).toContain("validarMedico");
  });

  it("nunca grava o slug", () => {
    /*
      Mesma regra que o importador respeita: o endereço do perfil é uma URL
      que o Google indexou, e mudá-la a apaga. A tela mostra e não edita.
    */
    expect(codigo).not.toMatch(/slug\s*:/);
  });

  it("invalida o site público depois de gravar", () => {
    expect(codigo).toContain('revalidatePath("/(site)", "layout")');
  });
});

describe("o formulário de edição", () => {
  const form = semComentarios(fonte("../components/painel/FormularioMedico.tsx"));

  it("usa useActionState", () => {
    expect(form).toContain("useActionState");
  });

  it("mostra o endereço do perfil sem deixar editar", () => {
    expect(form).toMatch(/readOnly|disabled/);
    expect(form).not.toMatch(/name="slug"/);
  });

  it("explica por que o endereço não muda", () => {
    expect(form.toLowerCase()).toMatch(/google|indexad/);
  });
});
