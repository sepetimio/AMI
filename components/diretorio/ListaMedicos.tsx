import Link from "next/link";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { LinhaMedico } from "@/components/diretorio/LinhaMedico";
import type { Medico } from "@/lib/dados/tipos";

export function ListaMedicos({
  medicos,
  filtroMaisRestritivo,
  saida,
}: {
  medicos: Medico[];
  /** Nome do filtro a sugerir remover quando não há resultado. */
  filtroMaisRestritivo?: string;
  /**
   * Para onde mandar quem não achou nada. Cada tela sabe qual é a saída útil
   * dali: de uma especialidade sem resultado no bairro, o caminho é ver a
   * especialidade inteira, não a lista de especialidades.
   */
  saida?: { rotulo: string; href: string };
}) {
  if (medicos.length === 0) {
    const destino = saida ?? {
      rotulo: "Ver todas as especialidades",
      href: "/medicos",
    };
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
            href={destino.href}
            className="inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 font-semibold text-white hover:bg-ami-green-700"
          >
            {destino.rotulo}
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
