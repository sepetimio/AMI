import { LadrilhosBairros } from "@/components/diretorio/LadrilhosBairros";
import styles from "@/components/home/BairrosEParceiros.module.css";
import { EmpresasParceiras } from "@/components/home/EmpresasParceiras";

type Item = { nome: string; slug: string; total: number };

/*
  "Onde os médicos atendem" e "Empresas parceiras da AMI": a faixa branca de
  ponta a ponta que fecha a home (docs/desenho-aprovado/home-aprovada.html,
  `#bairros`). Os bairros em cima, um fio (`.separa`) e os parceiros
  embaixo.

  A margem lateral é `--borda-faixa` (app/globals.css), a mesma da busca
  verde, de "Seja associado" e do rodapé: o texto fica na coluna dos outros
  blocos. Não há margem embaixo: o rodapé emenda na faixa.

  `parceiros` vem de `moldurasDaHome` (lib/molduras.ts): só no modo
  demonstração, porque hoje a parte inteira é provisória.

  Sem bairro nenhum (banco vazio), a parte dos bairros não sai: título
  sobre grade vazia promete o que não está lá. Sem bairro e sem parceiros,
  a faixa inteira não sai. O fio só existe entre as duas partes.
*/
export function BairrosEParceiros({
  bairros,
  parceiros,
}: {
  bairros: Item[];
  parceiros: boolean;
}) {
  const temBairros = bairros.length > 0;
  if (!temBairros && !parceiros) return null;

  return (
    <section
      id="bairros"
      data-bloco="bairros"
      aria-labelledby={temBairros ? "bairros-titulo" : "parceiros-titulo"}
      className={styles.faixa}
    >
      {temBairros ? (
        <>
          <div className={styles.cabSecao}>
            <span className="rotulo-secao" data-coluna="">
              Onde os médicos atendem
            </span>
            <h2 id="bairros-titulo" className={styles.titulo}>
              Escolha o seu bairro
            </h2>
          </div>
          <LadrilhosBairros itens={bairros} />
        </>
      ) : null}

      {temBairros && parceiros ? <div className={styles.separa} aria-hidden="true" /> : null}

      {parceiros ? (
        <section id="parceiros" aria-labelledby="parceiros-titulo">
          <div className={styles.cabSecao}>
            <span className="rotulo-secao" data-coluna="">
              Empresas parceiras da AMI
            </span>
            <h2 id="parceiros-titulo" className={styles.titulo}>
              Quem caminha com a AMI
            </h2>
          </div>
          <EmpresasParceiras />
        </section>
      ) : null}
    </section>
  );
}
