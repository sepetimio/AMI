import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioMedico } from "@/components/painel/FormularioMedico";
import { BlocoEspecialidades } from "@/components/painel/BlocoEspecialidades";
import { BlocoLocais } from "@/components/painel/BlocoLocais";
import { oQueFalta } from "@/lib/painel/medico";
import { medicoPorId } from "@/lib/painel/consultas";
import {
  catalogoDeEspecialidades,
  especialidadesDoMedico,
} from "@/lib/painel/especialidades";
import { bairros, locaisDoMedico, todosOsLocais } from "@/lib/painel/locais";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export const dynamic = "force-dynamic";

export default async function PaginaDeEdicao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();

  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const cliente = await clienteDoPainel();
  const medico = await medicoPorId(cliente, numero);
  if (!medico) notFound();

  const [especialidades, catalogo, locais, listaDeBairros, todos] = await Promise.all([
    especialidadesDoMedico(cliente, numero),
    catalogoDeEspecialidades(cliente),
    locaisDoMedico(cliente, numero),
    bairros(cliente),
    todosOsLocais(cliente),
  ]);

  const falta = oQueFalta({
    temEspecialidade: medico.especialidade !== null,
    temEndereco: medico.bairros.length > 0,
    temBio: Boolean(medico.bio),
  });

  return (
    <>
      <Link href="/painel" className="text-[15px] text-ink-600 hover:text-ink-900">
        ← Todos os médicos
      </Link>

      <h1 className="mt-4 text-[28px] font-semibold text-ink-900">{medico.nome}</h1>

      <p className="registro mt-1 text-[15px] text-ink-400">
        {medico.publicado ? "no ar" : "fora do ar"}
        {" · "}
        <Link href={`/medico/${medico.slug}`} className="hover:text-ink-900">
          ver no site
        </Link>
      </p>

      {falta.length ? (
        <p className="mt-4 rounded-bloco border border-line bg-surface px-4 py-3 text-[15px] text-ink-600">
          Falta: {falta.join(", ")}.
        </p>
      ) : null}

      <FormularioMedico medico={medico} />

      <BlocoEspecialidades
        medicoId={medico.id}
        especialidades={especialidades}
        catalogo={catalogo}
      />

      <BlocoLocais
        medicoId={medico.id}
        locais={locais}
        listaDeBairros={listaDeBairros}
        todosOsLocais={todos}
      />
    </>
  );
}
