import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import styles from "@/components/diretorio/CartaoMedico.module.css";
import { hrefTelefone } from "@/lib/ami";
import { especialidadeDoCartao, telefoneDoCartao } from "@/lib/encontre";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import type { Medico } from "@/lib/dados/tipos";

/*
  A largura desenhada da foto do cartão, pelas réguas de GradeMedicos.module.css
  e da coluna das páginas (`--coluna` de 1192px e `--folga-da-coluna` de 24px
  de cada lado, 12px no celular, em app/globals.css; o `sizes` não lê
  variável de CSS, por isso os números vão escritos): 4 por linha com --gap
  24 acima de 1180px (280px a partir de 1240), 3 com --gap 24 até 1180, 2
  com --gap 16 até 980, e a foto de 116px (112px a 380) no cartão deitado
  do celular.
*/
export const SIZES_DO_CARTAO =
  "(max-width: 380px) 112px, (max-width: 700px) 116px, " +
  "(max-width: 980px) calc((100vw - 64px) / 2), " +
  "(max-width: 1180px) calc((100vw - 96px) / 3), " +
  "(max-width: 1240px) calc((100vw - 120px) / 4), 280px";

/*
  O cartão do médico, na busca, em "Outros médicos" do perfil e na página de
  especialidade. Só foto, nome, "MÉDICO · CRM/UF", uma especialidade com RQE
  e o "Ligar": nada de bairro, selo, telemedicina ou acessibilidade.

  A especialidade é a principal; na página de uma especialidade
  (`especialidade`, o slug dela), é a da página, com o RQE dela, quando o
  médico a tem (`especialidadeDoCartao`, lib/encontre.ts).

  A palavra MÉDICO ao lado do CRM é exigência da Resolução CFM 2.336/2023,
  Art. 4º, I (`identificacaoMedica`, lib/formato.ts).

  O cartão inteiro leva ao perfil pelo link do nome, esticado em CSS; o
  "Ligar" fica por cima e liga para o primeiro consultório com telefone
  (`telefoneDoCartao`). Sem telefone, o espaço do botão fica, vazio, para os
  botões da fileira continuarem alinhados. `data-ligar` marca os dois para a
  auditoria visual.
*/
export function CartaoMedico({
  medico,
  imediata = false,
  especialidade = null,
}: {
  medico: Medico;
  imediata?: boolean;
  especialidade?: string | null;
}) {
  const mostrada = especialidadeDoCartao(medico, especialidade);
  const telefone = telefoneDoCartao(medico);

  return (
    <li className={styles.medico}>
      <FotoDoMedico
        nome={medico.nome}
        foto={medico.foto}
        alt=""
        sizes={SIZES_DO_CARTAO}
        carga={imediata ? "imediata" : "preguicosa"}
        className={styles.foto}
      />
      <div className={styles.corpo}>
        <div className={styles.texto}>
          <h3 className={styles.nome}>
            <Link href={`/medico/${medico.slug}`}>{medico.nome}</Link>
          </h3>
          <p className={styles.crm}>{identificacaoMedica(medico.crm, medico.crmUf)}</p>
          {mostrada ? (
            <p className={styles.esp}>
              {mostrada.nome}
              {mostrada.rqe ? (
                <>
                  {" "}
                  {/* Num texto só, com o espaço que não quebra: "RQE" não
                      fica numa linha e o número na outra. */}
                  <span className={styles.rqe}>{`RQE\u00a0${mostrada.rqe}`}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        {telefone ? (
          <a
            href={hrefTelefone(telefone)}
            className={`botao ${styles.ligar}`}
            aria-label={`Ligar para ${medico.nome}, ${formatarTelefone(telefone)}`}
            data-ligar=""
          >
            <Icone nome="telefone" /> Ligar
          </a>
        ) : (
          <div className={styles.semLigar} aria-hidden="true" data-ligar=""></div>
        )}
      </div>
    </li>
  );
}
