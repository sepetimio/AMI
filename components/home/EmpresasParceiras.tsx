import styles from "@/components/home/EmpresasParceiras.module.css";
import { ESPACOS_DE_PARCEIRAS } from "@/lib/molduras";
import type { EmpresaParceira } from "@/lib/sanity/tipos";

/*
  A grade dos logotipos das empresas parceiras da AMI. O título e o rótulo
  são de `Parceiros`, que monta esta grade na faixa branca.

  Com empresas cadastradas no Sanity, cada logotipo vai numa caixa do mesmo
  tamanho do `.logo-vazio` do desenho aprovado, com borda cheia e fundo
  branco, e aparece inteiro, sem cortar nem distorcer. O nome da empresa é o
  texto alternativo. Com site, a caixa é link e abre em outra aba.

  Sem nenhuma cadastrada, saem os seis espaços "Logotipo a entrar", a
  caixa tracejada do desenho. Nenhum nome de empresa é escrito aqui:
  escrever um seria anunciar uma parceria que não existe. Cada espaço leva
  `data-a-entrar`, a marca de toda moldura "a entrar" do site, sem estilo
  nenhum.

  Este componente não decide se aparece, nem se os espaços vazios podem
  sair. Quem decide é `moldurasDaHome`, em lib/molduras.ts: os espaços, só
  no modo demonstração.

  Seis lado a lado no computador, três por linha abaixo de 980px e no
  celular (a versão final do desenho: duas linhas de três, nada cortado na
  borda).
*/

/*
  A largura da imagem dentro da caixa, pelas réguas do CSS: a faixa tem
  `--borda-faixa` de cada lado (72px no computador, 52px até 980px, 32px até
  700px, e o texto numa coluna de 1096px a partir de 1240px de tela); a
  grade tem 6 colunas com 12px entre elas, ou 3 com 12px, ou 3 com 8px no
  celular; e a caixa tira 1px de borda e 8px de folga de cada lado (6px no
  celular).
*/
export const SIZES_DO_LOGOTIPO =
  "(max-width: 700px) calc((100vw - 80px) / 3 - 14px), " +
  "(max-width: 980px) calc((100vw - 128px) / 3 - 18px), " +
  "(max-width: 1240px) calc((100vw - 204px) / 6 - 18px), 155px";

function Logotipo({ parceira }: { parceira: EmpresaParceira }) {
  const imagem = (
    /* eslint-disable-next-line @next/next/no-img-element --
       o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
    <img
      src={parceira.logotipo}
      srcSet={parceira.logotipoSrcset}
      sizes={SIZES_DO_LOGOTIPO}
      alt={parceira.nome}
      loading="lazy"
      decoding="async"
    />
  );

  if (!parceira.site) return <div className={styles.logo}>{imagem}</div>;

  return (
    <a
      className={styles.logo}
      href={parceira.site}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${parceira.nome} (abre em outra aba)`}
    >
      {imagem}
    </a>
  );
}

export function EmpresasParceiras({ parceiras }: { parceiras: EmpresaParceira[] }) {
  if (parceiras.length > 0) {
    return (
      <ul className={styles.parceiros}>
        {parceiras.map((p) => (
          <li key={p.id} className={styles.parceira}>
            <Logotipo parceira={p} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={styles.parceiros}>
      {Array.from({ length: ESPACOS_DE_PARCEIRAS }, (_, i) => (
        <li key={i} className={styles.logoVazio} data-a-entrar="">
          Logotipo a entrar
        </li>
      ))}
    </ul>
  );
}
