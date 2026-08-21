import Link from "next/link";

export type ItemTrilha = { nome: string; caminho: string };

/*
  Breadcrumb visível no topo de toda página interna. Existe em par com o
  BreadcrumbList do JSON-LD: dado estruturado sem o correspondente visível
  na tela é justamente o que o Google trata como marcação enganosa.
*/
export function Breadcrumb({ itens }: { itens: ItemTrilha[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="pb-2 pt-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-600">
        {itens.map((item, i) => {
          const ultimo = i === itens.length - 1;
          return (
            <li key={item.caminho} className="flex items-center gap-2">
              {ultimo ? (
                <span aria-current="page">{item.nome}</span>
              ) : (
                <>
                  <Link
                    href={item.caminho}
                    /* min-h-11 = 44px, o alvo mínimo de toque no mobile. */
                    className="inline-flex min-h-11 items-center text-ami-green-600 underline-offset-2 hover:underline"
                  >
                    {item.nome}
                  </Link>
                  <span aria-hidden="true" className="text-ink-300">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
