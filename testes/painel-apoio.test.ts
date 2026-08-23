import { describe, expect, it } from "vitest";
import { semComentarios, semComentariosSql } from "@/testes/apoio";

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

  it("mantém -- intacto, porque em JS é decremento, não comentário", () => {
    /*
      `semComentariosSql`, o irmão para arquivos .sql, trata `--` como
      comentário. Este é o teste espelhado: prova que ESTA função, a de
      TypeScript, continua cega a `--` — porque aqui `--` é o operador de
      decremento, e tratá-lo como comentário quebraria qualquer arquivo do
      painel que decrementa uma variável.
    */
    const codigo = 'let x = 10;\nx--;\n// comentário real\nconst y = x-- - 1;\nconsole.log("ok");';
    const limpo = semComentarios(codigo);
    expect(limpo).toContain("x--;");
    expect(limpo).toContain("x-- - 1");
    expect(limpo).not.toContain("comentário real");
  });
});

/*
  `semComentariosSql` existe porque `--` é comentário em SQL e decremento em
  JavaScript: uma função só serve às duas linguagens ingenuamente se fingir
  que `--` não existe, e para SQL isso é exatamente o buraco que este arquivo
  fecha. O caso abaixo reproduz a colisão que apareceu de verdade em
  `painel-migracao.test.ts`: um comentário `--` citando a sintaxe que uma
  asserção proíbe, que sem esta função sobrevivia à varredura e derrubava o
  teste por um comentário inócuo em vez de por uma política real.
*/
describe("semComentariosSql", () => {
  it("remove comentário de linha SQL, inclusive um que cita sintaxe proibida", () => {
    const sql = "select 1;\n-- Nao existe policy on horario for delete\nselect 2;";
    const limpo = semComentariosSql(sql);
    expect(limpo).not.toContain("on horario for delete");
    expect(limpo).toContain("select 1;");
    expect(limpo).toContain("select 2;");
  });

  it("remove comentário de bloco SQL", () => {
    const sql = "select 1; /* on tabela for delete */ select 2;";
    expect(semComentariosSql(sql)).not.toContain("on tabela for delete");
  });

  it("não mexe em código real fora do comentário", () => {
    const sql = "create policy x on atendimento for delete using (true); -- ok";
    expect(semComentariosSql(sql)).toContain("on atendimento for delete");
  });
});
