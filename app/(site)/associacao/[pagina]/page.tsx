import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import {
  paginaPorSlug,
  slugsDePaginasSobAssociacao,
} from "@/lib/sanity/consultas";

export const revalidate = 3600;

/*
  Derivada de `CAMINHO_DAS_PAGINAS`, em `lib/sanity/consultas.ts`, e não mais
  escrita à mão aqui. Antes desta rodada de revisão, este array e aquele
  mapeamento eram duas listas independentes com o mesmo conteúdo, e nada
  impedia que divergissem: quem acrescentasse uma sétima página sob
  `/associacao` e esquecesse de mexer aqui teria uma página que renderiza
  normalmente e nunca aparece no sitemap. Ver o comentário completo sobre a
  direção da correção em `slugsDePaginasSobAssociacao`.

  "diretoria" e "associacao" não entram aqui: a primeira é a rota estática de
  `app/(site)/associacao/diretoria/page.tsx` (o Next resolve segmento
  estático antes de dinâmico, então esta rota nunca a vê), e a segunda é
  `app/(site)/associacao/page.tsx`, o índice, que não é prosa pura e por isso
  não usa `PaginaDeTexto`. Nenhuma das duas está em `CAMINHO_DAS_PAGINAS`.
*/
/* Exportada só para o teste que cruza esta lista com `CAMINHO_DAS_PAGINAS`
   (ver `testes/sanity-consultas.test.ts`): é o jeito de o teste verificar a
   rota de verdade, e não uma cópia do cálculo escrita de novo ali. */
export const PAGINAS = slugsDePaginasSobAssociacao();

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
  if (!PAGINAS.includes(pagina)) notFound();

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
