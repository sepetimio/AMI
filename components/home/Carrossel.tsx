"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icone } from "@/components/base/Icone";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import styles from "@/components/home/Carrossel.module.css";
import {
  INTERVALO,
  direcaoDoDedo,
  indiceReal,
  posicaoNaFita,
  precisaSaltar,
} from "@/lib/carrossel";
import type { ItemDoCarrossel } from "@/lib/molduras";
import {
  SEM_PAUSA,
  aplicarEvento,
  parado,
  rotuloDoBotao,
} from "@/lib/pausaDoCarrossel";
import type { Foco } from "@/lib/sanity/tipos";

const MOVIMENTO_REDUZIDO = "(prefers-reduced-motion: reduce)";

/*
  Os três pares abaixo alimentam os `useSyncExternalStore` do componente e
  moram fora dele de propósito: definidas no corpo do componente, seriam
  funções novas a cada renderização, e o React refaria a inscrição toda vez.

  Cada `ler*` devolve um booleano — mesmo valor enquanto nada muda, que é o
  que `getSnapshot` exige (um objeto novo a cada chamada faria laço infinito).
  Elas rodam só no cliente, então não precisam de guarda `typeof window`.
*/
function assinarMovimento(aoMudar: () => void) {
  const consulta = window.matchMedia(MOVIMENTO_REDUZIDO);
  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
}

function lerMovimento() {
  return window.matchMedia(MOVIMENTO_REDUZIDO).matches;
}

function assinarAba(aoMudar: () => void) {
  document.addEventListener("visibilitychange", aoMudar);
  return () => document.removeEventListener("visibilitychange", aoMudar);
}

function lerAba() {
  return document.hidden;
}

/* Nada a assinar: "já hidratou" só muda uma vez, e o React mesmo cuida
   disso ao trocar o instantâneo do servidor pelo do cliente. */
function semAssinatura() {
  return () => {};
}

function verdadeiro() {
  return true;
}

/* O instantâneo do servidor dos três. Lá não há nem preferência de movimento
   nem aba, e o valor precisa ser o mesmo em toda renderização de servidor. */
function falso() {
  return false;
}

/* O ponto de interesse vira `object-position`; sem ele, o centro. */
function posicaoDoFoco(foco: Foco | null): string | undefined {
  return foco ? `${foco.x * 100}% ${foco.y * 100}%` : undefined;
}

/* As medidas que o CDN entrega, para o navegador reservar o espaço. São as
   de ARTE_LARGA e ARTE_CELULAR em lib/sanity/banners.ts — que não entra aqui
   porque traria o cliente do Sanity para o navegador; o teste do carrossel
   confere que os números batem. A foto do composto sai com 1600px de
   largura e sem proporção combinada: 4:3 é a da área dela no desenho. */
const LARGA = { largura: 3000, altura: 1288 };
const CELULAR = { largura: 1080, altura: 1350 };
const FOTO = { largura: 1600, altura: 1200 };

/*
  O carrossel da home, sem biblioteca. A lógica é a do desenho aprovado
  (docs/desenho-aprovado/home-aprovada.html), passada para React; as contas
  da fita estão em lib/carrossel.ts.

  A fita: n slides reais mais uma cópia do último antes e uma do primeiro
  depois. Do último, "próximo" anda para a cópia do primeiro, sempre para a
  direita, e no fim do movimento a fita salta sem animação para o primeiro de
  verdade, que é idêntico. A posição da fita é escrita direto no elemento
  (`mover`), não pelo estado do React: "clique no meio do movimento conclui o
  atual e atende" exige que o salto aconteça ANTES do movimento seguinte, e
  dois `setState` no mesmo clique seriam agrupados num só, e o salto nunca
  chegaria à tela.

  O tempo: a bolinha do slide atual enche em INTERVALO por animação de CSS,
  e o fim da animação passa o slide. Parar é congelar a animação
  (`animation-play-state: paused`, pela classe `parado`), o que faz a barra
  continuar de onde parou quando a rotação volta.

  A rotação para em cinco situações: alguém pausa, o mouse entra, o teclado
  chega, a aba sai da frente — não faz sentido girar para ninguém — ou o
  componente ainda não hidratou (sem o React, o fim da barra não teria quem
  ouvisse). A pausa do botão é a única que continua depois que o mouse ou o
  foco saem; a regra e o porquê estão em lib/pausaDoCarrossel.ts.

  Quem liga "reduzir movimento" no sistema NÃO recebe rotação nenhuma. Quem
  liga isso costuma ter enxaqueca, vertigem ou epilepsia fotossensível: para
  essas pessoas, coisa que se move sozinha não é incômodo, é sintoma. Nesse
  caso o botão de pausa some, porque não há o que pausar, e as trocas pelas
  bolinhas e setas acontecem sem deslizar.

  As imagens chegam como endereço pronto (ver o comentário de `Banner` em
  lib/sanity/tipos.ts), não como referência do Sanity — por isso é `<img>`
  puro, não `next/image`: o CDN do Sanity já entrega cada imagem na largura
  certa (lib/sanity/banners.ts), e `next.config.ts` não registra
  `cdn.sanity.io` em `images.remotePatterns` — nenhum outro consumidor de
  imagem do Sanity no site usa `next/image` pelo mesmo motivo (ver
  components/editorial/LinhaNoticia.tsx e TextoRico.tsx).

  Três desenhos de slide:
  - "arte": a imagem pronta cobre o slide; no celular, a versão 4:5 quando
    existe; sem ela, a larga recortada pelo ponto de interesse.
  - "composto": texto à esquerda e foto à direita; no celular, o texto sobre
    a foto. Sem foto, a área dela vira moldura.
  - "provisorio" (lib/molduras.ts): a moldura "Arte a entrar" cobre o slide.
    Rotação, bolinhas e pausa tratam todos do mesmo jeito, porque o cliente
    quer ver o mecanismo funcionando antes de ter as artes. Quem garante que
    real e provisório nunca vêm misturados é quem monta a lista,
    `moldurasDaHome`, não este componente.
*/
export function Carrossel({ itens }: { itens: ItemDoCarrossel[] }) {
  const n = itens.length;
  const varios = n > 1;

  const raiz = useRef<HTMLElement>(null);
  const fita = useRef<HTMLDivElement>(null);
  const controles = useRef<HTMLDivElement>(null);
  /* Os slides reais, pelo índice: é neles que se mede o botão. */
  const reais = useRef<(HTMLDivElement | null)[]>([]);
  /* Onde a fita está e se está andando: do DOM, não do React (ver o
     comentário do componente). */
  const posicao = useRef(1);
  const movendo = useRef(false);
  const relogio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* O item real na tela. */
  const [atual, setAtual] = useState(0);
  /* A posição da fita que está entrando: a cópia, enquanto o movimento até
     ela não termina; depois, a real. Recebe a classe `ativo` junto com o
     real correspondente, para as animações de entrada não se repetirem no
     salto. */
  const [entrando, setEntrando] = useState(1);
  /* Muda a cada troca, para a barra de tempo recomeçar do zero mesmo quando
     o destino é o próprio slide atual. */
  const [volta, setVolta] = useState(0);
  const [pausa, avisar] = useReducer(aplicarEvento, SEM_PAUSA);

  /*
    `useSyncExternalStore`, e não `useState`, porque as duas árvores precisam
    bater.

    `semMovimento` decide se o botão "Pausar" existe no JSX lá embaixo, e este
    componente é renderizado no servidor antes de hidratar. Ler `matchMedia`
    na inicialização de um `useState` daria dois resultados: no servidor não
    há `window`, então `false`, e o botão nasce; no cliente de quem tem
    "reduzir movimento" ligado, `true`, e o botão não nasce. O React
    descartaria a árvore do servidor e refaria do zero — justamente para quem
    a regra existe para proteger.

    O terceiro argumento é o instantâneo do servidor, e o React o usa tanto
    para renderizar no servidor quanto para a renderização de hidratação: as
    duas nascem iguais. Só depois de hidratar ele passa a `lerMovimento`. Isso
    também fecha a corrida com a rotação: até a hidratação terminar, `gira`
    é falso (ver `hidratado`), então a barra de tempo não corre para quem
    pediu menos movimento nem por um instante.
  */
  const semMovimento = useSyncExternalStore(
    assinarMovimento,
    lerMovimento,
    falso,
  );

  /*
    A quarta situação que para a rotação: a aba sai da frente.

    O que o navegador faz com a animação de uma aba em segundo plano varia
    de navegador para navegador; esta pausa não depende disso. Sem ela, um
    banner pode trocar sozinho enquanto ninguém olha, e
    quem volta à aba encontra a rotação fora de sincronia com o que fez por
    último (setas, bolinhas, dedo). `visibilitychange` é o evento que o
    próprio navegador dispara nas duas transições, então um só listener cobre
    ir e voltar.

    Mesma forma do `semMovimento` acima, pela mesma razão: hoje `abaOculta`
    entra na classe `parado`, que sai no HTML do servidor, e um valor lido
    diferente lá e na hidratação faria as duas árvores divergirem.
  */
  const abaOculta = useSyncExternalStore(assinarAba, lerAba, falso);

  /*
    Falso no servidor e na hidratação, verdadeiro logo depois. A barra de
    tempo é animação de CSS e começaria a correr assim que o HTML chegasse;
    se ela terminasse antes de o React estar ouvindo, ninguém passaria o
    slide, e o carrossel ficaria parado para sempre. Com isto ela nasce
    congelada no zero e só anda depois de hidratar.
  */
  const hidratado = useSyncExternalStore(semAssinatura, verdadeiro, falso);

  const gira =
    varios && hidratado && !semMovimento && !parado(pausa) && !abaOculta;

  /* Escreve a posição da fita. Sem animação: desliga a transição, escreve,
     força o navegador a aplicar (`offsetWidth`) e religa. */
  function mover(pos: number, animar: boolean) {
    const el = fita.current;
    if (!el) return;
    posicao.current = pos;
    el.style.transition = animar ? "" : "none";
    el.style.transform = `translateX(-${pos * 100}%)`;
    if (!animar) {
      void el.offsetWidth;
      el.style.transition = "";
    }
  }

  /* Fim do movimento: pelo aviso do navegador ou, se ele não vier (aba
     oculta), pelo relógio. Numa cópia, salta para o real idêntico. */
  function aoParar() {
    clearTimeout(relogio.current);
    movendo.current = false;
    const salto = precisaSaltar(posicao.current, n);
    if (salto !== null) {
      mover(salto, false);
      setEntrando(salto);
    }
  }

  /* `i` pode ser −1 ou n: as cópias. */
  function ir(i: number, animar = true) {
    if (movendo.current) aoParar(); // clique no meio do movimento: conclui e atende
    const real = indiceReal(i, n);
    setAtual(real);
    setVolta((v) => v + 1);
    if (!animar || semMovimento) {
      /* Sem deslizar, não há por que passar pela cópia. */
      mover(posicaoNaFita(real), false);
      setEntrando(posicaoNaFita(real));
      return;
    }
    const destino = posicaoNaFita(i);
    setEntrando(destino);
    if (destino !== posicao.current) movendo.current = true;
    mover(destino, true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(aoParar, 1200);
  }

  /* O grupo de controles fica com o centro alinhado ao centro do botão do
     slide atual. A conta é relativa ao próprio slide, então vale com a fita
     parada ou andando. Slide sem botão (arte, moldura): a margem do CSS. */
  function centralizar() {
    const slide = reais.current[atual];
    const grupo = controles.current;
    if (!slide || !grupo) return;
    const botao = slide.querySelector<HTMLElement>("[data-botao]");
    if (!botao) {
      grupo.style.left = "";
      return;
    }
    const rs = slide.getBoundingClientRect();
    const rb = botao.getBoundingClientRect();
    const centro = rb.left - rs.left + rb.width / 2;
    grupo.style.left = `${Math.round(centro - grupo.offsetWidth / 2)}px`;
  }

  /* Antes de pintar, para o grupo já sair andando para o lugar certo. */
  useLayoutEffect(centralizar);

  /* Os ouvintes nativos chamam a versão mais nova destas, sem precisar se
     reinscrever a cada troca de slide. */
  const recentralizar = useEffectEvent(centralizar);
  const deslizar = useEffectEvent((direcao: -1 | 1) => ir(atual + direcao));
  const usar = useEffectEvent(
    (evento: "mouseEntrou" | "mouseSaiu" | "focoEntrou" | "focoSaiu") =>
      avisar(evento),
  );

  /* A largura do botão muda quando a fonte termina de carregar, e a posição
     dele muda com a largura da tela. */
  useEffect(() => {
    if (!varios) return;
    let vivo = true;
    const aoRedimensionar = () => recentralizar();
    window.addEventListener("resize", aoRedimensionar);
    void document.fonts?.ready.then(() => {
      if (vivo) recentralizar();
    });
    return () => {
      vivo = false;
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [varios]);

  useEffect(() => () => clearTimeout(relogio.current), []);

  /*
    Mouse, teclado e dedo, em ouvintes nativos.

    Mouse: só `pointerType === "mouse"`. No celular, o toque dispara "mouse
    entrou" e nunca "saiu": o carrossel ficava parado para sempre depois do
    primeiro toque — defeito achado no desenho.

    Teclado: só quando o foco é visível (`:focus-visible`). Clicar numa
    bolinha com o mouse também põe o foco nela, e isso não é "o teclado
    chegou".

    Mouse e foco são dois motivos de uso; o carrossel volta a girar só
    quando os dois acabaram, por isso os dois sinalizadores locais.

    Dedo: deslizar para os lados troca o slide; para cima e para baixo
    continua rolando a página (`passive`, e a decisão em `direcaoDoDedo`).
  */
  useEffect(() => {
    const el = raiz.current;
    if (!el || !varios) return;
    let mouseDentro = false;
    let focoDentro = false;
    let x0: number | null = null;
    let y0 = 0;

    const aoEntrarPonteiro = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseDentro = true;
      usar("mouseEntrou");
    };
    const aoSairPonteiro = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseDentro = false;
      if (!focoDentro) usar("mouseSaiu");
    };
    const aoEntrarFoco = (e: FocusEvent) => {
      if (!(e.target instanceof Element) || !e.target.matches(":focus-visible")) return;
      focoDentro = true;
      usar("focoEntrou");
    };
    const aoSairFoco = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      focoDentro = false;
      if (!mouseDentro) usar("focoSaiu");
    };
    const aoTocar = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };
    const aoSoltar = (e: TouchEvent) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      const direcao = direcaoDoDedo(dx, dy);
      if (direcao !== 0) deslizar(direcao);
    };

    el.addEventListener("pointerenter", aoEntrarPonteiro);
    el.addEventListener("pointerleave", aoSairPonteiro);
    el.addEventListener("focusin", aoEntrarFoco);
    el.addEventListener("focusout", aoSairFoco);
    el.addEventListener("touchstart", aoTocar, { passive: true });
    el.addEventListener("touchend", aoSoltar, { passive: true });
    return () => {
      el.removeEventListener("pointerenter", aoEntrarPonteiro);
      el.removeEventListener("pointerleave", aoSairPonteiro);
      el.removeEventListener("focusin", aoEntrarFoco);
      el.removeEventListener("focusout", aoSairFoco);
      el.removeEventListener("touchstart", aoTocar);
      el.removeEventListener("touchend", aoSoltar);
    };
  }, [varios]);

  if (n === 0) return null;

  /* n + 2 posições com cópias nas pontas; um item só não gira nem copia. */
  const naFita = varios
    ? [
        { item: itens[n - 1], copia: true },
        ...itens.map((item) => ({ item, copia: false })),
        { item: itens[0], copia: true },
      ]
    : [{ item: itens[0], copia: false }];

  const corrente = itens[atual];
  const tema =
    corrente.tipo === "arte"
      ? corrente.tema
      : corrente.tipo === "provisorio"
        ? "escuro"
        : null;

  const classes = [
    styles.carrossel,
    tema === "escuro" ? styles.escuro : "",
    tema === "claro" ? styles.claro : "",
    gira ? "" : styles.parado,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={raiz}
      data-bloco="carrossel"
      aria-roledescription="carrossel"
      aria-label="Destaques da AMI"
      className={classes}
      style={{ "--intervalo": `${INTERVALO}ms` } as CSSProperties}
    >
      <div
        ref={fita}
        className={styles.slides}
        data-copias={varios ? "" : undefined}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "transform") aoParar();
        }}
      >
        {naFita.map(({ item, copia }, p) => {
          /* Sem cópias, a posição 0 é o próprio item. */
          const indice = varios ? (copia ? -1 : p - 1) : 0;
          const ativo =
            !varios || p === entrando || p === posicaoNaFita(atual);
          /* O real fora da tela não recebe foco nem é lido: quem navega
             pelo teclado troca de slide pelos controles. */
          const escondido = varios && !copia && indice !== atual;
          return (
            <div
              key={copia ? `copia-${p}` : item.id}
              ref={
                copia
                  ? undefined
                  : (no) => {
                      reais.current[indice] = no;
                    }
              }
              data-slide=""
              data-copia={copia ? "" : undefined}
              aria-hidden={copia ? "true" : undefined}
              inert={escondido || undefined}
              className={[
                styles.slide,
                item.tipo === "composto" ? "" : styles.arte,
                ativo ? styles.ativo : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <Slide item={item} copia={copia} primeiro={!copia && indice === 0} />
            </div>
          );
        })}
      </div>

      {varios ? (
        <div ref={controles} className={styles.controles}>
          <div className={styles.bolinhas}>
            {itens.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para o banner ${i + 1} de ${n}`}
                aria-current={i === atual ? "true" : undefined}
                className={
                  i === atual ? `${styles.bolinha} ${styles.ativa}` : styles.bolinha
                }
              >
                <span
                  key={i === atual ? volta : undefined}
                  onAnimationEnd={(e) => {
                    if (e.target !== e.currentTarget || i !== atual || !gira) return;
                    ir(atual + 1);
                  }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => ir(atual - 1)}
            aria-label="Anterior"
            className={`${styles.ctl} ${styles.anterior}`}
          >
            <Icone nome="anterior" tamanho={16} />
          </button>
          <button
            type="button"
            onClick={() => ir(atual + 1)}
            aria-label="Próximo"
            className={`${styles.ctl} ${styles.proximo}`}
          >
            <Icone nome="proximo" tamanho={16} />
          </button>
          {semMovimento ? null : (
            <button
              type="button"
              onClick={() => avisar("botao")}
              aria-label={rotuloDoBotao(pausa)}
              className={`${styles.ctl} ${styles.pausa}`}
            >
              <Icone nome={pausa.pausaDoBotao ? "retomar" : "pausar"} tamanho={16} />
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

/* O desenho de um slide. Numa cópia, nenhum link entra na ordem do Tab. */
function Slide({
  item,
  copia,
  primeiro,
}: {
  item: ItemDoCarrossel;
  copia: boolean;
  primeiro: boolean;
}) {
  const tabIndex = copia ? -1 : undefined;
  /* Só a primeira imagem do carrossel tem prioridade; o resto carrega
     quando chega perto da tela. */
  const carga = primeiro
    ? ({ fetchPriority: "high" } as const)
    : ({ loading: "lazy" } as const);

  if (item.tipo === "composto") {
    return (
      <>
        <div className={styles.anima}>
          {item.rotulo ? (
            <span className={`rotulo-secao ${styles.rotulo}`}>{item.rotulo}</span>
          ) : null}
          <div className={styles.titulo}>{item.titulo}</div>
          {item.texto ? <p>{item.texto}</p> : null}
          {item.destino && item.botao ? (
            <Link
              href={item.destino}
              tabIndex={tabIndex}
              data-botao=""
              className={`botao ${styles.acao}`}
            >
              {item.botao} <Icone nome="seta" />
            </Link>
          ) : null}
        </div>
        <div className={styles.foto}>
          {item.foto ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               o CDN do Sanity já redimensiona; ver o comentário do
               Carrossel. */
            <img
              src={item.foto}
              alt={item.fotoAlt}
              width={FOTO.largura}
              height={FOTO.altura}
              decoding="async"
              {...carga}
              style={{ objectPosition: posicaoDoFoco(item.foco) }}
            />
          ) : (
            /* Tarja no alto: no celular a moldura cobre o cartão, e embaixo
               moram o texto e os controles. */
            <MolduraProvisoria
              largura={FOTO.largura}
              altura={FOTO.altura}
              className="h-full items-start!"
              rotulo="Foto a entrar"
              legenda="Foto a entrar"
            />
          )}
        </div>
      </>
    );
  }

  let peca: ReactNode;
  if (item.tipo === "provisorio") {
    /* A tarja vai para o alto: embaixo moram os controles. */
    peca = (
      <div className={styles.cobre}>
        <MolduraProvisoria
          largura={1192}
          altura={512}
          className="h-full items-start!"
          rotulo={`Arte a entrar: ${item.rotulo}`}
          legenda={<>Arte a entrar: {item.rotulo}</>}
        />
      </div>
    );
  } else {
    peca = (
      <picture>
        {item.imagemCelular ? (
          <source
            media="(max-width: 700px)"
            srcSet={item.imagemCelular}
            width={CELULAR.largura}
            height={CELULAR.altura}
          />
        ) : null}
        {/* `<img>` puro: o CDN do Sanity já redimensiona; ver o comentário
            do Carrossel. (Dentro de `<picture>` a regra no-img-element do
            Next não reclama, por isso não há eslint-disable aqui.) */}
        <img
          src={item.imagem}
          alt={item.alt}
          width={LARGA.largura}
          height={LARGA.altura}
          decoding="async"
          {...carga}
          className={styles.arteImagem}
          style={{
            /* Com versão de celular, a larga só aparece onde cabe inteira. */
            objectPosition: item.imagemCelular ? undefined : posicaoDoFoco(item.foco),
          }}
        />
      </picture>
    );
  }

  return item.destino ? (
    <Link href={item.destino} tabIndex={tabIndex} className={styles.arteLink}>
      {peca}
    </Link>
  ) : (
    peca
  );
}
