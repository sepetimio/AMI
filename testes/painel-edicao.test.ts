import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

describe("salvarMedico", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes.ts"));

  it("é ação de servidor, com a diretiva antes de qualquer coisa", () => {
    expect(codigo.trimStart().startsWith('"use server"')).toBe(true);
  });

  const posGuarda = codigo.indexOf("exigirAdmin(");
  const posEscrita = codigo.indexOf(".update(");

  it("chama a guarda e grava — os dois existem", () => {
    expect(posGuarda, "não achei a chamada de exigirAdmin()").toBeGreaterThan(-1);
    expect(posEscrita, "não achei a gravação").toBeGreaterThan(-1);
  });

  it("confere a permissão antes de gravar", () => {
    expect(posEscrita).toBeGreaterThan(posGuarda);
  });

  it("valida no servidor, e não só no navegador", () => {
    expect(codigo).toContain("validarMedico(");
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

  it("confere que a gravação afetou alguma linha", () => {
    /*
      Sem `.select()`, uma gravação que não casa linha nenhuma volta sem erro
      — e a política do banco recusando chegaria à tela como sucesso.
    */
    expect(codigo).toContain('.select("id")');
    expect(codigo).toContain("maybeSingle()");
    expect(codigo).toContain("Não encontrei este médico para salvar");
  });

  it("traduz a colisão de CRM em vez de mostrar o erro cru do banco", () => {
    expect(codigo).toContain('"23505"');
    expect(codigo).toContain("Já existe um médico com o CRM");
  });
});

describe("o formulário de edição", () => {
  const form = semComentarios(fonte("../components/painel/FormularioMedico.tsx"));

  it("usa useActionState", () => {
    expect(form).toContain("useActionState");
  });

  it("mostra o endereço do perfil sem deixar editar", () => {
    expect(form).toMatch(/id="endereco-do-perfil"[\s\S]{0,200}readOnly/);
    expect(form).not.toMatch(/name="slug"/);
  });

  it("explica por que o endereço não muda", () => {
    expect(form.toLowerCase()).toMatch(/google|indexad/);
  });
});
