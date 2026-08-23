import Link from "next/link";
import { AMI } from "@/lib/ami";
import { formatarTelefone } from "@/lib/formato";

/*
  Os três serviços da AMI.

  Cada cartão mostra algo VIVO que o menu do topo não mostra — senão ele seria
  um segundo menu. O primeiro traz a contagem, o segundo o telefone, o
  terceiro a manchete mais recente.

  A grade nasce com três e já comporta "Sua AMI" (aluguel de auditório e hall
  de eventos) e "Empresa parceira", que o dono anunciou para depois.
*/
export function ServicosDaAmi({
  total,
  especialidades,
  ultimaNoticia,
}: {
  total: number;
  especialidades: number;
  ultimaNoticia: { titulo: string; slug: string } | null;
}) {
  const fixo = AMI.telefones[0];

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="font-titulo text-[15px] font-bold uppercase tracking-[0.1em] text-ink-400">
        Serviços da AMI
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/medicos"
          className="pressiona rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="text-[21px] font-semibold text-ink-900">Encontre um médico</h3>
          <p className="registro mt-3 text-[15px] text-ink-400">
            {total} {total === 1 ? "profissional" : "profissionais"} em{" "}
            {especialidades} {especialidades === 1 ? "especialidade" : "especialidades"}
          </p>
        </Link>

        <Link
          href="/contato"
          className="pressiona rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="text-[21px] font-semibold text-ink-900">Fale com a AMI</h3>
          <p className="registro mt-3 text-[15px] text-ink-400">
            {formatarTelefone(fixo)}
          </p>
        </Link>

        <Link
          href="/associacao/seja-associado"
          className="pressiona rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="text-[21px] font-semibold text-ink-900">Seja associado</h3>
          <p className="mt-3 text-[15px] text-ink-400">
            Médico com inscrição no CRM pode se associar à AMI.
          </p>
        </Link>
      </div>

      {ultimaNoticia ? (
        <Link
          href={`/noticias/${ultimaNoticia.slug}`}
          className="pressiona mt-4 block rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="font-titulo text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">
            Última notícia
          </h3>
          <p className="mt-2 text-[19px] font-semibold text-ink-900">
            {ultimaNoticia.titulo}
          </p>
        </Link>
      ) : null}
    </section>
  );
}
