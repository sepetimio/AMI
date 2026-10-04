import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/diretorio/CartaoDiretor.module.css";
import { SIZES_DO_CARTAO } from "@/components/diretorio/CartaoMedico";
import cartao from "@/components/diretorio/CartaoMedico.module.css";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import type { Diretor } from "@/lib/dados/diretoria";
import { identificacaoMedica } from "@/lib/formato";

/*
  O cartão de um membro da diretoria: o cartão do médico da busca
  (CartaoMedico.module.css, com a mesma foto, o mesmo nome e o mesmo
  "MÉDICO · CRM/UF"), com o cargo acima do nome e "Ver perfil" no lugar do
  "Ligar". Num cartão de diretoria a pergunta é "quem é o presidente", e
  não "onde está a Mayara": o cargo vem antes da pessoa.

  - Com perfil publicado no diretório, o cartão inteiro leva a ele, pelo
    link do nome, esticado em CSS. "Ver perfil" só desenha (`aria-hidden`):
    o teclado não para duas vezes no mesmo destino.
  - Sem perfil, o cartão não é link (um link que leva a 404 é pior que
    texto) e não tem botão, mas o espaço do botão fica, para os pés dos
    cartões de uma fileira continuarem na mesma linha. `data-ligar` marca o
    botão ou o espaço dele para a auditoria visual, como no cartão da busca.

  A linha do CRM sai só com CRM e UF: `lib/dados/diretoria` já os resolve
  entre as duas origens, e quem não é médico (um contador na tesouraria)
  não tem inscrição. A palavra MÉDICO ao lado do CRM é exigência da
  Resolução CFM 2.336/2023, Art. 4º, I (`identificacaoMedica`).
*/
export function CartaoDiretor({ diretor, imediata = false }: { diretor: Diretor; imediata?: boolean }) {
  const perfil = diretor.slugDoPerfil;

  return (
    <li
      className={`${cartao.medico} ${styles.diretor}`}
      data-diretor=""
      data-sem-perfil={perfil ? undefined : ""}
    >
      <FotoDoMedico
        nome={diretor.nome}
        foto={diretor.foto}
        alt=""
        sizes={SIZES_DO_CARTAO}
        carga={imediata ? "imediata" : "preguicosa"}
        className={`${cartao.foto} ${styles.foto}`}
      />
      <div className={cartao.corpo}>
        <div className={cartao.texto}>
          <p className={styles.cargo}>{diretor.cargo}</p>
          <h3 className={cartao.nome}>
            {perfil ? <Link href={`/medico/${perfil}`}>{diretor.nome}</Link> : diretor.nome}
          </h3>
          {diretor.crm && diretor.crmUf ? (
            <p className={cartao.crm}>{identificacaoMedica(diretor.crm, diretor.crmUf)}</p>
          ) : null}
        </div>
        {perfil ? (
          <span className={`botao ${cartao.ligar} ${styles.verPerfil}`} aria-hidden="true" data-ligar="">
            Ver perfil <Icone nome="seta" />
          </span>
        ) : (
          <div className={cartao.semLigar} aria-hidden="true" data-ligar=""></div>
        )}
      </div>
    </li>
  );
}
