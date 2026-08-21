import type { Metadata } from "next";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { IndiceEspecialidades } from "@/components/diretorio/IndiceEspecialidades";
import { LadrilhosBairros } from "@/components/diretorio/LadrilhosBairros";
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
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      {/* Mesma cabeceira das páginas de especialidade: fundo branco, símbolo
          em máscara à direita, contagem grande em monoespaçada. É o que faz
          /medicos e /medicos/cardiologia lerem como o mesmo sistema em vez de
          duas páginas feitas em dias diferentes. */}
      <Cabeceira
        trilha={trilha}
        titulo="Médicos em Imperatriz"
        contagem={total}
        rotuloContagem={
          total === 1 ? "profissional publicado" : "profissionais publicados"
        }
      >
        Em {contagem(especialidades.length, "especialidade", "especialidades")},
        com endereço, telefone e horários por dia da semana. Todos os registros
        trazem o CRM, conforme exige a Resolução CFM 2.336/2023.
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <section
          aria-labelledby="por-especialidade"
          className="revelar pb-4 pt-12"
        >
          <h2 id="por-especialidade" className="pb-1">
            Por especialidade
          </h2>
          <IndiceEspecialidades itens={especialidades} />
        </section>

        <section
          aria-labelledby="titulo-por-bairro"
          id="por-bairro"
          className="revelar pb-20 pt-12"
        >
          <h2 id="titulo-por-bairro" className="pb-1">
            Por bairro
          </h2>
          <div className="mt-8">
            <LadrilhosBairros itens={bairros} />
          </div>
        </section>
      </div>
    </>
  );
}
