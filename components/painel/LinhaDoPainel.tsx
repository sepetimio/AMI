import Link from "next/link";
import { alternarPublicacao } from "@/app/painel/acoes";
import type { MedicoNaLista } from "@/lib/painel/consultas";

/*
  Uma linha da lista.

  O estado de publicação é o que esta tela existe para mostrar: é a única
  superfície do projeto onde o médico despublicado aparece.
*/
export function LinhaDoPainel({ medico }: { medico: MedicoNaLista }) {
  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-line py-4">
      <div className="min-w-0 flex-1">
        <Link
          href={`/painel/medico/${medico.id}`}
          className="text-[17px] font-semibold text-ink-900 hover:underline"
        >
          {medico.nome}
        </Link>
        <p className="registro mt-1 text-[14px] text-ink-400">
          CRM/{medico.crmUf} {medico.crm}
          {medico.especialidade ? ` · ${medico.especialidade}` : ""}
          {medico.bairros.length ? ` · ${medico.bairros.join(", ")}` : ""}
        </p>
      </div>

      <span
        className={
          medico.publicado
            ? "registro rounded-chip bg-ami-green-600 px-3 py-1 text-[13px] text-white"
            : "registro rounded-chip border border-line px-3 py-1 text-[13px] text-ink-400"
        }
      >
        {medico.publicado ? "no ar" : "fora do ar"}
      </span>

      <form action={alternarPublicacao}>
        <input type="hidden" name="id" value={medico.id} />
        <input type="hidden" name="publicado" value={String(!medico.publicado)} />
        <button
          type="submit"
          className="pressiona rounded-controle border border-line px-4 py-2 text-[14px] font-medium text-ink-600 hover:text-ink-900"
        >
          {medico.publicado ? "Tirar do ar" : "Pôr no ar"}
        </button>
      </form>
    </li>
  );
}
