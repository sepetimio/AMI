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
    expect(sql).not.toMatch(/for\s+delete/);
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
  });

  it("liga a segurança de linha na tabela nova", () => {
    expect(sql).toMatch(/alter\s+table\s+perfil_usuario\s+enable\s+row\s+level\s+security/);
  });

  it("a função de papel é security definer com search_path fixo", () => {
    /* Sem `security definer`, a política que consulta perfil_usuario dispara a
       política de perfil_usuario e recursa. Sem `search_path` fixo, alguém
       troca o significado da tabela por um objeto homônimo. */
    expect(sql).toMatch(/create\s+function\s+eh_admin[\s\S]*security\s+definer/);
    expect(sql).toMatch(/create\s+function\s+eh_admin[\s\S]*set\s+search_path\s*=\s*public/);
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
