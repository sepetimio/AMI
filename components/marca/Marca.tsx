/*
  A marca entra como <img> apontando para o SVG estático, não embutida no JSX:
  o traçado tem cerca de 55 KB e embutir isso em toda página desperdiçaria
  banda em cada navegação. Como arquivo, o navegador guarda em cache uma vez.

  width e height declarados evitam deslocamento de layout no carregamento.
*/
export function Marca({
  className = "",
  altura = 42,
}: {
  className?: string;
  altura?: number;
}) {
  const proporcao = 602 / 480;
  return (
    <img
      src="/marca/ami-marca.svg"
      alt="Associação Médica de Imperatriz"
      width={Math.round(altura * proporcao)}
      height={altura}
      className={className}
    />
  );
}
