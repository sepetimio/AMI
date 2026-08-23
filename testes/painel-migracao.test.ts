import { describe, expect, it } from "vitest";
import { fonte, semComentariosSql } from "@/testes/apoio";

/** Tira o prefixo `public.` de um nome de tabela capturado do SQL. */
function normalizarTabela(nome: string): string {
  return nome.replace(/^public\./, "");
}

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
  const sql = semComentariosSql(fonte("../supabase/migrations/0006_painel_vinculos.sql"))
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

  const CONCEDE_ESCRITA = [
    "profissional_especialidade",
    "atendimento",
    "local",
    "local_acessibilidade",
  ];

  it("concede remoção exatamente nas três tabelas de ligação", () => {
    const alvos = [...sql.matchAll(/on\s+([\w.]+)\s+for\s+delete/g)]
      .map((m) => normalizarTabela(m[1]));
    expect(alvos.sort()).toEqual([...PERMITE_REMOVER].sort());
  });

  it("não concede remoção em nenhuma tabela de cadastro", () => {
    for (const tabela of NUNCA_REMOVE) {
      expect(sql).not.toMatch(new RegExp(`on\\s+(?:public\\.)?${tabela}\\s+for\\s+delete`));
    }
  });

  it("concede escrita exatamente nas quatro tabelas da fatia", () => {
    /*
      O limite acordado não é só remoção em três tabelas — é escrita (insert
      ou update) em quatro: as três de ligação mais `local`, que ganha
      insert/update sem delete. Nenhuma tabela de cadastro (profissional,
      especialidade, bairro, horario, perfil_usuario) entra aqui.
    */
    const escritas = [...sql.matchAll(/create\s+policy\s+\S+\s+on\s+([\w.]+)\s+for\s+(insert|update)/g)];
    const tabelas = [...new Set(escritas.map((m) => normalizarTabela(m[1])))];
    expect(tabelas.sort()).toEqual([...CONCEDE_ESCRITA].sort());
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

  it("toda condição de política usa (select eh_admin()), nunca eh_admin() cru", () => {
    /*
      `eh_admin()` cru dentro de `using`/`with check` roda uma vez por linha
      varrida; `(select eh_admin())` é içável pelo planejador e roda uma vez
      por comando. A diferença não é estilo — é o comentário do próprio
      arquivo que a explica. Sem este teste, trocar as nove ocorrências pela
      forma crua passava verde no teste acima (que só olha se `eh_admin()`
      aparece em algum lugar da política, não em que forma).
    */
    expect(sql).not.toMatch(/using\s*\(\s*eh_admin\(\)/);
    expect(sql).not.toMatch(/with\s+check\s*\(\s*eh_admin\(\)/);
  });
});

describe("supabase/testes-rls.sql", () => {
  const sql = semComentariosSql(fonte("../supabase/testes-rls.sql")).toLowerCase();

  /*
    A spec pede, na seção 12, uma asserção por tabela nova para cada papel:
    visitante anônimo não escreve, conta sem perfil não escreve, admin escreve,
    e remoção só nas três tabelas permitidas. São quatro tabelas novas.

    A lista anterior tinha doze marcas e o arquivo cobria quatro asserções de
    fatia 2, todas sobre `atendimento` e `local` —
    `profissional_especialidade` e `local_acessibilidade` não tinham nenhuma, e
    o papel `anon` não era exercido em nenhuma. A trava atestava uma cobertura
    que não existia, e o título dizia um número que não era o do arquivo.
  */
  const MARCAS = [
    // Fatia 1: o médico.
    "visitante nao ve despublicado",
    "admin ve despublicado",
    "visitante nao grava",
    "admin grava",
    "ninguem apaga",
    "conta sem perfil nao ve nada",
    "conta sem perfil nao grava",
    "ninguem se promove a admin",
    // Fatia 2: profissional_especialidade.
    "vinculo de especialidade: anon insere",
    "vinculo de especialidade: conta sem perfil insere",
    "vinculo de especialidade: admin insere",
    "vinculo de especialidade: admin altera",
    "vinculo de especialidade: admin remove",
    // Fatia 2: atendimento.
    "atendimento: anon insere",
    "atendimento: conta sem perfil insere",
    "atendimento: admin insere",
    "atendimento: admin remove",
    // Fatia 2: local — escrita sim, remoção não.
    "local: anon insere",
    "local: conta sem perfil insere",
    "local: admin insere",
    "local: admin altera",
    "local nao pode ser apagado",
    // Fatia 2: local_acessibilidade.
    "acessibilidade: anon insere",
    "acessibilidade: conta sem perfil insere",
    "acessibilidade: admin insere",
    "acessibilidade: admin remove",
  ];

  it("cobre as vinte e seis asserções que a especificação exige", () => {
    expect(MARCAS.length, "o título desta asserção diz vinte e seis").toBe(26);

    for (const marca of MARCAS) {
      expect(sql, `falta a asserção "${marca}"`).toContain(marca);
    }
  });

  it("nenhuma marca contém outra: senão a busca por substring fica cega", () => {
    /*
      A busca acima é por substring. Se "admin grava" fosse pedaço de
      "atendimento: admin grava", apagar o bloco do médico inteiro continuaria
      passando — a marca seria achada dentro da outra mensagem. Já aconteceu
      neste arquivo, com "ninguem apaga", e está registrado no comentário do
      próprio SQL.
    */
    for (const marca of MARCAS) {
      for (const outra of MARCAS) {
        if (marca === outra) continue;
        expect(outra.includes(marca), `"${marca}" está dentro de "${outra}"`).toBe(false);
      }
    }
  });

  it("exerce os três papéis nas tabelas da fatia 2", () => {
    /*
      As marcas dizem o que o arquivo AFIRMA; estas linhas dizem que ele
      chega a trocar de papel para afirmar. Sem `set local role anon` nenhum
      no bloco da fatia 2, as marcas de "anon insere" seriam texto de
      mensagem que nunca roda sob o papel que nomeiam.
    */
    expect(sql, "não exerce o papel anon").toContain("set local role anon");
    expect(sql, "não exerce o papel authenticated").toContain("set local role authenticated");
    expect(sql, "não fala pelo admin").toContain("admin_uuid");
    expect(sql, "não fala por uma conta sem perfil").toContain("ninguem_uuid");
  });
});
