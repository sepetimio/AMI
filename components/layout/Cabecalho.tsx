import Link from "next/link";
import { Marca } from "@/components/marca/Marca";

const MENU = [
  { rotulo: "Buscar médicos", href: "/medicos" },
  { rotulo: "A Associação", href: "/associacao" },
];

/*
  Cabeçalho claro. A marca da AMI é verde-escura e sumiria sobre a faixa
  verde-800 prevista na direção de arte — o verde segue estruturando o site
  no herói da home, no bloco institucional e no rodapé.

  Separado do conteúdo por um fio de 1px, não por sombra.
*/
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3 md:px-6">
        <Link
          href="/"
          /* min-h-11 = 44px, o alvo mínimo de toque no mobile — a marca
             tem 40px de altura e sozinha ficaria abaixo do mínimo. */
          className="flex min-h-11 shrink-0 items-center"
          aria-label="Ir para a página inicial da AMI"
        >
          <Marca altura={40} />
        </Link>

        <nav aria-label="Principal" className="ml-auto">
          <ul className="flex items-center gap-1">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  /* min-h-11 = 44px, o alvo mínimo de toque no mobile */
                  className="flex min-h-11 items-center rounded-controle px-3 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
