import { EmpresasParceiras } from "@/components/home/EmpresasParceiras";
import styles from "@/components/home/Parceiros.module.css";

/*
  "Quem caminha com a AMI": a faixa branca de ponta a ponta que fecha a home
  (docs/desenho-aprovado/home-aprovada.html, `#bairros`, só a parte dos
  parceiros: os bairros saíram do site em 03/10/2026).

  A margem lateral é `--borda-faixa` (app/globals.css), a mesma da busca
  verde, de "Seja associado" e do rodapé. Não há margem embaixo: a faixa
  leva `data-faixa`, e o rodapé emenda nela quando ela fecha a página
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.

  `parceiros` vem de `moldurasDaHome` (lib/molduras.ts): só no modo
  demonstração, porque hoje a parte inteira é provisória. Sem ela, a faixa
  não existe.
*/
export function Parceiros({ parceiros }: { parceiros: boolean }) {
  if (!parceiros) return null;

  return (
    <section
      id="parceiros"
      data-bloco="parceiros"
      data-faixa=""
      aria-labelledby="parceiros-titulo"
      className={`revelar ${styles.faixa}`}
    >
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
  );
}
