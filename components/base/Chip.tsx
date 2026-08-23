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
  /* Sobre fundo claro a ação e o destaque usam verde-600. A menta só entra
     como preenchimento, nunca como cor de texto. */
  const cores = {
    neutro: "bg-canvas text-ink-600 border-transparent",
    associado: "bg-ami-lima-100 text-ami-green-700 border-ami-green-600/30",
  }[tom];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-medium ${cores}`}
    >
      {children}
    </span>
  );
}
