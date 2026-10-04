import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaleComAmi } from "@/components/associacao/FaleComAmi";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { conteudoDaPagina, iconeDaPagina, VOLTA_ASSOCIACAO } from "@/lib/paginaDeTexto";
import { RASCUNHOS_DE_ASSOCIACAO } from "@/lib/rascunhosLegais";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { slugsDePaginasSobAssociacao } from "@/lib/sanity/paginas";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

/*
  As páginas de texto sob /associacao: Seja associado, Estatuto, Política
  editorial e Benefícios. A lista deriva de `CAMINHO_DAS_PAGINAS`
  (lib/sanity/paginas.ts), a mesma do sitemap e do schema do Studio.

  "diretoria" e "associacao" não entram: a primeira é a rota estática de
  app/(site)/associacao/diretoria/page.tsx (o Next resolve segmento
  estático antes de dinâmico, então esta rota nunca a vê), e a segunda é a
  página institucional, app/(site)/associacao/page.tsx.

  Exportada só para o teste que cruza esta lista com `CAMINHO_DAS_PAGINAS`
  (testes/sanity-paginas.test.ts): é o jeito de o teste verificar a rota
  de verdade, e não uma cópia do cálculo escrita de novo ali.
*/
export const PAGINAS = slugsDePaginasSobAssociacao();

type Props = { params: Promise<{ pagina: string }> };

export function generateStaticParams() {
  return PAGINAS.map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const conteudo = await paginaPorSlug(pagina);
  if (conteudo) {
    return {
      title: tituloDePagina(conteudo.titulo),
      description: conteudo.resumo,
      alternates: { canonical: `/associacao/${pagina}` },
    };
  }

  /* Sem documento no Sanity: o título e a descrição saem do rascunho em
     código, quando existir. Sem rascunho, a página não existe, e não há o
     que anunciar. */
  const rascunho = RASCUNHOS_DE_ASSOCIACAO[pagina];
  if (!rascunho) return {};

  return {
    title: tituloDePagina(rascunho.titulo),
    description: rascunho.resumo,
    alternates: { canonical: `/associacao/${pagina}` },
  };
}

/*
  O texto vem do documento do Studio, quando a AMI publicou; senão, do
  rascunho em código (hoje só "seja-associado", em lib/rascunhosLegais.ts);
  sem os dois, página não encontrada. O revisado sempre vence
  (`conteudoDaPagina`, lib/paginaDeTexto.ts).

  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para A
  Associação. Seja associado fecha a coluna com o quadro "Fale com a AMI"
  (components/associacao/FaleComAmi.tsx), venha o texto do Studio ou do
  rascunho.
*/
export default async function SubpaginaDaAssociacao({ params }: Props) {
  const { pagina } = await params;
  if (!PAGINAS.includes(pagina)) notFound();

  const conteudo = conteudoDaPagina(
    await paginaPorSlug(pagina),
    RASCUNHOS_DE_ASSOCIACAO[pagina],
    DADOS_DEMONSTRACAO,
  );
  if (!conteudo) notFound();

  return (
    <PaginaDeTexto conteudo={conteudo} volta={VOLTA_ASSOCIACAO} icone={iconeDaPagina(pagina)}>
      {pagina === "seja-associado" ? <FaleComAmi /> : null}
    </PaginaDeTexto>
  );
}
