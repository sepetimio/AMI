import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/home/EncontreUmMedico.module.css";

/* Quantas especialidades viram pílula: as do desenho aprovado. */
const PILULAS = 7;

/*
  "Encontre um médico": a faixa verde de ponta a ponta da home, com o campo
  de busca e as especialidades com mais médicos.

  A faixa vai fora da caixa centralizada da página e leva `data-faixa`, a
  marca das faixas de ponta a ponta (o rodapé a lê). O texto dela fica na
  mesma linha vertical do resto porque a margem lateral é `--borda-faixa`
  (app/globals.css), a mesma do rodapé. Entra na tela com a `.revelar`
  global.

  O campo é um formulário HTML de verdade, GET para `/busca`: funciona sem
  JavaScript e o resultado vira uma URL que se compartilha. O nome do campo é
  `termo` porque é o que `filtrosDaQuery` lê (lib/dados/urlFiltros.ts).

  O texto de exemplo do campo é "Nome ou especialidade" em toda largura. O
  desenho trocava por JavaScript para "Nome do médico ou especialidade" acima
  de 700px; o curto cabe em todas, dispensa o script e o rótulo completo
  continua lá, para quem lê a tela.

  O `id="encontre"` é o destino do menu e da barra do pé do celular.
*/
export function EncontreUmMedico({
  especialidades,
}: {
  especialidades: { nome: string; slug: string; total: number }[];
}) {
  /* Só contam as especialidades com algum médico: são as que têm página com
     gente dentro, e o "veja todas as N" não pode prometer mais do que isso. */
  const comMedicos = especialidades.filter((e) => e.total > 0);
  /* As que têm mais médicos; empate fica na ordem que veio. */
  const pilulas = [...comMedicos].sort((a, b) => b.total - a.total).slice(0, PILULAS);
  const todas = comMedicos.length;

  return (
    <section
      id="encontre"
      data-bloco="encontre"
      data-faixa=""
      aria-labelledby="encontre-titulo"
      className={`textura-verde revelar ${styles.encontre}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${styles.sobre}`} data-coluna="">
          Encontre um médico
        </span>
        <h2 id="encontre-titulo" className={styles.titulo}>
          Quem atende em Imperatriz, num só lugar
        </h2>
        <p className={styles.texto}>
          Todo médico aparece com o número de inscrição no CRM, para você
          conferir no portal do Conselho.
        </p>
      </div>

      <div>
        <form action="/busca" method="get" role="search" className={styles.campo}>
          <Icone nome="lupa" className={styles.lupa} />
          <label htmlFor="encontre-termo" className="sr-only">
            Nome do médico ou especialidade
          </label>
          <input
            id="encontre-termo"
            name="termo"
            type="search"
            placeholder="Nome ou especialidade"
            enterKeyHint="search"
          />
          <button type="submit" className={`botao ${styles.buscar}`}>
            Buscar <Icone nome="seta" />
          </button>
        </form>

        {pilulas.length > 0 ? (
          <ul className={styles.chips}>
            {pilulas.map((e) => (
              <li key={e.slug}>
                <Link className={styles.chip} href={`/medicos/${e.slug}`}>
                  {`${e.nome} `}
                  <span className={styles.num}>
                    {e.total}
                    <span className="sr-only">{e.total === 1 ? " médico" : " médicos"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <p className={styles.rodapeBusca}>
          {"Ou "}
          <Link href="/medicos">
            {todas > 1 ? `veja todas as ${todas} especialidades` : "veja as especialidades"}
          </Link>
        </p>
      </div>
    </section>
  );
}
