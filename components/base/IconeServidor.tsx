import { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  SealCheck,
  Stethoscope,
  Heartbeat,
  Handshake,
  FlagBanner,
  Eye,
  HandHeart,
  Buildings,
  ArrowUpRight,
  MapPin,
  ArrowLeft,
  HandPalm,
  DropHalf,
  ForkKnife,
  GenderFemale,
  Brain,
  Bone,
  Ear,
  Baby,
  ChatsCircle,
  Hand,
  Drop,
} from "@phosphor-icons/react/dist/ssr";
import { desenharIcone, mapaDoCliente, type PropsDoIcone } from "@/components/base/Icone";

/*
  Os ícones que só componentes de servidor desenham: os das especialidades,
  os dos ladrilhos e os das páginas sem código no navegador.

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
  selo: SealCheck,
  estetoscopio: Stethoscope,
  batimento: Heartbeat,
  parceria: Handshake,
  bandeira: FlagBanner,
  olho: Eye,
  maoCoracao: HandHeart,
  predio: Buildings,
  setaDiagonal: ArrowUpRight,
  comoChegar: MapPin,
  voltar: ArrowLeft,
  palma: HandPalm,
  meiaGota: DropHalf,
  garfoEFaca: ForkKnife,
  feminino: GenderFemale,
  cerebro: Brain,
  osso: Bone,
  orelha: Ear,
  bebe: Baby,
  conversa: ChatsCircle,
  mao: Hand,
  gota: Drop,
} satisfies Record<string, Icon>;

/** Todos os nomes de ícone do site. */
export type NomeIcone = keyof typeof mapaDeTodos;

/** O ícone pelo nome, entre todos os do site. Só para componente de servidor. */
export function Icone(props: PropsDoIcone<NomeIcone>): ReactNode {
  return desenharIcone(mapaDeTodos[props.nome], props);
}

export function LadrilhoIcone({
  nome,
  pequeno = false,
}: {
  nome: NomeIcone;
  pequeno?: boolean;
}): ReactNode {
  return (
    <span
      className={`ladrilho-icone${pequeno ? " ladrilho-icone--pequeno" : ""}`}
      aria-hidden="true"
    >
      <Icone nome={nome} duotone tamanho={pequeno ? 23 : 28} />
    </span>
  );
}
