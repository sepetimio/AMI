import { ReactNode } from "react";
import type { Icon, IconWeight } from "@phosphor-icons/react";
import {
  MagnifyingGlass,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Pause,
  Play,
  List,
  X,
  Phone,
  WhatsappLogo,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";

/*
  Os ícones do site ficam em dois mapas, para que o JavaScript do navegador
  leve só os ícones que o navegador desenha.

  Por que dois:
  - Um componente de cliente ("use client") vai para o JavaScript que toda
    página baixa, com tudo o que ele importa.
  - Se ele importa um mapa de ícones, o mapa vai inteiro: o empacotador não
    sabe que nome vai chegar em `nome` e leva todos.
  - Com um mapa só, os ícones das especialidades e dos ladrilhos iam para o
    arquivo compartilhado de todas as páginas, a home inclusive, sem que
    nenhum código do navegador os desenhasse.

  A regra:
  - Este arquivo tem só os ícones que algum componente de cliente desenha.
    É o único mapa que um componente de cliente pode importar.
  - components/base/IconeServidor.tsx tem os demais, o `LadrilhoIcone` e um
    `Icone` que aceita todos os nomes. Só componente de servidor o importa.
  - Um componente de servidor usa este arquivo ou aquele, tanto faz para o
    navegador: o que ele desenha chega pronto, como SVG no HTML.

  Ao pôr um ícone:
  - se algum componente de cliente o desenha, ele entra aqui;
  - se não, entra em IconeServidor.tsx;
  - se o último componente de cliente que usava um ícone daqui deixa de
    usá-lo, o ícone passa para lá.

  testes/icones.test.ts trava as duas metades:
  - nenhum arquivo "use client" de components/ e app/, nem o que ele importa,
    chega a IconeServidor.tsx;
  - cada nome daqui aparece em algum arquivo "use client".
*/
export const mapaDoCliente = {
  lupa: MagnifyingGlass,
  seta: ArrowRight,
  anterior: CaretLeft,
  proximo: CaretRight,
  pausar: Pause,
  retomar: Play,
  menu: List,
  fechar: X,
  telefone: Phone,
  whatsapp: WhatsappLogo,
  abaixo: CaretDown,
} satisfies Record<string, Icon>;

export type NomeIconeDoCliente = keyof typeof mapaDoCliente;

export type PropsDoIcone<Nome extends string> = {
  nome: Nome;
  tamanho?: number;
  duotone?: boolean;
  className?: string;
};

/** O SVG de um ícone Phosphor, igual para os dois mapas. */
export function desenharIcone(
  IconComponent: Icon,
  { tamanho = 20, duotone = false, className = "" }: Omit<PropsDoIcone<string>, "nome">,
): ReactNode {
  const weight: IconWeight = duotone ? "duotone" : "regular";
  return (
    <IconComponent
      size={tamanho}
      weight={weight}
      className={className}
      aria-hidden="true"
    />
  );
}

/** O ícone pelo nome, entre os que o cliente desenha. */
export function Icone(props: PropsDoIcone<NomeIconeDoCliente>): ReactNode {
  return desenharIcone(mapaDoCliente[props.nome], props);
}
