import { createImageUrlBuilder } from "@sanity/image-url";
import { exigir } from "@/sanity/exigir";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  Endereço de uma imagem do Sanity, já dimensionada.

  `createImageUrlBuilder` nomeado, e não a exportação padrão: no
  `@sanity/image-url@2` a padrão está marcada como depreciada.

  A configuração entra por parâmetro, com valor padrão, porque esta função é
  síncrona por contrato: o tipo de `PortableTextComponents["types"]["image"]`
  do `@portabletext/react` é um `ComponentType` comum, que não aceita
  componente assíncrono, então a receita de `lib/sanity/cliente.ts` (adiar o
  ambiente para dentro de uma função `async`) não cabe aqui. Um valor padrão
  de parâmetro só roda quando a função é chamada sem o argumento, nunca na
  importação do módulo, e é isso que mantém a preguiça que a tarefa 3 exigiu.
*/
function configuracaoPadrao(): { projectId: string; dataset: string } {
  return {
    /* `exigir()`, e não `?? ""`, alinhando com `lib/sanity/cliente.ts`:
       faltar `projectId` é configuração ausente, e configuração ausente tem
       de falhar dizendo o nome da variável. O `?? ""` de antes defendia um
       estado impossível: toda chamada de `urlDaImagem` acontece depois de um
       `paginaPorSlug`/`noticiaPorSlug` na mesma renderização, e aquele
       caminho já passou pelo `exigir()` de `sanity/env.ts`. Não existe
       estado com um objeto `Noticia` em mãos e sem `projectId`. */
    projectId: exigir(
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      "NEXT_PUBLIC_SANITY_PROJECT_ID",
    ),
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  };
}

export function urlDaImagem(
  imagem: ImagemSanity,
  largura: number,
  configuracao: { projectId: string; dataset: string } = configuracaoPadrao(),
): string {
  try {
    return createImageUrlBuilder(configuracao)
      .image(imagem.asset)
      /*
        `fit=crop` sozinho, sem `.height()`, não recorta nada: `fit()` do
        `@sanity/image-url` só calcula o retângulo a partir do ponto de
        interesse quando largura E altura são passadas (ver o `if
        (!(imgWidth && imgHeight)) return {...}` logo no início da função,
        em node_modules/@sanity/image-url/src/urlForImage.ts). Sem `.height()`
        aqui, o CDN só redimensiona proporcionalmente pela largura pedida.

        Isso é comportamento desejado, não um descuido: quem chama esta
        função sem largura fixa de exibição, como `TextoRico` para imagem no
        corpo do texto, quer a foto exatamente como a AMI enviou, sem
        recortar rosto ou detalhe fora de um retângulo arbitrário. `fit=crop`
        continua na cadeia porque é o parâmetro que o CDN exige para que um
        chamador futuro que também passe altura (uma capa de matéria, por
        exemplo, onde proporção fixa é desejada) ganhe o recorte pelo
        hotspot de graça, sem precisar mudar esta função.
      */
      .width(largura)
      .fit("crop")
      .auto("format")
      .url();
  } catch {
    /*
      `asset._ref` malformado (upload ainda em andamento, referência
      corrompida) faz `.image()` lançar "Malformed asset _ref" lá dentro do
      `@sanity/image-url`. Devolver "" em vez de deixar a exceção subir é
      decisão deliberada: quem usa este endereço está desenhando uma imagem
      dentro de uma página inteira (uma notícia, uma página institucional).
      A AMI perde uma foto, não a notícia inteira. Quem chama decide o que
      fazer com uma resposta vazia; ver `TextoRico.tsx`, que descarta o
      bloco de imagem inteiro nesse caso.
    */
    return "";
  }
}

/*
  Dimensões reais de uma imagem, extraídas do próprio `_ref`.

  O Sanity codifica largura e altura originais no identificador do ativo,
  no formato `image-{id}-{largura}x{altura}-{extensão}`. Isso permite
  declarar `width`/`height` corretos num `<img>` sem precisar perguntar ao
  CDN nem carregar a imagem primeiro: o navegador reserva a caixa certa
  antes do primeiro byte chegar, o que é a diferença entre CLS zero e uma
  página que pula quando a foto termina de carregar.

  Devolve `undefined`, não lança, quando o `_ref` não tem o formato
  esperado: mesma filosofia de `urlDaImagem`, degradar uma imagem não pode
  derrubar a página.
*/
export function dimensoesDoRef(
  ref: string,
): { largura: number; altura: number } | undefined {
  const [, , dimensoes] = ref.split("-");
  if (!dimensoes) return undefined;

  const [larguraTexto, alturaTexto] = dimensoes.split("x");
  const largura = Number(larguraTexto);
  const altura = Number(alturaTexto);
  if (!Number.isFinite(largura) || !Number.isFinite(altura)) return undefined;

  return { largura, altura };
}
