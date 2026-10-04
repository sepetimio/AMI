import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/perfil/Perfil.module.css";
import { hrefTelefone } from "@/lib/ami";
import {
  enderecoDoLocal,
  linkDoMapa,
  linkDoWhatsapp,
  nomeDoConsultorio,
  numeroPreenchido,
  titulosDosConsultorios,
} from "@/lib/encontre";
import { formatarTelefone } from "@/lib/formato";
import type { LocalAtendimento } from "@/lib/dados/tipos";

/*
  "Onde atende": um cartão por consultório, com o bairro como título, o
  endereço completo, o telefone e os botões "Ligar", "WhatsApp" e "Como
  chegar". Sem telefone, sem "Ligar"; sem WhatsApp, sem o botão dele (campo
  em branco conta como sem: `numeroPreenchido`); "Como chegar" sai sempre,
  porque todo consultório tem endereço.

  Dois consultórios no mesmo bairro não ficam iguais para quem ouve a
  página: o título leva o número (`titulosDosConsultorios`), e os botões
  nomeiam o consultório pela primeira linha do endereço
  (`nomeDoConsultorio`, lib/encontre.ts).

  O `id="onde-atende"` é o destino do "ver os N endereços" do topo.
*/
export function OndeAtende({ locais }: { locais: LocalAtendimento[] }) {
  const titulos = titulosDosConsultorios(locais);
  return (
    <section id="onde-atende" data-bloco="onde-atende" aria-labelledby="onde-atende-titulo" className="revelar">
      <div className={styles.cabSecao}>
        <h2 id="onde-atende-titulo" className={styles.titulo} data-coluna="">
          Onde atende
        </h2>
      </div>
      <div className={styles.consultorios}>
        {locais.map((l, i) => {
          const [linha1, linha2] = enderecoDoLocal(l);
          const titulo = titulos[i];
          const nome = nomeDoConsultorio(linha1, titulo);
          const telefone = numeroPreenchido(l.telefone);
          const whatsapp = numeroPreenchido(l.whatsapp);
          return (
            <article key={l.id} className={styles.consultorio}>
              <h3>{titulo}</h3>
              <address>
                {linha1 ? (
                  <>
                    {linha1}
                    <br />
                  </>
                ) : null}
                {linha2}
              </address>
              {telefone ? <p className={`numero-tabular ${styles.tel}`}>{formatarTelefone(telefone)}</p> : null}
              <div className={styles.acoesDoConsultorio}>
                {telefone ? (
                  <a className="botao" href={hrefTelefone(telefone)} aria-label={`Ligar para o consultório ${nome}`}>
                    <Icone nome="telefone" /> Ligar
                  </a>
                ) : null}
                {whatsapp ? (
                  <a className="botao-contorno" href={linkDoWhatsapp(whatsapp)} aria-label={`WhatsApp do consultório ${nome}`}>
                    <Icone nome="whatsapp" /> WhatsApp
                  </a>
                ) : null}
                <a className="botao-contorno" href={linkDoMapa(l)} aria-label={`Como chegar ao consultório ${nome} (abre o mapa)`}>
                  <Icone nome="comoChegar" /> Como chegar
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
