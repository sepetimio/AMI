"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Banner } from "@/lib/sanity/tipos";

const INTERVALO = 6000;

/*
  O carrossel de banners, sem biblioteca.

  Encaixe de rolagem faz o trabalho pesado: arrastar no celular vem de graça,
  e a posição é o próprio `scrollLeft`. O JavaScript só empurra.

  A rotação para em quatro situações: alguém pausa, o mouse entra, o teclado
  chega, ou a aba sai da frente — não faz sentido girar para ninguém.

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
*/
export function Carrossel({ banners }: { banners: Banner[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [semMovimento, setSemMovimento] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => setSemMovimento(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  const gira = banners.length > 1 && !semMovimento && !pausado;

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
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
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
            const arte = (
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
              onClick={() => setPausado((p) => !p)}
              className="pressiona ml-2 rounded-controle border border-line px-3 py-2 text-[14px] font-medium text-ink-600 hover:text-ink-900"
            >
              {pausado ? "Retomar" : "Pausar"}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
