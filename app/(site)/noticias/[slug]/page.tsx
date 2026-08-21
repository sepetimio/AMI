import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { TextoRico } from "@/components/editorial/TextoRico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, newsArticle } from "@/lib/seo/jsonld";
import { noticiaPorSlug, slugsDeNoticias } from "@/lib/sanity/consultas";
import { dimensoesDoRef, urlDaImagem } from "@/lib/sanity/imagem";
import { dataPorExtenso, identificacaoMedica } from "@/lib/formato";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Larguras pedidas ao CDN para o `srcset` da capa.

  Mesma técnica de `LinhaNoticia`, mas a caixa aqui é bem maior: a capa ocupa
  quase o contêiner inteiro (1200px), não uma miniatura de 160px. Contra o
  cálculo de `sizes` abaixo, a caixa chega a 1134px de CSS no desktop, o que
  pede uns 2270px de arquivo em densidade 2.

  O teto de 2400 cobre densidade 2 com folga, e é uma decisão deliberada de
  parar aí, não um esquecimento de densidade 3 (que pediria uns 3400px):
  numa tela 3x a imagem sai a uns 2,1x, perceptivelmente nítida o bastante,
  e o ganho de nitidez entre 2x e 3x numa peça deste tamanho não paga o
  quase dobro de bytes numa rede majoritariamente 4G, que é o cenário real de
  quem acessa este site. Para uma miniatura pequena esse cálculo pode pender
  para o outro lado; para uma imagem deste porte, não.
*/
const LARGURAS_CAPA = [640, 960, 1200, 1600, 2000, 2400];

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeNoticias();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = await noticiaPorSlug(slug);
  if (!n) return {};

  return {
    title: `${n.titulo} | AMI`,
    description: n.resumo,
    alternates: { canonical: `/noticias/${slug}` },
  };
}

export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;
  const n = await noticiaPorSlug(slug);
  if (!n) notFound();

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Notícias", caminho: "/noticias" },
    { nome: n.titulo, caminho: `/noticias/${n.slug}` },
  ];

  /*
    `urlDaImagem` devolve "" e `dimensoesDoRef` devolve `undefined` para a
    mesma causa: `asset._ref` malformado (upload ainda em andamento,
    referência corrompida). Sem os dois a notícia perde a capa, não a
    página inteira; ver o comentário em lib/sanity/imagem.ts.

    A caixa da capa usa a proporção REAL do arquivo que a AMI enviou, e não
    uma razão fixa (a versão anterior deste componente declarava
    width={1400} height={788}, uma proporção 16:9 inventada): se a foto
    enviada não for 16:9, o navegador reserva uma caixa errada e a página
    pula quando a imagem termina de carregar, o mesmo defeito de CLS que já
    foi corrigido duas vezes neste projeto (ver TextoRico, para imagem de
    corpo, e LinhaNoticia, para miniatura de lista).

    A capa segue o caminho de TextoRico (proporção real, extraída do `_ref`),
    não o de LinhaNoticia (caixa fixa por CSS com `object-cover`): recortar a
    capa de uma matéria para caber numa caixa arbitrária é decisão editorial
    que ninguém tomou, o mesmo raciocínio que já vale para imagem de corpo.
    `object-cover` faz sentido numa miniatura de lista, onde a grade precisa
    de caixas do mesmo tamanho lado a lado; a capa é peça única, sem vizinha
    para alinhar.
  */
  const capa = n.capa;
  const capaUrl = capa ? urlDaImagem(capa, 1200) : "";
  const capaDimensoes = capa ? dimensoesDoRef(capa.asset._ref) : undefined;
  const capaLargura = 1200;
  const capaAltura = capaDimensoes
    ? Math.round((capaLargura * capaDimensoes.altura) / capaDimensoes.largura)
    : undefined;
  const capaSrcSet = capa
    ? LARGURAS_CAPA.map(
        (largura) => `${urlDaImagem(capa, largura)} ${largura}w`,
      ).join(", ")
    : "";

  return (
    <>
      <JsonLd dados={newsArticle(n, SITE)} />
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira trilha={trilha} titulo={n.titulo}>
        {n.resumo}
      </Cabeceira>

      <article className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        {/* Assinatura e datas logo abaixo da cabeceira: num site de saúde é a
            primeira coisa que o leitor precisa poder conferir. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line py-5">
          <p className="text-[16px] font-semibold text-ink-900">
            {n.autor.slugDoPerfil ? (
              <Link
                href={`/medico/${n.autor.slugDoPerfil}`}
                /* min-h-11 = 44px, o alvo mínimo de toque no mobile; ver
                   Breadcrumb.tsx. A linha inteira passou de items-baseline
                   para items-center por causa deste link: um alvo de 44px de
                   altura ao lado de texto de 15px quebraria o alinhamento
                   por linha de base (o link ficaria "flutuando" acima dos
                   vizinhos). Com items-center, cada peça da assinatura centra
                   no eixo cruzado da linha, então o link cresce sem desalinhar
                   as datas e o CRM ao lado. */
                className="pressiona inline-flex min-h-11 items-center text-ami-green-600 underline underline-offset-2 hover:text-ami-green-700"
              >
                {n.autor.nome}
              </Link>
            ) : (
              n.autor.nome
            )}
          </p>
          <p className="registro text-[15px] text-ink-600">
            {identificacaoMedica(n.autor.crm, n.autor.crmUf)}
          </p>
          <p className="registro text-[15px] text-ink-400">
            Publicado em {dataPorExtenso(n.publicadoEm)}
          </p>
          {n.atualizadoEm ? (
            <p className="registro text-[15px] text-ink-400">
              Atualizado em {dataPorExtenso(n.atualizadoEm)}
            </p>
          ) : null}
        </div>

        {capa && capaUrl && capaDimensoes ? (
          <figure className="mt-8">
            <div className="rounded-bloco border border-line bg-surface p-2 shadow-erguido">
              {/* eslint-disable-next-line @next/next/no-img-element --
                  o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */}
              <img
                src={capaUrl}
                srcSet={capaSrcSet}
                /*
                  Contêiner desta página: `max-w-[1200px] px-4 md:px-6`
                  (16px de preenchimento abaixo de `md`, 24px a partir dali,
                  capado em 1200px de largura total). A moldura da capa soma
                  mais `p-2` (8px, 16px nos dois lados) E `border` (1px,
                  Tailwind: 2px nos dois lados) por dentro disso, 18px ao
                  todo. Acima de 1200px de viewport o contêiner para de
                  crescer, então a caixa da imagem fica fixa em
                  1200 - 48 - 18 = 1134px. Abaixo de 1200px ela acompanha a
                  viewport: 100vw menos 66px (48 + 18) a partir de `md`
                  (768px), menos 50px (32 + 18) abaixo dali. Precisa
                  acompanhar estes números se o preenchimento do contêiner ou
                  da moldura mudar, senão o navegador escolhe a largura
                  errada do `srcset`.
                */
                sizes="(min-width: 1200px) 1134px, (min-width: 768px) calc(100vw - 66px), calc(100vw - 50px)"
                alt={capa.alt}
                width={capaLargura}
                height={capaAltura}
                className="h-auto w-full rounded-controle"
              />
            </div>
          </figure>
        ) : null}

        <div className="mt-4">
          <TextoRico blocos={n.corpo} />
        </div>

        <p className="coluna-leitura mt-14 border-l-2 border-line-strong py-1 pl-5 text-[15px] text-ink-400">
          Conteúdo informativo publicado pela Associação Médica de Imperatriz.
          Não substitui a consulta médica.
        </p>

        <p className="mt-10">
          <Link
            href="/noticias"
            className="pressiona inline-flex min-h-11 items-center rounded-controle border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ami-green-600 hover:border-ami-green-600 hover:bg-ami-mint-100"
          >
            Ver todas as notícias
          </Link>
        </p>
      </article>
    </>
  );
}
