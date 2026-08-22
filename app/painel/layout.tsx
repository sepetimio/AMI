import type { Metadata } from "next";
import Link from "next/link";

/*
  Casca visual do painel, e nada mais.

  NÃO confere permissão. O guia de autenticação do Next 16 é explícito sobre
  por quê: layout não roda de novo a cada navegação, então uma conferência
  aqui deixa buraco entre telas. Cada página chama `exigirAdmin()` por conta
  própria.

  O `robots` abaixo é a primeira tranca contra indexação. A segunda já existe
  em `app/robots.ts`, que lista /painel/ em disallow.
*/
export const metadata: Metadata = {
  title: "Painel · AMI",
  robots: { index: false, follow: false },
};

export default function LayoutDoPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 md:px-8">
          <Link href="/painel" className="texto-placa text-[15px] text-ink-900">
            Painel da AMI
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
