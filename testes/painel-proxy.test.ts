import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

/*
  Duas armadilhas medidas, e as duas falham em silêncio.

  1. No Next 16 o arquivo se chama `proxy.ts` e exporta `proxy`. Um
     `middleware.ts` é só um arquivo que ninguém chama — sem erro nenhum.
  2. O `setAll` do @supabase/ssr recebe um SEGUNDO argumento com cabeçalhos
     de não-cachear. Sem eles, uma CDN pode servir o cookie de sessão de uma
     pessoa a outra.
*/
describe("proxy.ts", () => {
  const codigo = fonte("../proxy.ts");

  it("exporta `proxy`, não `middleware`", () => {
    expect(codigo).toMatch(/export\s+(async\s+)?function\s+proxy\b/);
    expect(codigo).not.toMatch(/export\s+(async\s+)?function\s+middleware\b/);
  });

  it("o filtro cobre só o painel — o site público não pode passar por aqui", () => {
    const m = /matcher\s*:\s*\[([^\]]*)\]/.exec(codigo);
    expect(m, "não achei config.matcher").not.toBeNull();
    const caminhos = [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    expect(caminhos.length).toBeGreaterThan(0);
    for (const c of caminhos) expect(c.startsWith("/painel")).toBe(true);
  });

  it("aplica os cabeçalhos de não-cachear que o segundo argumento traz", () => {
    /* O nome do segundo parâmetro é livre; o que não pode é ele não existir
       nem ser usado. */
    const decl = /setAll\s*:?\s*\(\s*[^,)]+,\s*([A-Za-zÀ-ú_$][\w$]*)\s*\)/.exec(codigo);
    expect(decl, "setAll precisa receber o segundo argumento").not.toBeNull();
    expect(codigo).toContain(`Object.entries(${decl![1]})`);
    expect(codigo).toMatch(/\.headers\.set\(/);
  });

  it("todo desvio passa pela saída única que carrega a sessão", () => {
    /*
      Um `return NextResponse.redirect(...)` direto devolveria uma resposta que
      nunca viu a renovação de sessão, e desconectaria em silêncio quem tivesse
      o token vencido. Nenhum teste de texto consegue ver que a resposta
      devolvida não é a que recebeu os cookies — então o que se trava aqui é a
      forma.
    */
    expect(codigo).not.toMatch(/return\s+NextResponse\.redirect/);
    expect(codigo).toMatch(/return\s+entregar\(/);
  });
});

describe("lib/painel/servidor.ts", () => {
  const codigo = fonte("../lib/painel/servidor.ts");

  it("não lê a chave do importador", () => {
    expect(codigo).not.toContain("SUPABASE_CHAVE_IMPORTADOR");
  });

  it("usa a chave pública, que é o que faz as políticas valerem", () => {
    expect(codigo).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
