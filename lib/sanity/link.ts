/*
  Como renderizar um link escrito no Studio: se ele vira link, e se vira
  navegação interna do Next ou âncora comum.

  Vive em `lib/` e não dentro de `CorpoDoTexto.tsx` pelo mesmo motivo que
  `etiquetasDoDocumento` e as demais: são as decisões daquele componente
  que têm regra própria, e sem elas em função pura não há como travá-las em
  teste. A anotação de link do Studio aceita `http`, `https`, `mailto`,
  `tel` e endereço relativo; `hrefSeguro` não confia nisso (o dado pode
  chegar ao Sanity por outro caminho que não o formulário do Studio) e
  `ehLinkInterno` vê os casos que passam por ela.
*/

/*
  O endereço que pode virar link no texto, ou null.

  Lista do que passa, e não do que é barrado: `http:`, `https:`, `mailto:`
  e `tel:` (o esquema em qualquer caixa), o caminho do próprio site (`/`) e
  a âncora (`#`). Todo o resto, `javascript:`, `data:` e `vbscript:` à
  frente, e também o relativo sem barra, sai como texto sem link. Os
  espaços das pontas saem antes da conferência, como o navegador faz; um
  espaço, tabulação ou quebra no meio do esquema ("java\tscript:") não
  casa com nenhum começo aceito e também sai sem link.
*/
const COMECOS_ACEITOS = /^(https?:|mailto:|tel:|\/|#)/i;

export function hrefSeguro(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const limpo = href.trim();
  return COMECOS_ACEITOS.test(limpo) ? limpo : null;
}

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
