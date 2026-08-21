import Link from "next/link";

type Item = { nome: string; slug: string; total: number };

/*
  Índice de especialidades em fluxo de colunas, com fio pontilhado ligando o
  nome ao número: é a forma do sumário de um anuário impresso, e não da lista
  genérica com um fio embaixo de cada item.

  A escolha resolve um problema concreto. Os nomes variam muito de
  comprimento, de "Pediatria" a "Ginecologia e Obstetrícia". Com o número
  encostado no nome, a coluna da direita fica serrilhada e ninguém consegue
  comparar as contagens. Com coluna fixa, "Ginecologia e Obstetrícia" ou
  quebra ou obriga a coluna a ser larga demais para as outras treze. O fio que
  estica absorve a diferença e mantém os números alinhados.

  Existe como componente porque a home e /medicos mostram o mesmo índice, e
  duas cópias divergiriam na primeira alteração.
*/
export function IndiceEspecialidades({ itens }: { itens: Item[] }) {
  return (
    <ul className="mt-2 gap-x-12 md:columns-2 lg:columns-3">
      {itens.map((e) => (
        /* `break-inside-avoid` impede que uma linha seja partida ao meio entre
           o fim de uma coluna e o começo da seguinte. */
        <li key={e.slug} className="break-inside-avoid">
          <Link
            href={`/medicos/${e.slug}`}
            className="pressiona group flex min-h-12 items-baseline gap-3 border-b border-line py-2.5 hover:border-ami-green-600"
          >
            <span className="font-titulo text-[19px] font-semibold [font-stretch:88%] group-hover:text-ami-green-600">
              {e.nome}
            </span>
            <span
              aria-hidden="true"
              className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-line-strong"
            />
            <span className="registro shrink-0 text-[15px] text-ink-400">
              {e.total}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
