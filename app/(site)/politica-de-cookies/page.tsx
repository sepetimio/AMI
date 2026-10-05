import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { conteudoDaPagina, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import { COOKIES } from "@/lib/rascunhosLegais";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SLUG = "politica-de-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug(SLUG);
  return {
    title: "Política de cookies | AMI",
    description:
      conteudo?.resumo ?? "Quais cookies este site usa e para quê.",
    alternates: { canonical: `/${SLUG}` },
  };
}

/*
  Duas origens possíveis, e a revisada sempre vence.

  Enquanto a AMI não publicar o documento no Studio, entra o rascunho de
  `lib/rascunhosLegais.ts`, com aviso visível de que não passou por advogado.
  A alternativa era esta página dar 404, e num site que lida com saúde a
  ausência de política é falha mais visível do que um rascunho assinalado.

  Publicado o texto revisado, `paginaPorSlug` passa a devolver algo e ele
  vence (`conteudoDaPagina`, lib/paginaDeTexto.ts): o rascunho some da tela
  sem ninguém precisar apagar nada, e o aviso some junto com ele.

  O que ainda falta no rascunho (o parágrafo marcado) sai como moldura "a
  entrar" nos dois modos, e não só na demonstração, como nas páginas da
  associação: um texto legal não pode perder calado um item obrigatório, e
  o quadro de aviso já diz que o texto é rascunho. Por isso o terceiro
  argumento é `true`, e não a chave de demonstração.

  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para o
  início.
*/
export default async function PaginaCookies() {
  const conteudo = conteudoDaPagina(await paginaPorSlug(SLUG), COOKIES, true);
  if (!conteudo) notFound();

  return <PaginaDeTexto conteudo={conteudo} volta={VOLTA_INICIO} />;
}
