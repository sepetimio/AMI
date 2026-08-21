import { defineArrayMember, defineField, defineType } from "sanity";

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

/* `options.list` não existe em `SlugOptions` (@sanity/types@6.10.1, o que o
   `sanity@6.10.1` instalado reexporta) e o input padrão do tipo `slug` no
   Studio (`SlugInput`, em node_modules/sanity/lib/PerspectiveProvider-*.js)
   só lê `options.source`, não `options.list`: não existe dropdown para slug
   nessa versão. A lista fechada é aplicada aqui, na validação, que é o único
   lugar onde ela de fato impede a publicação de um endereço fora da lista. */
const enderecosValidos = [
  "associacao",
  "beneficios",
  "estatuto",
  "politica-editorial",
  "politica-de-privacidade",
  "termos-de-uso",
  "politica-de-cookies",
];
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
      description:
        "Um destes, exatamente: " +
        enderecosValidos.join(", ") +
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
                    validation: (r) => r.required(),
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
