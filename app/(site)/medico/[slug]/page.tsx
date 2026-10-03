import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import paginas from "@/app/(site)/encontre.module.css";
import { Icone } from "@/components/base/Icone";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import { BarraDoMedico } from "@/components/perfil/BarraDoMedico";
import { OndeAtende } from "@/components/perfil/OndeAtende";
import styles from "@/components/perfil/Perfil.module.css";
import { TopoDoPerfil } from "@/components/perfil/TopoDoPerfil";
import { JsonLd } from "@/components/seo/JsonLd";
import { buscarMedicos, medicoPorSlug, slugsDeMedicos } from "@/lib/dados/medicos";
import { consultorioPrincipal, especialidadePrincipal, numeroPreenchido, outrosMedicos, paragrafosDaBio } from "@/lib/encontre";
import { physician } from "@/lib/seo/jsonld";
import { descricaoMedico, tituloMedico } from "@/lib/seo/metadados";

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

  const principal = especialidadePrincipal(m);
  const bairros = [...new Set(m.locais.map((l) => l.bairro.nome))];

  return {
    title: tituloMedico(m.nome, principal?.nome ?? null),
    description: descricaoMedico(m.nome, principal?.nome ?? null, bairros),
    alternates: { canonical: `/medico/${slug}` },
  };
}

/*
  O perfil do médico: o topo (retrato, nome, CRM, especialidade e os botões
  do consultório principal), "Onde atende", "Sobre", "Outros médicos de
  {especialidade}" e a nota final. Sem a `Cabeceira` das outras páginas
  internas e sem breadcrumb visível, como no desenho aprovado.

  "Sobre" só sai com biografia; "Outros médicos", só com algum (até quatro,
  da mesma especialidade principal, em ordem alfabética: `outrosMedicos`,
  lib/encontre.ts).

  O JSON-LD é só o do médico (`physician`). Sem o BreadcrumbList, porque a
  trilha não aparece na tela: dado estruturado sem o equivalente visível é
  marcação enganosa (components/layout/Breadcrumb.tsx).
*/
export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) notFound();

  const principal = especialidadePrincipal(m);
  const outros = outrosMedicos(m, await buscarMedicos());
  const bio = paragrafosDaBio(m.bio ?? "");
  const consultorio = consultorioPrincipal(m);
  const telefone = numeroPreenchido(consultorio?.telefone);

  return (
    <div className={paginas.pagina}>
      <JsonLd dados={physician(m, SITE)} />

      <TopoDoPerfil medico={m} />

      {m.locais.length > 0 ? <OndeAtende locais={m.locais} /> : null}

      {bio.length > 0 ? (
        <section data-bloco="sobre" aria-labelledby="sobre-titulo" className="revelar">
          <div className={styles.leitura}>
            <h2 id="sobre-titulo" className={styles.titulo} data-coluna="">
              Sobre
            </h2>
            {bio.map((paragrafo, i) => (
              <p key={i}>{paragrafo}</p>
            ))}
          </div>
        </section>
      ) : null}

      {principal && outros.length > 0 ? (
        <section data-bloco="outros" aria-labelledby="outros-titulo" className="revelar">
          <div className={styles.cabSecao}>
            <h2 id="outros-titulo" className={styles.titulo} data-coluna="">
              {`Outros médicos de ${principal.nome}`}
            </h2>
            <Link href={`/medicos/${principal.slug}`} className="botao-linha">
              {`Ver todos de ${principal.nome}`} <Icone nome="seta" />
            </Link>
          </div>
          <GradeMedicos medicos={outros} />
        </section>
      ) : null}

      <div data-bloco="nota">
        <p className={styles.notaFinal} data-coluna="">
          As informações desta página são fornecidas pelo profissional e
          revisadas pela Associação Médica de Imperatriz. Conteúdo informativo;
          não substitui a consulta médica.
        </p>
      </div>

      {/* No celular: "Ligar" e "WhatsApp" do consultório principal, quando os
          botões do topo saem da tela. Sem telefone ali, fica a barra padrão
          do site. */}
      {telefone ? (
        <BarraDoMedico nome={m.nome} telefone={telefone} whatsapp={numeroPreenchido(consultorio?.whatsapp)} />
      ) : null}
    </div>
  );
}
