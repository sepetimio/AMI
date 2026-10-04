import Link from "next/link";
import { Icone, LadrilhoIcone } from "@/components/base/Icone";
import resultados from "@/components/busca/ResultadosDaBusca.module.css";
import styles from "@/components/especialidades/GradeDeEspecialidades.module.css";
import { especialidadesComMedico, iconeDaEspecialidade, nomeComQuebras } from "@/lib/especialidades";
import { contagem } from "@/lib/formato";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";

/*
  A grade do índice de especialidades.
  - Em cima, a contagem ("14 especialidades") e a frase da ordem, como na
    busca.
  - Embaixo, um cartão por especialidade com médico, em ordem alfabética
    (`especialidadesComMedico`).
  - Cada cartão tem o ícone num ladrilho, o nome, "N médicos" e a seta.
  - O cartão inteiro leva à página da especialidade, pelo link do nome,
    esticado em CSS.

  O nome sai com o hífen opcional nas palavras longas (`nomeComQuebras`).

  Marcas para a auditoria visual: `data-cartao-de-especialidade`,
  `data-nome` e `data-contagem`.
*/
export function GradeDeEspecialidades({
  especialidades,
}: {
  especialidades: EspecialidadeComContagem[];
}) {
  const itens = especialidadesComMedico(especialidades);

  return (
    <section data-bloco="especialidades" aria-labelledby="contagem-de-especialidades">
      <div className={resultados.cab}>
        <h2 id="contagem-de-especialidades" className={resultados.contagem} data-coluna="">
          {contagem(itens.length, "especialidade", "especialidades")}
        </h2>
        <p className={resultados.ordem}>
          <span className={styles.ordemLonga}>Em ordem alfabética</span>
          <span className={styles.ordemCurta}>De A a Z</span>
        </p>
      </div>

      <ul className={styles.grade}>
        {itens.map((e) => (
          <li key={e.slug} className={styles.cartao} data-cartao-de-especialidade="">
            <LadrilhoIcone nome={iconeDaEspecialidade(e.slug)} />
            <h3 className={styles.nome} data-nome="">
              <Link href={`/medicos/${e.slug}`}>{nomeComQuebras(e.nome)}</Link>
            </h3>
            <p className={styles.pe}>
              <span className={styles.conta} data-contagem="">
                {contagem(e.total, "médico", "médicos")}
              </span>
              <span className={styles.seta} aria-hidden="true">
                <Icone nome="seta" />
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
