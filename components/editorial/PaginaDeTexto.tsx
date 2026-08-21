import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { TextoRico } from "@/components/editorial/TextoRico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { dataPorExtenso } from "@/lib/formato";
import type { ItemTrilha } from "@/components/layout/Breadcrumb";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Corpo de uma página de PROSA PURA vinda do Sanity: as subpáginas de
  /associacao (benefícios, estatuto, política editorial) e, na tarefa 10, as
  três páginas legais. Todas têm a mesma natureza: sem o documento do Studio
  não sobra nada para mostrar, então a ausência vira 404. Uma página de
  estatuto sem estatuto não é uma página, é casca vazia que o Google indexaria
  como conteúdo raso.

  Esta é a diferença deliberada em relação a `/associacao`, que é
  ÍNDICE, não prosa: o trabalho de um índice é navegação, os caminhos que ele
  aponta vêm do código, e por isso ele nunca chama `notFound()`, mesmo com o
  Sanity vazio. `/associacao/page.tsx` não usa este componente por causa
  disso: a distinção não é um parâmetro booleano aqui dentro (um
  `obrigatoria?: boolean` esconderia a decisão dentro de uma função pensada
  para uma coisa só), é a escolha de qual componente cada rota usa. Só as
  páginas de prosa pura chamam `PaginaDeTexto`.

  A data de atualização sai visível, e não só no metadado: numa política de
  privacidade, saber de quando é a versão que se está lendo é a informação
  mais importante da página depois do próprio texto.
*/
export async function PaginaDeTexto({
  slug,
  trilha,
}: {
  slug: string;
  trilha: ItemTrilha[];
}) {
  const pagina = await paginaPorSlug(slug);
  if (!pagina) notFound();

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira trilha={trilha} titulo={pagina.titulo}>
        {pagina.resumo}
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        <p className="registro border-b border-line py-5 text-[15px] text-ink-400">
          Atualizado em {dataPorExtenso(pagina.atualizadoEm)}
        </p>

        <div className="mt-2">
          <TextoRico blocos={pagina.corpo} />
        </div>
      </div>
    </>
  );
}
