import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";

export default function LayoutSite({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Primeiro alvo do Tab: quem navega por teclado não precisa
          atravessar o menu inteiro a cada página. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-controle focus:bg-ami-green-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape />
    </>
  );
}
