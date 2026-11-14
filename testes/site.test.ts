import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { enderecoDoSite } from "@/lib/site";

describe("enderecoDoSite", () => {
  it("tira a barra do fim", () => {
    expect(enderecoDoSite({ NEXT_PUBLIC_SITE_URL: "https://ami.org.br/" })).toBe(
      "https://ami.org.br",
    );
  });

  it("apara os espacos", () => {
    expect(
      enderecoDoSite({ NEXT_PUBLIC_SITE_URL: "  https://ami.org.br  " }),
    ).toBe("https://ami.org.br");
  });

  it("cai no endereco da Vercel quando a variavel esta vazia", () => {
    expect(
      enderecoDoSite({
        NEXT_PUBLIC_SITE_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "site-ami.vercel.app",
      }),
    ).toBe("https://site-ami.vercel.app");
  });

  it("nao duplica o esquema do endereco da Vercel", () => {
    expect(
      enderecoDoSite({
        VERCEL_PROJECT_PRODUCTION_URL: " https://site-ami.vercel.app/ ",
      }),
    ).toBe("https://site-ami.vercel.app");
  });

  it("cai no localhost quando nao ha nada", () => {
    expect(enderecoDoSite({})).toBe("http://localhost:3000");
    expect(
      enderecoDoSite({
        NEXT_PUBLIC_SITE_URL: "  ",
        VERCEL_PROJECT_PRODUCTION_URL: " ",
      }),
    ).toBe("http://localhost:3000");
  });

  it("prefere a variavel ao endereco da Vercel", () => {
    expect(
      enderecoDoSite({
        NEXT_PUBLIC_SITE_URL: "https://ami.org.br",
        VERCEL_PROJECT_PRODUCTION_URL: "site-ami.vercel.app",
      }),
    ).toBe("https://ami.org.br");
  });
});

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

describe("o endereco do site mora em um lugar so", () => {
  it("NEXT_PUBLIC_SITE_URL so aparece em lib/site.ts", () => {
    const quem = [...arquivos("app"), ...arquivos("lib")]
      .filter((f) => readFileSync(f, "utf8").includes("NEXT_PUBLIC_SITE_URL"))
      .map((f) => f.replaceAll("\\", "/"));
    expect(quem).toEqual(["lib/site.ts"]);
  });
});
