import Link from "next/link";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { LinhaMedico } from "@/components/diretorio/LinhaMedico";
import type { Medico } from "@/lib/dados/tipos";

export function ListaMedicos({
  medicos,
  filtroMaisRestritivo,
}: {
  medicos: Medico[];
  /** Nome do filtro a sugerir remover quando não há resultado. */
  filtroMaisRestritivo?: string;
}) {
  if (medicos.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum médico com esses filtros"
        descricao={
          filtroMaisRestritivo
            ? `Tente remover o filtro de ${filtroMaisRestritivo} — costuma ser o que mais reduz a lista.`
            : "Tente remover um dos filtros para ampliar a busca."
        }
        acao={
          <Link
            href="/medicos"
            className="inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 font-semibold text-white hover:bg-ami-green-700"
          >
            Ver todas as especialidades
          </Link>
        }
      />
    );
  }

  return (
    <ul className="rounded-bloco border border-line bg-surface px-5">
      {medicos.map((m) => (
        <LinhaMedico key={m.id} medico={m} />
      ))}
    </ul>
  );
}
