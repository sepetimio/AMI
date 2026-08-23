import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  Varredura em vez de lista à mão: a fatia 2 acrescenta várias ações, e uma
  lista literal é garantia que apodrece sozinha — este arquivo já ficou duas
  tarefas cobrindo dois terços do que dizia cobrir.
*/
function acoesDoPainel(relativo: string): string[] {
  const dir = fileURLToPath(new URL(relativo, import.meta.url));
  const achados: string[] = [];

  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = `${relativo}/${entrada.name}`;
    if (entrada.isDirectory()) achados.push(...acoesDoPainel(caminho));
    else if (entrada.name === "acoes.ts") achados.push(caminho);
  }

  return achados;
}

const ACOES = acoesDoPainel("../app/painel");

describe("as ações do painel", () => {
  it("a varredura acha os três arquivos de ação", () => {
    expect(ACOES.length).toBeGreaterThanOrEqual(3);
  });

  for (const caminho of ACOES) {
    it(`${caminho} é ação de servidor`, () => {
      expect(fonte(caminho).trimStart().startsWith('"use server"')).toBe(true);
    });
  }

  it("nenhuma ação remove nada", () => {
    /* Não existe política de remoção no banco, então uma chamada de remoção
       aqui falharia — mas falharia em tempo de execução, e o teste é mais
       barato que descobrir assim. */
    for (const caminho of ACOES) {
      expect(semComentarios(fonte(caminho))).not.toMatch(/\.delete\s*\(/);
    }
  });
});

describe("alternarPublicacao", () => {
  /*
    Sem comentários, inclusive para medir ordem.

    Uma âncora que cai dentro de um comentário não mede a ordem de nada: a
    versão anterior deste teste achava `exigirAdmin(` na própria prosa deste
    arquivo, e continuava verde com a chamada de verdade apagada.
  */
  const codigo = semComentarios(fonte("../app/painel/acoes.ts"));

  const posGuarda = codigo.indexOf("exigirAdmin(");
  const posEscrita = codigo.indexOf(".update(");
  const posInvalida = codigo.indexOf("revalidatePath(");

  it("chama a guarda, grava e invalida — os três existem", () => {
    expect(posGuarda, "não achei a chamada de exigirAdmin()").toBeGreaterThan(-1);
    expect(posEscrita, "não achei a gravação").toBeGreaterThan(-1);
    expect(posInvalida, "não achei a chamada de revalidatePath()").toBeGreaterThan(-1);
  });

  it("confere a permissão antes de gravar", () => {
    expect(posEscrita).toBeGreaterThan(posGuarda);
  });

  it("confere se a gravação alterou alguma linha", () => {
    /*
      PostgREST filtra a linha que a política não admite em vez de recusar a
      chamada: zero linhas alteradas, `error` nulo. Sem esta conferência a
      ação declarava sucesso e o banco seguia com o valor antigo — aconteceu
      em 23/08/2026, contra o banco de verdade.

      As duas âncoras são a forma que EXECUTA, e `codigo` já vem sem
      comentários: a prosa de `acoes.ts` cita `.select()` e `!data` ao
      explicar por que eles estão lá, e uma busca no fonte cru casaria com ela
      em vez de com o código.
    */
    const posConfere = codigo.indexOf(".select(");
    expect(posConfere, "a gravação não pede as linhas afetadas de volta").toBeGreaterThan(-1);
    expect(posConfere).toBeGreaterThan(posEscrita);
    expect(codigo, "ninguém testa se veio linha").toContain("if (!data)");
    expect(codigo.indexOf("if (!data)")).toBeLessThan(posInvalida);
  });

  it("invalida o site público depois de gravar", () => {
    /*
      Antes da gravação, a invalidação derruba o cache e ele se reconstrói com
      o dado velho: compila, roda, e não invalida nada.
    */
    expect(codigo).toContain('revalidatePath("/(site)", "layout")');
    expect(posInvalida).toBeGreaterThan(posEscrita);
  });
});
