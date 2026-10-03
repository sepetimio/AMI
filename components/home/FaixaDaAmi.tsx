import { AMI } from "@/lib/ami";

/*
  A identidade, curta.

  Substitui o herói de tela cheia, cujo título era "Encontre um médico em
  Imperatriz" — o site inteiro era a busca. Agora a busca é um dos serviços,
  e o topo diz o que a AMI é.

  Os números saem do banco e nunca são escritos à mão. São a coisa mais
  honesta da home: provam que ela é mantida.
*/
export function FaixaDaAmi({
  total,
  especialidades,
  bairros,
}: {
  total: number;
  especialidades: number;
  bairros: number;
}) {
  return (
    <section className="bg-ami-green-900 py-12 md:py-16">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h1 className="texto-placa text-white">{AMI.razaoSocial}</h1>

        <p className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-ami-lima-400 md:text-[20px]">
          A associação dos médicos de Imperatriz. Aqui você encontra quem atende
          na cidade, fala com a associação e se torna associado.
        </p>

        <p className="registro mt-6 text-[15px] text-white/80">
          <strong className="font-semibold text-white">{total}</strong>{" "}
          {total === 1 ? "profissional" : "profissionais"} ·{" "}
          <strong className="font-semibold text-white">{especialidades}</strong>{" "}
          {especialidades === 1 ? "especialidade" : "especialidades"} ·{" "}
          <strong className="font-semibold text-white">{bairros}</strong>{" "}
          {bairros === 1 ? "bairro" : "bairros"}
        </p>
      </div>
    </section>
  );
}
