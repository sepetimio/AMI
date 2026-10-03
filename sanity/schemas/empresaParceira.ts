import { defineField, defineType } from "sanity";

/*
  Uma empresa parceira da AMI. Cada uma cadastrada vira um logotipo na faixa
  "Quem caminha com a AMI", no fim da home, e entra na contagem do quarto
  número da faixa de números (components/home/NumerosDaAmi.tsx).

  O site lê estes campos por `GROQ_EMPRESAS_PARCEIRAS`, em
  lib/sanity/consultas.ts. Sem nome ou sem logotipo, a empresa não sai no
  site nem conta no número.
*/
export const empresaParceira = defineType({
  name: "empresaParceira",
  title: "Empresa parceira",
  type: "document",
  fields: [
    defineField({
      name: "nome",
      title: "Nome",
      type: "string",
      description:
        "O nome da empresa. Não aparece escrito na página: é o que o leitor de " +
        "tela lê no lugar do logotipo.",
      validation: (r) => r.required().max(80),
    }),
    defineField({
      name: "logotipo",
      title: "Logotipo",
      type: "image",
      /* PNG, JPEG ou WebP. SVG fica de fora: o caminho dele pelo CDN de
         imagens do Sanity até a página não foi conferido. */
      options: { accept: "image/png,image/jpeg,image/webp" },
      description:
        "PNG com fundo transparente, com 640 pixels de largura ou mais. O site " +
        "mostra o logotipo inteiro, sem cortar, numa caixa branca mais larga que alta.",
      validation: (r) =>
        r
          .required()
          .custom((v) =>
            (v as { asset?: unknown } | undefined)?.asset ? true : "O logotipo é obrigatório",
          ),
    }),
    defineField({
      name: "site",
      title: "Site",
      type: "url",
      description:
        "O endereço completo do site da empresa, começando com https://. Pode " +
        "deixar vazio: nesse caso o logotipo não é link.",
    }),
    defineField({
      name: "ordem",
      title: "Ordem",
      type: "number",
      description:
        "10, 20, 30 — com folga, para inserir no meio sem renumerar tudo. Pode " +
        "deixar vazio: as empresas sem ordem vêm depois das numeradas, pelo nome.",
    }),
  ],
  preview: {
    select: { title: "nome", subtitle: "site", media: "logotipo" },
  },
});
