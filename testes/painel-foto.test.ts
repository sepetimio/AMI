import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { BlocoFoto } from "@/components/painel/BlocoFoto";
import {
  BUCKET_DAS_FOTOS,
  LIMITE_DA_FOTO,
  caminhoDaFoto,
  conferirFoto,
  mensagemDoErroDeEnvio,
  tipoDaFoto,
} from "@/lib/painel/foto";
import { recorteRetrato } from "@/lib/painel/recorte";
import { fonte, semComentarios } from "@/testes/apoio";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50,
]);
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);

function comTamanho(inicio: Uint8Array, tamanho: number): Uint8Array {
  const bytes = new Uint8Array(tamanho);
  bytes.set(inicio.subarray(0, Math.min(inicio.length, tamanho)));
  return bytes;
}

describe("constantes", () => {
  it("bucket e limite", () => {
    expect(BUCKET_DAS_FOTOS).toBe("fotos-medicos");
    expect(LIMITE_DA_FOTO).toBe(900 * 1024);
  });
});

describe("tipoDaFoto", () => {
  it("reconhece JPEG", () => expect(tipoDaFoto(JPEG)).toBe("jpg"));
  it("reconhece WebP", () => expect(tipoDaFoto(WEBP)).toBe("webp"));
  it("não aceita PNG", () => expect(tipoDaFoto(PNG)).toBeNull());
  it("não aceita RIFF que não é WebP", () => {
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(tipoDaFoto(wav)).toBeNull();
  });
  it("não aceita bytes curtos demais", () => {
    expect(tipoDaFoto(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(
      tipoDaFoto(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57])),
    ).toBeNull();
  });
});

describe("conferirFoto", () => {
  it("aceita JPEG e WebP", () => {
    expect(conferirFoto(JPEG)).toEqual({ ok: true, tipo: "jpg" });
    expect(conferirFoto(WEBP)).toEqual({ ok: true, tipo: "webp" });
  });

  it("recusa foto vazia", () => {
    expect(conferirFoto(new Uint8Array(0))).toEqual({
      ok: false,
      erro: "Nenhuma foto chegou. Escolha a foto de novo.",
    });
  });

  it("aceita o limite exato e recusa um byte a mais", () => {
    expect(conferirFoto(comTamanho(JPEG, LIMITE_DA_FOTO))).toEqual({
      ok: true,
      tipo: "jpg",
    });
    expect(conferirFoto(comTamanho(JPEG, LIMITE_DA_FOTO + 1))).toEqual({
      ok: false,
      erro: "A foto passou de 900 KB. Escolha outra ou tente de novo.",
    });
  });

  it("recusa PNG", () => {
    expect(conferirFoto(PNG)).toEqual({
      ok: false,
      erro: "Formato não aceito. Use JPG, PNG ou WebP.",
    });
  });
});

describe("caminhoDaFoto", () => {
  it("monta id/data.tipo sem dois-pontos nem ponto na data", () => {
    const agora = new Date("2026-11-14T10:20:30.456Z");
    expect(caminhoDaFoto(12, "webp", agora)).toBe(
      "12/2026-11-14T10-20-30-456Z.webp",
    );
    expect(caminhoDaFoto(7, "jpg", agora)).toBe(
      "7/2026-11-14T10-20-30-456Z.jpg",
    );
  });
});

describe("mensagemDoErroDeEnvio", () => {
  it("bucket ausente", () => {
    const esperado =
      "O armazenamento de fotos ainda não foi ligado no Supabase. Veja docs/como-ligar-as-fotos.md.";
    expect(mensagemDoErroDeEnvio("Bucket not found")).toBe(esperado);
    expect(mensagemDoErroDeEnvio("xx BUCKET NOT FOUND xx")).toBe(esperado);
  });

  it("política ou sessão", () => {
    const esperado =
      "O banco não aceitou o envio. Costuma ser sessão expirada: saia e entre de novo.";
    expect(
      mensagemDoErroDeEnvio("new row violates row-level security policy"),
    ).toBe(esperado);
    expect(mensagemDoErroDeEnvio("Unauthorized")).toBe(esperado);
  });

  it("outro erro", () => {
    expect(mensagemDoErroDeEnvio("boom")).toBe(
      "Não consegui enviar a foto: boom",
    );
  });
});

describe("as ações da foto, lidas como código", () => {
  const codigo = semComentarios(
    fonte("../app/painel/medico/[id]/acoes-foto.ts"),
  );
  const corpo = (nome: string, quem = "export async function") => {
    const i = codigo.indexOf(`${quem} ${nome}`);
    expect(i, `não achei ${nome}`).toBeGreaterThan(-1);
    const prox = codigo.indexOf("async function", i + 10);
    return codigo.slice(i, prox === -1 ? undefined : prox);
  };

  it("gravarFoto: update com conferência de linha, e só depois revalida", () => {
    const c = corpo("gravarFoto", "async function");
    const upd = c.indexOf(".update(");
    expect(upd).toBeGreaterThan(c.indexOf("clienteDoPainel("));
    expect(c.indexOf(".select(")).toBeGreaterThan(upd);
    expect(c).toContain("if (!data)");
    expect(c.indexOf("if (!data)")).toBeLessThan(c.indexOf("revalidatePath("));
    for (const rota of [
      'revalidatePath("/(site)", "layout")',
      'revalidatePath("/sitemap.xml")',
      'revalidatePath("/painel")',
      "revalidatePath(`/painel/medico/${id}`)",
    ]) {
      expect(c, rota).toContain(rota);
    }
  });

  for (const nome of ["enviarFoto", "removerFoto"]) {
    it(`${nome}: a guarda vem antes de qualquer cliente e a gravação passa pelo gravarFoto`, () => {
      const c = corpo(nome);
      expect(c.indexOf("exigirAdmin(")).toBeGreaterThan(-1);
      const cli = c.indexOf("clienteDoPainel(");
      if (cli !== -1) expect(c.indexOf("exigirAdmin(")).toBeLessThan(cli);
      expect(c.indexOf("exigirAdmin(")).toBeLessThan(c.indexOf("gravarFoto("));
    });
  }

  it("enviarFoto confere a foto antes do upload e não sobrescreve", () => {
    const c = corpo("enviarFoto");
    expect(c.indexOf("conferirFoto(")).toBeGreaterThan(-1);
    expect(c.indexOf("conferirFoto(")).toBeLessThan(c.indexOf(".upload("));
    expect(c).toMatch(/upsert:\s*false/);
    expect(c).toContain('cacheControl: "31536000"');
    expect(c).toContain('tipo === "webp" ? "image/webp" : "image/jpeg"');
  });

  it("removerFoto só limpa a coluna e não envia nada", () => {
    const c = corpo("removerFoto");
    expect(c).toMatch(/gravarFoto\(id,\s*null\)/);
    expect(c).not.toContain(".upload(");
  });

  it("o arquivo não chama .remove(", () => {
    expect(codigo).not.toMatch(/\.remove\s*\(/);
  });
});

describe("recorteRetrato", () => {
  it("paisagem: corta dos lados, pelo centro", () => {
    expect(recorteRetrato(4000, 3000)).toEqual({
      sx: 800, sy: 0, sLargura: 2400, sAltura: 3000, largura: 800, altura: 1000, pequena: false,
    });
  });

  it("retrato 3:4: corta em cima e embaixo", () => {
    expect(recorteRetrato(3000, 4000)).toEqual({
      sx: 0, sy: 125, sLargura: 3000, sAltura: 3750, largura: 800, altura: 1000, pequena: false,
    });
  });

  it("800x1000 exato: sem deslocamento", () => {
    expect(recorteRetrato(800, 1000)).toEqual({
      sx: 0, sy: 0, sLargura: 800, sAltura: 1000, largura: 800, altura: 1000, pequena: false,
    });
  });

  it("foto pequena: não amplia e avisa", () => {
    expect(recorteRetrato(300, 300)).toEqual({
      sx: 30, sy: 0, sLargura: 240, sAltura: 300, largura: 240, altura: 300, pequena: true,
    });
  });

  it("400x500 exato não é pequena", () => {
    expect(recorteRetrato(400, 500).pequena).toBe(false);
    expect(recorteRetrato(399, 500).pequena).toBe(true);
  });

  it("só devolve inteiros", () => {
    const r = recorteRetrato(1001, 777);
    for (const v of Object.values(r)) if (typeof v === "number") expect(Number.isInteger(v)).toBe(true);
  });
});

describe("BlocoFoto (renderização)", () => {
  const medico = { medicoId: 7, nome: "Ana Souza" };

  it("com foto: a imagem, o Remover foto e o input com o accept exato", () => {
    const html = renderToString(
      createElement(BlocoFoto, { ...medico, foto: "https://x.test/7/a.webp" }),
    );
    expect(html).toMatch(/<img[^>]*src="https:\/\/x\.test\/7\/a\.webp"/);
    expect(html).toContain("Remover foto");
    expect(html).toContain("Escolher foto");
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).toContain("JPG, PNG ou WebP. O painel recorta no formato retrato do site, pelo centro.");
    expect(html).toContain('aria-live="polite"');
  });

  it("sem foto: as iniciais e nenhum Remover foto", () => {
    const html = renderToString(createElement(BlocoFoto, { ...medico, foto: null }));
    expect(html).toContain(">AS<");
    expect(html).not.toContain("Remover foto");
    expect(html).not.toContain("<img");
    expect(html).toContain("Escolher foto");
  });

  it("nenhum svg no bloco", () => {
    for (const foto of [null, "https://x.test/a.webp"]) {
      expect(renderToString(createElement(BlocoFoto, { ...medico, foto }))).not.toContain("<svg");
    }
  });
});

describe("a página de edição", () => {
  it("monta o BlocoFoto depois do formulário e antes das especialidades", () => {
    const pagina = fonte("../app/painel/medico/[id]/page.tsx");
    const f = pagina.indexOf("<FormularioMedico");
    const b = pagina.indexOf("<BlocoFoto");
    const e = pagina.indexOf("<BlocoEspecialidades");
    expect(f).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(f);
    expect(e).toBeGreaterThan(b);
    expect(pagina).toContain("foto={medico.foto}");
  });
});
