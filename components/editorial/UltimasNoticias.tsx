import Link from "next/link";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
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

  A exceção é `provisorias`, que só o modo demonstração liga (quem decide é
  `moldurasDaHome`, em lib/molduras.ts): sem publicação, saem três cartões
  "Notícia a entrar" com a forma de `LinhaNoticia`, para o cliente ver a home
  inteira antes de a AMI publicar. Eles não são link — não há página de
  notícia para eles. Havendo UMA notícia real, ela sai sozinha e os
  provisórios não aparecem, com ou sem `provisorias`: real e provisório nunca
  se misturam. O padrão `false` faz quem esquecer de passar a prop cair no
  null de antes.
*/
export async function UltimasNoticias({
  provisorias = false,
}: {
  provisorias?: boolean;
} = {}) {
  const noticias = await listarNoticias(3);
  if (noticias.length === 0 && !provisorias) return null;

  return (
    <section
      aria-labelledby="ultimas-noticias"
      className="revelar mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20"
    >
      <div className="flex items-baseline justify-between gap-4 pb-1">
        <h2 id="ultimas-noticias">Da associação</h2>
        <Link
          href="/noticias"
          className="pressiona shrink-0 text-[15px] font-semibold text-ami-green-600 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <ul className="mt-6 grid gap-3">
        {noticias.length > 0
          ? noticias.map((n) => <LinhaNoticia key={n.slug} noticia={n} />)
          : [1, 2, 3].map((n) => <NoticiaProvisoria key={n} />)}
      </ul>
    </section>
  );
}

/*
  O cartão "Notícia a entrar". Mesma casca, mesmo respiro e mesma caixa de
  capa de `LinhaNoticia` (160 × 112 a partir de `sm`, largura cheia abaixo),
  para que a primeira publicação real ocupe o lugar sem mover nada. Sem
  `<Link>` e sem os estados de passagem de mouse: não leva a lugar nenhum, e
  não deve parecer que leva. O fio tracejado é a mesma marca de provisório do
  cartão "Sua AMI".
*/
function NoticiaProvisoria() {
  return (
    <li className="min-w-0 rounded-bloco border border-dashed border-line-strong bg-surface shadow-apoio">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:gap-6 md:p-6">
        <MolduraProvisoria
          largura={160}
          altura={112}
          rotulo="Espaço reservado para a capa de uma notícia"
          className="h-[112px] shrink-0 rounded-bloco shadow-apoio sm:w-[160px]"
        />

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.02em] text-ink-900">
            Notícia a entrar
          </h3>
          <p className="coluna-leitura mt-2 text-[16px] text-ink-600">
            Espaço reservado para uma publicação da AMI.
          </p>
        </div>
      </div>
    </li>
  );
}
