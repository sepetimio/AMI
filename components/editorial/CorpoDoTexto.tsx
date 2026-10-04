import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { imagemDoTexto, SIZES_DA_IMAGEM_DO_TEXTO } from "@/lib/noticias";
import { ehLinkInterno } from "@/lib/sanity/link";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  O texto rico de uma página de texto, do Studio ou do rascunho em código
  (que chega no mesmo formato: `blocosDoRascunho`, lib/paginaDeTexto.ts), e
  o de uma notícia.

  Cada nó sai como tag simples, e o CSS da coluna desenha
  (PaginaDeTexto.module.css). As exceções:
  - o h2 ganha o `id` da âncora dele (`ancoras`, pela chave do bloco), para
    o índice "Nesta página" levar até ele;
  - o estilo "aEntrar" é o que falta no rascunho: a moldura "a entrar", em
    cinza e itálico. Quem decide se ela existe é a rota, ao montar o texto
    (`conteudoDaPagina`, lib/paginaDeTexto.ts): nas páginas da associação,
    só na demonstração; nos três textos legais, sempre;
  - a marca "numero", que só o rascunho põe (`trechosDoTexto`,
    lib/paginaDeTexto.ts), sai num `span` que não quebra no meio;
  - a lista numerada leva a classe `numerada`: o índice recolhido "Nesta
    página" também é um `ol` dentro da coluna, e a regra da lista do texto
    não pode alcançá-lo;
  - a imagem (só a notícia tem): na proporção do arquivo que a AMI enviou,
    sem recorte e sem moldura, com a legenda embaixo quando há
    (`imagemDoTexto`, lib/noticias.ts). Sem endereço (`_ref` malformado), o
    bloco some: a notícia perde a foto, não o texto. Ela só baixa ao rolar
    (`loading="lazy"`): nunca é a primeira coisa da tela;
  - o link: interno pelo roteador do Next, externo na mesma aba (a regra de
    qual é qual está em lib/sanity/link.ts). Abrir em aba nova sem avisar
    tira do leitor o botão voltar.

  O schema da notícia (sanity/schemas/noticia.ts) aceita parágrafo, h2, h3,
  citação, as duas listas, negrito, itálico, link e imagem; o da página
  institucional (sanity/schemas/paginaInstitucional.ts), o mesmo sem a
  citação e sem a imagem. `onMissingComponent={false}`: o que vier fora
  disso sai sem aviso no console.
*/
function componentes(ancoras: Record<string, string>): PortableTextComponents {
  return {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      h2: ({ value, children }) => (
        <h2 id={value._key ? ancoras[value._key] : undefined}>{children}</h2>
      ),
      h3: ({ children }) => <h3>{children}</h3>,
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
      aEntrar: ({ children }) => (
        <p className={styles.falta} data-a-entrar="">
          {children}
        </p>
      ),
    },
    list: {
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol className={styles.numerada}>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      numero: ({ children }) => <span className={styles.inteiro}>{children}</span>,
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
    types: {
      image: ({ value }: { value: ImagemSanity }) => {
        const imagem = imagemDoTexto(value);
        if (!imagem) return null;
        return (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element --
                o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */}
            <img
              src={imagem.src}
              srcSet={imagem.srcSet}
              sizes={SIZES_DA_IMAGEM_DO_TEXTO}
              alt={imagem.alt}
              width={imagem.largura}
              height={imagem.altura}
              loading="lazy"
              decoding="async"
            />
            {value.legenda ? <figcaption>{value.legenda}</figcaption> : null}
          </figure>
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
