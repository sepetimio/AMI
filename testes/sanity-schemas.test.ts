import { describe, expect, it } from "vitest";
import { tipos } from "@/sanity/schemas";

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
