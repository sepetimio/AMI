import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { ehLinkInterno } from "@/lib/sanity/link";

/*
  O texto de uma página de texto, do Studio ou do rascunho em código (que
  chega no mesmo formato: `blocosDoRascunho`, lib/paginaDeTexto.ts).

  Cada nó sai como tag simples, e o CSS da coluna desenha
  (PaginaDeTexto.module.css). As exceções:
  - o h2 ganha o `id` da âncora dele (`ancoras`, pela chave do bloco), para
    o índice "Nesta página" levar até ele;
  - o estilo "aEntrar" é o que falta no rascunho: a moldura "a entrar", em
    cinza e itálico. Quem decide se ela existe é a rota, ao montar o texto
    (`conteudoDaPagina`, lib/paginaDeTexto.ts): nas páginas da associação,
    só na demonstração; nos três textos legais, sempre;
  - o link é o do texto rico das notícias: interno pelo roteador do Next,
    externo na mesma aba (a regra de qual é qual está em lib/sanity/link.ts).

  O schema da página institucional (sanity/schemas/paginaInstitucional.ts)
  só aceita parágrafo, h2, h3, as duas listas, negrito, itálico e link.
  `onMissingComponent={false}`: o que vier fora disso sai sem aviso no
  console.
*/
function componentes(ancoras: Record<string, string>): PortableTextComponents {
  return {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      h2: ({ value, children }) => (
        <h2 id={value._key ? ancoras[value._key] : undefined}>{children}</h2>
      ),
      h3: ({ children }) => <h3>{children}</h3>,
      aEntrar: ({ children }) => (
        <p className={styles.falta} data-a-entrar="">
          {children}
        </p>
      ),
    },
    list: {
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      link: ({ value, children }) => {
        const href: string = value?.href ?? "#";
        return ehLinkInterno(href) ? (
          <Link href={href} className={styles.link}>
            {children}
          </Link>
        ) : (
          <a href={href} className={styles.link}>
            {children}
          </a>
        );
      },
    },
  };
}

export function CorpoDoTexto({
  blocos,
  ancoras = {},
}: {
  blocos: PortableTextBlock[];
  ancoras?: Record<string, string>;
}) {
  return <PortableText value={blocos} components={componentes(ancoras)} onMissingComponent={false} />;
}
