import Image from "next/image";
import { ESPACOS, type NomeEspaco } from "@/lib/imagens";

/*
  Fotografia de um espaço declarado em lib/imagens.ts.

  Enquanto o espaço estiver marcado como provisório, sai a moldura FPO no
  lugar: mesma proporção, mesmo peso visual, e o nome da foto que falta
  escrito nela. O raciocínio inteiro está em lib/imagens.ts.

  Com material real, sai `next/image`. Largura e altura declaradas em ambos os
  casos: sem elas a imagem empurra o texto quando termina de carregar, que é a
  maior fonte de deslocamento de layout num site com foto.

  `prioridade` marca a imagem que aparece antes da primeira rolagem. Só uma
  por página pode receber, porque é a que o navegador busca primeiro, e marcar
  duas é o mesmo que não marcar nenhuma.
*/
export function Fotografia({
  espaco,
  className = "",
  prioridade = false,
  sizes = "100vw",
}: {
  espaco: NomeEspaco;
  className?: string;
  prioridade?: boolean;
  sizes?: string;
}) {
  const { fonte, alt, largura, altura, rotulo, provisoria } = ESPACOS[espaco];

  if (provisoria) {
    return (
      <div
        /* `aspect-ratio` pelo mesmo par largura/altura da foto de verdade: o
           dia em que ela entrar, nada no layout se move. */
        style={{ aspectRatio: `${largura} / ${altura}` }}
        className={`relative isolate flex w-full items-end overflow-hidden bg-ami-green-900 ${className}`}
        role="img"
        aria-label={`Espaço reservado para fotografia: ${alt}`}
      >
        {/* Mesmo recurso do herói: o símbolo como máscara sobre um degradê,
            para a moldura ter matéria em vez de ser um retângulo chapado. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 scale-[1.35]"
          style={{
            background:
              "linear-gradient(150deg, var(--color-ami-green-500), var(--color-ami-green-700))",
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
        <p className="w-full bg-ami-green-950/75 px-5 py-4 text-[13px] font-medium uppercase tracking-[0.09em] text-ami-mint-400 backdrop-blur-sm">
          Fotografia a entrar: {rotulo}
        </p>
      </div>
    );
  }

  return (
    <Image
      src={fonte}
      alt={alt}
      width={largura}
      height={altura}
      sizes={sizes}
      priority={prioridade}
      className={className}
    />
  );
}
