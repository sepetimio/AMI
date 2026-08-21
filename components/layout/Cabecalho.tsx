import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { MenuPrincipal } from "@/components/layout/MenuPrincipal";

/*
  Cabeçalho claro. A marca da AMI é verde-escura e sumiria sobre a faixa
  verde-800 do herói, que é o motivo de o verde estruturar o site por baixo do
  cabeçalho, e não dentro dele.

  Separado do conteúdo por um fio, não por sombra. O fio ganhou um segundo
  traço em verde-600 na base: contra o título de display do herói o cabeçalho
  antigo ficava tímido, e um cabeçalho tímido em cima de uma cabeceira forte
  lê como duas páginas empilhadas em vez de uma.

  A altura total fica em 68px, dentro do teto de 80px que uma barra de
  navegação pode ocupar antes de começar a comer a primeira dobra.
*/
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ami-green-600 bg-surface shadow-apoio">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3 md:px-6">
        <Link
          href="/"
          /* min-h-11 = 44px, o alvo mínimo de toque no mobile. A marca tem
             44px de altura e sozinha ficaria no limite. */
          className="pressiona flex min-h-11 shrink-0 items-center rounded-controle"
          aria-label="Ir para a página inicial da AMI"
        >
          <Marca altura={44} />
        </Link>

        <MenuPrincipal />
      </div>
    </header>
  );
}
