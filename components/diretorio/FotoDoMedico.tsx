import styles from "@/components/diretorio/FotoDoMedico.module.css";
import { iniciais } from "@/lib/encontre";

/** Como a foto baixa: preguiçosa (padrão), logo, ou logo e na frente das outras. */
export type CargaDaFoto = "preguicosa" | "imediata" | "primeira";

/*
  O espaço da foto do médico: o retrato, quando há, ou as iniciais em
  Bricolage na cor lima, sobre o verde com textura e a luz que passeia.

  Sem foto não é moldura "a entrar": é o estado de verdade de quem ainda não
  mandou retrato, e sai também fora do modo demonstração.

  Quem usa decide o tamanho, a proporção e o canto do espaço (`className`) e
  o tamanho das iniciais (a variável `--tamanho-iniciais`, no mesmo
  elemento). A foto é um arquivo só, sem versões em outros tamanhos: `sizes`
  vai junto para dizer a largura desenhada, e só passa a escolher arquivo
  quando a foto vier com `srcSet`.
*/
export function FotoDoMedico({
  nome,
  foto,
  alt,
  sizes,
  carga = "preguicosa",
  className = "",
}: {
  nome: string;
  foto: string | null;
  /** Vazio quando o nome do médico já está ao lado (o cartão). */
  alt: string;
  /** A largura desenhada, com as réguas do CSS de quem usa. */
  sizes: string;
  carga?: CargaDaFoto;
  className?: string;
}) {
  const classes = (...lista: string[]) => lista.filter(Boolean).join(" ");

  if (!foto) {
    return (
      <div aria-hidden="true" className={classes("textura-verde", styles.foto, styles.semFoto, className)}>
        <div className="brilho"></div>
        <span className={styles.iniciais}>{iniciais(nome)}</span>
      </div>
    );
  }

  return (
    <div className={classes(styles.foto, styles.comFoto, className)}>
      <img
        src={foto}
        alt={alt}
        sizes={sizes}
        width={400}
        height={500}
        decoding="async"
        {...(carga === "preguicosa" ? { loading: "lazy" as const } : {})}
        {...(carga === "primeira" ? { fetchPriority: "high" as const } : {})}
      />
    </div>
  );
}
