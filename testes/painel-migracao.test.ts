import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  A migração do painel é a primeira do projeto que concede escrita.

  Este teste é grosseiro de propósito: ele lê o SQL e falha se aparecer
  concessão de remoção. Com a segurança de linha ligada e sem política de
  `delete`, o Postgres recusa remoção de qualquer pessoa por qualquer
  caminho — inclusive do admin. É a mesma garantia que o importador tem, aqui
  no lugar onde ela é mais barata de perder.
*/

describe("0005_painel.sql", () => {
  const sql = fonte("../supabase/migrations/0005_painel.sql").toLowerCase();

  it("não concede remoção em tabela nenhuma", () => {
    expect(sql).not.toMatch(/for\s+(delete|all)\b/);
    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
    expect(sql).not.toMatch(/disable\s+row\s+level\s+security/);
  });

  it("liga a segurança de linha na tabela nova", () => {
    expect(sql).toMatch(/alter\s+table\s+perfil_usuario\s+enable\s+row\s+level\s+security/);
  });

  it("a função de papel é security definer com search_path fixo", () => {
    /* `security definer` não é necessário hoje — a única política de
       perfil_usuario é `id = auth.uid()`, que não consulta outra tabela, e a
       cadeia não recursa. Fica assim porque a primeira política futura que ler
       perfil_usuario via eh_admin() torna a recursão real, e ninguém vai
       lembrar de voltar aqui. `search_path` fixo impede que alguém troque o
       significado da tabela por um objeto homônimo — inclusive uma tabela
       temporária da própria sessão, daí `pg_temp` no caminho de busca.

       O corpo é isolado até o `$$;` que fecha eh_admin(): sem isso, a
       asserção casaria com qualquer `security definer` mais adiante no
       arquivo, inclusive o de local_publicado. */
    const corpo = sql.match(/create\s+function\s+eh_admin\(\)[\s\S]*?\$\$;/);
    expect(corpo, "não achou o corpo de eh_admin()").not.toBeNull();
    expect(corpo![0]).toMatch(/security\s+definer/);
    expect(corpo![0]).toMatch(/set\s+search_path\s*=\s*public/);
  });

  it("as duas funções pinam pg_temp no fim do caminho de busca", () => {
    /*
      Sem `pg_temp` listado, o Postgres procura o esquema temporário da sessão
      ANTES de tudo para nome de relação. Uma tabela temporária homônima
      sombrearia a real dentro de uma função que roda como dona.
    */
    for (const nome of ["eh_admin", "local_publicado"]) {
      const corpo = new RegExp(`function\\s+${nome}\\([\\s\\S]*?\\$\\$;`).exec(sql);
      expect(corpo, `não achei o corpo de ${nome}`).not.toBeNull();
      expect(corpo![0], nome).toMatch(/search_path\s*=\s*public\s*,\s*pg_temp/);
    }
  });

  it("concede escrita apenas em profissional nesta fatia", () => {
    const escritas = [...sql.matchAll(/create\s+policy\s+\S+\s+on\s+(\S+)\s+for\s+(insert|update)/g)];
    const tabelas = [...new Set(escritas.map((m) => m[1]))];
    expect(tabelas).toEqual(["profissional"]);
  });
});

describe("0006_painel_vinculos.sql", () => {
  const sql = semComentarios(fonte("../supabase/migrations/0006_painel_vinculos.sql"))
    .toLowerCase();

  const PERMITE_REMOVER = [
    "profissional_especialidade",
    "atendimento",
    "local_acessibilidade",
  ];

  const NUNCA_REMOVE = [
    "profissional",
    "local",
    "especialidade",
    "bairro",
    "horario",
    "perfil_usuario",
  ];

  it("concede remoção exatamente nas três tabelas de ligação", () => {
    const alvos = [...sql.matchAll(/on\s+(\w+)\s+for\s+delete/g)].map((m) => m[1]);
    expect(alvos.sort()).toEqual([...PERMITE_REMOVER].sort());
  });

  it("não concede remoção em nenhuma tabela de cadastro", () => {
    for (const tabela of NUNCA_REMOVE) {
      expect(sql).not.toMatch(new RegExp(`on\\s+${tabela}\\s+for\\s+delete`));
    }
  });

  it("não usa for all, grant, drop table, truncate nem desliga RLS", () => {
    expect(sql).not.toMatch(/for\s+all\b/);
    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
    expect(sql).not.toMatch(/disable\s+row\s+level\s+security/);
  });

  it("nenhuma política de escrita passa sem eh_admin", () => {
    const politicas = [...sql.matchAll(/create\s+policy[\s\S]*?;/g)].map((m) => m[0]);
    expect(politicas.length).toBeGreaterThan(0);
    for (const p of politicas) expect(p).toContain("eh_admin()");
  });
});

describe("supabase/testes-rls.sql", () => {
  const sql = fonte("../supabase/testes-rls.sql").toLowerCase();

  it("cobre as oito asserções que a especificação exige", () => {
    for (const marca of [
      "visitante nao ve despublicado",
      "admin ve despublicado",
      "visitante nao grava",
      "admin grava",
      "ninguem apaga",
      "conta sem perfil nao ve nada",
      "conta sem perfil nao grava",
      "ninguem se promove a admin",
    ]) {
      expect(sql, `falta a asserção "${marca}"`).toContain(marca);
    }
  });
});
