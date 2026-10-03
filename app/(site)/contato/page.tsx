import type { Metadata } from "next";
import Link from "next/link";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";
import { AMI, enderecoEmLinha, hrefTelefone } from "@/lib/ami";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TRILHA = [
  { nome: "Início", caminho: "/" },
  { nome: "Fale com a AMI", caminho: "/contato" },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: tituloDePagina("Fale com a AMI"),
    description:
      "Endereço, telefone e Instagram da Associação Médica de Imperatriz.",
    alternates: { canonical: "/contato" },
  };
}

/* Mesma classe de link que `TextoRico` usa para os links do texto editorial
   (components/editorial/TextoRico.tsx): verde de marca, sublinhado, mais
   escuro no hover. Repetida aqui, e não extraída, porque só existem estes
   dois lugares usando; extrair um componente para dois usos teria sido
   indireção sem ganho. */
const CLASSE_LINK =
  "font-semibold text-ami-green-600 underline underline-offset-2 hover:text-ami-green-700";

/*
  Página sem Sanity e sem rascunho: sai inteira hoje porque todo dado já
  existe em `lib/ami.ts`, recebido do cliente em 21/08/2026 — a mesma fonte
  única que o rodapé (components/layout/Rodape.tsx) e o JSON-LD da home leem,
  para que nome, endereço e telefone fiquem idênticos em todo lugar do site
  (o critério de negócio local do Google exige isso; ver o comentário em
  lib/ami.ts).

  A única frase que não vem do arquivo é a última: aponta quem quer se
  associar para o telefone, porque a página de filiação
  (/associacao/seja-associado) ainda não tem o texto definitivo da AMI.
*/
export default function PaginaContato() {
  return (
    <>
      <JsonLd dados={breadcrumbList(TRILHA, SITE)} />

      <Cabeceira trilha={TRILHA} titulo="Fale com a AMI">
        Endereço, telefone e Instagram da Associação Médica de Imperatriz.
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6">
        <address className="coluna-leitura mt-2 text-[18px] not-italic leading-relaxed text-ink-600">
          <p>{AMI.razaoSocial}</p>

          <p className="mt-4">{enderecoEmLinha()}</p>

          {/* Telefone clicável: no celular, que é a maioria do acesso,
              ligar é a ação mais provável de quem chegou até aqui. */}
          <ul className="mt-4 space-y-2">
            {AMI.telefones.map((t) => (
              <li key={t}>
                <a
                  href={hrefTelefone(t)}
                  className={`registro pressiona inline-flex min-h-11 items-center ${CLASSE_LINK}`}
                >
                  {t}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-4">
            <a
              href={AMI.redes.instagram}
              className={`pressiona inline-flex min-h-11 items-center ${CLASSE_LINK}`}
            >
              Instagram
            </a>
          </p>

          <p className="registro mt-6 text-[15px] text-ink-400">
            CNPJ {AMI.cnpj}
          </p>
        </address>

        <p className="coluna-leitura mt-10 border-t border-line pt-8 text-[16px] text-ink-600">
          Médico interessado em se associar: a página{" "}
          <Link href="/associacao/seja-associado" className={CLASSE_LINK}>
            Seja associado
          </Link>{" "}
          diz quem pode se associar e como fazer isso.
        </p>
      </div>
    </>
  );
}
