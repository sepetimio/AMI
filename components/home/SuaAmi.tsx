import Link from "next/link";
import { Fotografia } from "@/components/base/Fotografia";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/home/SuaAmi.module.css";

/*
  "Sua AMI": a foto grande do auditório com o cartão de vidro por cima,
  oferecendo os espaços da sede para eventos.

  O bloco inteiro é provisório: a AMI ainda não confirmou o serviço, e por
  isso a etiqueta "em breve". Fora da demonstração ele não sai, haja ou não
  foto real (a mesma regra do cartão "Sua AMI" de antes, em
  `moldurasDaHome`). Na demonstração, a foto é a de `ESPACOS.salao`, que
  enquanto não chega sai como moldura "Fotografia a entrar".

  O texto não traz capacidade, preço, metragem nem horário: nenhum desses
  dados veio da AMI.

  No computador a foto cobre o bloco e o cartão assenta no canto de baixo.
  No celular a foto fica em cima, e o cartão sobe 40px sobre a borda dela.

  O bloco não tem margem própria: a home, quando o montar (tarefa 10), vai
  pô-lo na caixa centralizada e decidir o espaço de cima com `--ritmo`.
*/
export function SuaAmi({ demonstracao }: { demonstracao: boolean }) {
  if (!demonstracao) return null;

  return (
    <section
      id="sua-ami"
      data-bloco="sua-ami"
      aria-labelledby="sua-ami-titulo"
      className={styles.vitrine}
    >
      <div className={styles.fundo}>
        <Fotografia
          espaco="salao"
          demonstracao={demonstracao}
          sizes="(min-width: 1240px) 1192px, 100vw"
          className={styles.fotografia}
        />
      </div>

      <div className={styles.cartao}>
        <div className={styles.linhaRotulo}>
          <span className="rotulo-secao">Sua AMI</span>
          <span className={styles.etiqueta}>em breve</span>
        </div>
        <h2 id="sua-ami-titulo" className={styles.titulo}>
          O auditório e o hall de eventos da AMI
        </h2>
        <p className={styles.texto}>
          Espaços da sede para congressos, cursos, reuniões e
          confraternizações. Fale com a AMI para conhecer as datas livres.
        </p>
        <Link className={`botao ${styles.acao}`} href="/contato">
          Consultar disponibilidade <Icone nome="seta" />
        </Link>
      </div>
    </section>
  );
}
