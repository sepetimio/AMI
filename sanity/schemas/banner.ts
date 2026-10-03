import { defineField, defineType } from "sanity";

/*
  O banner da home. Há dois tipos, e quem cadastra escolhe no campo "Tipo":

  - ARTE PRONTA: uma imagem produzida fora, nas medidas padrão, que cobre o
    slide inteiro, com uma versão própria para o celular. Não é texto sobre
    foto: a AMI sobe a imagem e ela aparece.
  - FOTO COM TEXTO MONTADO NO SITE: a AMI sobe uma foto e escreve rótulo,
    título, texto curto e botão; o site monta o slide. Não precisa de designer.

  Na arte pronta, a descrição da imagem não é cortesia: toda a informação do
  banner mora dentro da arte, e imagem é opaca para leitor de tela, para busca
  e para quem aumenta a fonte. A descrição é o único caminho do conteúdo até
  essas pessoas. No tipo com texto montado o texto já é texto, e a descrição
  da foto só diz o que a foto mostra.

  Os campos do tipo que não foi escolhido ficam escondidos. Quem nunca
  escolheu um tipo (documento anterior a este campo) tem os campos de arte
  à mostra, o mesmo que `paraBanner` (lib/sanity/banners.ts) faz ao ler:
  `tipo ?? "arte"`.
*/

type Contexto = { document?: { [campo: string]: unknown } };

/** O documento é um banner com foto e texto? Sem tipo gravado, não é. */
const ehComposto = ({ document }: Contexto) => document?.tipo === "composto";
const ehArte = (c: Contexto) => !ehComposto(c);

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
      name: "tipo",
      title: "Tipo",
      type: "string",
      description:
        "Arte pronta: você sobe uma imagem já desenhada, com os textos dentro. " +
        "Foto com texto: você sobe só a foto e escreve os textos aqui; o site monta o banner.",
      options: {
        list: [
          { title: "Arte pronta", value: "arte" },
          { title: "Foto com texto montado no site", value: "composto" },
        ],
        layout: "radio",
      },
      initialValue: "arte",
    }),

    /* ── Arte pronta ─────────────────────────────────────────────── */
    defineField({
      name: "imagem",
      title: "Arte",
      type: "image",
      options: { hotspot: true },
      description:
        "3000 × 1288 pixels, para o computador. Se a arte tem letras, deixe uma " +
        "folga entre elas e as bordas.",
      hidden: ehComposto,
      validation: (r) =>
        r.custom((v, c) =>
          ehArte(c as Contexto) && !(v as { asset?: unknown } | undefined)?.asset
            ? "A arte é obrigatória"
            : true,
        ),
      fields: [
        defineField({
          name: "alt",
          title: "Descrição da imagem",
          type: "string",
          description:
            "Diga o que o cartaz diz, não o que ele é. " +
            'Não "banner da assembleia", e sim "Assembleia geral no dia 12 de março, ' +
            'às 19h, na sede da AMI".',
          validation: (r) =>
            r.custom((v, c) =>
              ehArte(c as Contexto) && (typeof v !== "string" || v.trim().length < 15)
                ? "Descreva o que o cartaz diz (pelo menos 15 letras)"
                : true,
            ),
        }),
      ],
    }),
    defineField({
      name: "imagemCelular",
      title: "Arte para o celular",
      type: "image",
      description:
        "1080 × 1350 pixels, na vertical. Pode deixar vazio: nesse caso o site " +
        "recorta a arte do computador para caber no celular.",
      hidden: ehComposto,
    }),
    defineField({
      name: "tema",
      title: "Cor do fundo da arte",
      type: "string",
      description:
        "Se o fundo da arte é escuro ou claro: muda a cor das bolinhas e das setas.",
      options: {
        list: [
          { title: "Escuro", value: "escuro" },
          { title: "Claro", value: "claro" },
        ],
        layout: "radio",
      },
      initialValue: "escuro",
      hidden: ehComposto,
    }),

    /* ── Foto com texto montado no site ──────────────────────────── */
    defineField({
      name: "foto",
      title: "Foto",
      type: "image",
      options: { hotspot: true },
      description:
        "1600 pixels de largura ou mais. No computador a foto fica à direita do texto; " +
        "no celular, o texto fica sobre a foto.",
      hidden: ehArte,
      fields: [
        defineField({
          name: "alt",
          title: "Descrição da foto",
          type: "string",
          description:
            "O que a foto mostra, para quem não enxerga: " +
            '"Diretoria da AMI reunida na sede".',
          validation: (r) =>
            r.custom((v, c) => {
              const foto = (c as { parent?: { asset?: unknown } }).parent;
              return ehComposto(c as Contexto) && foto?.asset && !v
                ? "Descreva o que a foto mostra"
                : true;
            }),
        }),
      ],
    }),
    defineField({
      name: "rotulo",
      title: "Rótulo",
      type: "string",
      description: "A palavrinha acima do título, como “Agenda” ou “Novidade”. Opcional.",
      hidden: ehArte,
      validation: (r) => r.max(40),
    }),
    defineField({
      name: "titulo",
      title: "Título",
      type: "string",
      description: "A frase grande do banner. Até 70 letras.",
      hidden: ehArte,
      validation: (r) =>
        r
          .max(70)
          .custom((v, c) =>
            ehComposto(c as Contexto) && !v ? "O título é obrigatório" : true,
          ),
    }),
    defineField({
      name: "texto",
      title: "Texto",
      type: "text",
      rows: 3,
      description: "Uma ou duas frases abaixo do título. Até 160 letras. Opcional.",
      hidden: ehArte,
      validation: (r) => r.max(160),
    }),
    defineField({
      name: "botao",
      title: "Texto do botão",
      type: "string",
      description:
        "O que está escrito no botão, como “Saiba mais”. Até 28 letras. " +
        "O botão leva ao endereço do campo “Para onde leva”, logo abaixo.",
      hidden: ehArte,
      validation: (r) => r.max(28),
    }),

    /* ── Os dois tipos ───────────────────────────────────────────── */
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
    select: {
      title: "nome",
      subtitle: "expiraEm",
      arte: "imagem",
      foto: "foto",
    },
    prepare: ({ title, subtitle, arte, foto }) => ({
      title,
      subtitle,
      media: arte ?? foto,
    }),
  },
});
