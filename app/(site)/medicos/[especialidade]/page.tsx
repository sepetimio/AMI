import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { LadrilhosBairros } from "@/components/diretorio/LadrilhosBairros";
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
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <JsonLd dados={itemList(medicos, SITE)} />

      {/*
        Cabeceira própria, sangrando de borda a borda.

        Esta é a página que o Google traz tráfego, e era um h1 solto sobre o
        cinza da página, indistinguível do resultado de busca livre logo ao
        lado. A faixa branca com o símbolo em máscara dá a ela a mesma
        gramática do herói da home, uma oitava abaixo: lá o símbolo é verde
        sobre verde escuro, aqui é verde claríssimo sobre branco.

        A contagem sai grande, em monoespaçada de registro. É a informação que
        a pessoa veio buscar antes de qualquer outra: quantos existem.
      */}
      <Cabeceira
        trilha={trilha}
        titulo={`${esp.nome} em Imperatriz - MA`}
        contagem={todosDaEspecialidade.length}
        rotuloContagem={
          todosDaEspecialidade.length === 1
            ? "profissional publicado"
            : "profissionais publicados"
        }
      >
        {/* Gerado dos dados reais, nunca texto-modelo com a palavra trocada. */}
        {paragrafoDeAbertura(resumo)}
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <div className="grid gap-8 py-10 md:grid-cols-[260px_1fr]">
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
            <div className="border-t border-line pt-5 text-[15px] text-ink-400">
              <p>
                <strong className="font-semibold text-ink-600">
                  Revisado por
                </strong>{" "}
                [PROVISÓRIO: nome do médico revisor]
              </p>
              <p className="registro mt-1">
                CRM/MA [PROVISÓRIO], revisão em [PROVISÓRIO: data]
              </p>
              <p className="mt-2">
                Conteúdo informativo; não substitui a consulta médica.
              </p>
            </div>       </div>
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
        <div className="mt-5">
          <LadrilhosBairros
            itens={bairros}
            href={(slug) => `/medicos/${especialidade}/${slug}`}
            /* O usuário merece saber que a página existe mesmo quando é
               pequena demais para entrar no índice de busca. */
            nota={(b) =>
              facetaEhIndexavel(b.total)
                ? null
                : `menos de ${MINIMO_PARA_INDEXAR} profissionais`
            }
          />
        </div>   <h3 className="mt-10">Outras especialidades</h3>
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
    </>
  );
}
