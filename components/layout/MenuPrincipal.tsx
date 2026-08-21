"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { rotulo: "Buscar médicos", href: "/medicos" },
  { rotulo: "Notícias", href: "/noticias" },
  { rotulo: "A Associação", href: "/associacao" },
];

/*
  Folha cliente isolada, e é o único motivo de existir separada do cabeçalho:
  não há como um Server Component saber o caminho atual, e sem isso o menu não
  consegue dizer onde a pessoa está. O resto do cabeçalho continua no servidor.

  O item atual é marcado por três sinais ao mesmo tempo, de propósito:
  `aria-current` para leitor de tela, peso e cor para quem enxerga, e um traço
  sob o rótulo. Um sinal só de cor excluiria quem não a distingue.
*/
export function MenuPrincipal() {
  const caminho = usePathname();

  return (
    <nav aria-label="Principal" className="ml-auto">
      <ul className="flex items-center gap-1">
        {MENU.map((item) => {
          /* Prefixo, não igualdade: /medicos/cardiologia continua marcando
             "Buscar médicos". Só a home usaria igualdade, e ela não está no
             menu porque a marca à esquerda já é o link para ela. */
          const atual = caminho.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={atual ? "page" : undefined}
                /* min-h-11 = 44px, o alvo mínimo de toque no mobile. */
                className={`pressiona relative flex min-h-11 items-center rounded-controle px-3 text-[15px] font-semibold ${
                  atual
                    ? "text-ink-900"
                    : "text-ami-green-600 hover:bg-ami-mint-100"
                }`}
              >
                {item.rotulo}
                {atual ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-chip bg-ami-green-600"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
