import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { fonte, semComentarios } from "@/testes/apoio";
import { Icone as IconeDoCliente, mapaDoCliente, type NomeIconeDoCliente } from "@/components/base/Icone";
import { Icone, LadrilhoIcone, type NomeIcone } from "@/components/base/IconeServidor";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Baby,
  Bone,
  Brain,
  Buildings,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatsCircle,
  Drop,
  DropHalf,
  Ear,
  Eye,
  FlagBanner,
  ForkKnife,
  GenderFemale,
  Hand,
  HandHeart,
  HandPalm,
  Handshake,
  Heartbeat,
  List,
  MagnifyingGlass,
  MapPin,
  Pause,
  Phone,
  Play,
  SealCheck,
  Stethoscope,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react/dist/ssr";

describe("os icones", () => {
  it("saem como SVG no servidor, sem fonte de icones", () => {
    const html = renderToString(createElement(Icone, { nome: "estetoscopio" }));
    expect(html).toMatch(/^<svg/);
  });

  it("className passa para o SVG", () => {
    const html = renderToString(createElement(Icone, { nome: "seta", className: "x" }));
    expect(html).toContain('class="x"');
  });

  it("aria-hidden no SVG do Icone", () => {
    const html = renderToString(createElement(Icone, { nome: "selo" }));
    expect(html).toContain('aria-hidden="true"');
  });

  it("o ladrilho tem aria-hidden no span externo", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo" }));
    expect(html).toContain('<span class="ladrilho-icone" aria-hidden="true">');
  });

  it("cada nome desenha o icone Phosphor dele: trocar dois de lugar fica vermelho", () => {
    /* A tabela esperada, escrita aqui de novo e não importada: comparar cada
       nome com o render do componente Phosphor que ele deve ser é o que pega
       "pausar" e "retomar" trocados entre si. Contar SVGs diferentes não
       pegava: dois trocados continuam diferentes. */
    const esperado: Record<NomeIcone, Icon> = {
      selo: SealCheck,
      estetoscopio: Stethoscope,
      batimento: Heartbeat,
      parceria: Handshake,
      bandeira: FlagBanner,
      olho: Eye,
      maoCoracao: HandHeart,
      predio: Buildings,
      lupa: MagnifyingGlass,
      seta: ArrowRight,
      setaDiagonal: ArrowUpRight,
      anterior: CaretLeft,
      proximo: CaretRight,
      pausar: Pause,
      retomar: Play,
      menu: List,
      fechar: X,
      telefone: Phone,
      whatsapp: WhatsappLogo,
      comoChegar: MapPin,
      voltar: ArrowLeft,
      abaixo: CaretDown,
      palma: HandPalm,
      meiaGota: DropHalf,
      garfoEFaca: ForkKnife,
      feminino: GenderFemale,
      cerebro: Brain,
      osso: Bone,
      orelha: Ear,
      bebe: Baby,
      conversa: ChatsCircle,
      mao: Hand,
      gota: Drop,
    };
    for (const [nome, Componente] of Object.entries(esperado) as [NomeIcone, Icon][]) {
      for (const duotone of [false, true]) {
        const nosso = renderToString(createElement(Icone, { nome, duotone }));
        const dele = renderToString(
          createElement(Componente, {
            size: 20,
            weight: duotone ? "duotone" : "regular",
            className: "",
            "aria-hidden": "true",
          }),
        );
        expect(nosso, `${nome}${duotone ? " duotone" : ""}`).toBe(dele);
        /* O `Icone` do cliente desenha igual os nomes que tem. */
        if (nome in mapaDoCliente) {
          const doCliente = renderToString(
            createElement(IconeDoCliente, { nome: nome as NomeIconeDoCliente, duotone }),
          );
          expect(doCliente, `${nome} no cliente`).toBe(dele);
        }
      }
    }
    /* E os 33 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(33);
  });

  it("duotone inclui opacity 0.2, regular nao", () => {
    const htmlDuotone = renderToString(createElement(Icone, { nome: "selo", duotone: true }));
    const htmlRegular = renderToString(createElement(Icone, { nome: "selo", duotone: false }));
    expect(htmlDuotone).toContain('opacity="0.2"');
    expect(htmlRegular).not.toContain('opacity="0.2"');
  });

  it("tamanho pequeno do ladrilho sai com width 23 e classe --pequeno", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo", pequeno: true }));
    expect(html).toContain('width="23"');
    expect(html).toContain('class="ladrilho-icone ladrilho-icone--pequeno"');
  });

  it("tamanho normal do ladrilho sai com width 28 e sem classe --pequeno", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo", pequeno: false }));
    expect(html).toContain('width="28"');
    expect(html).toContain('class="ladrilho-icone" aria-hidden="true">');
  });

  it("importa so os icones usados, pelo caminho de servidor", () => {
    for (const arquivo of ["../components/base/Icone.tsx", "../components/base/IconeServidor.tsx"]) {
      const src = fonte(arquivo);
      expect(src, arquivo).toContain("@phosphor-icons/react/dist/ssr");
      expect(src, arquivo).not.toMatch(/import\s+\*\s+as\s+\w+\s+from\s+["']@phosphor-icons\/react/);
      expect(src, arquivo).not.toMatch(/^import\s+\{[^}]*\}\s+from\s+["']@phosphor-icons\/react["']/m);
    }
  });
});

/*
  Os dois mapas de ícones (a regra está em components/base/Icone.tsx).

  Leitura de código, e não renderização: o que se trava aqui é a ligação
  entre módulos, que decide o que vai para o JavaScript do navegador.

  Um arquivo "use client" leva para o navegador tudo o que importa, e o que
  isso importa, e assim por diante. Por isso a varredura segue os imports a
  partir de cada arquivo "use client" de components/ e app/:
  - segue `import`, `export ... from` e `import()` com `@/` ou caminho
    relativo, que resolvem para um arquivo .ts ou .tsx do repositório;
  - pula `import type`, que some na compilação;
  - pacotes e CSS ficam de fora: nenhum deles importa os mapas.
*/
const RAIZ = fileURLToPath(new URL("..", import.meta.url));

function arquivosDe(pasta: string): string[] {
  return readdirSync(join(RAIZ, pasta), { recursive: true, encoding: "utf8" })
    .filter((nome) => /\.tsx?$/.test(nome))
    .map((nome) => join(RAIZ, pasta, nome));
}

function ehDeCliente(arquivo: string): boolean {
  return /^["']use client["']/.test(semComentarios(readFileSync(arquivo, "utf8")).trimStart());
}

/** Os arquivos do repositório que este importa de verdade (sem `import type`). */
function importsDe(arquivo: string): string[] {
  const codigo = semComentarios(readFileSync(arquivo, "utf8"));
  const caminhos = [
    ...codigo.matchAll(/\bimport\s+(?!type\s)(?:[\w*{}\s,$]+?\s+from\s+)?["']([^"']+)["']/g),
    ...codigo.matchAll(/\bexport\s+(?!type\s)[\w*{}\s,$]+?\s+from\s+["']([^"']+)["']/g),
    ...codigo.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  return caminhos.flatMap((caminho) => {
    const base = caminho.startsWith("@/")
      ? join(RAIZ, caminho.slice(2))
      : caminho.startsWith(".")
        ? join(dirname(arquivo), caminho)
        : null;
    if (!base) return [];
    const achado = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(
      (c) => /\.tsx?$/.test(c) && existsSync(c),
    );
    return achado ? [achado] : [];
  });
}

/** Tudo o que vai para o navegador a partir dos arquivos "use client": eles e o que importam. */
function moduloDoCliente(): Map<string, string> {
  /* arquivo -> o arquivo "use client" de onde a varredura chegou nele */
  const vistos = new Map<string, string>();
  const fila = [...arquivosDe("components"), ...arquivosDe("app")].filter(ehDeCliente);
  for (const inicio of fila) vistos.set(inicio, inicio);
  while (fila.length > 0) {
    const atual = fila.shift()!;
    for (const proximo of importsDe(atual)) {
      if (!vistos.has(proximo)) {
        vistos.set(proximo, vistos.get(atual)!);
        fila.push(proximo);
      }
    }
  }
  return vistos;
}

describe("os dois mapas de icones", () => {
  const cliente = moduloDoCliente();
  const servidor = join(RAIZ, "components", "base", "IconeServidor.tsx");

  it("a varredura acha os arquivos de cliente e segue os imports deles", () => {
    /* Sem isto, uma varredura que não achasse nada passaria sempre. */
    expect(cliente.has(join(RAIZ, "components", "layout", "BarraDoPe.tsx"))).toBe(true);
    expect(cliente.has(join(RAIZ, "components", "base", "Icone.tsx"))).toBe(true);
    expect(cliente.has(join(RAIZ, "lib", "barra-do-pe.ts"))).toBe(true);
  });

  it("nenhum arquivo de cliente, nem o que ele importa, chega ao mapa de servidor", () => {
    const origem = cliente.get(servidor);
    expect(origem && relative(RAIZ, origem), "arquivo de cliente que chega a IconeServidor.tsx").toBeUndefined();
  });

  it("o mapa do cliente so tem icones que o cliente desenha", () => {
    /* Só o atributo `nome` de um `<Icone>`: `nome="x"`, ou os textos entre
       aspas de `nome={…}` (os dois lados de um ternário). Procurar "x" em
       todo o código casava com nomes de campo do painel e do importador
       ("telefone", "whatsapp"), e um ícone sobrando no mapa passava. */
    const codigo = [...cliente.keys()]
      .filter((arquivo) => arquivo !== join(RAIZ, "components", "base", "Icone.tsx"))
      .map((arquivo) => semComentarios(readFileSync(arquivo, "utf8")))
      .join("\n");
    const desenhados = new Set<string>();
    for (const m of codigo.matchAll(/<Icone\b[^>]*?\bnome=(?:"([^"]*)"|\{([^{}]*)\})/g)) {
      if (m[1] !== undefined) desenhados.add(m[1]);
      for (const literal of (m[2] ?? "").matchAll(/"([^"]*)"/g)) desenhados.add(literal[1]);
    }
    const semUso = Object.keys(mapaDoCliente).filter((nome) => !desenhados.has(nome));
    expect(semUso, "nomes do mapa do cliente que nenhum <Icone> de cliente desenha").toEqual([]);
  });
});
