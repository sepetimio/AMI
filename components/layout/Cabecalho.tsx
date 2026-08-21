import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { MenuPrincipal } from "@/components/layout/MenuPrincipal";

/*
  Cabeçalho solto, não colado.

  A versão anterior era a barra de borda a borda grudada no topo, separada do
  conteúdo por um fio de 1px. É o padrão mais antigo que existe na web e é
  exatamente o que faz uma página parecer documento com um menu em cima, em
  vez de produto.

  Aqui ele descola: fica preso na rolagem, mas recuado das bordas, com canto
  generoso e sombra difusa. O efeito é o de uma peça pousada sobre a página,
  e é o mesmo princípio que rege os cartões do resto do site.

  `backdrop-blur` só aqui e no rodapé, que são fixos. Aplicado a contêiner que
  rola, o desfoque força repintura de GPU a cada quadro e derruba os quadros
  por segundo no celular, que é o aparelho de quem procura médico às pressas.

  A altura útil fica em 64px, dentro do teto de 80px que uma barra pode ocupar
  antes de começar a comer a primeira dobra.
*/
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 md:px-5 md:pt-5">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 rounded-painel border border-line bg-surface/80 px-3 py-2.5 md:gap-6 shadow-erguido backdrop-blur-xl md:px-6">
        <Link
          href="/"
          /* min-h-11 = 44px, o alvo mínimo de toque no celular. */
          className="pressiona flex min-h-11 shrink-0 items-center rounded-controle"
          aria-label="Ir para a página inicial da AMI"
        >
          <Marca altura={40} />
        </Link>

        <MenuPrincipal />
      </div>
    </header>
  );
}
