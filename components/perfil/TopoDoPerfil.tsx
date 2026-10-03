import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import styles from "@/components/perfil/Perfil.module.css";
import { hrefTelefone } from "@/lib/ami";
import { consultorioPrincipal, especialidadePrincipal, linkDoWhatsapp, numeroPreenchido } from "@/lib/encontre";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import type { Medico } from "@/lib/dados/tipos";

/*
  A largura desenhada do retrato, pelas réguas de Perfil.module.css e da
  caixa de 1240px: 460px no computador; no tablet, a coluna de .85fr ao lado
  de 1fr, com 36px entre elas e `--m` de 28px dos dois lados; no celular, a
  largura da caixa (24px de folga ao todo).
*/
export const SIZES_DO_PERFIL =
  "(max-width: 700px) calc(100vw - 24px), (max-width: 980px) calc((100vw - 140px) * 0.46), 460px";

/*
  O topo do perfil: o retrato (ou as iniciais) ao lado do nome, do
  "MÉDICO · CRM", da especialidade principal com RQE e dos botões do
  consultório principal, "Ligar" e "WhatsApp". Acima do nome, no lugar do
  rótulo, o link de volta para a busca; abaixo dos botões, a linha que diz
  de qual consultório eles são, com o número para quem está no computador,
  e o atalho para os outros endereços quando há mais de um.

  Sem foto, as iniciais saem no mesmo quadro do retrato: a mesma classe
  `.foto`, com a proporção de 4:5 e a largura da coluna, com foto ou sem.

  `data-acoes-do-medico` marca os botões do topo: a barra do pé do perfil
  aparece quando eles saem da tela (components/perfil/BarraDoMedico.tsx).

  Sem breadcrumb visível: o cliente aprovou o desenho sem ele. Por isso a
  página também não leva o BreadcrumbList no JSON-LD.
*/
export function TopoDoPerfil({ medico }: { medico: Medico }) {
  const principal = especialidadePrincipal(medico);
  const consultorio = consultorioPrincipal(medico);
  const telefone = numeroPreenchido(consultorio?.telefone);
  const whatsapp = numeroPreenchido(consultorio?.whatsapp);
  const enderecos = medico.locais.length;

  return (
    <section data-bloco="perfil" aria-labelledby="perfil-nome" className={styles.topo}>
      <FotoDoMedico
        nome={medico.nome}
        foto={medico.foto}
        alt={`Retrato de ${medico.nome}`}
        sizes={SIZES_DO_PERFIL}
        carga="primeira"
        className={styles.foto}
      />

      <div className={styles.texto}>
        <Link href="/busca" className={`rotulo-secao ${styles.volta}`}>
          <Icone nome="voltar" /> Encontre um médico
        </Link>
        <h1 id="perfil-nome" className={styles.nome}>
          {medico.nome}
        </h1>
        <p className={styles.crm}>{identificacaoMedica(medico.crm, medico.crmUf)}</p>
        {principal ? (
          <p className={styles.esp}>
            {principal.nome}
            {principal.rqe ? (
              <>
                {" "}
                <span className={styles.rqe}>{`RQE\u00a0${principal.rqe}`}</span>
              </>
            ) : null}
          </p>
        ) : null}

        {telefone || whatsapp ? (
          <div className={styles.acoes} data-acoes-do-medico="">
            {telefone ? (
              <a
                className="botao"
                href={hrefTelefone(telefone)}
                aria-label={`Ligar para ${medico.nome}, ${formatarTelefone(telefone)}`}
              >
                <Icone nome="telefone" /> Ligar
              </a>
            ) : null}
            {whatsapp ? (
              <a className="botao-contorno" href={linkDoWhatsapp(whatsapp)} aria-label={`WhatsApp de ${medico.nome}`}>
                <Icone nome="whatsapp" /> WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}

        {consultorio ? (
          <p className={styles.linhaDoConsultorio}>
            {`Consultório em ${consultorio.bairro.nome}`}
            {telefone ? (
              <>
                {" · "}
                <span className="numero-tabular">{formatarTelefone(telefone)}</span>
              </>
            ) : null}
            {enderecos > 1 ? (
              <>
                {" · "}
                <a href="#onde-atende">{`ver os ${enderecos} endereços`}</a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
