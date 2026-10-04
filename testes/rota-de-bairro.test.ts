import { describe, expect, it, vi } from "vitest";
import type { Medico } from "@/lib/dados/tipos";

/*
  As páginas de especialidade por bairro saíram do site. O endereço antigo
  leva, com redirecionamento permanente, à página da especialidade
  (next.config.ts), e o sitemap deixou de convidar o robô para eles.
*/

function medico(id: number, especialidade: string, bairro: string): Medico {
  return {
    id,
    slug: `m${id}`,
    nome: `Médico ${id}`,
    crm: String(id),
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [{ nome: especialidade, slug: especialidade, rqe: null, principal: true }],
    locais: [
      {
        id,
        logradouro: "Rua A",
        numero: "1",
        bairro: { id: 1, nome: bairro, slug: bairro },
        telefone: null,
        whatsapp: null,
        estacionamento: false,
        acessibilidade: [],
      },
    ],
  };
}

vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => [1, 2, 3, 4].map((i) => medico(i, "cardiologia", "centro")),
}));
vi.mock("@/lib/sanity/consultas", () => ({
  caminhosDePaginasPublicadas: async () => [],
  slugsDeNoticias: async () => [],
}));

describe("o endereço antigo de especialidade por bairro", () => {
  it("vai para a página da especialidade, com redirecionamento permanente", async () => {
    const { default: config } = await import("@/next.config");
    expect(await config.redirects!()).toEqual([
      {
        source: "/medicos/:especialidade/:bairro",
        destination: "/medicos/:especialidade",
        permanent: true,
      },
    ]);
  });

  it("a página de cruzamento não existe mais", async () => {
    const { existsSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const caminho = fileURLToPath(new URL("../app/(site)/medicos/[especialidade]/[bairro]/page.tsx", import.meta.url));
    expect(existsSync(caminho)).toBe(false);
  });
});

describe("o sitemap", () => {
  it("lista a especialidade e o perfil, e nenhum endereço de especialidade por bairro", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/medicos/cardiologia"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/medico/m1"))).toBe(true);
    expect(urls.filter((u) => /\/medicos\/[^/]+\/[^/]+$/.test(u))).toEqual([]);
  });
});
