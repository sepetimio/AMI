import { ReactNode } from "react";
import {
  SealCheck,
  Stethoscope,
  Heartbeat,
  MapPinArea,
  FlagBanner,
  Eye,
  HandHeart,
  Buildings,
  MagnifyingGlass,
  ArrowRight,
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Pause,
  Play,
  List,
  X,
  Phone,
} from "@phosphor-icons/react/dist/ssr";

export type NomeIcone =
  | "selo"
  | "estetoscopio"
  | "batimento"
  | "mapa"
  | "bandeira"
  | "olho"
  | "maoCoracao"
  | "predio"
  | "lupa"
  | "seta"
  | "setaDiagonal"
  | "anterior"
  | "proximo"
  | "pausar"
  | "retomar"
  | "menu"
  | "fechar"
  | "telefone";

const iconMap: Record<NomeIcone, typeof SealCheck> = {
  selo: SealCheck,
  estetoscopio: Stethoscope,
  batimento: Heartbeat,
  mapa: MapPinArea,
  bandeira: FlagBanner,
  olho: Eye,
  maoCoracao: HandHeart,
  predio: Buildings,
  lupa: MagnifyingGlass,
  seta: ArrowRight,
  setaDiagonal: ArrowUpRight,
  anterior: CaretLeft,
  proximo: CaretRight,
  pausar: Pause,
  retomar: Play,
  menu: List,
  fechar: X,
  telefone: Phone,
};

export function Icone({
  nome,
  tamanho = 20,
  duotone = false,
}: {
  nome: NomeIcone;
  tamanho?: number;
  duotone?: boolean;
}): ReactNode {
  const IconComponent = iconMap[nome];
  const weight = (duotone ? "duotone" : "regular") as never;
  return (
    <IconComponent
      size={tamanho}
      weight={weight}
      aria-hidden="true"
    />
  );
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
