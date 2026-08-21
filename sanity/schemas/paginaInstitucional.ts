import { defineArrayMember, defineField, defineType } from "sanity";
import { PAGINAS_CONHECIDAS } from "@/lib/sanity/paginas";

/*
  Páginas de texto da associação: benefícios, estatuto, política editorial, e
  a própria /associacao.

  Existe como tipo separado de `noticia` porque não tem autor, não tem data de
  publicação e não sai em listagem cronológica. Forçar os dois no mesmo tipo
  encheria o formulário do estatuto de campos que a AMI teria de ignorar toda
  vez, e formulário com campo inútil é formulário preenchido errado.

  O `slug` vem de lista fechada em vez de texto livre: cada endereço aqui tem
  uma rota correspondente no Next, e um slug inventado no Studio produziria um
  documento publicado que não aparece em lugar nenhum do site.
*/

/*
  `enderecosValidos` deriva de `PAGINAS_CONHECIDAS` (`lib/sanity/paginas.ts`),
  e não é mais escrita à mão aqui. Achado da rodada 2 de revisão da tarefa 11:
  esta era, sem que nada a ligasse às outras duas, uma TERCEIRA lista
  independente do mesmo conjunto de sete slugs que `CAMINHO_DAS_PAGINAS` (o
  sitemap) e `PAGINAS` (a rota `/associacao/[pagina]`) também descreviam.
  Nada impedia as três de divergirem; agora as três leem do mesmo módulo.

  `PAGINAS_CONHECIDAS` não importa nada (ver o comentário lá), então
  importar daqui não arrasta `obterCliente` nem a validação de ambiente de
  `sanity/env.ts` para dentro do Studio, que carrega este arquivo no
  navegador da secretaria da AMI sem `.env.local` nenhum por perto. É a
  mesma razão pela qual este schema nunca importou de
  `lib/sanity/consultas.ts`. */
/* Exportada só para o teste de reconciliação em
   `testes/sanity-paginas.test.ts`: comparar esta lista, importada daqui,
   contra `PAGINAS_CONHECIDAS`, importada de `lib/sanity/paginas.ts`, é o que
   pegaria alguém desfazendo esta derivação no futuro e voltando a escrever
   a lista à mão. */
export const enderecosValidos = Object.keys(PAGINAS_CONHECIDAS);

/* `options.list` não existe em `SlugOptions` (@sanity/types@6.10.1, o que o
   `sanity@6.10.1` instalado reexporta) e o input padrão do tipo `slug` no
   Studio (`SlugInput`, em node_modules/sanity/lib/PerspectiveProvider-*.js)
   só lê `options.source`, não `options.list`: não existe dropdown para slug
   nessa versão. A lista fechada é aplicada na validação abaixo, que é o
   único lugar onde ela de fato impede a publicação de um endereço fora da
   lista; a descrição do campo, logo ali, é o que dá à secretaria da AMI um
   rótulo legível para cada slug, já que não há dropdown para mostrá-lo. */
export const paginaInstitucional = defineType({
  name: "paginaInstitucional",
  title: "Página institucional",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Endereço",
      type: "slug",
      /* "Rótulo (slug)" por entrada, não só o slug cru: "termos-de-uso"
         sozinho não diz nada para quem preenche o formulário, e é a
         secretaria da AMI que lê isto, não um desenvolvedor. */
      description:
        "Um destes, exatamente: " +
        enderecosValidos
          .map((slug) => `${PAGINAS_CONHECIDAS[slug].rotulo} (${slug})`)
          .join(", ") +
        ". Qualquer outro valor não tem rota correspondente no site.",
      validation: (r) =>
        r.required().custom((valor) => {
          if (valor?.current && !enderecosValidos.includes(valor.current)) {
            return "Endereço não corresponde a nenhuma página do site.";
          }
          return true;
        }),
    }),
    defineField({
      name: "resumo",
      title: "Resumo",
      type: "text",
      rows: 3,
      description: "Aparece abaixo do título e na busca do Google.",
      validation: (r) => r.required().min(60).max(220),
    }),
    defineField({
      name: "atualizadoEm",
      title: "Atualizado em",
      type: "datetime",
      description:
        "Obrigatório nas páginas legais: o leitor precisa saber de quando é " +
        "a versão que está lendo.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "corpo",
      title: "Texto",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Parágrafo", value: "normal" },
            { title: "Título de seção", value: "h2" },
            { title: "Subtítulo", value: "h3" },
          ],
          lists: [
            { title: "Lista", value: "bullet" },
            { title: "Lista numerada", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Negrito", value: "strong" },
              { title: "Itálico", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Endereço",
                    type: "url",
                    /*
                      Um `type: "url"` cru já carrega `Rule.uri()` com
                      `scheme: ["http", "https"]` e `allowRelative: false`, e
                      `.required()` não substitui essa regra base: acrescenta
                      à ela. O efeito era a secretaria não conseguir linkar
                      `/associacao/diretoria` nem o e-mail da AMI de dentro de
                      uma página institucional, que num estatuto e numa
                      política editorial é justamente o que mais se linka.
                      Esta lista é a mesma da anotação de link padrão do
                      próprio Sanity, escrita aqui porque só declarando
                      `uri()` explicitamente ela troca a base.
                    */
                    validation: (r) =>
                      r.required().uri({
                        scheme: ["http", "https", "tel", "mailto"],
                        allowRelative: true,
                      }),
                  }),
                ],
              },
            ],
          },
        }),
      ],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "titulo", subtitle: "slug.current" },
  },
});
