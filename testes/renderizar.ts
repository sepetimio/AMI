import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { vi } from "vitest";

/*
  O cabeçalho e o rodapé renderizados no servidor, com a chave de
  demonstração escolhida.

  A chave é controlada como em testes/home-renderizada.test.ts: `vi.stubEnv`
  e `vi.resetModules()` antes de importar, para lib/demonstracao.ts ser
  avaliado de novo com o valor novo. Quem chama limpa com
  `vi.unstubAllEnvs()` no `afterEach`.

  O menu do cabeçalho é componente de cliente e lê o caminho por
  `usePathname`; aqui não há roteador. O arquivo de teste que usa esta função
  precisa do dublê, no topo dele (o `vi.mock` vale para o arquivo inteiro):

    vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
*/
export async function renderizar(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { Cabecalho } = await import("@/components/layout/Cabecalho");
  const { Rodape } = await import("@/components/layout/Rodape");
  return {
    cabecalho: renderToString(createElement(Cabecalho)),
    rodape: renderToString(createElement(Rodape)),
  };
}
