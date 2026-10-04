import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { BarraDoPe } from "@/components/layout/BarraDoPe";
import { Revelar } from "@/components/layout/Revelar";
import { VoltaAoTopo } from "@/components/layout/VoltaAoTopo";

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
      {/* Depois do rodapé, nunca entre o cabeçalho e o `<main>`: o teste do
          cabeçalho trava os dois colados. A barra é presa à tela e não ocupa
          lugar no fluxo, então a posição no código não muda onde ela aparece. */}
      <BarraDoPe />
      {/* Não desenha nada: leva ao topo da página nova na troca por link, e
          não no voltar nem no avançar (components/layout/VoltaAoTopo.tsx).
          Age antes da pintura, e por isso antes do `<Revelar />`, que decide
          o que espera pela posição em que a página abre. */}
      <VoltaAoTopo />
      {/* Não desenha nada: põe em espera os blocos `.revelar` que abrem fora
          da tela e os faz entrar ao rolar (components/layout/Revelar.tsx). */}
      <Revelar />
    </>
  );
}
