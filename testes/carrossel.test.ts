import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carrossel } from "@/components/home/Carrossel";
import type { Banner } from "@/lib/sanity/tipos";

/*
  A única coisa que este arquivo mede: a saída de servidor do carrossel não
  depende da preferência de movimento do cliente.

  Isso importa porque `semMovimento` decide se o botão "Pausar" existe no JSX.
  Se o valor lido no servidor puder diferir do valor da primeira renderização
  do cliente, as duas árvores divergem, o React descarta a do servidor e
  refaz do zero — e só para quem tem "reduzir movimento" ligado, que é
  exatamente o público que a regra existe para proteger.

  Renderizar o componente e olhar o resultado não provaria nada: no Vitest,
  servidor e cliente são o mesmo processo. A prova é `renderToString` com
  `matchMedia` respondendo `true`: se o servidor consultasse a preferência,
  o botão sumiria da saída e as contagens de chamada abaixo passariam de zero.
*/

const BANNERS: Banner[] = [
  {
    id: "a",
    nome: "Primeiro",
    imagem: "https://exemplo.test/a.jpg",
    alt: "Primeiro banner",
    destino: null,
    ordem: 1,
  },
  {
    id: "b",
    nome: "Segundo",
    imagem: "https://exemplo.test/b.jpg",
    alt: "Segundo banner",
    destino: null,
    ordem: 2,
  },
];

/* `window` não existe no ambiente `node` do Vitest. Este é o mínimo que
   `lerMovimento`/`assinarMovimento` tocariam se fossem chamadas: se elas
   forem, `chamadas` sai de zero e o teste diz onde. */
function janelaFalsa(reduzirMovimento: boolean) {
  const contador = { chamadas: 0 };
  const janela = {
    matchMedia: (consulta: string) => {
      contador.chamadas += 1;
      return {
        media: consulta,
        matches: reduzirMovimento,
        addEventListener: () => {},
        removeEventListener: () => {},
      };
    },
  };
  return { janela, contador };
}

function renderizarNoServidor(reduzirMovimento: boolean) {
  const { janela, contador } = janelaFalsa(reduzirMovimento);
  vi.stubGlobal("window", janela);
  const html = renderToString(createElement(Carrossel, { banners: BANNERS }));
  return { html, chamadas: contador.chamadas };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Carrossel na renderização de servidor", () => {
  it("gera o botão Pausar mesmo com reduzir movimento ligado", () => {
    const { html, chamadas } = renderizarNoServidor(true);

    expect(html).toContain("Pausar");
    expect(chamadas).toBe(0);
  });

  it("gera a mesma árvore com a preferência ligada e desligada", () => {
    const ligado = renderizarNoServidor(true);
    const desligado = renderizarNoServidor(false);

    expect(ligado.html).toBe(desligado.html);
    expect(desligado.chamadas).toBe(0);
  });
});
