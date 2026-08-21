import { Breadcrumb, type ItemTrilha } from "@/components/layout/Breadcrumb";

/*
  Cabeceira das páginas internas: /medicos, /busca, cada especialidade e cada
  cruzamento de especialidade com bairro.

  É a mesma gramática do herói da home, uma oitava abaixo. Lá o símbolo é
  verde de marca sobre verde escuro, a 30% de opacidade, e o título sai no
  nível de display. Aqui o símbolo é o mesmo degradê a 7% sobre branco, e o
  título é um h1 comum. A cabeceira sangra de borda a borda em ambos os casos,
  o que é o que faz as duas lerem como o mesmo sistema em vez de como duas
  páginas feitas em dias diferentes.

  A contagem sai grande, à esquerda, em monoespaçada de registro: num
  diretório é a primeira coisa que a pessoa quer saber, antes de qualquer
  texto de abertura.

  Existe como componente porque quatro cópias do mesmo bloco de máscara CSS
  divergiriam na primeira alteração de opacidade.
*/
export function Cabeceira({
  trilha,
  titulo,
  contagem,
  rotuloContagem,
  children,
}: {
  trilha: ItemTrilha[];
  titulo: React.ReactNode;
  /** Número grande. Omitir quando a página não tem o que contar. */
  contagem?: number;
  /** Vem já flexionado por quem chama: só o chamador sabe o substantivo. */
  rotuloContagem?: string;
  /** Parágrafo de abertura, quando houver. */
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-line-strong bg-surface">
      {/* Some abaixo de md: num celular a marca disputaria largura com o
          título, que é o único elemento que precisa dela. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] top-1/2 hidden h-[190%] w-[42%] -translate-y-1/2 md:block"
        style={{
          background:
            "linear-gradient(150deg, var(--color-ami-green-500), var(--color-ami-green-700))",
          opacity: 0.07,
          WebkitMaskImage: "url(/marca/ami-simbolo.svg)",
          maskImage: "url(/marca/ami-simbolo.svg)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-4 pb-10 md:px-6">
        <Breadcrumb itens={trilha} />
        <h1 className="mt-1 max-w-[20ch]">{titulo}</h1>

        {contagem !== undefined ? (
          <p className="mt-5 flex items-baseline gap-2.5">
            <span className="registro font-titulo text-[40px] font-bold leading-none text-ami-green-600">
              {contagem}
            </span>
            <span className="text-[17px] text-ink-600">{rotuloContagem}</span>
          </p>
        ) : null}

        {children ? (
          <div className="coluna-leitura mt-4 text-ink-600">{children}</div>
        ) : null}
      </div>
    </header>
  );
}
