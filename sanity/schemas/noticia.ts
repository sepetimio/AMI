import { defineArrayMember, defineField, defineType } from "sanity";

/*
  Notícia do blog da AMI.

  `publicadoEm` e `atualizadoEm` são campos e não metadados automáticos do
  Sanity (`_createdAt`, `_updatedAt`) porque o que vale para o leitor e para o
  Google é a data editorial, não a data do banco. Corrigir uma vírgula três
  meses depois mexeria em `_updatedAt` e faria a matéria parecer revisada.
*/
export const noticia = defineType({
  name: "noticia",
  title: "Notícia",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "string",
      validation: (r) => r.required().max(110),
    }),
    defineField({
      name: "slug",
      title: "Endereço",
      type: "slug",
      options: { source: "titulo", maxLength: 90 },
      description:
        "Endereço publicado não muda. Se mudar, é preciso um redirecionamento.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "resumo",
      title: "Resumo",
      type: "text",
      rows: 3,
      description:
        "Duas ou três linhas. É o que aparece no índice e na busca do Google.",
      validation: (r) => r.required().min(60).max(220),
    }),
    defineField({
      name: "capa",
      title: "Imagem de capa",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Descrição da imagem",
          type: "string",
          description:
            "Descreva a cena para quem usa leitor de tela. Nunca escreva " +
            "'foto' ou 'imagem'.",
          validation: (r) => r.required(),
        }),
      ],
    }),
    defineField({
      name: "autor",
      title: "Autor",
      type: "reference",
      to: [{ type: "autor" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publicadoEm",
      title: "Publicado em",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "atualizadoEm",
      title: "Atualizado em",
      type: "datetime",
      description:
        "Preencha só quando houver revisão de conteúdo, não a cada correção " +
        "de digitação.",
    }),
    defineField({
      name: "corpo",
      title: "Texto",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          /* H1 fica de fora: a página já tem um, e um segundo quebra a
             hierarquia de cabeçalhos que leitor de tela usa para navegar. */
          styles: [
            { title: "Parágrafo", value: "normal" },
            { title: "Título de seção", value: "h2" },
            { title: "Subtítulo", value: "h3" },
            { title: "Citação", value: "blockquote" },
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
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Descrição da imagem",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "legenda", title: "Legenda", type: "string" }),
          ],
        }),
      ],
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    {
      title: "Mais recente primeiro",
      name: "recentes",
      by: [{ field: "publicadoEm", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "titulo", subtitle: "publicadoEm", media: "capa" },
  },
});
