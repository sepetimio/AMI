import Link from "next/link";
import { LadrilhoIcone, type NomeIcone } from "@/components/base/Icone";
import { Contador } from "@/components/home/Contador";
import styles from "@/components/home/NumerosDaAmi.module.css";
import { AMI } from "@/lib/ami";

/*
  Os números da AMI, logo abaixo do carrossel: sem caixa, direto no fundo da
  página, em colunas separadas por fio. No celular, cartõezinhos brancos só
  com ícone, número e rótulo.

  São quatro, como no desenho aprovado: anos, médicos, especialidades e
  empresas parceiras (o quarto era bairros atendidos, que saiu do site com
  os bairros em 03/10/2026). O das parceiras pode faltar: com `parceiras`
  nulo, que é o que `moldurasDaHome` (lib/molduras.ts) dá fora da
  demonstração quando não há nenhuma cadastrada, ficam três. O contêiner
  diz quantos são em `data-quantos`, e o CSS desenha cada caso por ele.

  Os números chegam por propriedade: os anos são calculados de `lib/ami.ts`
  (`anosDeAmi`), médicos e especialidades saem do banco, e as parceiras do
  Sanity. Nenhum é escrito à mão aqui, e nenhum texto de apoio afirma o que
  só o banco sabe: o das especialidades, que no desenho nomeava
  especialidades, diz só para que serve o botão, e o das parceiras não
  promete benefício nenhum.

  O bloco não tem margem própria: quem o põe na página (a home) decide o
  espaço de cima, com `--ritmo`, e o põe na coluna centralizada.

  Entra na tela com a `.revelar` global, como no desenho. Quando os números
  já abrem na primeira tela (quase sempre), ficam parados: só o bloco que
  abre abaixo da tela anima (components/layout/Revelar.tsx).
*/
type Item = {
  icone: NomeIcone;
  valor: number;
  rotulo: string;
  apoio: string;
  botao: string;
  destino: string;
};

export function NumerosDaAmi({
  anos,
  medicos,
  especialidades,
  parceiras,
}: {
  anos: number;
  medicos: number;
  especialidades: number;
  parceiras: number | null;
}) {
  const itens: Item[] = [
    {
      icone: "selo",
      valor: anos,
      rotulo: "anos de AMI",
      apoio: `Em atividade desde ${AMI.fundadaEm}, reunindo os médicos de Imperatriz e da região.`,
      botao: "Conheça a história",
      destino: "/associacao",
    },
    {
      icone: "estetoscopio",
      valor: medicos,
      rotulo: medicos === 1 ? "médico no diretório" : "médicos no diretório",
      apoio: "Cada perfil com nome, CRM e endereço de atendimento.",
      botao: "Ver os médicos",
      destino: "/busca",
    },
    {
      icone: "batimento",
      valor: especialidades,
      rotulo: especialidades === 1 ? "especialidade" : "especialidades",
      apoio: "As especialidades com mais médicos no diretório da AMI.",
      botao: "Ver especialidades",
      destino: "/medicos",
    },
  ];

  if (parceiras !== null) {
    itens.push({
      icone: "parceria",
      valor: parceiras,
      rotulo: parceiras === 1 ? "empresa parceira" : "empresas parceiras",
      apoio: "Empresas que caminham com a AMI.",
      botao: "Ver parceiras",
      destino: "/#parceiros",
    });
  }

  return (
    <section
      data-bloco="numeros"
      data-quantos={itens.length}
      aria-label="A AMI em números"
      className={`revelar ${styles.numeros}`}
    >
      {itens.map((item) => (
        <div key={item.icone} className={styles.numero}>
          <LadrilhoIcone nome={item.icone} />
          <div className={styles.grande}>
            <Contador valor={item.valor} />
          </div>
          <div className={styles.rotulo}>
            {item.rotulo}
          </div>
          <p className={styles.apoio}>{item.apoio}</p>
          <Link className="botao-linha" href={item.destino}>
            {item.botao}
          </Link>
        </div>
      ))}
    </section>
  );
}
