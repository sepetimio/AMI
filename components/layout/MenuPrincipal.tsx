"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
  `curto` é o rótulo do celular. "Buscar médicos" sozinho não cabe: com a
  marca, os três itens e os respiros, a barra pedia 428px numa tela de 375, e
  o excesso empurrava a página inteira para o lado. Medido, não estimado.
*/
const MENU = [
  { rotulo: "Buscar médicos", curto: "Médicos", href: "/medicos" },
  { rotulo: "Notícias", curto: "Notícias", href: "/noticias" },
  { rotulo: "A Associação", curto: "Associação", href: "/associacao" },
];

/*
  Folha cliente isolada, e é o único motivo de existir separada do cabeçalho:
  não há como um Server Component saber o caminho atual, e sem isso o menu não
  consegue dizer onde a pessoa está. O resto do cabeçalho continua no servidor.

  O item atual é marcado por dois sinais ao mesmo tempo, de propósito:
  `aria-current` para leitor de tela, e peso mais preenchimento sólido para
  quem enxerga. Um sinal só de cor excluiria quem não a distingue, e por isso
  o item atual muda de peso e ganha fundo, não só de tom.

  A pílula preenchida substituiu o traço sob o rótulo. Num cabeçalho que agora
  flutua com canto arredondado, um sublinhado reto destoava da própria peça
  que o contém.

  A navegação rola na horizontal se ainda assim não couber, num aparelho de
  320px por exemplo. É rede de segurança, não o comportamento esperado: com os
  rótulos curtos a barra cabe folgada em 375px. O que ela garante é que o
  excesso fique contido aqui dentro em vez de virar rolagem lateral da página,
  que é o defeito que mais irrita em celular.
*/
export function MenuPrincipal() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="ml-auto min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center gap-0.5 md:gap-1">
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
                /* min-h-11 = 44px, o alvo mínimo de toque no celular. */
                className={`pressiona flex min-h-11 items-center whitespace-nowrap rounded-chip px-2.5 text-[15px] md:px-4 ${
                  atual
                    ? "bg-ami-green-600 font-semibold text-white shadow-apoio"
                    : "font-medium text-ink-600 hover:bg-canvas hover:text-ink-900"
                }`}
              >
                <span className="sm:hidden">{item.curto}</span>
                <span className="hidden sm:inline">{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
