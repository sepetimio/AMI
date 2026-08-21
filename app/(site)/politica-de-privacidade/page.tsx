import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SLUG = "politica-de-privacidade";

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug(SLUG);
  return {
    title: "Política de privacidade | AMI",
    description:
      conteudo?.resumo ??
      "Como a Associação Médica de Imperatriz trata dados pessoais.",
    alternates: { canonical: `/${SLUG}` },
  };
}

export default function PaginaPrivacidade() {
  return (
    <PaginaDeTexto
      slug={SLUG}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "Política de privacidade", caminho: `/${SLUG}` },
      ]}
    />
  );
}
