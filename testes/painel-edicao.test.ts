import { describe, expect, it } from "vitest";
import { lerCamposDoMedico } from "@/lib/painel/medico";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  A ponte entre o formulário e a validação, com um `FormData` de verdade.

  Ela não tinha teste nenhum: trocar `dados.get("associadoAmi") === "on"` por
  `true` dentro da ação passava a suíte inteira, e o defeito faria TODO médico
  salvo virar associado — o campo de que depende a decisão de nunca apagar
  médico. Testar aqui, e não pela ação, evita simular o Supabase, que este
  projeto nunca fez.
*/
describe("lerCamposDoMedico", () => {
  function formulario(pares: Record<string, string> = {}): FormData {
    const dados = new FormData();
    for (const [chave, valor] of Object.entries(pares)) dados.append(chave, valor);
    return dados;
  }

  const CHEIO = {
    nome: "Ana Ribeiro",
    crm: "12345",
    crmUf: "MA",
    telemedicina: "on",
    associadoAmi: "on",
    situacao: "inativo",
    bio: "Atende desde 1998.",
    verificadoEm: "2026-08-23",
  };

  it("cada campo chega ao lugar certo, os oito de uma vez", () => {
    expect(lerCamposDoMedico(formulario(CHEIO))).toEqual({
      nome: "Ana Ribeiro",
      crm: "12345",
      crmUf: "MA",
      telemedicina: true,
      associadoAmi: true,
      situacao: "inativo",
      bio: "Atende desde 1998.",
      verificadoEm: "2026-08-23",
    });
  });

  it("caixa marcada vira true", () => {
    const campos = lerCamposDoMedico(formulario({ associadoAmi: "on", telemedicina: "on" }));
    expect(campos.associadoAmi).toBe(true);
    expect(campos.telemedicina).toBe(true);
  });

  it("caixa desmarcada vira false, não undefined", () => {
    /*
      O navegador não manda a caixa desmarcada: o campo simplesmente não
      existe no envio. `undefined` aqui gravaria nulo numa coluna booleana, e
      um `||` no lugar do `===` deixaria quem saiu da associação associado
      para sempre.
    */
    const campos = lerCamposDoMedico(formulario({ nome: "Ana" }));
    expect(campos.associadoAmi).toBe(false);
    expect(campos.telemedicina).toBe(false);
  });

  it("campo ausente vira string vazia, não a palavra \"null\"", () => {
    /*
      `String(null)` devolve "null" — quatro letras que passariam por
      `validarMedico` como nome, CRM e biografia de verdade.
    */
    const campos = lerCamposDoMedico(formulario());
    expect(campos.nome).toBe("");
    expect(campos.crm).toBe("");
    expect(campos.crmUf).toBe("");
    expect(campos.bio).toBe("");
    expect(campos.verificadoEm).toBe("");
  });

  it("situação ausente vira ativo, que é o padrão do cadastro", () => {
    expect(lerCamposDoMedico(formulario()).situacao).toBe("ativo");
  });

  it("caixa marcada com qualquer outro valor não vira true", () => {
    /*
      `=== "on"` e não "veio alguma coisa": uma requisição montada à mão pode
      mandar `associadoAmi=off`, e "off" é um valor presente.
    */
    expect(lerCamposDoMedico(formulario({ associadoAmi: "off" })).associadoAmi).toBe(false);
  });
});

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
