import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import { FormularioDaBusca } from "@/components/busca/FormularioDaBusca";
import styles from "@/components/busca/FaixaDaBusca.module.css";
import { enderecoDaBusca } from "@/lib/dados/urlFiltros";
import { opcoesDeEspecialidade } from "@/lib/encontre";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";

/*
  A faixa verde de ponta a ponta que abre a busca: o rótulo, o título, a
  linha de apoio (a mesma da busca da home), o formulário e, quando há uma
  especialidade escolhida, "Filtro: Cardiologia ×". O × é um link para a
  mesma busca sem a especialidade.

  O `id="encontre"` é o da busca da home: o menu e a barra do pé do
  celular procuram `#encontre`. `data-faixa` é a marca das faixas de ponta a
  ponta (app/(site)/encontre.module.css não a põe na coluna).
*/
export function FaixaDaBusca({
  termo,
  escolhida,
  especialidades,
}: {
  termo: string;
  escolhida: EspecialidadeComContagem | null;
  especialidades: EspecialidadeComContagem[];
}) {
  return (
    <section
      id="encontre"
      data-bloco="busca"
      data-faixa=""
      aria-labelledby="busca-titulo"
      className={`textura-verde ${styles.faixa}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${styles.sobre}`} data-coluna="">
          Encontre um médico
        </span>
        <h1 id="busca-titulo" className={styles.titulo}>
          Quem atende em Imperatriz
        </h1>
        <p className={styles.texto}>
          Todo médico aparece com o número de inscrição no CRM, para você
          conferir no portal do Conselho.
        </p>
      </div>

      <div>
        <FormularioDaBusca
          key={`${termo}|${escolhida?.slug ?? ""}`}
          termo={termo}
          especialidade={escolhida?.slug ?? ""}
          opcoes={opcoesDeEspecialidade(especialidades)}
        />
        {escolhida ? (
          <p className={styles.filtroAtivo}>
            <span>Filtro:</span>
            <Link
              href={enderecoDaBusca(termo ? { termo } : {})}
              className={styles.tira}
              aria-label={`Tirar o filtro de ${escolhida.nome}`}
            >
              {`${escolhida.nome} `}
              <Icone nome="fechar" />
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
