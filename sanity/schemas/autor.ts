import { defineField, defineType } from "sanity";

/*
  Autor é médico, e por isso carrega CRM.

  Não é a tabela `profissional` do Supabase: quem escreve para o site pode não
  estar publicado no diretório, e um documento do Sanity não deve depender de
  uma linha do Postgres para existir. O laço entre os dois é `slugDoPerfil`,
  opcional: quando preenchido, a assinatura da notícia vira link para o perfil
  real; quando vazio, sai como texto. É deliberadamente frouxo, porque a
  alternativa é uma notícia que não publica porque o autor ainda não foi
  cadastrado no diretório.
*/
export const autor = defineType({
  name: "autor",
  title: "Autor",
  type: "document",
  fields: [
    defineField({
      name: "nome",
      title: "Nome",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "crm",
      title: "CRM",
      type: "string",
      description: "Só os números. A UF vai no campo ao lado.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "crmUf",
      title: "UF do CRM",
      type: "string",
      initialValue: "MA",
      validation: (r) => r.required().length(2),
    }),
    defineField({
      name: "slugDoPerfil",
      title: "Endereço do perfil no diretório",
      type: "string",
      description:
        "Opcional. O trecho final do endereço, por exemplo mayara-viana. " +
        "Preenchido, a assinatura vira link para o perfil.",
    }),
  ],
  preview: {
    select: { title: "nome", subtitle: "crm" },
  },
});
