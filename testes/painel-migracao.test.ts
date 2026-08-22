import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  A migração do painel é a primeira do projeto que concede escrita.

  Este teste é grosseiro de propósito: ele lê o SQL e falha se aparecer
  concessão de remoção. Com a segurança de linha ligada e sem política de
  `delete`, o Postgres recusa remoção de qualquer pessoa por qualquer
  caminho — inclusive do admin. É a mesma garantia que o importador tem, aqui
  no lugar onde ela é mais barata de perder.
*/
function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

describe("0005_painel.sql", () => {
  const sql = fonte("../supabase/migrations/0005_painel.sql").toLowerCase();

  it("não concede remoção em tabela nenhuma", () => {
    expect(sql).not.toMatch(/for\s+(delete|all)\b/);
    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
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

  it("concede escrita apenas em profissional nesta fatia", () => {
    const escritas = [...sql.matchAll(/create\s+policy\s+\S+\s+on\s+(\S+)\s+for\s+(insert|update)/g)];
    const tabelas = [...new Set(escritas.map((m) => m[1]))];
    expect(tabelas).toEqual(["profissional"]);
  });
});

describe("supabase/testes-rls.sql", () => {
  const sql = fonte("../supabase/testes-rls.sql").toLowerCase();

  it("cobre as seis asserções que a especificação exige", () => {
    for (const marca of [
      "visitante nao ve despublicado",
      "admin ve despublicado",
      "visitante nao grava",
      "admin grava",
      "ninguem apaga",
      "conta sem perfil nao ve nada",
    ]) {
      expect(sql, `falta a asserção "${marca}"`).toContain(marca);
    }
  });
});
