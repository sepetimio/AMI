import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { ListaDeNoticias } from "@/components/editorial/ListaDeNoticias";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { JsonLd } from "@/components/seo/JsonLd";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { LIMITE_DA_LISTA, listaDeNoticias } from "@/lib/noticias";
import { listarNoticias } from "@/lib/sanity/consultas";
import { itemList } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: tituloDePagina("Notícias da Associação Médica de Imperatriz"),
  description:
    "Comunicados, eventos e notas da Associação Médica de Imperatriz, " +
    "assinados por médicos com CRM.",
  alternates: { canonical: "/noticias" },
};

/*
  A lista de notícias (item "Notícias" do menu), como no desenho aprovado
  (docs/desenho-aprovado/noticias-contato/noticias.html):
  - a faixa verde curta, com o rótulo, o título, a frase e o jornal no
    ladrilho;
  - a lista: a mais recente em destaque e as outras em cartões, no arranjo
    da home para poucas notícias; sem notícia, as molduras da home na
    demonstração, ou a frase de lista vazia fora dela (`listaDeNoticias`,
    lib/noticias.ts).

  No máximo 20, como antes, e sem paginação: "Mais antigas" entra numa
  fatia própria, quando a AMI passar de 20.

  O `ItemList` (spec da fundação, seção 7: toda listagem tem um) só sai
  quando há o que listar: um de zero itens descreve uma página vazia. Sem
  trilha e sem BreadcrumbList: dado estruturado sem o equivalente visível é
  marcação enganosa (lib/seo/jsonld.ts).

  Os blocos são filhos diretos de `.pagina` (app/(site)/encontre.module.css),
  a --ritmo um do outro; a lista fecha a página, a --ritmo do rodapé.
*/
export default async function PaginaNoticias() {
  const noticias = await listarNoticias(LIMITE_DA_LISTA);
  const lista = listaDeNoticias(DADOS_DEMONSTRACAO, noticias);

  return (
    <>
      {lista.tipo === "noticias" ? (
        <JsonLd
          dados={itemList(
            [lista.destaque, ...lista.grade].map((n) => ({ nome: n.titulo, caminho: `/noticias/${n.slug}` })),
            SITE,
          )}
        />
      ) : null}

      <div className={paginas.pagina}>
        <FaixaCurta
          rotulo="Notícias"
          titulo="Notícias da AMI"
          texto="Comunicados, eventos e notas da associação. Cada texto é assinado por um médico, com o número de inscrição no CRM."
          icone="jornal"
        />
        <ListaDeNoticias lista={lista} />
      </div>
    </>
  );
}
