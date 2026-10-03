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
  it("registra os quatro tipos de documento", () => {
    expect(tipos.map((t) => t.name).sort()).toEqual([
      "autor",
      "banner",
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

  it("banner tem os campos que a consulta projeta", () => {
    /* Contrato entre o cadastro e o carrossel, mesmo raciocínio do teste de
       notícia acima: renomear um campo no Studio não quebra nada em tempo de
       compilação, o GROQ devolve `undefined` calado e o slide perde o dado. */
    const campos = porNome("banner").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining([
        "nome",
        "tipo",
        "imagem",
        "imagemCelular",
        "tema",
        "foto",
        "rotulo",
        "titulo",
        "texto",
        "botao",
        "destino",
        "ordem",
        "expiraEm",
      ]),
    );
  });

  describe("banner, os dois tipos", () => {
    type Campo = {
      name: string;
      description?: string;
      initialValue?: unknown;
      options?: { list?: { title: string; value: string }[]; hotspot?: boolean };
      hidden?: (c: { document?: { tipo?: string } }) => boolean;
      validation?: (r: unknown, c: unknown) => unknown;
    };
    const campo = (nome: string): Campo => {
      const c = (porNome("banner").fields as Campo[]).find((f) => f.name === nome);
      if (!c) throw new Error(`banner sem o campo "${nome}"`);
      return c;
    };

    it("tipo escolhe entre arte pronta e foto com texto, e começa em arte", () => {
      const tipo = campo("tipo");
      expect(tipo.initialValue).toBe("arte");
      expect(tipo.options?.list).toEqual([
        { title: "Arte pronta", value: "arte" },
        { title: "Foto com texto montado no site", value: "composto" },
      ]);
    });

    it("tipo não é obrigatório: o documento antigo, sem tipo, não pode acusar erro", () => {
      /* Vale arte (`tipo ?? "arte"`), então faltar `tipo` não é defeito. */
      expect(rodar(campo("tipo").validation, undefined, doc()).obrigatorio).toBe(0);
      /* E o espião funciona: o nome interno continua sendo cobrado. */
      expect(rodar(campo("nome").validation, undefined, doc()).obrigatorio).toBe(1);
    });

    it("a arte larga e a foto deixam marcar o ponto de interesse", () => {
      expect(campo("imagem").options?.hotspot).toBe(true);
      expect(campo("foto").options?.hotspot).toBe(true);
    });

    it("as medidas ditas à AMI são as do carrossel aprovado", () => {
      expect(campo("imagem").description).toContain("3000 × 1288");
      expect(campo("imagemCelular").description).toContain("1080 × 1350");
    });

    it("tema começa em escuro e oferece escuro e claro", () => {
      const tema = campo("tema");
      expect(tema.initialValue).toBe("escuro");
      expect(tema.options?.list?.map((o) => o.value)).toEqual(["escuro", "claro"]);
    });

    it("cada tipo esconde os campos do outro", () => {
      const arte = { document: { tipo: "arte" } };
      const composto = { document: { tipo: "composto" } };
      for (const n of ["imagem", "imagemCelular", "tema"]) {
        expect(campo(n).hidden?.(arte), `${n} com arte`).toBe(false);
        expect(campo(n).hidden?.(composto), `${n} com composto`).toBe(true);
      }
      for (const n of ["foto", "rotulo", "titulo", "texto", "botao"]) {
        expect(campo(n).hidden?.(arte), `${n} com arte`).toBe(true);
        expect(campo(n).hidden?.(composto), `${n} com composto`).toBe(false);
      }
    });

    /* Uma regra de mentira: grava os limites e guarda as funções
       `custom` para o teste chamar com o documento que quiser. */
    /* `obrigatorio` conta quantas vezes a regra pediu `.required()`. */
    function rodar(
      validation: Campo["validation"],
      valor: unknown,
      contexto: unknown,
    ): { max: number[]; erros: unknown[]; obrigatorio: number } {
      const saida = { max: [] as number[], erros: [] as unknown[], obrigatorio: 0 };
      const regra: Record<string, unknown> = {
        required: () => (saida.obrigatorio++, regra),
        max: (n: number) => (saida.max.push(n), regra),
        custom: (f: (v: unknown, c: unknown) => unknown) => (
          saida.erros.push(f(valor, contexto)), regra
        ),
      };
      validation?.(regra, contexto);
      return saida;
    }
    const doc = (tipo?: string) => ({ document: { tipo } });

    it("o título só é obrigatório no tipo com texto, e tem até 70 letras", () => {
      expect(rodar(campo("titulo").validation, "", doc("composto")).erros).toEqual([
        "O título é obrigatório",
      ]);
      expect(rodar(campo("titulo").validation, "", doc("arte")).erros).toEqual([true]);
      expect(rodar(campo("titulo").validation, "Os médicos", doc("composto")).erros).toEqual([true]);
      expect(rodar(campo("titulo").validation, "", doc("composto")).max).toEqual([70]);
    });

    it("rótulo, texto e botão têm limite de letras", () => {
      expect(rodar(campo("rotulo").validation, "", doc("composto")).max).toEqual([40]);
      expect(rodar(campo("texto").validation, "", doc("composto")).max).toEqual([160]);
      expect(rodar(campo("botao").validation, "", doc("composto")).max).toEqual([28]);
    });

    it("a arte só é obrigatória no tipo arte (e no documento antigo, sem tipo)", () => {
      const v = campo("imagem").validation;
      expect(rodar(v, undefined, doc("arte")).erros).toEqual(["A arte é obrigatória"]);
      expect(rodar(v, undefined, doc()).erros).toEqual(["A arte é obrigatória"]);
      expect(rodar(v, undefined, doc("composto")).erros).toEqual([true]);
      expect(rodar(v, { asset: { _ref: "x" } }, doc("arte")).erros).toEqual([true]);
    });

    it("a descrição da foto só é cobrada quando há foto", () => {
      const alt = (porNome("banner").fields as unknown as { name: string; fields?: Campo[] }[])
        .find((f) => f.name === "foto")
        ?.fields?.find((f) => f.name === "alt");
      const com = { ...doc("composto"), parent: { asset: { _ref: "x" } } };
      const sem = { ...doc("composto"), parent: {} };
      expect(rodar(alt?.validation, "", com).erros).toEqual(["Descreva o que a foto mostra"]);
      expect(rodar(alt?.validation, "", sem).erros).toEqual([true]);
      expect(rodar(alt?.validation, "Diretoria reunida", com).erros).toEqual([true]);
    });

    it("banner antigo, sem tipo, mostra os campos de arte", () => {
      /* O documento que já existia não tem `tipo` gravado. */
      expect(campo("imagem").hidden?.({ document: {} })).toBe(false);
      expect(campo("titulo").hidden?.({ document: {} })).toBe(true);
    });
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
