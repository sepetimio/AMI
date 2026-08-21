import { createImageUrlBuilder } from "@sanity/image-url";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  Endereço de uma imagem do Sanity, já dimensionada.

  `createImageUrlBuilder` nomeado, e não a exportação padrão: no
  `@sanity/image-url@2` a padrão está marcada como depreciada.

  Este módulo NÃO importa `projectId`/`dataset` de `sanity/env.ts`, ao
  contrário do que o plano original previa. Aquele módulo valida as
  variáveis de ambiente no próprio topo, na importação (falha rápida,
  decisão deliberada, ver o comentário lá). Um `import` estático daqui
  herdaria essa validação assim que qualquer arquivo importasse
  `urlDaImagem`, mesmo sem nunca chegar a montar uma URL: foi exatamente o
  que já quebrou a suíte na tarefa 3, através de `lib/sanity/consultas.ts`.

  A correção de lá (`lib/sanity/cliente.ts`) adia a leitura do ambiente
  para dentro de uma função `async`, memoizada, porque quem chama já está
  numa função assíncrona fazendo uma consulta de rede. Aqui não dá para
  repetir a mesma receita: `urlDaImagem` é síncrona por contrato (o passo 5
  do brief usa `src={urlDaImagem(value, 1200)}` direto no JSX), e o tipo de
  `PortableTextComponents["types"]["image"]` do `@portabletext/react` é um
  `ComponentType` comum, que não aceita um componente assíncrono como
  renderizador.

  A solução aqui é "receber por parâmetro", a segunda saída já validada
  neste projeto: `configuracao` tem valor padrão, calculado por chamada (não
  na importação do módulo, porque um valor padrão de parâmetro só roda
  quando a função é de fato chamada sem o argumento). O padrão lê
  `process.env` direto, sem passar pelo `exigir()` de `sanity/env.ts`: aqui
  faltar `projectId` produz uma URL malformada mas visível na tela, não uma
  página inteira que não renderiza por causa de uma imagem que talvez nem
  apareça na dobra. Quem precisar de validação forte (ou de testar com um
  projeto fixo) pode passar `configuracao` explicitamente.
*/
function configuracaoPadrao(): { projectId: string; dataset: string } {
  return {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
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
