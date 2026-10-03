import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as ami from "@/lib/ami";
import { hrefTelefone } from "@/lib/ami";
import { semComentarios } from "@/testes/apoio";

describe("hrefTelefone", () => {
  it("devolve tel:+55 seguido só de dígitos, venha o número como vier", () => {
    for (const entrada of [
      "(99) 3524-3716",
      "99 3524 3716",
      "99-3524-3716",
      " (99)  98802-0205 ",
      "9935243716",
    ]) {
      expect(hrefTelefone(entrada)).toMatch(/^tel:\+55\d+$/);
    }
    expect(hrefTelefone("(99) 3524-3716")).toBe("tel:+559935243716");
    expect(hrefTelefone("(99) 98802-0205")).toBe("tel:+5599988020205");
  });

  it("o número sem o tel: não sai de lib/ami.ts", () => {
    /* Foi `telefoneParaLigar` direto num `href` que quebrou o rodapé. Sem
       export, esse erro não se repete: não há o que importar. */
    expect("telefoneParaLigar" in ami).toBe(false);
  });
});

/*
  `tel:` escrito à mão já quebrou o site: o rodapé montava o `href` sem o
  prefixo e saía `href="+5599..."`, que o navegador lê como endereço de página.
  Só `hrefTelefone`, em `lib/ami.ts`, pode escrever `tel:`.

  A varredura percorre `app/` e `components/` inteiros, qualquer arquivo de
  código, em vez de listar nomes de arquivo: uma lista exata deixa de fora o
  arquivo novo, que é justamente o que escreveria o `tel:` à mão. Os dois
  testes do fim existem para que ela não passe vazia por engano.
*/
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXTENSOES = /\.(tsx?|jsx?|mjs|cjs)$/;

function arquivosDe(pasta: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) achados.push(...arquivosDe(caminho));
    else if (EXTENSOES.test(entrada.name)) achados.push(caminho);
  }
  return achados;
}

const ARQUIVOS = [...arquivosDe(join(RAIZ, "app")), ...arquivosDe(join(RAIZ, "components"))].map(
  (c) => relative(RAIZ, c).replaceAll("\\", "/"),
);

/* Não casa dentro de outra palavra (`hotel:`), só o esquema `tel:`. */
const TEL_ESCRITO = /(?<![A-Za-z0-9])tel:/;

describe("link de telefone", () => {
  it("nenhum arquivo de app/ nem de components/ escreve `tel:` fora de hrefTelefone", () => {
    const culpados = ARQUIVOS.filter((a) =>
      TEL_ESCRITO.test(semComentarios(readFileSync(join(RAIZ, a), "utf8"))),
    );
    expect(culpados).toEqual([]);
  });

  it("a varredura enxerga os arquivos que usam o link, e muitos mais", () => {
    for (const esperado of [
      "app/(site)/contato/page.tsx",
      "app/(site)/medico/[slug]/page.tsx",
      "components/diretorio/LinhaMedico.tsx",
      "components/layout/Rodape.tsx",
    ]) {
      expect(ARQUIVOS).toContain(esperado);
    }
    expect(ARQUIVOS.length).toBeGreaterThan(20);
  });

  it("a regra reprova de verdade: vê `tel:` em código e ignora comentário", () => {
    expect(TEL_ESCRITO.test(semComentarios("const h = `tel:${x}`;"))).toBe(true);
    expect(TEL_ESCRITO.test(semComentarios('const h = "tel:+5599";'))).toBe(true);
    expect(TEL_ESCRITO.test(semComentarios("// o link `tel:` exige\nconst a = 1;"))).toBe(false);
    expect(TEL_ESCRITO.test(semComentarios('const h = "hotel:";'))).toBe(false);
  });
});
