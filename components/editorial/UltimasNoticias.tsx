import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import styles from "@/components/editorial/UltimasNoticias.module.css";
import { arranjoDasNoticias, tamanhosDasCapas } from "@/lib/arranjo-das-noticias";
import { dataPorExtenso } from "@/lib/formato";
import { listarNoticias } from "@/lib/sanity/consultas";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  As notícias da home: uma em destaque, com o título sobre a foto, e as três
  seguintes numa lista ao lado, como no desenho aprovado
  (docs/desenho-aprovado/home-aprovada.html, `.noticias`). Com menos de
  quatro, o arranjo muda (`arranjoDasNoticias`, lib/arranjo-das-noticias.ts):
  nada fica ao lado do destaque.

  Duas peças. `UltimasNoticias` só busca no Sanity e entrega a lista a
  `NoticiasDaHome`, que só desenha. A separação existe para o teste: a peça
  que desenha é pura e se renderiza com `renderToString`, sem Sanity
  (testes/noticias-da-home.test.ts).

  Sem publicação, o bloco não existe (devolve null): título de seção sobre
  lista vazia promete conteúdo que não está lá.

  A exceção é `provisorias`, que só o modo demonstração liga (quem decide é
  `moldurasDaHome`, em lib/molduras.ts): sem publicação, saem quatro peças
  "Notícia a entrar" na forma do desenho, o destaque e as três da lista,
  para o cliente ver a home inteira antes de a AMI publicar. Elas não são
  link: não há página de notícia para elas. A capa, o título e o resumo
  delas levam `data-a-entrar`, a marca de toda moldura "a entrar" do site,
  sem estilo nenhum. Havendo UMA notícia real, só a real sai, com ou sem
  `provisorias`: real e provisório nunca se misturam. O padrão `false` faz
  quem esquecer de passar a prop cair no null.

  O bloco entra na tela com a `.revelar` global (app/globals.css): se abrir
  abaixo da tela, entra ao rolar; se já abrir nela, fica parado
  (components/layout/Revelar.tsx).
*/
export async function UltimasNoticias({
  provisorias = false,
}: {
  provisorias?: boolean;
} = {}) {
  const noticias = await listarNoticias(QUANTAS);
  return <NoticiasDaHome noticias={noticias} provisorias={provisorias} />;
}

/* O destaque e as três da lista. */
const QUANTAS = 4;

/* Larguras pedidas ao CDN do Sanity para o `srcset`, como em LinhaNoticia.
   O destaque chega a 1096px (2192 numa tela de densidade 2); a miniatura do
   arranjo "ao-lado" chega a uns 330px de 701 a 1180px (660 em densidade 2).
   O item de pé (três notícias: duas embaixo do destaque) chega a 536px do
   tablet para cima e pede as do destaque; no celular ele vira a miniatura
   de 88px, e por isso leva também 160 e 320, senão o celular baixaria o de
   480. Quem diz ao navegador o tamanho de cada uma é `tamanhosDasCapas`. */
const LARGURAS_DESTAQUE = [480, 640, 960, 1280, 1600, 2200];
const LARGURAS_MINIATURA = [160, 320, 480, 640, 960];
const LARGURAS_ITEM_DE_PE = [160, 320, ...LARGURAS_DESTAQUE];

export function NoticiasDaHome({
  noticias,
  provisorias = false,
}: {
  noticias: ResumoNoticia[];
  provisorias?: boolean;
}) {
  const reais = noticias.slice(0, QUANTAS);
  if (reais.length === 0 && !provisorias) return null;

  const [destaque, ...lista] = reais;
  /* As provisórias são sempre quatro: o desenho inteiro. */
  const arranjo = arranjoDasNoticias(destaque ? reais.length : QUANTAS)!;
  const capas = tamanhosDasCapas(arranjo);
  const capaDoItem = {
    sizes: capas.item,
    larguras: capas.itemDePe ? LARGURAS_ITEM_DE_PE : LARGURAS_MINIATURA,
  };
  const grade = {
    className: styles.noticias,
    "data-arranjo": arranjo.arranjo,
    "data-deitado": arranjo.deitado ? "" : undefined,
    style: arranjo.colunas > 0 ? ({ "--colunas": arranjo.colunas } as CSSProperties) : undefined,
  };

  return (
    <section data-bloco="noticias" aria-labelledby="noticias-titulo" className="revelar">
      <div className={styles.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Notícias
          </span>
          <h2 id="noticias-titulo" className={styles.titulo}>
            Fique por dentro da AMI
          </h2>
          <p className={styles.texto}>
            Comunicados, eventos e o que acontece na medicina em Imperatriz.
          </p>
        </div>
        <Link className="botao-linha" href="/noticias">
          Ver todas as notícias <Icone nome="setaDiagonal" tamanho={16} />
        </Link>
      </div>

      {destaque ? (
        /* O arranjo vem de `arranjoDasNoticias` (lib/arranjo-das-noticias.ts):
           com menos de quatro, nada fica ao lado do destaque. */
        <div {...grade}>
          <Destaque noticia={destaque} sizes={capas.destaque} />
          {lista.length > 0 ? (
            <Lista>
              {lista.map((n) => (
                <Item key={n.slug} noticia={n} capa={capaDoItem} />
              ))}
            </Lista>
          ) : null}
        </div>
      ) : (
        <div {...grade}>
          <Destaque sizes={capas.destaque} />
          <Lista>
            {[1, 2, 3].map((n) => (
              <Item key={n} capa={capaDoItem} />
            ))}
          </Lista>
        </div>
      )}
    </section>
  );
}

/* A coluna da direita, com a divisória entre uma notícia e a seguinte. */
function Lista({ children }: { children: ReactNode[] }) {
  return (
    <div className={styles.lista}>
      {children.map((filho, i) => (
        <Fragment key={i}>
          {i > 0 ? <div className={styles.sep} aria-hidden="true" /> : null}
          {filho}
        </Fragment>
      ))}
    </div>
  );
}

/*
  A capa de uma notícia real, ou nada.

  `urlDaImagem` devolve "" quando `asset._ref` está malformado; um
  `<img src="">` faria o navegador pedir a página de novo (ver
  LinhaNoticia). Sem URL, a notícia cai no mesmo desenho de quem não tem
  capa.

  `alt=""`: a imagem está dentro do link, e o nome do link é o título. A
  descrição da foto entraria no nome do link antes do título e o alongaria
  sem dizer para onde ele leva.
*/
function Capa({
  noticia,
  larguras,
  sizes,
}: {
  noticia: ResumoNoticia;
  larguras: number[];
  sizes: string;
}) {
  const capa = noticia.capa;
  const src = capa ? urlDaImagem(capa, larguras[1]) : "";
  if (!capa || !src) return <div className={styles.semCapa} aria-hidden="true" />;
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
    <img
      src={src}
      srcSet={larguras.map((l) => `${urlDaImagem(capa, l)} ${l}w`).join(", ")}
      sizes={sizes}
      alt=""
      loading="lazy"
      decoding="async"
      className={styles.imagem}
    />
  );
}

/* Link para a notícia real; para a provisória, uma caixa que não leva a
   lugar nenhum e não deve parecer que leva. */
function Casca({
  noticia,
  className,
  children,
}: {
  noticia?: ResumoNoticia;
  className: string;
  children: ReactNode;
}) {
  return noticia ? (
    <Link href={`/noticias/${noticia.slug}`} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

/*
  A notícia em destaque: o título vai sobre a foto, num degradê escuro que
  garante o contraste do texto branco mesmo sobre uma foto branca (a conta
  está no CSS e no teste).
*/
function Destaque({ noticia, sizes }: { noticia?: ResumoNoticia; sizes: string }) {
  return (
    <article className={styles.destaque}>
      <Casca noticia={noticia} className={styles.destaqueCorpo}>
        <div className={styles.foto}>
          {noticia ? (
            <Capa
              noticia={noticia}
              larguras={LARGURAS_DESTAQUE}
              sizes={sizes}
            />
          ) : (
            <MolduraProvisoria
              largura={16}
              altura={10}
              rotulo="Espaço reservado para a capa de uma notícia"
              className="h-full"
            />
          )}
        </div>
        <div className={styles.sobreFoto}>
          {noticia ? <span className={styles.data}>{dataPorExtenso(noticia.publicadoEm)}</span> : null}
          <h3 className={styles.destaqueTitulo} data-a-entrar={noticia ? undefined : ""}>
            {noticia ? noticia.titulo : "Notícia a entrar"}
          </h3>
          <p className={styles.resumo} data-a-entrar={noticia ? undefined : ""}>
            {noticia ? noticia.resumo : "Espaço reservado para uma publicação da AMI."}
          </p>
        </div>
      </Casca>
    </article>
  );
}

/* Uma notícia da lista: miniatura à esquerda, data e título à direita. */
function Item({
  noticia,
  capa,
}: {
  noticia?: ResumoNoticia;
  capa: { sizes: string; larguras: number[] };
}) {
  return (
    <article>
      <Casca noticia={noticia} className={styles.item}>
        <div className={styles.miniatura}>
          {noticia ? (
            <Capa noticia={noticia} larguras={capa.larguras} sizes={capa.sizes} />
          ) : (
            <MolduraProvisoria
              largura={4}
              altura={3}
              rotulo="Espaço reservado para a capa de uma notícia"
              className="h-full"
            />
          )}
        </div>
        <div className={styles.itemTexto}>
          {noticia ? <span className={styles.data}>{dataPorExtenso(noticia.publicadoEm)}</span> : null}
          <h3 className={styles.itemTitulo} data-a-entrar={noticia ? undefined : ""}>
            {noticia ? noticia.titulo : "Notícia a entrar"}
          </h3>
        </div>
      </Casca>
    </article>
  );
}
