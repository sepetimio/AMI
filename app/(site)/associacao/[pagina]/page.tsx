import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { RascunhoLegalNaTela } from "@/components/editorial/RascunhoLegalNaTela";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { slugsDePaginasSobAssociacao } from "@/lib/sanity/paginas";
import { RASCUNHOS_DE_ASSOCIACAO } from "@/lib/rascunhosLegais";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

/*
  Derivada de `CAMINHO_DAS_PAGINAS`, em `lib/sanity/paginas.ts`, e não mais
  escrita à mão aqui. Antes da rodada 1 de revisão da tarefa 11, este array
  e aquele mapeamento eram duas listas independentes com o mesmo conteúdo,
  e nada impedia que divergissem. A rodada 2 achou uma TERCEIRA lista, em
  `sanity/schemas/paginaInstitucional.ts`, e foi por isso que o mapeamento
  saiu de `lib/sanity/consultas.ts` (que arrasta o cliente do Sanity) e virou
  o módulo `lib/sanity/paginas.ts`, sem import nenhum, importável também
  pelo schema. Ver o comentário completo lá.

  "diretoria" e "associacao" não entram aqui: a primeira é a rota estática de
  `app/(site)/associacao/diretoria/page.tsx` (o Next resolve segmento
  estático antes de dinâmico, então esta rota nunca a vê), e a segunda é
  `app/(site)/associacao/page.tsx`, o índice, que não é prosa pura e por isso
  não usa `PaginaDeTexto`. Nenhuma das duas está em `CAMINHO_DAS_PAGINAS`.
*/
/* Exportada só para o teste que cruza esta lista com `CAMINHO_DAS_PAGINAS`
   (ver `testes/sanity-paginas.test.ts`): é o jeito de o teste verificar a
   rota de verdade, e não uma cópia do cálculo escrita de novo ali. */
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
     código, quando existir, pelo mesmo motivo do componente abaixo — ver o
     comentário lá. Sem rascunho, `generateMetadata` não tem o que anunciar. */
  const rascunho = RASCUNHOS_DE_ASSOCIACAO[pagina];
  if (!rascunho) return {};

  return {
    title: tituloDePagina(rascunho.titulo),
    description: rascunho.resumo,
    alternates: { canonical: `/associacao/${pagina}` },
  };
}

/*
  Duas origens possíveis para uma subpágina, três desfechos.

  Documento publicado no Sanity: `PaginaDeTexto` renderiza o texto revisado.
  Sem documento, mas com rascunho em código para este slug (hoje só
  "seja-associado", em `lib/rascunhosLegais.ts`): `RascunhoLegalNaTela`
  mostra o provisório, com o aviso que o próprio rascunho traz (o de
  Seja associado diz que a página é provisória, sem falar em advogado) — o
  mesmo mecanismo das três páginas legais de primeiro nível
  (/politica-de-privacidade e as outras duas), reaproveitado aqui porque o
  comentário de `RascunhoLegalNaTela` já explica por que a alternativa é
  pior: sem ele, o cartão "Seja associado" da home levaria a 404 até a AMI
  escrever o texto dela.

  Sem documento e sem rascunho (benefícios, estatuto, política editorial,
  hoje): `notFound()`, como sempre foi. Esta mudança vale para as quatro
  subpáginas que passam por esta rota, não só a nova — as três legais
  (política de privacidade, termos de uso, política de cookies) não entram
  aqui, cada uma tem sua própria rota de primeiro nível. Como só
  "seja-associado" tem rascunho, o efeito prático nas outras três é nenhum
  enquanto nenhuma delas ganhar um em código.
*/
export default async function SubpaginaDaAssociacao({ params }: Props) {
  const { pagina } = await params;
  if (!PAGINAS.includes(pagina)) notFound();

  const conteudo = await paginaPorSlug(pagina);

  if (conteudo) {
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

  const rascunho = RASCUNHOS_DE_ASSOCIACAO[pagina];
  if (!rascunho) notFound();

  return (
    <RascunhoLegalNaTela
      rascunho={rascunho}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "A Associação", caminho: "/associacao" },
        { nome: rascunho.titulo, caminho: `/associacao/${pagina}` },
      ]}
    />
  );
}
