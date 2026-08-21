import Link from "next/link";
import { LinhaNoticia } from "@/components/editorial/LinhaNoticia";
import { listarNoticias } from "@/lib/sanity/consultas";

/*
  Bloco de últimas notícias na home.

  É o primeiro passo para uma home que não desemboca só no diretório: até
  agora o site tinha médicos e mais nada para mostrar, e uma home é tão
  atrativa quanto o material que ela pode exibir.

  Devolve null quando não há publicação. Título de seção sobre lista vazia
  promete conteúdo que não está lá, e numa home isso é pior do que a seção não
  existir.
*/
export async function UltimasNoticias() {
  const noticias = await listarNoticias(3);
  if (noticias.length === 0) return null;

  return (
    <section
      aria-labelledby="ultimas-noticias"
      className="revelar mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
        <h2 id="ultimas-noticias">Da associação</h2>
        <Link
          href="/noticias"
          className="pressiona shrink-0 text-[15px] font-semibold text-ami-green-600 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <ul className="mt-6 overflow-hidden rounded-bloco border border-line bg-surface shadow-apoio">
        {noticias.map((n) => (
          <LinhaNoticia key={n.slug} noticia={n} />
        ))}
      </ul>
    </section>
  );
}
