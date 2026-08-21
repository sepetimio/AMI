import type { Metadata } from "next";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { LinhaNoticia } from "@/components/editorial/LinhaNoticia";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, itemList } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";
import { listarNoticias } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: tituloDePagina("Notícias da Associação Médica de Imperatriz"),
  description:
    "Comunicados, eventos e notas da Associação Médica de Imperatriz, " +
    "assinados por médicos com CRM.",
  alternates: { canonical: "/noticias" },
};

export default async function PaginaNoticias() {
  const noticias = await listarNoticias(20);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Notícias", caminho: "/noticias" },
  ];

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      {/* A spec, seção 7, pede ItemList em toda listagem. Só sai quando há o
          que listar: um ItemList de zero itens não informa nada ao Google e
          ainda por cima descreve uma página vazia. */}
      {noticias.length > 0 ? (
        <JsonLd
          dados={itemList(
            noticias.map((n) => ({
              nome: n.titulo,
              caminho: `/noticias/${n.slug}`,
            })),
            SITE,
          )}
        />
      ) : null}

      <Cabeceira
        trilha={trilha}
        titulo="Notícias da AMI"
        contagem={noticias.length}
        rotuloContagem={
          noticias.length === 1 ? "publicação" : "publicações"
        }
      >
        Comunicados, eventos e notas da associação. Cada texto é assinado por
        um médico, com o número de inscrição no CRM.
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
        {/* Sem isto, quem navega por cabeçalhos pula do h1 da Cabeceira
            direto para o h3 de cada LinhaNoticia. Mesma convenção de
            app/(site)/busca/page.tsx e
            app/(site)/medicos/[especialidade]/page.tsx: o h2 marca a região
            de resultados mesmo quando ela está vazia, porque o marco
            precisa existir para quem navega por cabeçalhos encontrar
            "nenhuma publicação" também. */}
        <h2 className="sr-only">Resultados</h2>

        {noticias.length === 0 ? (
          <EstadoVazio
            titulo="Ainda não há publicações"
            descricao="Quando a AMI publicar a primeira notícia, ela aparece aqui."
          />
        ) : (
          <ul className="overflow-hidden rounded-bloco border border-line bg-surface shadow-apoio">
            {noticias.map((n) => (
              <LinhaNoticia key={n.slug} noticia={n} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
