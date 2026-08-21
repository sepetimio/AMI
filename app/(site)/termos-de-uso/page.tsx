import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

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

export default function PaginaTermos() {
  return (
    <PaginaDeTexto
      slug={SLUG}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "Termos de uso", caminho: `/${SLUG}` },
      ]}
    />
  );
}
