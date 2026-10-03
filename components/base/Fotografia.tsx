import Image from "next/image";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { ESPACOS, type NomeEspaco } from "@/lib/imagens";
import { desenhoDaFotografia } from "@/lib/molduras";

/*
  Fotografia de um espaço declarado em lib/imagens.ts.

  Enquanto o espaço estiver marcado como provisório, sai a moldura FPO no
  lugar: mesma proporção, mesmo peso visual, e o nome da foto que falta
  escrito nela. O raciocínio inteiro está em lib/imagens.ts.

  Mas só no modo demonstração. Fora dele, foto provisória não desenha nada
  (devolve null): é a mesma trava das molduras da home, e a decisão é de
  `desenhoDaFotografia`, em lib/molduras.ts. `demonstracao` vem, por padrão,
  da chave de verdade; a prop existe para o teste poder passar os dois
  valores. Quem põe uma Fotografia dentro de uma casca precisa perguntar a
  mesma função antes, senão a casca fica vazia.

  Com material real, sai `next/image`. Largura e altura declaradas em ambos os
  casos: sem elas a imagem empurra o texto quando termina de carregar, que é a
  maior fonte de deslocamento de layout num site com foto.
*/
export function Fotografia({
  espaco,
  className = "",
  sizes = "100vw",
  demonstracao = DADOS_DEMONSTRACAO,
}: {
  espaco: NomeEspaco;
  className?: string;
  sizes?: string;
  demonstracao?: boolean;
}) {
  const { fonte, alt, largura, altura, rotulo, provisoria } = ESPACOS[espaco];
  const desenho = desenhoDaFotografia(provisoria, demonstracao);

  if (desenho === "nada") return null;

  if (desenho === "moldura") {
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
      className={className}
    />
  );
}
