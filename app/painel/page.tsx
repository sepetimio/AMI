import Link from "next/link";
import { LinhaDoPainel } from "@/components/painel/LinhaDoPainel";
import { POR_PAGINA, listarMedicos } from "@/lib/painel/consultas";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";
import { contagem } from "@/lib/formato";

/* Painel nunca é cacheado: ele mostra o estado agora, não o de uma hora atrás. */
export const dynamic = "force-dynamic";

export default async function PaginaDoPainel({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  await exigirAdmin();

  const { q, pagina } = await searchParams;
  const numero = Math.max(1, Number(pagina ?? "1") || 1);

  const cliente = await clienteDoPainel();
  const { medicos, total } = await listarMedicos(cliente, { termo: q, pagina: numero });

  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <h1 className="text-[28px] font-semibold text-ink-900">Médicos</h1>
      <p className="mt-1 text-[16px] text-ink-600">
        {q?.trim()
          ? `${contagem(total, "resultado", "resultados")} para "${q}".`
          : `${contagem(total, "médico no cadastro", "médicos no cadastro")}, publicados ou não.`}
      </p>

      <form method="get" className="mt-6 flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome ou CRM"
          aria-label="Buscar por nome ou CRM"
          className="w-full max-w-[420px] rounded-controle border border-line bg-surface px-4 py-3 text-[16px] text-ink-900 outline-none focus-visible:border-ami-green-600"
        />
        <button
          type="submit"
          className="pressiona rounded-controle bg-ami-green-600 px-5 text-[15px] font-semibold text-white hover:bg-ami-green-700"
        >
          Buscar
        </button>
      </form>

      {medicos.length === 0 ? (
        <p className="mt-10 text-[16px] text-ink-600">
          Nenhum médico encontrado{q ? ` para "${q}"` : ""}.
        </p>
      ) : (
        <ul className="mt-6">
          {medicos.map((m) => (
            <LinhaDoPainel key={m.id} medico={m} />
          ))}
        </ul>
      )}

      {ultimaPagina > 1 ? (
        <nav className="mt-8 flex items-center gap-4 text-[15px]" aria-label="Páginas">
          {numero > 1 ? (
            <Link
              href={`/painel?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(numero - 1) })}`}
              className="text-ink-600 hover:text-ink-900"
            >
              ← Anterior
            </Link>
          ) : null}
          <span className="registro text-ink-400">
            página {numero} de {ultimaPagina}
          </span>
          {numero < ultimaPagina ? (
            <Link
              href={`/painel?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(numero + 1) })}`}
              className="text-ink-600 hover:text-ink-900"
            >
              Próxima →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
