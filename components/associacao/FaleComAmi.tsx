import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { AMI, hrefTelefone, linkDoMapaDaAmi } from "@/lib/ami";

/*
  "Fale com a AMI", o quadro de chamada no fim de Seja associado: ligar
  para o fixo da sede, ligar para o celular e "Como chegar" à sede.

  Sem WhatsApp: lib/ami.ts diz que nenhum dos dois números está confirmado
  como WhatsApp, e um botão para uma linha que não atende por lá é pior que
  não ter botão. Quando a AMI confirmar, ele entra ao lado de "Ligar".

  "Como chegar" abre o mapa na mesma aba, como o do consultório no perfil
  (components/perfil/OndeAtende.tsx).

  O desenho mora na folha da página de texto (PaginaDeTexto.module.css,
  `.chamada`), porque o quadro vive dentro da coluna de leitura e as regras
  dele precisam valer sobre as da coluna.

  O nome de cada botão para o leitor de tela contém, em sequência, o que
  está escrito nele ("Ligar (99) 3524-3716 para a AMI"): quem usa comando
  de voz diz o que vê.

  Os dois números levam `.numero` (algarismos tabulares), como no desenho:
  é o que faz os três botões caberem numa linha só na coluna de 680px.

  É componente de servidor: os ícones vêm de IconeServidor, que só o
  servidor importa (components/base/Icone.tsx explica o porquê).
*/
export function FaleComAmi() {
  const [fixo, celular] = AMI.telefones;

  return (
    <div className={styles.chamada} data-fale-com-ami="">
      <LadrilhoIcone nome="chamada" pequeno />
      <div>
        <h3>Fale com a AMI</h3>
        <p>{`Pelo telefone ou na sede, no ${AMI.endereco.bairro} de ${AMI.endereco.cidade}.`}</p>
      </div>
      <div className={styles.acoes}>
        <a className="botao" href={hrefTelefone(fixo)} aria-label={`Ligar ${fixo} para a AMI`}>
          <Icone nome="telefone" /> Ligar <span className={styles.numero}>{fixo}</span>
        </a>
        <a className="botao-contorno" href={hrefTelefone(celular)} aria-label={`Ligar ${celular} para a AMI`}>
          <Icone nome="celular" /> <span className={styles.numero}>{celular}</span>
        </a>
        <a className="botao-contorno" href={linkDoMapaDaAmi()} aria-label="Como chegar à sede da AMI (abre o mapa)">
          <Icone nome="comoChegar" /> Como chegar
        </a>
      </div>
    </div>
  );
}
