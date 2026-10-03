import type { Metadata } from "next";
import Link from "next/link";
import { Fotografia } from "@/components/base/Fotografia";
import { IndiceEspecialidades } from "@/components/diretorio/IndiceEspecialidades";
import { LadrilhosBairros } from "@/components/diretorio/LadrilhosBairros";
import { UltimasNoticias } from "@/components/editorial/UltimasNoticias";
import { Carrossel } from "@/components/home/Carrossel";
import { EmpresasParceiras } from "@/components/home/EmpresasParceiras";
import { FaixaDaAmi } from "@/components/home/FaixaDaAmi";
import { ServicosDaAmi } from "@/components/home/ServicosDaAmi";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationAmi } from "@/lib/seo/jsonld";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia, moldurasDaHome } from "@/lib/molduras";
import { bannersAtivos } from "@/lib/sanity/banners";
import { listarNoticias } from "@/lib/sanity/consultas";

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
      `Imperatriz - MA. Filtre por especialidade e bairro.`,
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  /* Mesmo raciocínio do `generateMetadata`: o total vem da contagem de
     profissionais, não da soma por especialidade, que double-conta quem tem
     mais de uma. */
  const [especialidades, bairros, total, banners, noticias] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
    buscarMedicos().then((m) => m.length),
    bannersAtivos(),
    listarNoticias(1),
  ]);

  /* As molduras "a entrar" e a trava que as segura: só no modo
     demonstração, e nunca misturadas a conteúdo real. A decisão inteira
     mora em lib/molduras.ts; aqui só entra o valor da chave. */
  const molduras = moldurasDaHome(DADOS_DEMONSTRACAO, {
    banners,
    temNoticia: noticias.length > 0,
  });
  const fotoDaSede =
    desenhoDaFotografia(ESPACOS.sede.provisoria, DADOS_DEMONSTRACAO) !== "nada";

  return (
    <>
      <JsonLd dados={organizationAmi(SITE)} />

      {/* =====================================================
          1. FAIXA DA AMI
          Substitui o herói de tela cheia. O <h1> mora dentro do
          próprio componente — ver components/home/FaixaDaAmi.tsx.
          ===================================================== */}
      <FaixaDaAmi
        total={total}
        especialidades={especialidades.length}
        bairros={bairros.length}
      />

      {/* =====================================================
          2. CARROSSEL DE BANNERS
          ===================================================== */}
      <Carrossel banners={molduras.banners} />

      {/* =====================================================
          3. SERVIÇOS DA AMI
          "Encontre um médico" — antes o título da página inteira —
          vira o primeiro dos cartões. "Sua AMI", o quarto, é
          provisório.
          ===================================================== */}
      <ServicosDaAmi
        total={total}
        especialidades={especialidades.length}
        ultimaNoticia={
          noticias[0] ? { titulo: noticias[0].titulo, slug: noticias[0].slug } : null
        }
        suaAmi={molduras.suaAmi}
      />

      {/* =====================================================
          4. ÍNDICE DE ESPECIALIDADES
          Fluxo em colunas, como o índice de um anuário impresso.
          ===================================================== */}
      <section
        aria-labelledby="especialidades"
        className="revelar mx-auto max-w-[1200px] px-4 pb-4 pt-16 md:px-6 md:pt-24"
      >
        <div className="flex items-baseline justify-between gap-4 pb-1">
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
          5. INSTITUCIONAL
          Claro, com fotografia. Antes era uma segunda faixa verde
          escura com texto solto dentro, o que fazia o verde virar
          decoração em vez de estrutura.
          ===================================================== */}
      <section
        aria-labelledby="institucional"
        className="revelar mx-auto max-w-[1200px] px-4 py-20 md:px-6 md:py-28"
      >
        {/* Sem foto (provisória fora do modo demonstração), a casca e a
            segunda coluna saem juntas: o texto fica sozinho, e não ao lado de
            uma moldura vazia. */}
        <div
          className={`grid items-center gap-10 md:gap-16 ${fotoDaSede ? "md:grid-cols-2" : ""}`}
        >
          {/* Moldura concêntrica: casca externa com fio e respiro de 8px,
              miolo com o raio descontado da espessura da casca. É o que faz a
              foto parecer assentada numa moldura, e não colada na página. */}
          {fotoDaSede ? (
            <div className="rounded-bloco border border-line bg-surface p-2 shadow-erguido">
              <Fotografia
                espaco="sede"
                sizes="(min-width: 768px) 46vw, 92vw"
                className="h-auto w-full object-cover"
              />
            </div>
          ) : null}

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
              Cada perfil traz nome, número de inscrição no CRM e endereço de
              atendimento. Sem nota, sem classificação e sem destaque pago: a
              ordem é a mesma para todo mundo.
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
          6. ÚLTIMAS NOTÍCIAS
          Sem matéria publicada no Sanity, some sozinha (devolve null) —
          a não ser no modo demonstração, em que saem três cartões
          "Notícia a entrar" no lugar.
          ===================================================== */}
      <UltimasNoticias provisorias={molduras.noticiasProvisorias} />

      {/* =====================================================
          7. BAIRROS
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

      {/* =====================================================
          8. EMPRESAS PARCEIRAS DA AMI
          A última seção da home. Hoje inteira provisória, então só
          existe no modo demonstração.
          ===================================================== */}
      {molduras.parceiros ? <EmpresasParceiras /> : null}
    </>
  );
}
