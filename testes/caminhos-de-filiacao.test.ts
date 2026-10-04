import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/*
  Os caminhos até Seja associado fora da home.

  A página `/associacao/seja-associado` existe desde este ramo, mas `/contato`
  continuava dizendo que "a página de filiação está em preparação", sem link,
  e o índice `/associacao` não a listava. Renderiza as duas páginas de
  verdade e lê o HTML, sem clicar nem medir pixel (ver vitest.config.ts).

  `/associacao` lê o Sanity (a apresentação e as páginas publicadas), a
  diretoria e o banco; os dublês devolvem tudo vazio, o estado de hoje do
  Sanity. O fecho da página leva a Seja associado em qualquer caso.
*/

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async () => null,
  caminhosDePaginasPublicadas: async () => [],
}));
vi.mock("@/lib/dados/diretoria", () => ({ listarDiretoria: async () => [] }));
vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => [] }));
vi.mock("@/lib/dados/especialidades", () => ({ especialidadesComContagem: async () => [] }));

const { default: PaginaContato } = await import("@/app/(site)/contato/page");
const { default: PaginaAssociacao } = await import(
  "@/app/(site)/associacao/page"
);

const CONTATO = renderToString(PaginaContato());
const ASSOCIACAO = renderToString(await PaginaAssociacao());

describe("caminhos até Seja associado", () => {
  it("/contato leva à página, em vez de dizer que ela está em preparação", () => {
    expect(CONTATO).toContain('href="/associacao/seja-associado"');
    expect(CONTATO).not.toMatch(/em prepara/);
  });

  it("/associacao leva a Seja associado", () => {
    expect(ASSOCIACAO).toContain('href="/associacao/seja-associado"');
    expect(ASSOCIACAO).toContain("Seja associado");
  });
});
