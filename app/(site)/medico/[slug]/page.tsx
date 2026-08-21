import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Chip } from "@/components/base/Chip";
import { GradeHorarios } from "@/components/diretorio/GradeHorarios";
import { LinhaMedico } from "@/components/diretorio/LinhaMedico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, physician } from "@/lib/seo/jsonld";
import { buscarMedicos, medicoPorSlug, slugsDeMedicos } from "@/lib/dados/medicos";
import { descricaoMedico, tituloMedico } from "@/lib/seo/metadados";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import { ROTULO_ACESSIBILIDADE } from "@/lib/dados/tipos";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeMedicos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) return {};

  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const bairros = [...new Set(m.locais.map((l) => l.bairro.nome))];

  return {
    title: tituloMedico(m.nome, principal?.nome ?? null),
    description: descricaoMedico(m.nome, principal?.nome ?? null, bairros),
    alternates: { canonical: `/medico/${slug}` },
  };
}

export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) notFound();

  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const bairroPrincipal = m.locais[0]?.bairro;

  /* Profissionais relacionados: linkam para a especialidade e o bairro, o que
     costura a malha interna do site. */
  const relacionados = principal
    ? (await buscarMedicos({ especialidade: principal.slug }))
        .filter((outro) => outro.slug !== m.slug)
        .slice(0, 4)
    : [];

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    ...(principal
      ? [{ nome: principal.nome, caminho: `/medicos/${principal.slug}` }]
      : []),
    { nome: m.nome, caminho: `/medico/${m.slug}` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={physician(m, SITE)} />
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <Breadcrumb itens={trilha} />

      <header className="border-b border-line-strong pb-8 pt-4">
        <h1>{m.nome}</h1>
        {/* Nome e CRM com a palavra MÉDICO — CFM 2.336/2023, Art. 4º, I. */}
        <p className="numero-tabular mt-2 text-[17px] font-semibold text-ink-600">
          {identificacaoMedica(m.crm, m.crmUf)}
        </p>
        {principal ? (
          <p className="mt-1 text-[17px] text-ink-600">
            {principal.nome}
            {principal.rqe ? (
              <span className="numero-tabular"> · RQE {principal.rqe}</span>
            ) : null}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {m.associadoAmi ? <Chip tom="associado">Associado AMI</Chip> : null}
          {m.telemedicina ? <Chip>Atende por telemedicina</Chip> : null}
        </div>
      </header>

      <section aria-labelledby="locais" className="border-b border-line py-12">
        <h2 id="locais">Onde atende</h2>
        <div className="mt-6 space-y-10">
          {m.locais.map((l) => (
            <div key={l.id} className="grid gap-6 md:grid-cols-2">
              <div>
                <h3>{l.bairro.nome}</h3>
                <address className="mt-2 not-italic text-ink-600">
                  {[l.logradouro, l.numero].filter(Boolean).join(", ")}
                  <br />
                  {l.bairro.nome}, Imperatriz - MA
                </address>

                {l.telefone ? (
                  <p className="mt-4">
                    <a
                      href={`tel:+55${l.telefone.replace(/\D/g, "")}`}
                      className="numero-tabular inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 font-semibold text-white hover:bg-ami-green-700"
                    >
                      Ligar {formatarTelefone(l.telefone)}
                    </a>
                  </p>
                ) : null}

                {l.acessibilidade.length || l.estacionamento ? (
                  <ul className="mt-5 space-y-1 text-[15px] text-ink-600">
                    {l.acessibilidade.map((r) => (
                      <li key={r}>{ROTULO_ACESSIBILIDADE[r]}</li>
                    ))}
                    {l.estacionamento ? <li>Estacionamento</li> : null}
                  </ul>
                ) : null}
              </div>

              <div>
                <h3 className="sr-only">Horários em {l.bairro.nome}</h3>
                <GradeHorarios horarios={l.horarios} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {m.bio ? (
        <section aria-labelledby="sobre" className="border-b border-line py-12">
          <h2 id="sobre">Sobre</h2>
          <p className="coluna-leitura mt-4 text-ink-600">{m.bio}</p>
        </section>
      ) : null}

      {relacionados.length ? (
        <section aria-labelledby="relacionados" className="py-12">
          <h2 id="relacionados">
            Outros profissionais de {principal!.nome.toLowerCase()}
          </h2>
          <ul className="mt-4 rounded-bloco border border-line bg-surface px-5">
            {relacionados.map((outro) => (
              <LinhaMedico key={outro.id} medico={outro} />
            ))}
          </ul>
          <p className="mt-6 flex flex-wrap gap-4">
            <Link
              href={`/medicos/${principal!.slug}`}
              className="font-semibold text-ami-green-600 underline"
            >
              Todos de {principal!.nome.toLowerCase()}
            </Link>
            {bairroPrincipal ? (
              <Link
                href={`/medicos/${principal!.slug}/${bairroPrincipal.slug}`}
                className="font-semibold text-ami-green-600 underline"
              >
                {principal!.nome} no bairro {bairroPrincipal.nome}
              </Link>
            ) : null}
          </p>
        </section>
      ) : null}

      <p className="coluna-leitura pb-14 text-[15px] text-ink-400">
        As informações desta página são fornecidas pelo profissional e revisadas
        pela Associação Médica de Imperatriz. Conteúdo informativo; não
        substitui a consulta médica.
      </p>
    </div>
  );
}
