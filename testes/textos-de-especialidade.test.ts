import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import {
  ETIQUETA_TEXTOS_DE_ESPECIALIDADE,
  GROQ_TEXTO_DE_ESPECIALIDADE,
  paraTextoDeEspecialidade,
  type TextoDeEspecialidadeCru,
} from "@/lib/sanity/consultas";

/*
  O texto "Sobre a especialidade", do banco do Sanity até o que a página
  desenha.

  A consulta é executada de verdade com `groq-js`, sobre documentos que o
  teste escreve, como em testes/parceiras-consulta.test.ts. Assim se vê
  QUAL documento o filtro escolhe e O QUE a projeção devolve. Depois,
  `paraTextoDeEspecialidade` (função pura) confere se o texto está completo
  e escreve o mês da revisão. Não prova o Sanity de verdade (cache,
  permissões, rascunhos): só o GROQ e a montagem.

  Nomes e textos de mentira, todos.
*/

const bloco = (texto: string, extra: Record<string, unknown> = {}) => ({
  _type: "block",
  _key: `b-${texto.length}`,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
  ...extra,
});
const item = (texto: string) => bloco(texto, { listItem: "bullet", level: 1 });

const COMPLETO = {
  oQueFaz: [bloco("Cuida do coração e dos vasos.")],
  quandoProcurar: [item("Falta de ar."), item("Pressão alta."), bloco("Dor forte no peito: ligue 192.")],
  revisorNome: "Dra. Exemplo Revisora",
  revisorCrm: "CRM/MA 10000",
  revisadoEm: "2026-09-15",
};

const slug = (current: string) => ({ _type: "slug", current });

const DOCUMENTOS = [
  {
    _type: "textoDeEspecialidade",
    _id: "cardio",
    _updatedAt: "2026-09-20T10:00:00Z",
    especialidade: slug("cardiologia"),
    ...COMPLETO,
  },
  /* Dois da mesma especialidade (o Studio recusa, mas um documento pode
     chegar por fora dele): vale o atualizado por último. */
  {
    _type: "textoDeEspecialidade",
    _id: "pediatria-antigo",
    _updatedAt: "2026-09-01T10:00:00Z",
    especialidade: slug("pediatria"),
    ...COMPLETO,
    revisorNome: "Revisora Antiga",
  },
  {
    _type: "textoDeEspecialidade",
    _id: "pediatria-novo",
    _updatedAt: "2026-09-10T10:00:00Z",
    especialidade: slug("pediatria"),
    ...COMPLETO,
    revisorNome: "Revisora Nova",
  },
  /* Incompleto: só o "O que faz". */
  {
    _type: "textoDeEspecialidade",
    _id: "urologia",
    _updatedAt: "2026-09-10T10:00:00Z",
    especialidade: slug("urologia"),
    oQueFaz: [bloco("Cuida do trato urinário.")],
  },
  /* Outro tipo de documento, com os mesmos campos. */
  { _type: "banner", _id: "banner", especialidade: slug("neurologia"), ...COMPLETO },
];

async function consultar(especialidade: string): Promise<TextoDeEspecialidadeCru | null> {
  const valor = await evaluate(parse(GROQ_TEXTO_DE_ESPECIALIDADE), {
    dataset: DOCUMENTOS,
    params: { especialidade },
  });
  return (await valor.get()) as TextoDeEspecialidadeCru | null;
}

describe("a consulta do texto (GROQ_TEXTO_DE_ESPECIALIDADE)", () => {
  it("devolve o texto da especialidade pedida, com os cinco campos que a página usa", async () => {
    expect(await consultar("cardiologia")).toEqual(COMPLETO);
  });

  it("outra especialidade e outro tipo de documento não entram", async () => {
    expect(await consultar("neurologia")).toBeNull();
    expect(await consultar("inexistente")).toBeNull();
  });

  it("com dois textos da mesma especialidade, vale o atualizado por último", async () => {
    expect((await consultar("pediatria"))?.revisorNome).toBe("Revisora Nova");
  });

  it("o que falta sai nulo, e não some do objeto", async () => {
    expect(await consultar("urologia")).toEqual({
      oQueFaz: [bloco("Cuida do trato urinário.")],
      quandoProcurar: null,
      revisorNome: null,
      revisorCrm: null,
      revisadoEm: null,
    });
  });

  it("a etiqueta de cache é a que o webhook invalida", () => {
    expect(ETIQUETA_TEXTOS_DE_ESPECIALIDADE).toBe("textos-de-especialidade");
  });
});

describe("paraTextoDeEspecialidade", () => {
  const cru = (o: Partial<TextoDeEspecialidadeCru> = {}): TextoDeEspecialidadeCru =>
    ({ ...COMPLETO, ...o }) as unknown as TextoDeEspecialidadeCru;

  it("completo: os textos como vieram, os nomes aparados e o mês por extenso", () => {
    expect(paraTextoDeEspecialidade(cru({ revisorNome: "  Dra. Exemplo Revisora \n" }))).toEqual({
      oQueFaz: COMPLETO.oQueFaz,
      quandoProcurar: COMPLETO.quandoProcurar,
      revisorNome: "Dra. Exemplo Revisora",
      revisorCrm: "CRM/MA 10000",
      mesDaRevisao: "setembro de 2026",
    });
  });

  it("sem documento, nada", () => {
    expect(paraTextoDeEspecialidade(null)).toBeNull();
  });

  it("qualquer um dos cinco faltando, nada: o texto só sai completo", () => {
    for (const campo of ["oQueFaz", "quandoProcurar", "revisorNome", "revisorCrm", "revisadoEm"] as const) {
      expect(paraTextoDeEspecialidade(cru({ [campo]: null } as Partial<TextoDeEspecialidadeCru>)), campo).toBeNull();
    }
  });

  it("nome ou CRM em branco valem como faltando", () => {
    expect(paraTextoDeEspecialidade(cru({ revisorNome: "   " }))).toBeNull();
    expect(paraTextoDeEspecialidade(cru({ revisorCrm: "" }))).toBeNull();
  });

  it("texto sem nenhuma letra vale como faltando: lista vazia, bloco em branco", () => {
    expect(paraTextoDeEspecialidade(cru({ oQueFaz: [] }))).toBeNull();
    expect(
      paraTextoDeEspecialidade(
        cru({ quandoProcurar: [bloco("   ")] as unknown as TextoDeEspecialidadeCru["quandoProcurar"] }),
      ),
    ).toBeNull();
  });

  it("data fora do formato do Studio vale como faltando", () => {
    expect(paraTextoDeEspecialidade(cru({ revisadoEm: "2026-13-01" }))).toBeNull();
  });
});
