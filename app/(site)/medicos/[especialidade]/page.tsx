import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, comoItensDeLista, itemList } from "@/lib/seo/jsonld";
import { paragrafoDeAbertura, resumirFaceta } from "@/lib/dados/facetas";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  especialidadePorSlug,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { descricaoEspecialidade, tituloEspecialidade } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* No Next 16, params é Promise e precisa de await. Nada aqui lê
   `searchParams`: ler a querystring, mesmo só nos metadados, faz a página
   ser montada a cada visita, e ela deixaria de sair pronta do build
   (`generateStaticParams`) e de ser refeita só a cada `revalidate`. */
type Props = {
  params: Promise<{ especialidade: string }>;
};

export async function generateStaticParams() {
  const especialidades = await especialidadesComContagem();
  return especialidades.map((e) => ({ especialidade: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);
  if (!esp) return {};

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
    /* O mesmo endereço com qualquer querystring mostra a mesma página: o
       canonical aponta para o endereço limpo, e é ele que entra no índice. */
    alternates: { canonical: `/medicos/${especialidade}` },
  };
}

export default async function PaginaEspecialidade({ params }: Props) {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);

  const [todosDaEspecialidade, relacionadas] = await Promise.all([
    buscarMedicos({ especialidade }),
    especialidadesComContagem(),
  ]);
  /*
    A checagem de lista vazia é explícita, e não redundante: uma
    especialidade cadastrada sem nenhum profissional publicado (a linha
    existe, mas ninguém a preenche ainda) passaria pelo `if (!esp)` inteira
    e renderizaria um H1 de verdade
    sobre "reúne 0 médicos de X, somando 0 endereços de atendimento" —
    indexável e canônica para si mesma.
  */
  if (!esp || todosDaEspecialidade.length === 0) notFound();

  const medicos = todosDaEspecialidade;

  const resumo = resumirFaceta(todosDaEspecialidade, esp.nome);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    { nome: esp.nome, caminho: `/medicos/${especialidade}` },
  ];

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <JsonLd dados={itemList(comoItensDeLista(medicos), SITE)} />

      {/*
        Cabeceira própria, sangrando de borda a borda.

        Esta é a página que o Google traz tráfego, e era um h1 solto sobre o
        cinza da página, indistinguível do resultado de busca livre logo ao
        lado. A faixa clara de borda a borda, com o símbolo em máscara, é a
        `Cabeceira` que abre as páginas internas (a busca e o perfil do médico
        não a têm) — o comentário de
        components/layout/Cabeceira.tsx diz como ela conversa com as faixas
        de ponta a ponta da home.

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
      {/* A grade de cartões da busca, sem filtro: a página já é a
          especialidade, e os filtros de bairro, telemedicina, acessibilidade
          e associados saíram do site. Os quatro primeiros cartões, a primeira
          fileira no computador, baixam a foto logo, como na busca. */}
      <section aria-labelledby="medicos-da-especialidade" className="py-10">
        <h2 id="medicos-da-especialidade" className="sr-only">
          {`Médicos de ${esp.nome}`}
        </h2>
        <GradeMedicos medicos={medicos} imediatos={4} />
      </section>

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

        <h3>Outras especialidades</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {relacionadas
            .filter((e) => e.slug !== especialidade)
            .slice(0, 12)
            .map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/medicos/${e.slug}`}
                  className="inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:border-line-strong"
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
