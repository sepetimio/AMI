import { defineArrayMember, defineField, defineType } from "sanity";

/*
  O texto "Sobre a {especialidade}" da página de cada especialidade
  (/medicos/{especialidade}). Ele traz:
  - o que o especialista faz;
  - quando procurar;
  - quem revisou e quando.

  É texto de saúde, escrito e revisado por médico, e por isso fica no
  Studio, onde a AMI já escreve, e não no banco do diretório.

  O site lê estes campos por `GROQ_TEXTO_DE_ESPECIALIDADE`, em
  lib/sanity/consultas.ts. Com algum dos seis em branco, o texto não sai: na
  demonstração a página mostra "Texto da AMI a entrar." no lugar dele, e fora
  dela o bloco não existe.

  `especialidade` é do tipo `slug` porque o Sanity confere sozinho que dois
  documentos deste tipo não usam o mesmo valor.
*/

/* O fim do endereço da página: minúsculas sem acento, números e hífen. */
const FIM_DO_ENDERECO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* Parágrafos e lista com marcadores, e nada mais: o desenho da página só
   prevê os dois. */
const PARAGRAFOS_E_LISTA = defineArrayMember({
  type: "block",
  styles: [{ title: "Parágrafo", value: "normal" }],
  lists: [{ title: "Lista", value: "bullet" }],
  marks: { decorators: [], annotations: [] },
});

export const textoDeEspecialidade = defineType({
  name: "textoDeEspecialidade",
  title: "Texto de especialidade",
  type: "document",
  fields: [
    defineField({
      name: "especialidade",
      title: "Especialidade",
      type: "slug",
      description:
        "O fim do endereço da página da especialidade no site. Para a página " +
        "/medicos/ortopedia-e-traumatologia, escreva ortopedia-e-traumatologia. " +
        "Cada especialidade tem um texto só.",
      validation: (r) =>
        r.required().custom((v) => {
          const atual = (v as { current?: string } | undefined)?.current ?? "";
          return atual === "" || FIM_DO_ENDERECO.test(atual)
            ? true
            : "Use só letras minúsculas sem acento, números e hífen, como em ortopedia-e-traumatologia";
        }),
    }),
    defineField({
      name: "oQueFaz",
      title: "O que faz",
      type: "array",
      of: [PARAGRAFOS_E_LISTA],
      description: "O que o especialista faz, em um ou dois parágrafos.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "quandoProcurar",
      title: "Quando procurar",
      type: "array",
      of: [PARAGRAFOS_E_LISTA],
      description:
        "Quando procurar o especialista. Pode ter uma lista e, depois dela, um parágrafo.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "revisorNome",
      title: "Revisado por",
      type: "string",
      description:
        'O nome do médico que revisou o texto, como deve aparecer no site: "Dra. Maria da Silva".',
      validation: (r) => r.required().max(80),
    }),
    defineField({
      name: "revisorCrm",
      title: "CRM do revisor",
      type: "string",
      description: 'No formato "CRM/MA 12345".',
      validation: (r) => r.required().regex(/^CRM\/[A-Z]{2} \d+$/, { name: "CRM/UF número" }),
    }),
    defineField({
      name: "revisadoEm",
      title: "Data da revisão",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
      description: 'O site mostra só o mês e o ano: "revisão em setembro de 2026".',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "especialidade.current", subtitle: "revisorNome" },
  },
});
