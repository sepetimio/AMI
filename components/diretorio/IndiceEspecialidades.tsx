import Link from "next/link";

type Item = { nome: string; slug: string; total: number };

/*
  Especialidades em grade de cartões.

  A versão anterior era um índice em fluxo de colunas, com fio pontilhado
  ligando o nome à contagem, imitando o sumário de um anuário impresso. A
  ideia tinha lógica e envelheceu mal: fio pontilhado de sumário é convenção
  de papel, e trouxe para a tela justamente o ar de documento datado que esta
  passagem existe para remover.

  O problema que a versão antiga resolvia continua resolvido, por outro
  caminho. Os nomes variam muito de comprimento, de "Pediatria" a "Ginecologia
  e Obstetrícia", e numa lista com o número encostado no texto a coluna da
  direita fica serrilhada e ninguém consegue comparar as contagens. Na grade,
  cada cartão tem largura própria e a contagem ocupa sempre o mesmo canto,
  então a comparação volta a funcionar sem depender de alinhamento entre
  linhas.

  A contagem sai em monoespaçada pelo mesmo motivo do CRM e do telefone: é
  dado de registro, e alinhada entre cartões vira coluna varrível.

  Existe como componente porque a home e /medicos mostram o mesmo índice, e
  duas cópias divergiriam na primeira alteração.
*/
export function IndiceEspecialidades({ itens }: { itens: Item[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {itens.map((e) => (
        <li key={e.slug}>
          <Link
            href={`/medicos/${e.slug}`}
            className="pressiona eleva group flex min-h-[76px] items-center justify-between gap-4 rounded-bloco border border-line bg-surface px-5 py-4 shadow-apoio hover:border-line-strong"
          >
            <span className="text-[17px] font-medium leading-snug text-ink-900">
              {e.nome}
            </span>

            {/* Presa ao canto do cartão, e não encostada no nome, para que a
                coluna de números alinhe de cartão a cartão. */}
            <span className="registro shrink-0 rounded-chip bg-canvas px-2.5 py-1 text-[14px] text-ink-400 transition-colors duration-200 group-hover:bg-ami-lima-100 group-hover:text-ami-green-700">
              {e.total}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
