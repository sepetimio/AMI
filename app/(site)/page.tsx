import type { Metadata } from "next";
import Link from "next/link";
import { Fotografia } from "@/components/base/Fotografia";
import { IndiceEspecialidades } from "@/components/diretorio/IndiceEspecialidades";
import { LadrilhosBairros } from "@/components/diretorio/LadrilhosBairros";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationAmi } from "@/lib/seo/jsonld";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";

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
     profissionais, não da soma por especialidade, que double-conta quem tem
     mais de uma. */
  const [especialidades, bairros, total] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return (
    <>
      <JsonLd dados={organizationAmi(SITE)} />

      {/* =====================================================
          1. HERÓI
          Única faixa escura acima do rodapé. O verde deixou de ser
          papel de parede em duas faixas e passou a marcar exatamente
          dois momentos: a cabeceira e o colofão.
          ===================================================== */}
      <section className="relative isolate overflow-hidden bg-ami-green-900 pb-28 pt-16 md:pb-36 md:pt-24">
        {/*
          O símbolo em escala arquitetônica, cortado pela borda direita.

          Antes ele entrava como <img> a 5% de opacidade, que é a definição de
          marca de água: presente o bastante para sujar, fraco demais para
          compor. Aqui ele entra como MÁSCARA sobre um degradê, o que troca
          opacidade por tonalidade. O traço deixa de ser um cinza lavado e vira
          verde de marca embutido no verde escuro, como letra fundida em metal.
          É a diferença entre imprimir cinza e gravar em relevo.

          Some abaixo de md: num celular ele roubaria a largura do título, que
          é o único elemento que precisa dela.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[14%] top-1/2 hidden h-[150%] w-[62%] -translate-y-1/2 md:block"
          style={{
            background:
              "linear-gradient(155deg, var(--color-ami-green-500) 0%, var(--color-ami-green-600) 42%, var(--color-ami-green-800) 100%)",
            opacity: 0.3,
            WebkitMaskImage: "url(/marca/ami-simbolo.svg)",
            maskImage: "url(/marca/ami-simbolo.svg)",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />

        <div className="relative mx-auto grid max-w-[1200px] grid-cols-12 px-4 md:px-6">
          <div className="col-span-12 md:col-span-8 lg:col-span-7">
            <h1 className="texto-placa text-white">
              Encontre um médico em Imperatriz
            </h1>
            {/* Números contados do banco. Nunca escritos à mão. */}
            <p className="mt-6 max-w-[42ch] text-[19px] text-ami-mint-400 md:text-[21px]">
              <span className="registro text-white">{total}</span>{" "}
              {total === 1 ? "profissional" : "profissionais"} em{" "}
              <span className="registro text-white">
                {especialidades.length}
              </span>{" "}
              {especialidades.length === 1 ? "especialidade" : "especialidades"}
              , atendendo em{" "}
              <span className="registro text-white">{bairros.length}</span>{" "}
              {bairros.length === 1 ? "bairro" : "bairros"} da cidade.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          2. BUSCA
          Invade a faixa. É a única superfície flutuante do site, e é
          a que carrega a ação principal.
          ===================================================== */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Formulário HTML de verdade, com method GET: funciona sem
            JavaScript e o resultado vira uma URL compartilhável. */}
        <form
          action="/busca"
          method="get"
          className="-mt-16 rounded-bloco border border-line bg-surface p-5 shadow-flutuante md:-mt-20 md:p-7"
        >
          <h2 className="font-titulo text-[15px] font-bold uppercase tracking-[0.1em] text-ink-400 [font-stretch:88%]">
            Buscar no diretório
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px_auto]">
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
                placeholder="Cardiologista, Mayara Viana…"
                className="pressiona mt-1.5 min-h-12 w-full rounded-controle border border-line-strong bg-canvas px-3.5 text-[16px] placeholder:text-ink-300 focus:border-ami-green-600 focus:bg-surface"
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
                className="pressiona mt-1.5 min-h-12 w-full rounded-controle border border-line-strong bg-canvas px-3.5 text-[16px] focus:border-ami-green-600 focus:bg-surface"
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
              className="pressiona mt-auto min-h-12 rounded-controle bg-ami-green-600 px-8 font-semibold text-white shadow-apoio hover:bg-ami-green-700 hover:shadow-erguido"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          3. ÍNDICE DE ESPECIALIDADES
          Fluxo em colunas, como o índice de um anuário impresso.
          ===================================================== */}
      <section
        aria-labelledby="especialidades"
        className="revelar mx-auto max-w-[1200px] px-4 pb-4 pt-16 md:px-6 md:pt-24"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
          <h2 id="especialidades">Especialidades</h2>
          <Link
            href="/medicos"
            className="pressiona shrink-0 text-[15px] font-semibold text-ami-green-600 hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <IndiceEspecialidades itens={especialidades} />
      </section>

      {/* =====================================================
          4. INSTITUCIONAL
          Claro, com fotografia. Antes era uma segunda faixa verde
          escura com texto solto dentro, o que fazia o verde virar
          decoração em vez de estrutura.
          ===================================================== */}
      <section
        aria-labelledby="institucional"
        className="revelar mx-auto max-w-[1200px] px-4 py-20 md:px-6 md:py-28"
      >
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Moldura concêntrica: casca externa com fio e respiro de 8px,
              miolo com o raio descontado da espessura da casca. É o que faz a
              foto parecer assentada numa moldura, e não colada na página. */}
          <div className="rounded-bloco border border-line bg-surface p-2 shadow-erguido">
            <Fotografia
              espaco="sede"
              sizes="(min-width: 768px) 46vw, 92vw"
              className="h-auto w-full rounded-[6px] object-cover"
            />
          </div>

          <div>
            <h2 id="institucional">
              A entidade que representa os médicos de Imperatriz
            </h2>
            <p className="coluna-leitura mt-5 text-ink-600">
              A AMI reúne os profissionais que atendem em Imperatriz e na região
              sul do Maranhão. Este diretório existe para que a população
              encontre quem atende perto de casa, com informação correta e
              verificada.
            </p>
            <p className="coluna-leitura mt-4 text-ink-600">
              Cada perfil traz nome, número de inscrição no CRM, endereço de
              atendimento e horário. Sem nota, sem classificação e sem destaque
              pago: a ordem é a mesma para todo mundo.
            </p>
            <p className="mt-8">
              <Link
                href="/associacao"
                className="pressiona inline-flex min-h-12 items-center rounded-controle bg-ami-green-600 px-6 font-semibold text-white shadow-apoio hover:bg-ami-green-700 hover:shadow-erguido"
              >
                Conhecer a Associação
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          5. BAIRROS
          Quarta família de layout da página: ladrilho, não linha, não
          coluna, não divisão com foto.
          ===================================================== */}
      <section
        aria-labelledby="bairros"
        className="revelar border-t border-line bg-surface"
      >
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
          <h2 id="bairros">Onde os médicos atendem</h2>
          <p className="coluna-leitura mt-3 text-ink-600">
            Escolha o bairro para ver quem atende perto de você.
          </p>

          <div className="mt-8">
            <LadrilhosBairros itens={bairros} />
          </div>
        </div>
      </section>
    </>
  );
}
