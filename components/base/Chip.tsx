/*
  Dois tons, e a diferença entre eles é hierarquia, não decoração.

  A versão anterior tinha um tom só de fato: bairro, telemedicina,
  acessibilidade e "e mais um endereço" saíam todos com a mesma pílula
  cinza. Pílulas idênticas numa linha é sopa: quem lê não descobre o que é
  atributo permanente e o que é filiação, então lê tudo com o mesmo peso,
  que é o mesmo que não ler nada.

    neutro     fato do consultório (bairro, telemedicina, acessibilidade)
    associado  filiação à AMI. Único tom com cor de marca.
*/
export function Chip({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "associado";
}) {
  /* O tom "associado" é contorno verde fino com texto verde, sem
     preenchimento: o cliente leu o fundo lima claro que ele tinha como
     amarelado, e a reforma de 03/10/2026 o tirou. O texto é verde-700 e a
     borda verde-600, cheios; sem fundo próprio, o texto assenta no fundo do
     lugar onde a pílula está (página, cartão ou apoio), e o par
     verde-700 sobre cada um deles é medido em testes/paleta.test.ts.

     O lima nunca é cor de texto: sobre fundo claro ele é invisível, e o
     mesmo teste reprova quem tentar. */
  const cores = {
    neutro: "bg-canvas text-ink-600 border-transparent",
    associado: "bg-transparent text-ami-green-700 border-ami-green-600",
  }[tom];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-medium ${cores}`}
    >
      {children}
    </span>
  );
}
