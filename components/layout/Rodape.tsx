import Link from "next/link";
import { AMI, hrefTelefone } from "@/lib/ami";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import styles from "@/components/layout/Rodape.module.css";

/*
  Rodapé verde com a mesma textura do bloco de busca (`.textura-verde`, em
  `app/globals.css`) e uma luz que passeia devagar. Quatro colunas no
  computador, duas no celular.

  A marca não entra aqui: sendo verde-escura sobre fundo verde-escuro, ela
  sumiria. No lugar, o nome da associação em texto, que é legível e
  acessível, o que uma imagem não seria.

  As listas de todas as especialidades e de todos os bairros saíram daqui, como
  no desenho aprovado: o rodapé ficaria uma parede de texto, e elas deixam de
  ser lidas à toa a cada página. A ligação interna não se perde:
  "Especialidades" leva ao índice `/medicos`, que lista as especialidades e os
  bairros, e "Bairros" leva a `/busca`, onde os bairros são pílulas.

  O espaço de cima é `--ritmo`, menos quando a página termina numa faixa de
  ponta a ponta (um bloco com `data-faixa`): aí o rodapé emenda nela, sem
  espaço. A regra, com `:has`, está em Rodape.module.css.

  "Sua AMI" só aparece no modo demonstração, como o bloco `#sua-ami` da home
  a que ele leva; a mesma regra do menu (`menuDoSite`, em lib/menu.ts).
*/
export function Rodape() {
  return (
    <footer className={`textura-verde ${styles.rodape}`}>
      <div className={`brilho ${styles.luz}`} aria-hidden />
      <div className={styles.caixa}>
        <div className={styles.colunas}>
          <div>
            <p className={styles.lema}>{AMI.razaoSocial}</p>
            <div className="registro">CNPJ {AMI.cnpj}</div>
          </div>

          <nav aria-labelledby="rodape-associacao" className={styles.coluna}>
            <h2 id="rodape-associacao" className={styles.titulo}>
              A Associação
            </h2>
            <Link href="/associacao">Quem somos</Link>
            <Link href="/associacao/diretoria">Diretoria</Link>
            <Link href="/noticias">Notícias</Link>
            <Link href="/associacao/seja-associado">Seja associado</Link>
            {DADOS_DEMONSTRACAO ? <Link href="/#sua-ami">Sua AMI</Link> : null}
          </nav>

          <nav aria-labelledby="rodape-medicos" className={styles.coluna}>
            <h2 id="rodape-medicos" className={styles.titulo}>
              Encontre um médico
            </h2>
            <Link href="/busca">Buscar</Link>
            <Link href="/medicos">Especialidades</Link>
            <Link href="/busca">Bairros</Link>
          </nav>

          <div className={styles.coluna}>
            <h2 className={styles.titulo}>Fale com a AMI</h2>
            {/*
              Endereço e telefone vêm de `lib/ami.ts`, que é a fonte única.
              O critério de negócio local do Google pede que nome, endereço e
              telefone sejam idênticos em todo lugar do site e iguais ao perfil
              da empresa. Escrito à mão aqui, divergiria do dado estruturado na
              primeira correção, sem erro em lugar nenhum.
            */}
            <address>
              {AMI.endereco.logradouro}, {AMI.endereco.numero}
              <br />
              {AMI.endereco.bairro}, {AMI.endereco.cidade} – {AMI.endereco.uf}
              <br />
              CEP {AMI.endereco.cep}
            </address>

            {/* Telefone clicável: no celular, que é a maioria do acesso,
                ligar é a ação mais provável de quem chegou até aqui. */}
            <div className={styles.telefones}>
              {AMI.telefones.map((t) => (
                <a key={t} href={hrefTelefone(t)} className="registro">
                  {t}
                </a>
              ))}
            </div>

            <a href={AMI.redes.instagram} className={styles.instagram}>
              Instagram
            </a>
          </div>
        </div>

        <div className={styles.base}>
          <div className={styles.linha}>
            <span>© {AMI.razaoSocial}</span>
            {/*
              Os três links dão 404 hoje: o Sanity ainda não tem o texto de
              nenhuma das três páginas legais, e cada uma chama `notFound()`
              nesse caso. É esperado, não é defeito do rodapé. Diferente do
              sitemap (que não pode convidar um robô para um 404), o rodapé é
              navegação para gente, e um rodapé sem link para política de
              privacidade e termos de uso é o problema maior num site que lida
              com dado de saúde. O link some sozinho da lista quando a AMI
              escrever o texto: nada aqui muda nesse dia.
            */}
            <nav aria-label="Informações legais">
              <ul className={styles.legais}>
                {[
                  { rotulo: "Política de privacidade", href: "/politica-de-privacidade" },
                  { rotulo: "Termos de uso", href: "/termos-de-uso" },
                  { rotulo: "Política de cookies", href: "/politica-de-cookies" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.rotulo}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={styles.avisos}>
            <p>
              O conteúdo deste site é informativo e não substitui a consulta
              médica.
            </p>
            {/* Some no mesmo instante em que o robots.txt abre o site: as duas
                partes leem a mesma trava (lib/demonstracao.ts). Afirmar que os
                perfis são fictícios depois da carga do cadastro real seria
                desmentir 500 médicos de verdade no rodapé de toda página. */}
            {DADOS_DEMONSTRACAO ? (
              <p>
                Os dados de profissionais exibidos são fictícios, para
                demonstração, até a carga do cadastro oficial da AMI.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
