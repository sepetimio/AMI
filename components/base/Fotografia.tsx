import Image from "next/image";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
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
    /* O desenho mora em MolduraProvisoria, compartilhado com as outras
       molduras da home. O par largura/altura é o da foto de verdade: o dia
       em que ela entrar, nada no layout se move. */
    return (
      <MolduraProvisoria
        largura={largura}
        altura={altura}
        rotulo={`Espaço reservado para fotografia: ${alt}`}
        legenda={<>Fotografia a entrar: {rotulo}</>}
        className={className}
      />
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
