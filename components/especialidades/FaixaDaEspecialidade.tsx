import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import styles from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { iconeDaEspecialidade } from "@/lib/especialidades";

/*
  A faixa verde de ponta a ponta que abre a página de cada especialidade.
  - No lugar do rótulo, o link de volta ao índice ("← ESPECIALIDADES", como
    o "← ENCONTRE UM MÉDICO" do perfil).
  - O título e o parágrafo de abertura, gerado dos dados
    (`paragrafoDeAbertura`, lib/dados/facetas.ts).
  - À direita, o ícone da especialidade, que some no celular.

  Sem campo de busca, sem `Cabeceira` e sem trilha.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela; o "Encontrar médico" dela leva a `/busca`.
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaDaEspecialidade({
  nome,
  slug,
  paragrafo,
}: {
  nome: string;
  slug: string;
  paragrafo: string;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="especialidade-titulo"
      className={`textura-verde ${busca.faixa} ${styles.especialidade}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <Link href="/medicos" className={`rotulo-secao ${busca.sobre} ${styles.volta}`} data-coluna="">
          <Icone nome="voltar" /> Especialidades
        </Link>
        <h1 id="especialidade-titulo" className={busca.titulo}>
          {`${nome} em Imperatriz`}
        </h1>
        <p className={busca.texto}>{paragrafo}</p>
      </div>

      <div className={styles.selo} aria-hidden="true">
        <Icone nome={iconeDaEspecialidade(slug)} duotone tamanho={84} />
      </div>
    </section>
  );
}
