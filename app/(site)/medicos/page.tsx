import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { contagem } from "@/lib/formato";

/* Revalidação a cada hora: o cadastro muda algumas vezes por semana, e servir
   HTML pronto é o que segura o LCP abaixo de 2,5s em 4G. */
export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  /* Contagem de profissionais, não soma por especialidade: quem tem duas
     especialidades entraria duas vezes na soma. `buscarMedicos` é memoizada
     por requisição, então isto não é uma segunda ida ao banco. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return {
    title: `Médicos em Imperatriz - MA | ${total} profissionais | AMI`,
    description:
      `${total} médicos em ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Veja endereço, telefone e horários de atendimento.`,
    alternates: { canonical: "/medicos" },
  };
}

export default async function PaginaMedicos() {
  /* Mesmo raciocínio do `generateMetadata`: total = profissionais
     publicados, não a soma das contagens por especialidade. */
  const [especialidades, bairros, total] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <Breadcrumb itens={trilha} />

      {/* Ritmo vertical variado de propósito: bloco de abertura com respiro,
          lista densa logo abaixo. */}
      <div className="pb-10 pt-4">
        <h1>Médicos em Imperatriz</h1>
        <p className="coluna-leitura mt-4 text-ink-600">
          {contagem(total, "profissional", "profissionais")} em{" "}
          {contagem(especialidades.length, "especialidade", "especialidades")},
          com endereço, telefone e horários por dia da semana. Todos os
          registros trazem o CRM, conforme exige a Resolução CFM 2.336/2023.
        </p>
      </div>

      <section aria-labelledby="por-especialidade" className="pb-14">
        <h2 id="por-especialidade" className="border-b border-line-strong pb-3">
          Por especialidade
        </h2>
        {/* Lista em duas colunas, separada por fios — não grade de cartões. */}
        <ul className="mt-1 gap-x-10 md:columns-2">
          {especialidades.map((e) => (
            <li key={e.slug} className="break-inside-avoid border-b border-line">
              <Link
                href={`/medicos/${e.slug}`}
                className="flex min-h-11 items-center justify-between gap-4 py-2.5 text-ami-green-600 hover:bg-ami-mint-100"
              >
                <span className="font-semibold">{e.nome}</span>
                <span className="numero-tabular text-[15px] text-ink-400">
                  {e.total}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="por-bairro" className="pb-16">
        <h2 id="por-bairro" className="border-b border-line-strong pb-3">
          Por bairro
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {bairros.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/busca?bairro=${b.slug}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                {b.nome} · {b.total}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
