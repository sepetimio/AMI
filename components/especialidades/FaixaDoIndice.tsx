import { Icone } from "@/components/base/Icone";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import styles from "@/components/especialidades/FaixaDoIndice.module.css";
import campo from "@/components/home/EncontreUmMedico.module.css";
import { linhaDeApoioDoIndice } from "@/lib/especialidades";

/*
  A faixa verde de ponta a ponta que abre o índice de especialidades
  (/medicos): o rótulo, o título, a linha de apoio e o campo "Nome ou
  especialidade". Sem a `Cabeceira` das páginas antigas e sem trilha.

  A faixa é a da busca (FaixaDaBusca.module.css), com a coluna do texto
  mais larga (FaixaDoIndice.module.css).

  O campo é um formulário HTML de verdade, GET para `/busca`, o mesmo da
  busca da home: funciona sem JavaScript, e o resultado vira uma URL. Não
  leva a lista de especialidades: a lista é a grade logo abaixo.

  - `id="encontre"`: a barra do pé do celular leva a ele e põe o cursor no
    campo, como na home e na busca (components/layout/BarraDoPe.tsx).
  - `data-abertura`: a barra aparece quando esta faixa sai da tela.
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaDoIndice({ medicos }: { medicos: number }) {
  return (
    <section
      id="encontre"
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="especialidades-titulo"
      className={`textura-verde ${busca.faixa} ${styles.indice}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${busca.sobre}`} data-coluna="">
          Especialidades
        </span>
        <h1 id="especialidades-titulo" className={busca.titulo}>
          Especialidades em Imperatriz
        </h1>
        <p className={busca.texto}>{linhaDeApoioDoIndice(medicos)}</p>
      </div>

      <div>
        <form
          action="/busca"
          method="get"
          role="search"
          aria-label="Buscar médicos"
          className={`${campo.campo} ${styles.campo}`}
        >
          <Icone nome="lupa" className={campo.lupa} />
          <label htmlFor="indice-termo" className="sr-only">
            Nome do médico ou especialidade
          </label>
          <input
            id="indice-termo"
            name="termo"
            type="search"
            placeholder="Nome ou especialidade"
            enterKeyHint="search"
            autoComplete="off"
          />
          <button type="submit" className={`botao ${campo.buscar}`}>
            Buscar <Icone nome="seta" />
          </button>
        </form>
      </div>
    </section>
  );
}
