import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { RascunhoLegalNaTela } from "@/components/editorial/RascunhoLegalNaTela";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { TERMOS } from "@/lib/rascunhosLegais";

export const revalidate = 3600;

const SLUG = "termos-de-uso";

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug(SLUG);
  return {
    title: "Termos de uso | AMI",
    description:
      conteudo?.resumo ??
      "Condições de uso do site da Associação Médica de Imperatriz.",
    alternates: { canonical: `/${SLUG}` },
  };
}

const TRILHA = [
  { nome: "Início", caminho: "/" },
  { nome: "Termos de uso", caminho: `/${SLUG}` },
];

/*
  Duas origens possíveis, e a revisada sempre vence.

  Enquanto a AMI não publicar o documento no Studio, entra o rascunho de
  `lib/rascunhosLegais.ts`, com aviso visível de que não passou por advogado.
  A alternativa era esta página dar 404, e num site que lida com saúde a
  ausência de política é falha mais visível do que um rascunho assinalado.

  Publicado o texto revisado, `paginaPorSlug` passa a devolver algo e o ramo
  de cima assume: o rascunho some da tela sem ninguém precisar apagar nada, e
  o aviso some junto com ele.
*/
export default async function PaginaTermos() {
  const revisado = await paginaPorSlug(SLUG);

  if (revisado) return <PaginaDeTexto slug={SLUG} trilha={TRILHA} />;

  return <RascunhoLegalNaTela rascunho={TERMOS} trilha={TRILHA} />;
}
