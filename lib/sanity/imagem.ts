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
  return createImageUrlBuilder(configuracao)
    .image(imagem.asset)
    .width(largura)
    /* `fit=crop` com o ponto de interesse que a AMI marcou no Studio: sem
       ele, uma foto larga num espaço quadrado entra deformada ou com a
       cabeça de alguém cortada fora. */
    .fit("crop")
    .auto("format")
    .url();
}
