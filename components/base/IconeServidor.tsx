import { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight, MapPin, ArrowLeft, DeviceMobile } from "@phosphor-icons/react/dist/ssr";
import { desenharIcone, mapaDoCliente, type PropsDoIcone } from "@/components/base/Icone";

/*
  Os ícones que só componentes de servidor desenham: a seta diagonal ↗,
  o alfinete de "Como chegar", a seta ← de volta e o celular de "Fale com
  a AMI". Todos ao lado do texto de um botão ou link.

  NENHUM componente de cliente ("use client") importa este arquivo, nem
  direto nem por outro módulo: se importasse, todos os ícones daqui iriam
  para o JavaScript do navegador. A regra inteira e o porquê estão em
  components/base/Icone.tsx; testes/icones.test.ts trava.

  O `Icone` daqui aceita todos os nomes, os do cliente inclusive: um
  componente de servidor importa um só `Icone`, daqui, e desenha qualquer
  ícone do site.
*/
const mapaDeTodos = {
  ...mapaDoCliente,
  setaDiagonal: ArrowUpRight,
  comoChegar: MapPin,
  voltar: ArrowLeft,
  celular: DeviceMobile,
} satisfies Record<string, Icon>;

/** Todos os nomes de ícone do site. */
export type NomeIcone = keyof typeof mapaDeTodos;

/** O ícone pelo nome, entre todos os do site. Só para componente de servidor. */
export function Icone(props: PropsDoIcone<NomeIcone>): ReactNode {
  return desenharIcone(mapaDeTodos[props.nome], props);
}
