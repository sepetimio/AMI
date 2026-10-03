import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  Nenhuma página interna abre rolada.

  O `<html>` tem rolagem suave (app/globals.css), e o Next 16 só a desliga
  na troca de página quando o `<html>` traz `data-scroll-behavior="smooth"`.
  Sem o atributo, a volta ao topo da página nova vira animação, e os
  posicionamentos que o Next faz em seguida, um por bloco da página,
  atropelam essa animação: medido em 03/10/2026, a página parava de 186 a
  456px abaixo do topo.

  É ligação com o navegador, que não roda sem ele: aqui se lê o código. A
  medida na tela é da auditoria (scripts/auditoria-visual.js, conferência
  "abre no topo").
*/
const LAYOUT = semComentarios(fonte("../app/layout.tsx"));
const CSS = semComentarios(fonte("../app/globals.css"));
const NEXT = fonte("../node_modules/next/dist/shared/lib/router/utils/disable-smooth-scroll.js");

describe("a página nova abre no topo", () => {
  it("o html tem rolagem suave, e por isso avisa o Next", () => {
    expect(CSS).toMatch(/html\s*\{[^}]*scroll-behavior:\s*smooth/);
    expect(LAYOUT).toMatch(/<html\b[^>]*\bdata-scroll-behavior="smooth"/);
  });

  it("o Next desta versão lê exatamente esse atributo", () => {
    /* Se uma atualização do Next trocar o nome, este fica vermelho antes de
       a página voltar a abrir rolada. */
    expect(NEXT).toContain("htmlElement.dataset.scrollBehavior === 'smooth'");
    expect(NEXT).toContain("htmlElement.style.scrollBehavior = 'auto'");
  });
});
