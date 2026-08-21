import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
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

export default function PaginaCookies() {
  return (
    <PaginaDeTexto
      slug={SLUG}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "Política de cookies", caminho: `/${SLUG}` },
      ]}
    />
  );
}
