import { NextStudioLayout } from "next-sanity/studio";

/*
  O Studio fica fora do grupo `(site)` de propósito: ele não leva cabeçalho,
  rodapé, grão nem os tokens do diretório. É uma aplicação inteira embutida,
  com o próprio sistema visual, e envolvê-la no layout do site produziria dois
  cabeçalhos e uma barra de rolagem dentro da outra.
*/
export default function LayoutStudio({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextStudioLayout>{children}</NextStudioLayout>;
}
