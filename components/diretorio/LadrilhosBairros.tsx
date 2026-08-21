import Link from "next/link";
import { contagem } from "@/lib/formato";

type Item = { nome: string; slug: string; total: number };

/*
  Bairros em ladrilho, não em pílula.

  A diferença não é de gosto. A pílula com "Centro · 8" empacota nome e
  contagem numa linha só, do tamanho do texto, e uma fileira delas fica com a
  mesma altura e pesos diferentes conforme o nome. O ladrilho dá duas linhas,
  altura fixa e uma contagem que sempre cai no mesmo lugar, então a fileira
  inteira fica varrível de relance.

  Também é a quarta família de layout da home, depois da cabeceira escura, do
  índice em colunas e da divisão com fotografia. Repetir a pílula do índice
  aqui faria as duas seções lerem como a mesma coisa dita duas vezes.
*/
export function LadrilhosBairros({
  itens,
  /** Para onde cada ladrilho leva. A home manda para a busca filtrada. */
  href = (slug: string) => `/busca?bairro=${slug}`,
  /** Linha extra sob a contagem. Devolve null quando não há o que dizer. */
  nota,
}: {
  itens: Item[];
  href?: (slug: string) => string;
  nota?: (item: Item) => string | null;
}) {
  return (
    <ul className="flex flex-wrap gap-3">
      {itens.map((b) => (
        <li key={b.slug}>
          <Link
            href={href(b.slug)}
            className="pressiona flex min-h-[68px] flex-col justify-center rounded-bloco border border-line bg-canvas px-5 py-3 hover:border-ami-green-600 hover:bg-ami-mint-100 hover:shadow-erguido"
          >
            <span className="font-titulo text-[17px] font-semibold [font-stretch:90%]">
              {b.nome}
            </span>
            <span className="registro mt-0.5 text-[14px] text-ink-400">
              {contagem(b.total, "médico", "médicos")}
            </span>
            {nota?.(b) ? (
              <span className="mt-1 text-[13px] text-ink-400">{nota(b)}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
