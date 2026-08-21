import type { Metadata } from "next";
import Link from "next/link";
import { Simbolo } from "@/components/marca/Simbolo";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationAmi } from "@/lib/seo/jsonld";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { contagem } from "@/lib/formato";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  /* Não soma as contagens por especialidade: quem tem duas especialidades
     entraria duas vezes ali, e o total deixaria de bater com a contagem real
     de profissionais publicados que `/busca` lista. `buscarMedicos` já é
     memoizada por requisição, então isto não custa uma segunda ida ao banco. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return {
    title: "Associação Médica de Imperatriz",
    description:
      `${total} médicos e ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Filtre por especialidade e bairro, e veja horários.`,
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  /* Mesmo raciocínio do `generateMetadata`: o total vem da contagem de
     profissionais, não da soma por especialidade — que double-conta quem
     tem mais de uma. */
  const [especialidades, bairros, total] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return (
    <>
      <JsonLd dados={organizationAmi(SITE)} />

      {/* --- 1. Herói assimétrico em faixa verde-800 --- */}
      <section className="relative overflow-hidden bg-ami-green-800 pb-24 pt-14 md:pb-32">
        {/* Marca d'água: uso estrutural do símbolo, cortado pela borda.
            É a primeira das no máximo duas aparições por página. */}
        <Simbolo className="pointer-events-none absolute -right-16 top-0 h-full w-auto opacity-[0.05]" />

        <div className="mx-auto grid max-w-[1200px] grid-cols-12 px-4 md:px-6">
          <div className="col-span-12 md:col-span-7">
            <p className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-ami-mint-400">
              Associação Médica de Imperatriz
            </p>
            <h1 className="mt-3 text-white">
              Encontre o médico certo em Imperatriz
            </h1>
            {/* Números contados do banco. Nunca escritos à mão. */}
            <p className="numero-tabular mt-5 max-w-[46ch] text-[19px] text-ami-mint-400">
              {contagem(total, "médico", "médicos")} em{" "}
              {contagem(especialidades.length, "especialidade", "especialidades")}
              , atendendo em {contagem(bairros.length, "bairro", "bairros")}.
              Filtre por especialidade e bairro.
            </p>
          </div>
        </div>
      </section>

      {/* --- 2. Cartão de busca invadindo a faixa: única sombra do site --- */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Formulário HTML de verdade, com method GET: funciona sem
            JavaScript e o resultado vira uma URL compartilhável. */}
        <form
          action="/busca"
          method="get"
          className="-mt-14 rounded-bloco bg-surface p-5 shadow-[0_8px_24px_rgba(6,33,15,.14)] md:p-6"
        >
          <h2 className="text-[21px] font-semibold">Buscar</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px_auto]">
            <div>
              <label
                htmlFor="busca-termo"
                className="block text-[15px] font-semibold"
              >
                Especialidade ou nome
              </label>
              <input
                id="busca-termo"
                name="termo"
                type="search"
                placeholder="Cardiologia, Mayara Viana…"
                className="mt-1.5 min-h-11 w-full rounded-controle border border-line px-3 text-[15px] placeholder:text-ink-300"
              />
            </div>
            <div>
              <label
                htmlFor="busca-bairro"
                className="block text-[15px] font-semibold"
              >
                Bairro
              </label>
              <select
                id="busca-bairro"
                name="bairro"
                className="mt-1.5 min-h-11 w-full rounded-controle border border-line bg-surface px-3 text-[15px]"
              >
                <option value="">Todos</option>
                {bairros.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-auto min-h-11 rounded-controle bg-ami-green-600 px-6 font-semibold text-white hover:bg-ami-green-700"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* --- 3. Chips das especialidades com mais profissionais --- */}
      <section
        aria-labelledby="mais-buscadas"
        className="mx-auto max-w-[1200px] px-4 py-12 md:px-6"
      >
        <h2 id="mais-buscadas" className="sr-only">
          Especialidades com mais profissionais
        </h2>
        <ul className="flex flex-wrap gap-2">
          {especialidades.slice(0, 8).map((e) => (
            <li key={e.slug}>
              <Link
                href={`/medicos/${e.slug}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                {e.nome} · {e.total}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* --- 4. Acesso rápido em fios, não em cartões --- */}
      <section
        aria-labelledby="acesso-rapido"
        className="mx-auto max-w-[1200px] px-4 pb-14 md:px-6"
      >
        <h2 id="acesso-rapido" className="border-b border-line-strong pb-3">
          Acesso rápido
        </h2>
        <ul className="grid md:grid-cols-3">
          {[
            {
              titulo: "Por especialidade",
              texto: `${especialidades.length} especialidades com profissional publicado.`,
              href: "/medicos",
            },
            {
              titulo: "Por bairro",
              texto: `Atendimento em ${bairros.length} bairros de Imperatriz.`,
              /* Âncora: /medicos abre no índice de especialidades e o bloco
                 de bairros fica abaixo. Sem ela o leitor cai no lugar errado. */
              href: "/medicos#por-bairro",
            },
            {
              titulo: "A Associação",
              texto: "Quem é a AMI, diretoria e como se associar.",
              href: "/associacao",
            },
          ].map((item) => (
            <li key={item.titulo} className="border-b border-line">
              <Link
                href={item.href}
                className="block py-5 pr-4 hover:bg-ami-mint-100 md:pr-8"
              >
                <span className="block font-semibold text-ami-green-600">
                  {item.titulo}
                </span>
                <span className="mt-1 block text-[15px] text-ink-600">
                  {item.texto}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* --- 5. Faixa institucional em verde-900, respiro maior --- */}
      <section
        aria-labelledby="institucional"
        className="bg-ami-green-900 py-20 text-ami-mint-400"
      >
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <h2 id="institucional" className="text-white">
            A entidade que representa os médicos de Imperatriz
          </h2>
          <p className="coluna-leitura mt-4">
            A AMI reúne os profissionais que atendem em Imperatriz e na região
            sul do Maranhão. Este diretório existe para que a população encontre
            quem atende perto de casa, com informação correta e verificada.
          </p>
          <p className="mt-6">
            <Link
              href="/associacao"
              className="inline-flex min-h-11 items-center font-semibold text-white underline"
            >
              Conhecer a Associação
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
