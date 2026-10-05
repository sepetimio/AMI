import { Writable } from "node:stream";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToPipeableStream, renderToString } from "react-dom/server";
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

/*
  Uma página inteira renderizada no servidor, esperando as partes
  assíncronas (`onAllReady`): o caminho de testes/home-renderizada.test.ts,
  num lugar só para os testes de página que vieram depois.
*/
export function htmlDe(arvore: ReactNode): Promise<string> {
  return new Promise<string>((pronto, falhou) => {
    let html = "";
    const destino = new Writable({
      write(pedaco, _codificacao, seguir) {
        html += pedaco.toString();
        seguir();
      },
      final(seguir) {
        pronto(html);
        seguir();
      },
    });
    const fluxo = renderToPipeableStream(arvore, {
      onAllReady: () => fluxo.pipe(destino),
      onError: falhou,
    });
  });
}

/*
  A faixa do topo (`<section data-bloco="topo">`) sem o link de volta: o
  que sobra para conferir que a faixa não tem ícone. A seta do "← VOLTAR"
  fica, porque é ícone ao lado do texto de um link.

  Sem a faixa do topo no HTML, erro: o teste não pode passar por não achar
  o que confere.
*/
export function topoSemAVolta(html: string): string {
  const ini = html.indexOf('<section data-bloco="topo"');
  const fim = html.indexOf("</section>", ini);
  if (ini < 0 || fim < 0) throw new Error("O HTML não tem a faixa do topo.");
  return html.slice(ini, fim).replace(/<a [^>]*class="[^"]*\blink-de-volta\b[^"]*"[^>]*>[\s\S]*?<\/a>/g, "");
}
