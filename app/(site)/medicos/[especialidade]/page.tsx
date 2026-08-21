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
  /* Mesma condição da página: uma especialidade cadastrada sem nenhum
     profissional publicado não pode gerar metadados — title e description
     afirmariam "0 médicos" para um endereço que nem deveria existir. */
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

  const filtros = filtrosDaQuery(await searchParams);
  const [todosDaEspecialidade, bairros, relacionadas] = await Promise.all([
    buscarMedicos({ especialidade }),
    bairrosComContagem(especialidade),
    especialidadesComContagem(),
  ]);
  /*
    A checagem de lista vazia é explícita, e não redundante — mesmo raciocínio
    do cruzamento em `[bairro]/page.tsx`. Uma especialidade cadastrada sem
    nenhum profissional publicado (a linha existe, mas ninguém a preenche
    ainda) passaria pelo `if (!esp)` inteira e renderizaria um H1 de verdade
    sobre "reúne 0 médicos de X, somando 0 endereços de atendimento" —
    indexável e canônica para si mesma.
  */
  if (!esp || todosDaEspecialidade.length === 0) notFound();

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
            {/* Conteúdo de saúde é avaliado sob critério YMYL: sem autoria
                creditada e data de revisão, não ranqueia por melhor feito
                que seja. Os valores entram quando a AMI indicar o revisor. */}
            <p className="text-[15px] text-ink-400">
              <strong className="font-semibold text-ink-600">
                Revisado por
              </strong>{" "}
              [PROVISÓRIO — nome do médico revisor] · CRM/MA [PROVISÓRIO] ·
              revisão em [PROVISÓRIO — data]. Conteúdo informativo; não
              substitui a consulta médica.
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
