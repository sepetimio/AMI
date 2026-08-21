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
export function LinhaNoticia({ noticia }: { noticia: ResumoNoticia }) {
  return (
    <li className="group border-b border-line transition-colors duration-200 last:border-b-0 hover:bg-ami-mint-100/40">
      <Link
        href={`/noticias/${noticia.slug}`}
        className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:gap-6 md:px-6"
      >
        {noticia.capa ? (
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
            enviar. Miniaturas de proporções variadas também não fazem a
            grade dançar, porque a caixa é sempre a mesma.

            Não pedimos recorte ao CDN (`urlDaImagem` só recebe a largura, sem
            `.height()`): o `object-cover` já resolve o enquadramento visual,
            e recortar no servidor exigiria estender `urlDaImagem` para
            aceitar altura, o que nenhum outro chamador precisa hoje.
          */
          /* eslint-disable-next-line @next/next/no-img-element --
             o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
          <img
            src={urlDaImagem(noticia.capa, 320)}
            alt={noticia.capa.alt}
            width={160}
            height={112}
            className="h-[112px] w-full shrink-0 rounded-bloco object-cover shadow-apoio sm:w-[160px]"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="registro text-[14px] text-ink-400">
            {dataPorExtenso(noticia.publicadoEm)}
          </p>

          <h3 className="mt-1.5 font-titulo text-[23px] font-bold leading-[1.2] text-ink-900 transition-colors duration-200 [font-stretch:86%] group-hover:text-ami-green-600">
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
