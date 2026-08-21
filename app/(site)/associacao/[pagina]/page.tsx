import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

/*
  Lista fechada, espelhando as opções do campo `slug` no schema. Sem ela, um
  slug qualquer no endereço faria uma consulta ao Sanity que volta vazia e cai
  em 404 mesmo, só que depois de uma ida à rede. Com ela, o 404 é imediato e
  o `generateStaticParams` sabe o que pré-renderizar.

  "diretoria" e "associacao" não entram aqui: a primeira é a rota estática de
  `app/(site)/associacao/diretoria/page.tsx` (o Next resolve segmento
  estático antes de dinâmico, então esta rota nunca a vê), e a segunda é
  `app/(site)/associacao/page.tsx`, o índice, que não é prosa pura e por isso
  não usa `PaginaDeTexto`.
*/
const PAGINAS = ["beneficios", "estatuto", "politica-editorial"] as const;

type Props = { params: Promise<{ pagina: string }> };

export function generateStaticParams() {
  return PAGINAS.map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const conteudo = await paginaPorSlug(pagina);
  if (!conteudo) return {};

  return {
    title: `${conteudo.titulo} | AMI`,
    description: conteudo.resumo,
    alternates: { canonical: `/associacao/${pagina}` },
  };
}

export default async function SubpaginaDaAssociacao({ params }: Props) {
  const { pagina } = await params;
  if (!PAGINAS.includes(pagina as (typeof PAGINAS)[number])) notFound();

  const conteudo = await paginaPorSlug(pagina);
  if (!conteudo) notFound();

  return (
    <PaginaDeTexto
      slug={pagina}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "A Associação", caminho: "/associacao" },
        { nome: conteudo.titulo, caminho: `/associacao/${pagina}` },
      ]}
    />
  );
}
