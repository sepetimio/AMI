/*
  Como renderizar um link escrito no Studio: navegação interna do Next ou
  âncora comum.

  Vive em `lib/` e não dentro de `TextoRico.tsx` pelo mesmo motivo que
  `etiquetasDoDocumento` e as demais: é a única decisão daquele componente
  que tem regra própria, e sem ela em função pura não há como travá-la em
  teste. A anotação de link do Studio aceita `http`, `https`, `mailto`,
  `tel` e endereço relativo, então esta função vê os cinco casos de verdade.
*/
export function ehLinkInterno(href: string): boolean {
  /*
    Só a barra inicial conta como interno, e "//" fica de fora: "//ami.org.br"
    é endereço protocol-relative, ou seja, outro site, e passá-lo ao `<Link>`
    do Next faria o roteador tentar navegar para uma rota que não existe.

    O resto vai para `<a>` por razões distintas, todas terminando no mesmo
    lugar. `mailto:` e `tel:` não são navegação: quem os intercepta com o
    roteador impede o celular de abrir o discador, que num site de diretório
    médico é o gesto mais importante da página. `#secao` é salto dentro da
    própria página. E o relativo sem barra ("diretoria") o navegador resolve
    contra o endereço atual de um jeito que o `<Link>` não reproduz, então a
    âncora comum é a que se comporta como a secretaria espera.
  */
  return href.startsWith("/") && !href.startsWith("//");
}
