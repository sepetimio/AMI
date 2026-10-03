import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

/*
  "Sua AMI" no menu e no rodapé, nos dois modos, medido no HTML de servidor.

  O link `/#sua-ami` leva a um bloco da home que só existe no modo
  demonstração (components/home/SuaAmi.tsx devolve `null` fora dele). Fora
  dela, o link apontaria para o nada; por isso ele sai do menu e do rodapé
  junto com o bloco.

  A chave é controlada como em testes/home-renderizada.test.ts: `vi.stubEnv`
  e `vi.resetModules()` antes de importar, para lib/demonstracao.ts ser
  avaliado de novo com o valor novo. O menu é componente de cliente e lê o
  caminho por `usePathname`; aqui não há roteador, e o dublê abaixo é o
  mínimo que ele toca.
*/
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

async function renderizar(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { Cabecalho } = await import("@/components/layout/Cabecalho");
  const { Rodape } = await import("@/components/layout/Rodape");
  return {
    cabecalho: renderToString(createElement(Cabecalho)),
    rodape: renderToString(createElement(Rodape)),
  };
}

function vezes(texto: string, trecho: string): number {
  return texto.split(trecho).length - 1;
}

describe("Sua AMI no menu e no rodapé", () => {
  it("na demonstração, o menu (linha e gaveta) e o rodapé levam a /#sua-ami", async () => {
    const { cabecalho, rodape } = await renderizar("true");
    /* Duas vezes no cabeçalho: o menu em linha e a gaveta. */
    expect(vezes(cabecalho, 'href="/#sua-ami"')).toBe(2);
    expect(vezes(rodape, 'href="/#sua-ami"')).toBe(1);
  });

  it("fora dela, o link some dos três lugares, e os outros ficam", async () => {
    const { cabecalho, rodape } = await renderizar("false");
    expect(cabecalho).not.toContain("/#sua-ami");
    expect(cabecalho).not.toContain(">Sua AMI<");
    expect(rodape).not.toContain("/#sua-ami");
    expect(rodape).not.toContain(">Sua AMI<");
    /* O menu não sumiu inteiro: os seis outros itens, nas duas listas. */
    expect(vezes(cabecalho, 'href="/noticias"')).toBe(2);
    expect(vezes(cabecalho, 'href="/contato"')).toBe(2);
    expect(rodape).toContain('href="/associacao/seja-associado"');
  });
});
