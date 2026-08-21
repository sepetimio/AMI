import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";
import { dimensoesDoRef, urlDaImagem } from "@/lib/sanity/imagem";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  O texto que a AMI escreve no Studio, desenhado no sistema visual do site.

  Sem este mapeamento o PortableText emite `<h2>`, `<p>` e `<ul>` crus, que
  herdam só o que a camada base do `globals.css` define. Os cabeçalhos até
  saem certos, mas listas, citações e o respiro entre parágrafos ficam com o
  padrão do navegador, e o texto editorial passa a parecer colado de outro
  site. Aqui cada nó recebe as classes do projeto.
*/
const componentes: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="coluna-leitura mt-5 text-[18px] text-ink-600">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-12 border-b border-line-strong pb-3">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="mt-9">{children}</h3>,
    blockquote: ({ children }) => (
      /* Fio à esquerda em vez de aspas grandes: a citação num site
         institucional é fonte, não ornamento. */
      <blockquote className="coluna-leitura mt-7 border-l-2 border-ami-green-600 py-1 pl-5 text-[19px] text-ink-600">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="coluna-leitura mt-5 list-disc space-y-2 pl-6 text-[18px] text-ink-600">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="coluna-leitura mt-5 list-decimal space-y-2 pl-6 text-[18px] text-ink-600">
        {children}
      </ol>
    ),
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-ink-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      /* Link externo abre na mesma aba. Abrir em aba nova sem avisar rouba do
         leitor o controle do próprio navegador, e o botão voltar deixa de
         funcionar, que é a queixa mais comum de quem usa leitor de tela. */
      const externo = /^https?:\/\//.test(href);
      const classe =
        "font-semibold text-ami-green-600 underline underline-offset-2 hover:text-ami-green-700";

      return externo ? (
        /* Sem `target="_blank"` (a mesma aba, decisão de cima), `rel`
           não tem efeito nenhum: `noopener`/`noreferrer` só existem para
           mitigar o `window.opener` de um contexto de navegação novo. */
        <a href={href} className={classe}>
          {children}
        </a>
      ) : (
        <Link href={href} className={classe}>
          {children}
        </Link>
      );
    },
  },

  types: {
    image: ({ value }: { value: ImagemSanity }) => {
      const url = urlDaImagem(value, 1200);
      const dimensoes = dimensoesDoRef(value.asset._ref);

      /*
        `urlDaImagem` devolve "" e `dimensoesDoRef` devolve `undefined` para
        a mesma causa: um `_ref` que não segue o formato do Sanity (upload
        ainda em andamento, referência corrompida). Sem URL não há o que
        desenhar, e sem as dimensões reais não dá para reservar a caixa
        certa sem pular o layout. A notícia perde uma foto, não a página
        inteira: ver o comentário em lib/sanity/imagem.ts.
      */
      if (!url || !dimensoes) return null;

      /* Altura calculada a partir da proporção original do arquivo enviado
         pela AMI, não um valor fixo como 800: recortar a foto de alguém
         para caber numa caixa 3:2 é decisão editorial que ninguém tomou
         aqui. Com largura e altura declaradas na proporção real, o
         navegador reserva o espaço certo antes de a imagem carregar, sem
         o salto de layout que uma proporção inventada causaria. */
      const largura = 1200;
      const altura = Math.round(
        (largura * dimensoes.altura) / dimensoes.largura,
      );

      return (
        <figure className="mt-9">
          {/* Moldura concêntrica, a mesma do bloco institucional da home. */}
          <div className="rounded-bloco border border-line bg-surface p-2 shadow-erguido">
            {/* eslint-disable-next-line @next/next/no-img-element --
                o CDN do Sanity já redimensiona e converte formato; ver o
                comentário em lib/sanity/imagem.ts. */}
            <img
              src={url}
              alt={value.alt}
              width={largura}
              height={altura}
              className="h-auto w-full rounded-controle"
            />
          </div>
          {value.legenda ? (
            <figcaption className="coluna-leitura mt-3 text-[15px] text-ink-400">
              {value.legenda}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  },
};

export function TextoRico({ blocos }: { blocos: PortableTextBlock[] }) {
  return <PortableText value={blocos} components={componentes} />;
}
