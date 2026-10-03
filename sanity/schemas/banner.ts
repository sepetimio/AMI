import { defineField, defineType } from "sanity";

/*
  O banner da home.

  É uma ARTE PRONTA, produzida fora nas dimensões padrão — não é texto sobre
  foto. A AMI sobe a imagem e ela aparece.

  Por isso a descrição da imagem não é cortesia: toda a informação do banner
  mora dentro da arte, e imagem é opaca para leitor de tela, para busca e para
  quem aumenta a fonte. A descrição é o único caminho do conteúdo até essas
  pessoas.
*/
export const banner = defineType({
  name: "banner",
  title: "Banner da home",
  type: "document",
  fields: [
    defineField({
      name: "nome",
      title: "Nome interno",
      type: "string",
      description: "Só para você achar este banner na lista. Não aparece no site.",
      validation: (r) => r.required().max(80),
    }),
    defineField({
      name: "imagem",
      title: "Arte",
      type: "image",
      description: "3000 × 856 pixels. Texto grande: a arte encolhe no celular.",
      validation: (r) => r.required(),
      fields: [
        defineField({
          name: "alt",
          title: "Descrição da imagem",
          type: "string",
          description:
            "Diga o que o cartaz diz, não o que ele é. " +
            'Não "banner da assembleia", e sim "Assembleia geral no dia 12 de março, ' +
            'às 19h, na sede da AMI".',
          validation: (r) => r.required().min(15),
        }),
      ],
    }),
    defineField({
      name: "destino",
      title: "Para onde leva",
      type: "string",
      description:
        "Endereço de dentro do site, começando com barra — /medicos, /noticias. " +
        "Deixe vazio se o banner só informa.",
      validation: (r) =>
        r.custom((v) =>
          !v || (typeof v === "string" && v.startsWith("/"))
            ? true
            : "O endereço precisa começar com barra.",
        ),
    }),
    defineField({
      name: "ordem",
      title: "Ordem",
      type: "number",
      description: "10, 20, 30 — com folga, para inserir no meio sem renumerar tudo.",
      initialValue: 10,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "expiraEm",
      title: "Aparece até",
      type: "date",
      description:
        "O último dia em que ele aparece. Vazio significa que fica para sempre. " +
        "Banner de assembleia ou de prazo some sozinho no dia seguinte.",
    }),
  ],
  preview: {
    select: { title: "nome", subtitle: "expiraEm", media: "imagem" },
  },
});
