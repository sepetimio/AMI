import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, comoItensDeLista, itemList } from "@/lib/seo/jsonld";
import {
  MINIMO_PARA_INDEXAR,
  facetaEhIndexavel,
  paragrafoDeAbertura,
  resumirFaceta,
} from "@/lib/dados/facetas";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  bairrosComContagem,
  especialidadePorSlug,
} from "@/lib/dados/especialidades";
import { descricaoFaceta, tituloFaceta } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = {
  params: Promise<{ especialidade: string; bairro: string }>;
};

/* Sem generateStaticParams: são centenas de combinações e a maioria não tem
   ninguém. As páginas nascem sob demanda e a revalidação cuida do resto. */

async function carregar(especialidadeSlug: string, bairroSlug: string) {
  const [esp, medicos, bairros] = await Promise.all([
    especialidadePorSlug(especialidadeSlug),
    buscarMedicos({ especialidade: especialidadeSlug, bairro: bairroSlug }),
    bairrosComContagem(especialidadeSlug),
  ]);
  const bairro = bairros.find((b) => b.slug === bairroSlug);
  return { esp, medicos, bairro, bairros };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { especialidade, bairro } = await params;
  const { esp, medicos, bairro: b } = await carregar(especialidade, bairro);
  if (!esp || !b || medicos.length === 0) return {};

  const indexavel = facetaEhIndexavel(medicos.length);

  return {
    title: tituloFaceta(esp.nome, b.nome, medicos.length),
    /* Builder próprio da faceta de cruzamento, não `descricaoEspecialidade`:
       com todos os profissionais concentrados num bairro só e total >= 3, as
       duas funções receberiam os mesmos argumentos e emitiriam a mesma
       description — mas esta página e a de especialidade são indexáveis com
       canonicals diferentes. */
    description: descricaoFaceta(esp.nome, b.nome, medicos.length),
    /*
      Abaixo do corte, a página existe, funciona e é navegável — mas sai
      `noindex, follow`, com o canonical apontando para a especialidade.
      Conforme a AMI cadastra mais gente, ela entra no índice sozinha: a
      contagem vem do banco, não de uma lista escrita à mão.
    */
    alternates: {
      canonical: indexavel
        ? `/medicos/${especialidade}/${bairro}`
        : `/medicos/${especialidade}`,
    },
    ...(indexavel ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function PaginaFaceta({ params }: Props) {
  const { especialidade, bairro } = await params;
  const { esp, medicos, bairro: b, bairros } = await carregar(
    especialidade,
    bairro,
  );
  /*
    A checagem de lista vazia é explícita, e não redundante.

    Hoje `b` já sai indefinido para um cruzamento sem ninguém, porque
    `bairrosComContagem` só devolve bairro com oferta. Mas isso é uma
    propriedade daquela função, não um contrato desta página. Se um dia ela
    passar a listar todos os bairros — como o rodapé faz —, sem esta linha a
    página renderizaria um H1 de verdade sobre "reúne 0 cardiologistas no
    Santa Rita, somando 0 endereços de atendimento".
  */
  if (!esp || !b || medicos.length === 0) notFound();

  const resumo = resumirFaceta(medicos, esp.nome, b.nome);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    { nome: esp.nome, caminho: `/medicos/${especialidade}` },
    { nome: b.nome, caminho: `/medicos/${especialidade}/${bairro}` },
  ];

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <JsonLd dados={itemList(comoItensDeLista(medicos), SITE)} />

      <Cabeceira
        trilha={trilha}
        titulo={`${esp.nome} no bairro ${b.nome}, Imperatriz - MA`}
        contagem={medicos.length}
        rotuloContagem={
          medicos.length === 1
            ? "profissional publicado"
            : "profissionais publicados"
        }
      >
        {/* Gerado dos dados reais, nunca texto-modelo com a palavra trocada. */}
        {paragrafoDeAbertura(resumo)}
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <div className="pt-10">
        <h2 className="sr-only">Resultados</h2>
        <ListaMedicos medicos={medicos} filtroMaisRestritivo="bairro" />
      </div>

      <section
        aria-labelledby="outros-bairros"
        className="border-t border-line-strong py-14"
      >
        <h2 id="outros-bairros">
          {esp.nome} em outros bairros de Imperatriz
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {bairros
            .filter((outro) => outro.slug !== bairro)
            .map((outro) => (
              <li key={outro.slug}>
                <Link
                  href={`/medicos/${especialidade}/${outro.slug}`}
                  className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
                >
                  {outro.nome} · {outro.total}
                  {/* Mesma anotação da página de especialidade: o usuário
                      merece saber que a página existe mesmo abaixo do corte
                      de indexação. */}
                  {!facetaEhIndexavel(outro.total) ? (
                    <span className="ml-1 text-ink-400">
                      (menos de {MINIMO_PARA_INDEXAR})
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
        </ul>
        <p className="mt-6">
          <Link
            href={`/medicos/${especialidade}`}
            className="font-semibold text-ami-green-600 underline"
          >
            Ver todos os profissionais de {esp.nome.toLowerCase()} em Imperatriz
          </Link>
        </p>
      </section>
      </div>
    </>
  );
}
