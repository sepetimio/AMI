import { describe, expect, it } from "vitest";
import { tipos } from "@/sanity/schemas";

/*
  A anotação de link é a única regra dos dois schemas que precisa ser
  declarada por extenso: um `type: "url"` cru carrega `Rule.uri()` com
  `scheme: ["http", "https"]` e `allowRelative: false` embutidos, e
  `.required()` não desfaz isso.
*/
type Espiao = {
  chamou: string[];
  uri?: { scheme?: string[]; allowRelative?: boolean };
};

function espiarValidacaoDoLink(nomeDoTipo: string): Espiao {
  const tipo = porNome(nomeDoTipo) as unknown as {
    fields: { name: string; of?: unknown[] }[];
  };
  const corpo = tipo.fields.find((c) => c.name === "corpo");
  const blocos = (corpo?.of ?? []) as {
    marks?: {
      annotations?: {
        name: string;
        fields: { name: string; validation?: (r: unknown) => unknown }[];
      }[];
    };
  }[];
  const link = blocos
    .flatMap((b) => b.marks?.annotations ?? [])
    .find((a) => a.name === "link");
  const href = link?.fields.find((c) => c.name === "href");
  if (!href?.validation) throw new Error(`${nomeDoTipo}: link sem validação`);

  const espiao: Espiao = { chamou: [] };
  const regra = {
    required() {
      espiao.chamou.push("required");
      return regra;
    },
    uri(opcoes: { scheme?: string[]; allowRelative?: boolean }) {
      espiao.chamou.push("uri");
      espiao.uri = opcoes;
      return regra;
    },
  };
  href.validation(regra);
  return espiao;
}

function porNome(nome: string) {
  const t = tipos.find((t) => t.name === nome);
  if (!t) throw new Error(`schema "${nome}" não registrado`);
  return t as { name: string; fields: { name: string; validation?: unknown }[] };
}

describe("schemas do Sanity", () => {
  it("registra os três tipos de documento", () => {
    expect(tipos.map((t) => t.name).sort()).toEqual([
      "autor",
      "noticia",
      "paginaInstitucional",
    ]);
  });

  it("notícia tem os campos que as consultas projetam", () => {
    /* Este teste é o contrato entre a tarefa 2 e a tarefa 3. Um campo
       renomeado no Studio sem atualizar o GROQ não quebra nada em tempo de
       compilação: a consulta simplesmente devolve null, e a página some sem
       erro. Aqui isso vira teste vermelho. */
    const campos = porNome("noticia").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining([
        "titulo",
        "slug",
        "resumo",
        "capa",
        "autor",
        "publicadoEm",
        "atualizadoEm",
        "corpo",
      ]),
    );
  });

  it("autor guarda CRM e UF separados", () => {
    /* Separados porque a Resolução CFM 2.336/2023 exige exibir a inscrição
       com a UF, e `identificacaoMedica` em lib/formato.ts já monta a string
       a partir dos dois. Guardar "MA 10274" num campo só obrigaria a fatiar
       texto na hora de exibir. */
    const campos = porNome("autor").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining(["nome", "crm", "crmUf", "slugDoPerfil"]),
    );
  });

  it("página institucional tem slug e data de atualização", () => {
    const campos = porNome("paginaInstitucional").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining(["titulo", "slug", "resumo", "corpo", "atualizadoEm"]),
    );
  });
});

describe("anotação de link do texto rico", () => {
  /* A anotação de link padrão do próprio Sanity usa estes quatro esquemas e
     aceita endereço relativo. Sem declarar, a secretaria não consegue linkar
     /associacao/diretoria nem o e-mail da AMI de dentro de uma página
     institucional, e o ramo de link interno de TextoRico fica inalcançável. */
  for (const nome of ["noticia", "paginaInstitucional"]) {
    it(`${nome} aceita endereço interno, e-mail e telefone`, () => {
      const espiao = espiarValidacaoDoLink(nome);
      expect(espiao.chamou).toContain("required");
      expect(espiao.uri).toEqual({
        scheme: ["http", "https", "tel", "mailto"],
        allowRelative: true,
      });
    });
  }
});
