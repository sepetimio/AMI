import type { Metadata } from "next";
import { notFound } from "next/navigation";
import paginas from "@/app/(site)/encontre.module.css";
import { AutorDaNoticia } from "@/components/editorial/AutorDaNoticia";
import { CapaDaNoticia } from "@/components/editorial/CapaDaNoticia";
import { FaixaDaNoticia } from "@/components/editorial/FaixaDaNoticia";
import { FaixaDoTexto } from "@/components/editorial/FaixaDoTexto";
import { OutrasNoticias } from "@/components/editorial/OutrasNoticias";
import { JsonLd } from "@/components/seo/JsonLd";
import { LIMITE_DE_OUTRAS, capaDaNoticia, outrasNoticias } from "@/lib/noticias";
import { listarNoticias, noticiaPorSlug, slugsDeNoticias } from "@/lib/sanity/consultas";
import { newsArticle } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeNoticias();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = await noticiaPorSlug(slug);
  if (!n) return {};

  return {
    title: tituloDePagina(n.titulo),
    description: n.resumo,
    alternates: { canonical: `/noticias/${slug}` },
  };
}

/*
  A notícia aberta, como no desenho aprovado
  (docs/desenho-aprovado/noticias-contato/noticia.html):
  - a faixa verde, com "← NOTÍCIAS", o título, o resumo e a assinatura
    (components/editorial/FaixaDaNoticia.tsx);
  - a capa em 16:9, recortada pelo ponto de interesse; sem capa, ou com a
    referência quebrada, o bloco não existe;
  - o texto numa faixa branca, na coluna de leitura das páginas de texto
    (components/editorial/FaixaDoTexto.tsx), com "Atualizado em" quando a
    notícia foi revisada, o índice "Nesta página" com dois títulos de seção
    ou mais, e, no fim, quem assina e o aviso de saúde;
  - "Outras notícias": as três mais recentes que não são esta, em tantas
    colunas quantas forem; sem nenhuma, o bloco não existe
    (components/editorial/OutrasNoticias.tsx), e o texto fecha a página.

  Sem notícia publicada no endereço, página não encontrada.

  O JSON-LD é só o `NewsArticle` (lib/seo/jsonld.ts), como antes. Sem
  trilha e sem BreadcrumbList: dado estruturado sem o equivalente visível é
  marcação enganosa. Os blocos são filhos diretos de `.pagina`
  (app/(site)/encontre.module.css), a --ritmo um do outro; quando o texto
  fecha a página, o rodapé emenda nele.
*/
export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;
  /* Uma a mais que as de "Outras notícias": a aberta pode estar entre as
     mais recentes. */
  const [n, recentes] = await Promise.all([noticiaPorSlug(slug), listarNoticias(LIMITE_DE_OUTRAS + 1)]);
  if (!n) notFound();

  const capa = capaDaNoticia(n.capa);

  return (
    <>
      <JsonLd dados={newsArticle(n, SITE)} />

      <div className={paginas.pagina}>
        <FaixaDaNoticia noticia={n} />
        {capa ? <CapaDaNoticia capa={capa} /> : null}
        <FaixaDoTexto rotulo="Texto da notícia" atualizadoEm={n.atualizadoEm} corpo={n.corpo}>
          <AutorDaNoticia autor={n.autor} />
        </FaixaDoTexto>
        <OutrasNoticias noticias={outrasNoticias(recentes, n.slug)} />
      </div>
    </>
  );
}
