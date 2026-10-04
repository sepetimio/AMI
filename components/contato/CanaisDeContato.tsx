import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/contato/Contato.module.css";
import type { Canal } from "@/lib/paginaDeContato";

/*
  Os canais de contato, em três cartões brancos: o ladrilho, o rótulo, o
  dado em letra grande, uma linha de apoio e o botão no pé, alinhado entre
  os três (Contato.module.css). Quem diz quais são os canais é
  `canaisDeContato` (lib/paginaDeContato.ts).

  "Ligar" é o botão verde, com o telefone; "Abrir o Instagram", o de
  contorno, na mesma aba, como todo link para fora do site (a regra do
  texto rico, components/editorial/CorpoDoTexto.tsx: aba nova sem avisar
  tira do leitor o botão voltar). O nome de cada botão para o leitor de
  tela começa pelo que está escrito nele ("Ligar para a sede da AMI, …"),
  para quem usa comando de voz dizer o que vê, e diz para onde ele liga.

  Marcas para medir no navegador se os três cartões ficam alinhados:
  `data-canal`, `data-rotulo`, `data-dado` e `data-acao`.
*/
export function CanaisDeContato({ canais }: { canais: Canal[] }) {
  return (
    <section data-bloco="canais" aria-labelledby="canais-titulo">
      <h2 id="canais-titulo" className="sr-only">
        Canais de contato
      </h2>
      <ul className={styles.canais} role="list">
        {canais.map((c) => (
          <li key={c.chave} className={styles.canal} data-canal="">
            <LadrilhoIcone nome={c.icone} />
            <p className={styles.rotulo} data-rotulo="">
              {c.rotulo}
            </p>
            <p className={c.longo ? `${styles.dado} ${styles.longo}` : styles.dado} data-dado="">
              {c.dado}
            </p>
            <p className={styles.nota}>{c.nota}</p>
            <div className={styles.acao} data-acao="">
              {c.acao.tipo === "ligar" ? (
                <a className="botao" href={c.acao.href} aria-label={c.acao.rotulo}>
                  <Icone nome="telefone" /> {c.acao.texto}
                </a>
              ) : (
                <a className="botao-contorno" href={c.acao.href} aria-label={c.acao.rotulo}>
                  {c.acao.texto} <Icone nome="setaDiagonal" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
