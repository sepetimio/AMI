import type { Metadata } from "next";
import { notFound } from "next/navigation";
import paginas from "@/app/(site)/encontre.module.css";
import { FaixaDaEspecialidade } from "@/components/especialidades/FaixaDaEspecialidade";
import { MedicosDaEspecialidade } from "@/components/especialidades/MedicosDaEspecialidade";
import { SobreAEspecialidade } from "@/components/especialidades/SobreAEspecialidade";
import { JsonLd } from "@/components/seo/JsonLd";
import { paragrafoDeAbertura } from "@/lib/dados/facetas";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  especialidadePorSlug,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { sobreDaEspecialidade } from "@/lib/especialidades";
import { textoDaEspecialidade } from "@/lib/sanity/consultas";
import { comoItensDeLista, itemList } from "@/lib/seo/jsonld";
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

/*
  A página de uma especialidade:
  - a faixa verde com o link de volta ao índice, o título e o parágrafo de
    abertura;
  - a contagem e a grade de cartões da busca, cada um com a especialidade
    da página;
  - "Sobre a {especialidade}", com o texto da AMI no Sanity.

  Sem a `Cabeceira` das páginas internas antigas, sem trilha e sem "Outras
  especialidades". Os blocos são filhos diretos de `.pagina`
  (app/(site)/encontre.module.css), a --ritmo um do outro.

  O "Sobre" segue a trava (`sobreDaEspecialidade`, lib/especialidades.ts):
  - com o texto completo, sai nos dois modos;
  - sem texto, só na demonstração, como "a entrar";
  - fora dela, não existe, e a grade fecha a página a --ritmo do rodapé.

  Uma especialidade cadastrada sem nenhum profissional publicado (a linha
  existe, mas ninguém a preenche ainda) dá página não encontrada, e não um
  título sobre "0 médicos", indexável e canônico para si mesmo.

  O JSON-LD é a lista dos médicos (ItemList). Sem o BreadcrumbList: a
  trilha não aparece na tela, e dado estruturado sem o equivalente visível
  é marcação enganosa (lib/seo/jsonld.ts).
*/
export default async function PaginaEspecialidade({ params }: Props) {
  const { especialidade } = await params;
  const [esp, medicos, texto] = await Promise.all([
    especialidadePorSlug(especialidade),
    buscarMedicos({ especialidade }),
    textoDaEspecialidade(especialidade),
  ]);
  if (!esp || medicos.length === 0) notFound();

  const sobre = sobreDaEspecialidade(DADOS_DEMONSTRACAO, texto);

  return (
    <>
      <JsonLd dados={itemList(comoItensDeLista(medicos), SITE)} />
      <div className={paginas.pagina}>
        <FaixaDaEspecialidade
          nome={esp.nome}
          paragrafo={paragrafoDeAbertura(esp.nome, medicos.length)}
        />
        <MedicosDaEspecialidade medicos={medicos} especialidade={esp.slug} />
        {sobre ? <SobreAEspecialidade nome={esp.nome} sobre={sobre} /> : null}
      </div>
    </>
  );
}
