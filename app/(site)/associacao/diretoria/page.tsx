import type { Metadata } from "next";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { CartaoDiretor } from "@/components/diretorio/CartaoDiretor";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";
import { listarDiretoria } from "@/lib/dados/diretoria";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: tituloDePagina("Diretoria da Associação Médica de Imperatriz"),
  description:
    "Quem responde pela Associação Médica de Imperatriz, com cargo, nome e " +
    "número de inscrição no CRM.",
  alternates: { canonical: "/associacao/diretoria" },
};

export default async function PaginaDiretoria() {
  const diretoria = await listarDiretoria();

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "A Associação", caminho: "/associacao" },
    { nome: "Diretoria", caminho: "/associacao/diretoria" },
  ];

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira trilha={trilha} titulo="Diretoria da AMI">
        Quem responde pela associação. Cada nome traz o número de inscrição no
        CRM, e leva ao perfil no diretório quando há um publicado.
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
        {diretoria.length === 0 ? (
          <EstadoVazio
            titulo="Diretoria ainda não cadastrada"
            descricao="A composição da diretoria aparece aqui assim que a AMI a registrar."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {diretoria.map((d) => (
              <li key={d.id}>
                <CartaoDiretor diretor={d} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
