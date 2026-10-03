"use client";

import Link from "next/link";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import type { ItemDoCarrossel } from "@/lib/molduras";
import {
  SEM_PAUSA,
  aplicarEvento,
  parado,
  rotuloDoBotao,
} from "@/lib/pausaDoCarrossel";

const INTERVALO = 6000;

const MOVIMENTO_REDUZIDO = "(prefers-reduced-motion: reduce)";

/*
  Os quatro pares abaixo alimentam os `useSyncExternalStore` do componente e
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

/* O instantâneo do servidor dos dois. Lá não há nem preferência de movimento
   nem aba, e o valor precisa ser o mesmo em toda renderização de servidor. */
function falso() {
  return false;
}

/*
  O carrossel de banners, sem biblioteca.

  Encaixe de rolagem faz o trabalho pesado: arrastar no celular vem de graça,
  e a posição é o próprio `scrollLeft`. O JavaScript só empurra.

  A rotação para em quatro situações: alguém pausa, o mouse entra, o teclado
  chega, ou a aba sai da frente — não faz sentido girar para ninguém. A pausa
  do botão é a única que continua depois que o mouse ou o foco saem; a regra
  e o porquê estão em lib/pausaDoCarrossel.ts.

  Quem liga "reduzir movimento" no sistema NÃO recebe rotação nenhuma. Quem
  liga isso costuma ter enxaqueca, vertigem ou epilepsia fotossensível: para
  essas pessoas, coisa que se move sozinha não é incômodo, é sintoma. Nesse
  caso o botão de pausa some, porque não há o que pausar.

  `imagem` chega como endereço pronto (ver o comentário de `Banner` em
  lib/sanity/tipos.ts), não como referência do Sanity — por isso é `<img>`
  puro, não `next/image`: o CDN do Sanity já entrega a arte no tamanho certo
  (`lib/sanity/banners.ts` pede exatamente 3000px), e `next.config.ts` não
  registra `cdn.sanity.io` em `images.remotePatterns` — nenhum outro
  consumidor de imagem do Sanity no site usa `next/image` pelo mesmo motivo
  (ver components/editorial/LinhaNoticia.tsx e TextoRico.tsx).

  Um item pode ser também um banner PROVISÓRIO (`tipo: "provisorio"`, ver
  lib/molduras.ts): no lugar do `<img>` sai a moldura "Arte a entrar", na
  mesma proporção 3000 × 856 da arte real. Só o desenho de cada slide muda —
  rotação, setas, bolinhas e pausa tratam os dois do mesmo jeito, porque o
  cliente quer ver o mecanismo funcionando antes de ter as artes. Quem
  garante que real e provisório nunca vêm misturados é quem monta a lista,
  `moldurasDaHome`, não este componente.
*/
export function Carrossel({ banners }: { banners: ItemDoCarrossel[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
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
    também fecha a corrida que o `useState(false)` original tinha, porque a
    correção chega no commit da hidratação, antes de o efeito da rotação mais
    abaixo criar o temporizador de `INTERVALO`.
  */
  const semMovimento = useSyncExternalStore(
    assinarMovimento,
    lerMovimento,
    falso,
  );

  /*
    A quarta situação que para a rotação: a aba sai da frente.

    Um temporizador de 6s continua rodando numa aba em segundo plano — o
    navegador só reduz a frequência dele, não zera. Sem isto, um banner
    pode trocar sozinho enquanto ninguém olha, e quem volta à aba encontra
    a rotação fora de sincronia com o que fez por último (setas, bolinhas,
    arrastar). `visibilitychange` é o evento que o próprio navegador
    dispara nas duas transições, então um só listener cobre ir e voltar.

    Mesma forma do `semMovimento` acima, pela mesma razão: hoje `abaOculta`
    não entra em nenhum JSX condicional, mas quem for mexer nisso depois não
    tem como saber disso, e o defeito só apareceria em produção.
  */
  const abaOculta = useSyncExternalStore(assinarAba, lerAba, falso);

  const gira =
    banners.length > 1 && !semMovimento && !parado(pausa) && !abaOculta;

  /*
    `[gira, atual, banners.length]`, não `[]`.

    Sem vetor, o efeito reexecutava a cada render — recriando o temporizador
    sem necessidade, mas ainda com `atual` fresco a cada vez, porque cada
    render tinha o seu.

    Um vetor que esquecesse `atual` (por exemplo `[gira, banners.length]`)
    quebraria de verdade: o efeito só reconstrói o `setInterval` quando uma
    dependência listada muda, então o fecho (closure) de dentro dele ficaria
    preso no `atual` de quando o efeito rodou pela última vez. O primeiro
    disparo chama `irPara(1)`, o estado muda para 1, mas `gira` e
    `banners.length` continuam iguais — o efeito não reexecuta, e o
    temporizador antigo, ainda fechado sobre `atual = 0`, dispara de novo
    `irPara((0 + 1) % N)`, ou seja `irPara(1)`. A rotação empaca oscilando
    entre o primeiro e o segundo banner para sempre.

    Com `atual` no vetor, toda troca de banner (pelo temporizador, pelas
    setas, pelas bolinhas ou por arrastar) reconstrói o temporizador com o
    valor novo, e a rotação continua avançando.
  */
  useEffect(() => {
    if (!gira) return;
    const t = setInterval(() => irPara((atual + 1) % banners.length), INTERVALO);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gira, atual, banners.length]);

  function irPara(i: number) {
    const el = trilho.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: semMovimento ? "auto" : "smooth" });
    setAtual(i);
  }

  if (banners.length === 0) return null;

  const varios = banners.length > 1;

  return (
    <section
      aria-label="Destaques da AMI"
      className="mx-auto max-w-[1200px] px-4 md:px-6"
      onMouseEnter={() => avisar("mouseEntrou")}
      onMouseLeave={() => avisar("mouseSaiu")}
      onFocusCapture={() => avisar("focoEntrou")}
      onBlurCapture={() => avisar("focoSaiu")}
    >
      <div className="relative">
        <div
          ref={trilho}
          onScroll={(e) => {
            const el = e.currentTarget;
            setAtual(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-bloco [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {banners.map((b, i) => {
            /* Provisório: moldura. Composto: ainda sem desenho (a tarefa 6 o
               desenha); só a arte pronta sai como imagem. */
            if (b.tipo === "composto") return null;
            const arte = b.tipo === "provisorio" ? (
              <MolduraProvisoria
                largura={3000}
                altura={856}
                rotulo={`Arte a entrar: ${b.rotulo}`}
                legenda={<>Arte a entrar: {b.rotulo}</>}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element --
                 o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts e
                 o comentário no topo deste arquivo. */
              <img
                src={b.imagem}
                alt={b.alt}
                width={3000}
                height={856}
                loading={i === 0 ? undefined : "lazy"}
                className="h-auto w-full"
              />
            );
            return (
              <div key={b.id} className="w-full shrink-0 snap-start">
                {b.destino ? <Link href={b.destino}>{arte}</Link> : arte}
              </div>
            );
          })}
        </div>
      </div>

      {varios ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => irPara((atual - 1 + banners.length) % banners.length)}
            className="pressiona rounded-controle border border-line px-3 py-2 text-[14px] text-ink-600 hover:text-ink-900"
          >
            Anterior
          </button>

          <div className="flex gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o banner ${i + 1} de ${banners.length}`}
                aria-current={i === atual}
                className={
                  i === atual
                    ? "size-2.5 rounded-full bg-ami-green-600"
                    : "size-2.5 rounded-full border border-line-strong bg-surface"
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => irPara((atual + 1) % banners.length)}
            className="pressiona rounded-controle border border-line px-3 py-2 text-[14px] text-ink-600 hover:text-ink-900"
          >
            Próximo
          </button>

          {semMovimento ? null : (
            <button
              type="button"
              onClick={() => avisar("botao")}
              className="pressiona ml-2 rounded-controle border border-line px-3 py-2 text-[14px] font-medium text-ink-600 hover:text-ink-900"
            >
              {rotuloDoBotao(pausa)}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
