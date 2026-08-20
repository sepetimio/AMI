import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { PainelFiltros } from "@/components/diretorio/PainelFiltros";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, itemList } from "@/lib/seo/jsonld";
import {
  MINIMO_PARA_INDEXAR,
  facetaEhIndexavel,
  paragrafoDeAbertura,
  resumirFaceta,
} from "@/lib/dados/facetas";
import { filtrosDaQuery } from "@/lib/dados/urlFiltros";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  bairrosComContagem,
  especialidadePorSlug,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { descricaoEspecialidade, tituloEspecialidade } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* No Next 16, params e searchParams são Promise e precisam de await. */
type Props = {
  params: Promise<{ especialidade: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const especialidades = await especialidadesComContagem();
  return especialidades.map((e) => ({ especialidade: e.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);
  if (!esp) return {};

  const sp = await searchParams;
  const temFiltroDeQuery = Object.keys(sp).length > 0;

  const medicos = await buscarMedicos({ especialidade });
  /* `especialidadePorSlug` lê a tabela `especialidade` direto, sem olhar se
     algum profissional nela está publicado — então uma especialidade zerada
     resolveria aqui e produziria metadados para uma página vazia. O mesmo
     corte de `especialidadesComContagem` (que já omite isso da listagem)
     vale para a página individual: sem profissional publicado, a rota é
     404, não uma página com título e descrição sobre nada. */
  if (medicos.length === 0) return {};

  const bairros = [
    ...new Set(medicos.flatMap((m) => m.locais.map((l) => l.bairro.nome))),
  ];

  return {
    title: tituloEspecialidade(esp.nome, medicos.length),
    description: descricaoEspecialidade(esp.nome, medicos.length, bairros),
    alternates: { canonical: `/medicos/${especialidade}` },
    /* Filtro em querystring nunca entra no índice: combinações geram milhares
       de endereços quase iguais. O canonical continua apontando para a página
       limpa, e `follow` mantém os links rastreáveis. */
    ...(temFiltroDeQuery
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function PaginaEspecialidade({
  params,
  searchParams,
}: Props) {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);
  if (!esp) notFound();

  const filtros = filtrosDaQuery(await searchParams);
  const [todosDaEspecialidade, bairros, relacionadas] = await Promise.all([
    buscarMedicos({ especialidade }),
    bairrosComContagem(especialidade),
    especialidadesComContagem(),
  ]);
  /* Mesma razão do guard em generateMetadata: uma especialidade cadastrada
     sem nenhum profissional publicado não vira página — viraria título e
     parágrafo gerado falando de zero médicos, o que é pior que a rota não
     existir. */
  if (todosDaEspecialidade.length === 0) notFound();

  const medicos = await buscarMedicos({ ...filtros, especialidade });

  const resumo = resumirFaceta(todosDaEspecialidade, esp.nome);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    { nome: esp.nome, caminho: `/medicos/${especialidade}` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <JsonLd dados={itemList(medicos, SITE)} />
      <Breadcrumb itens={trilha} />

      <div className="pb-8 pt-4">
        <h1>{esp.nome} em Imperatriz - MA</h1>
        {/* Gerado dos dados reais, nunca texto-modelo com a palavra trocada. */}
        <p className="coluna-leitura mt-4 text-ink-600">
          {paragrafoDeAbertura(resumo)}
        </p>
      </div>

      <div className="grid gap-8 pb-14 md:grid-cols-[260px_1fr]">
        <PainelFiltros bairros={bairros} total={medicos.length} />
        <div>
          <h2 className="sr-only">Resultados</h2>
          <ListaMedicos
            medicos={medicos}
            filtroMaisRestritivo={
              filtros.acessibilidade?.length
                ? "acessibilidade"
                : filtros.bairro
                  ? "bairro"
                  : undefined
            }
          />
        </div>
      </div>

      {/* Conteúdo informativo com autoria creditada: sem isso, um site de
          saúde não passa no critério YMYL do Google. */}
      {esp.oQueFaz || esp.quandoProcurar ? (
        <section
          aria-labelledby="sobre-a-especialidade"
          className="border-t border-line-strong py-14"
        >
          <h2 id="sobre-a-especialidade">Sobre {esp.nome.toLowerCase()}</h2>
          <div className="coluna-leitura mt-5 space-y-5 text-ink-600">
            {esp.oQueFaz ? (
              <div>
                <h3>O que faz este especialista</h3>
                <p className="mt-2">{esp.oQueFaz}</p>
              </div>
            ) : null}
            {esp.quandoProcurar ? (
              <div>
                <h3>Quando procurar</h3>
                <p className="mt-2">{esp.quandoProcurar}</p>
              </div>
            ) : null}
            <p className="text-[15px] text-ink-400">
              Revisão médica [PROVISÓRIO — creditar nome, CRM e data da
              revisão]. Conteúdo informativo; não substitui a consulta.
            </p>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="links-internos"
        className="border-t border-line-strong py-14"
      >
        <h2 id="links-internos" className="sr-only">
          Navegação relacionada
        </h2>

        <h3>{esp.nome} por bairro</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {bairros.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/medicos/${especialidade}/${b.slug}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                {b.nome} · {b.total}
                {/* O usuário merece saber que a página existe mesmo quando é
                    pequena demais para entrar no índice. */}
                {!facetaEhIndexavel(b.total) ? (
                  <span className="ml-1 text-ink-400">
                    (menos de {MINIMO_PARA_INDEXAR})
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mt-10">Outras especialidades</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {relacionadas
            .filter((e) => e.slug !== especialidade)
            .slice(0, 12)
            .map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/medicos/${e.slug}`}
                  className="inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
                >
                  {e.nome}
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
