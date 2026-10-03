import type { ReactNode } from "react";

/*
  O desenho da moldura provisória ("FPO", for position only), numa peça só.

  Nasceu dentro de `Fotografia` e saiu de lá quando a home passou a ter
  outras coisas a entrar além de foto: os banners do carrossel, as capas
  das notícias, os logotipos dos parceiros. Todas são o mesmo bloco — verde
  profundo, o símbolo da AMI em máscara sobre um degradê e, quando há
  legenda, a tarja que diz por escrito o que falta ali.

  Este arquivo só DESENHA. Quem decide se uma moldura aparece é outra peça:
  para foto, `provisoria` em lib/imagens.ts; para o resto da home,
  `moldurasDaHome` em lib/molduras.ts.

  `largura` e `altura` são o par da peça de verdade, e viram `aspect-ratio`:
  no dia em que o material entra, nada no layout se move.
*/
export function MolduraProvisoria({
  largura,
  altura,
  rotulo,
  legenda,
  className = "",
}: {
  largura: number;
  altura: number;
  /** Nome acessível do bloco: leitor de tela não vê o desenho. */
  rotulo: string;
  /** Texto da tarja. Sem ela, sai só o bloco com o símbolo. */
  legenda?: ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{ aspectRatio: `${largura} / ${altura}` }}
      className={`relative isolate flex w-full items-end overflow-hidden bg-ami-green-900 ${className}`}
      role="img"
      aria-label={rotulo}
    >
      {/* Mesmo recurso de Cabeceira.tsx e EstadoVazio.tsx: o símbolo como
          máscara sobre um degradê, para a moldura ter matéria em vez de ser
          um retângulo chapado. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 scale-[1.35]"
        style={{
          background:
            "linear-gradient(150deg, var(--color-ami-lima-400), var(--color-ami-green-800))",
          opacity: 0.22,
          WebkitMaskImage: "url(/marca/ami-simbolo.svg)",
          maskImage: "url(/marca/ami-simbolo.svg)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      {legenda ? (
        <p className="w-full bg-ami-green-900/75 px-5 py-4 text-[13px] font-medium uppercase tracking-[0.09em] text-ami-lima-400 backdrop-blur-sm">
          {legenda}
        </p>
      ) : null}
    </div>
  );
}
