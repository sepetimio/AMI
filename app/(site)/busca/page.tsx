import type { Metadata } from "next";
import styles from "@/app/(site)/encontre.module.css";
import { FaixaDaBusca } from "@/components/busca/FaixaDaBusca";
import { ResultadosDaBusca } from "@/components/busca/ResultadosDaBusca";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { filtrosDaQuery } from "@/lib/dados/urlFiltros";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/*
  Busca livre. Fora do índice de propósito: cada termo digitado geraria um
  endereço novo e quase idêntico aos outros, e é exatamente esse tipo de
  página que faz o Google classificar um diretório como conteúdo raso.
  `follow` mantém os links de resultado rastreáveis.
*/
export const metadata: Metadata = {
  title: "Buscar médicos em Imperatriz - MA | AMI",
  robots: { index: false, follow: true },
};

/*
  A busca: a faixa verde com o campo e a lista de especialidades, e a
  contagem e a grade, em ordem alfabética. Sem a `Cabeceira` das outras
  páginas internas: a busca abre com a faixa verde.

  Da URL valem só `termo` e `especialidade`. Os outros filtros de antes
  (bairro, telemedicina, acessibilidade, associados, ordem) não chegam ao
  banco, e uma especialidade que não está na lista também não: a busca abre
  sem eles, sem erro.
*/
export default async function PaginaBusca({ searchParams }: Props) {
  const pedido = filtrosDaQuery(await searchParams);
  const especialidades = await especialidadesComContagem();
  /* Uma especialidade sem médico não está na lista (`opcoesDeEspecialidade`),
     e vale como inexistente. */
  const escolhida =
    especialidades.find((e) => e.slug === pedido.especialidade && e.total > 0) ?? null;
  const termo = pedido.termo ?? "";

  const medicos = await buscarMedicos({
    ...(termo ? { termo } : {}),
    ...(escolhida ? { especialidade: escolhida.slug } : {}),
  });

  return (
    <div className={styles.pagina}>
      <FaixaDaBusca termo={termo} escolhida={escolhida} especialidades={especialidades} />
      <ResultadosDaBusca medicos={medicos} escolhida={escolhida} />
    </div>
  );
}
