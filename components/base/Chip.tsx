/*
  Três tons, e a diferença entre eles é hierarquia, não decoração.

  A versão anterior tinha um tom só de fato: bairro, telemedicina,
  acessibilidade, "e mais um endereço" e "aberto agora" saíam todos com a
  mesma pílula cinza. Cinco pílulas idênticas numa linha é sopa: quem lê não
  descobre o que é atributo permanente, o que é estado de agora e o que é
  filiação, então lê tudo com o mesmo peso, que é o mesmo que não ler nada.

    neutro     fato do consultório (bairro, telemedicina, acessibilidade)
    associado  filiação à AMI. Único tom com cor de marca.
    estado     o que vale só neste instante. Único tom com ponto.

  O ponto colorido é ração escassa: em quase todo site ele é enfeite, e aqui
  ele aparece uma vez por linha, exatamente onde há estado que muda sozinho.
  Depende de `vivo` para a cor, mas nunca sozinho: o texto ao lado já diz
  "Aberto" ou "Fechado", porque cor não é informação para quem não a
  distingue.
*/
export function Chip({
  children,
  tom = "neutro",
  vivo,
}: {
  children: React.ReactNode;
  tom?: "neutro" | "associado" | "estado";
  /** Só para `tom="estado"`. Colore o ponto. */
  vivo?: boolean;
}) {
  /* Sobre fundo claro a ação e o destaque usam verde-600. A menta só entra
     como preenchimento, nunca como cor de texto. */
  const cores = {
    neutro: "bg-canvas text-ink-600 border-transparent",
    associado: "bg-ami-mint-100 text-ami-green-700 border-ami-green-600/30",
    estado: vivo
      ? "bg-ami-mint-100 text-ami-green-700 border-ami-green-600/30"
      : "bg-canvas text-ink-400 border-line",
  }[tom];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-medium ${cores}`}
    >
      {tom === "estado" ? (
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-chip ${
            vivo ? "bg-ami-green-600" : "bg-ink-300"
          }`}
        />
      ) : null}
      {children}
    </span>
  );
}
