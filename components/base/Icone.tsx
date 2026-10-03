import { ReactNode } from "react";
import type { IconWeight } from "@phosphor-icons/react";
import {
  SealCheck,
  Stethoscope,
  Heartbeat,
  Handshake,
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
  WhatsappLogo,
  MapPin,
  ArrowLeft,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";

export type NomeIcone =
  | "selo"
  | "estetoscopio"
  | "batimento"
  | "parceria"
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
  | "telefone"
  | "whatsapp"
  | "comoChegar"
  | "voltar"
  | "abaixo";

const mapaDeIcones: Record<NomeIcone, typeof SealCheck> = {
  selo: SealCheck,
  estetoscopio: Stethoscope,
  batimento: Heartbeat,
  parceria: Handshake,
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
  whatsapp: WhatsappLogo,
  comoChegar: MapPin,
  voltar: ArrowLeft,
  abaixo: CaretDown,
};

export function Icone({
  nome,
  tamanho = 20,
  duotone = false,
  className = "",
}: {
  nome: NomeIcone;
  tamanho?: number;
  duotone?: boolean;
  className?: string;
}): ReactNode {
  const IconComponent = mapaDeIcones[nome];
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
