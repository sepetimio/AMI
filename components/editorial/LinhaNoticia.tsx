import Link from "next/link";
import { urlDaImagem } from "@/lib/sanity/imagem";
import { dataPorExtenso, identificacaoMedica } from "@/lib/formato";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  Item do índice de notícias.

  Linha com miniatura à esquerda, e não grade de cartões: é a mesma gramática
  de `LinhaMedico`, e o site inteiro fica coerente. Grade de cartões também
  obrigaria toda matéria a ter capa, e a AMI vai publicar comunicado curto sem
  imagem.

  A assinatura traz CRM porque a Resolução CFM 2.336/2023 exige a inscrição ao
  lado do nome do médico, e conteúdo de saúde assinado sem CRM é exatamente o
  que o critério YMYL do Google penaliza.
*/

/*
  Larguras pedidas ao CDN para o `srcset` da miniatura.

  A caixa não tem a mesma largura em toda tela: fixa em 160px a partir do
  ponto de quebra `sm` (classe `sm:w-[160px]`), mas `w-full` abaixo dele, onde
  ela ocupa a largura do cartão inteiro. Medido contra o preenchimento real da
  página (`px-4` no contêiner) e do link (`px-5` na linha), essa largura fica
  entre uns 300px e 570px de CSS conforme o aparelho, ver o comentário de
  `sizes` mais abaixo.

  Pedir uma largura única (o que o brief original fazia, 320px fixos) deixa a
  miniatura nítida só num dos dois casos: em densidade 2 ou 3, padrão de
  celular, uma caixa de até 570px de CSS pede até 1710px de arquivo para sair
  nítida, e 320px sai visivelmente borrado bem no aparelho em que a maioria
  de quem procura médico está. `srcset` + `sizes` deixa o navegador calcular,
  a partir da largura real do layout e da densidade da tela dele, qual destas
  larguras baixar. Isso também poupa banda de quem está em 4G: o celular não
  baixa o arquivo pensado para a tela retina do desktop, e vice-versa.
*/
const LARGURAS_CAPA = [160, 320, 480, 640, 960, 1280];

export function LinhaNoticia({ noticia }: { noticia: ResumoNoticia }) {
  const capa = noticia.capa;

  /*
    `urlDaImagem` devolve "" quando `asset._ref` está malformado (upload
    ainda em andamento, referência corrompida), em vez de lançar; ver o
    comentário em lib/sanity/imagem.ts. Resolver aqui, antes do JSX, e não só
    checar `noticia.capa`: um `<img src="">` não fica em branco, o navegador
    trata string vazia como "recarregar a página atual" e dispara uma
    segunda requisição indesejada. Sem URL, a linha cai no mesmo layout de
    quem nunca teve capa, que já é um caso real (comunicado curto).

    A falha de `_ref` malformado independe da largura pedida (o problema é o
    formato do identificador, não o parâmetro de tamanho), então testar uma
    largura basta para saber se todas as larguras do `srcset` também vão
    falhar.
  */
  const capaSrc = capa ? urlDaImagem(capa, 640) : "";
  const capaSrcSet = capa
    ? LARGURAS_CAPA.map(
        (largura) => `${urlDaImagem(capa, largura)} ${largura}w`,
      ).join(", ")
    : "";

  return (
    /* `min-w-0`: ver o comentário equivalente em LinhaMedico. Item de grade
        não encolhe abaixo do conteúdo sem isto, e uma palavra longa sem
        espaço no resumo vira rolagem lateral da página. */
    <li className="pressiona eleva group min-w-0 rounded-bloco border border-line bg-surface shadow-apoio hover:border-line-strong">
      <Link
        href={`/noticias/${noticia.slug}`}
        className="flex flex-col gap-5 p-5 sm:flex-row sm:gap-6 md:p-6"
      >
        {capa && capaSrc ? (
          /*
            width={160} height={112} aqui NÃO é o defeito de CLS da tarefa 5.
            Lá (TextoRico) a imagem só tinha a largura fixada por CSS
            (`w-full`, `h-auto`), então o navegador usava a razão dos
            atributos width/height para calcular a altura automática antes de
            a imagem carregar; se a razão declarada não batesse com a real, a
            página pulava quando a imagem chegava.

            Aqui as duas dimensões da caixa são fixas por CSS em toda faixa de
            largura (`h-[112px]` sempre presente; `w-full` no celular,
            `sm:w-[160px]` a partir do breakpoint), com `object-cover`
            recortando o que sobrar. Como nenhuma dimensão fica em `auto`, o
            navegador nunca precisa da razão dos atributos para calcular a
            caixa: ela já está reservada antes do primeiro byte da imagem
            chegar, qualquer que seja a proporção real da foto que a AMI
            enviar, e qualquer que seja o arquivo que `srcset` escolher abaixo.
            Miniaturas de proporções variadas também não fazem a grade dançar,
            porque a caixa é sempre a mesma.

            Não pedimos recorte ao CDN (`urlDaImagem` só recebe a largura, sem
            `.height()`): o `object-cover` já resolve o enquadramento visual,
            e recortar no servidor exigiria estender `urlDaImagem` para
            aceitar altura, o que nenhum outro chamador precisa hoje.
          */
          /* eslint-disable-next-line @next/next/no-img-element --
             o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
          <img
            src={capaSrc}
            srcSet={capaSrcSet}
            /*
              Abaixo de `sm` (640px), a caixa é `w-full` dentro do link
              (`px-5`, 20px de cada lado) dentro do contêiner da página
              (`px-4`, 16px de cada lado): 100vw menos 72px de preenchimento
              somado. A partir de `sm`, a caixa é fixa em 160px. Precisa
              acompanhar `sm:w-[160px]` e os `px-*` da página e do link se
              algum dos três mudar, senão o navegador passa a escolher a
              largura errada do `srcset` (a caixa continua certa, só o
              arquivo baixado fica maior ou menor do que precisa).
            */
            sizes="(min-width: 640px) 160px, calc(100vw - 72px)"
            alt={capa.alt}
            width={160}
            height={112}
            className="h-[112px] w-full shrink-0 rounded-bloco object-cover shadow-apoio sm:w-[160px]"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="registro text-[14px] text-ink-400">
            {dataPorExtenso(noticia.publicadoEm)}
          </p>

          <h3 className="mt-2 text-[22px] font-semibold leading-[1.25] tracking-[-0.02em] text-ink-900 transition-colors duration-200 group-hover:text-ami-green-600">
            {noticia.titulo}
          </h3>

          <p className="coluna-leitura mt-2 text-[16px] text-ink-600">
            {noticia.resumo}
          </p>

          <p className="registro mt-3 text-[14px] font-semibold text-ink-400">
            {noticia.autor.nome}
            {", "}
            {identificacaoMedica(noticia.autor.crm, noticia.autor.crmUf)}
          </p>
        </div>
      </Link>
    </li>
  );
}
