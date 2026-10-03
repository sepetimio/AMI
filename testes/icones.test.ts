import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { fonte } from "@/testes/apoio";
import { Icone, LadrilhoIcone, type NomeIcone } from "@/components/base/Icone";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  CaretLeft,
  CaretRight,
  Eye,
  FlagBanner,
  HandHeart,
  Heartbeat,
  List,
  MagnifyingGlass,
  MapPinArea,
  Pause,
  Phone,
  Play,
  SealCheck,
  Stethoscope,
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
      mapa: MapPinArea,
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
      }
    }
    /* E os 18 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(18);
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
    const src = fonte("../components/base/Icone.tsx");
    expect(src).toContain("@phosphor-icons/react/dist/ssr");
    expect(src).not.toMatch(/import\s+\*\s+as\s+\w+\s+from\s+["']@phosphor-icons\/react/);
    expect(src).not.toMatch(/^import\s+\{[^}]*\}\s+from\s+["']@phosphor-icons\/react["']/m);
  });
});
