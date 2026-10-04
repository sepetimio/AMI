import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/perfil/Perfil.module.css";
import { hrefTelefone } from "@/lib/ami";
import { enderecoDoLocal, linkDoMapa, linkDoWhatsapp, numeroPreenchido } from "@/lib/encontre";
import { formatarTelefone } from "@/lib/formato";
import type { LocalAtendimento } from "@/lib/dados/tipos";

/*
  "Onde atende": um cartão por consultório, com o bairro como título, o
  endereço completo, o telefone e os botões "Ligar", "WhatsApp" e "Como
  chegar". Sem telefone, sem "Ligar"; sem WhatsApp, sem o botão dele (campo
  em branco conta como sem: `numeroPreenchido`); "Como chegar" sai sempre,
  porque todo consultório tem endereço.

  O `id="onde-atende"` é o destino do "ver os N endereços" do topo.
*/
export function OndeAtende({ locais }: { locais: LocalAtendimento[] }) {
  return (
    <section id="onde-atende" data-bloco="onde-atende" aria-labelledby="onde-atende-titulo" className="revelar">
      <div className={styles.cabSecao}>
        <h2 id="onde-atende-titulo" className={styles.titulo} data-coluna="">
          Onde atende
        </h2>
      </div>
      <div className={styles.consultorios}>
        {locais.map((l) => {
          const [linha1, linha2] = enderecoDoLocal(l);
          const bairro = l.bairro.nome;
          const telefone = numeroPreenchido(l.telefone);
          const whatsapp = numeroPreenchido(l.whatsapp);
          return (
            <article key={l.id} className={styles.consultorio}>
              <h3>{bairro}</h3>
              <address>
                {linha1}
                <br />
                {linha2}
              </address>
              {telefone ? <p className={`numero-tabular ${styles.tel}`}>{formatarTelefone(telefone)}</p> : null}
              <div className={styles.acoesDoConsultorio}>
                {telefone ? (
                  <a className="botao" href={hrefTelefone(telefone)} aria-label={`Ligar para o consultório de ${bairro}`}>
                    <Icone nome="telefone" /> Ligar
                  </a>
                ) : null}
                {whatsapp ? (
                  <a className="botao-contorno" href={linkDoWhatsapp(whatsapp)} aria-label={`WhatsApp do consultório de ${bairro}`}>
                    <Icone nome="whatsapp" /> WhatsApp
                  </a>
                ) : null}
                <a className="botao-contorno" href={linkDoMapa(l)} aria-label={`Como chegar ao consultório de ${bairro} (abre o mapa)`}>
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
