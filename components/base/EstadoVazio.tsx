/*
  Todo container de lista tem estado vazio desenhado. Lista em branco sem
  explicação é um dos sinais mais visíveis de protótipo inacabado — e aqui
  também é um beco sem saída para o usuário.
*/
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-painel border border-line bg-surface px-6 py-20 text-center shadow-erguido">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[220%] -translate-y-1/2"
        style={{
          background:
            "linear-gradient(150deg, var(--color-ami-green-500), var(--color-ami-green-700))",
          opacity: 0.055,
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
      <h2 className="text-[24px] font-semibold tracking-[-0.02em]">
        {titulo}
      </h2>
      <p className="coluna-leitura mx-auto mt-2 text-ink-600">{descricao}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}
