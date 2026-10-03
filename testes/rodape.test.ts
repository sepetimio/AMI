import { afterEach, describe, expect, it, vi } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";
import { renderizar } from "@/testes/renderizar";
import estilos from "@/components/layout/Rodape.module.css";
import { AMI, hrefTelefone } from "@/lib/ami";
import {
  ROLAGEM_SEM_CARROSSEL,
  destinoDaBusca,
  deveMostrarBarra,
  passouDoTopo,
} from "@/lib/barra-do-pe";

/* O menu do cabeçalho lê o caminho; aqui não há roteador (testes/renderizar.ts). */
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

const BARRA = semComentarios(fonte("../components/layout/BarraDoPe.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));
const LF = (css: string) => css.replaceAll("\r\n", "\n");
const CSS_ROD = LF(fonte("../components/layout/Rodape.module.css"));
const CSS_BARRA = LF(fonte("../components/layout/BarraDoPe.module.css"));

/* O corpo de uma regra `seletor { ... }` de um CSS, para a asserção olhar a
   regra certa e não o arquivo todo. */
function regra(css: string, seletor: string): string {
  const ini = css.indexOf(`${seletor} {`);
  expect(ini, `falta a regra ${seletor}`).toBeGreaterThan(-1);
  return css.slice(ini, css.indexOf("}", ini));
}

/* Tudo o que vem depois de `@media (max-width: 700px) {` até o fim do
   arquivo: nos dois CSS esse é o último bloco, e o que está dentro vale só
   no celular. */
function noCelular(css: string): string {
  const ini = css.indexOf("@media (max-width: 700px) {");
  expect(ini, "falta o @media (max-width: 700px)").toBeGreaterThan(-1);
  return css.slice(ini);
}

/* O que é componente se confere no HTML de servidor; o que é CSS, lendo o
   arquivo (só o navegador o aplica). */
describe("o rodape renderizado", () => {
  /* O trecho de uma navegação do rodapé, pelo atributo que a abre. */
  function trecho(html: string, abre: string): string {
    const ini = html.indexOf(abre);
    expect(ini, `falta ${abre}`).toBeGreaterThan(-1);
    return html.slice(ini, html.indexOf("</nav>", ini));
  }

  /* Os links de um trecho, como [texto, destino]. */
  function links(html: string): string[][] {
    return [...html.matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => [m[2], m[1]]);
  }

  it("tem as tres colunas do desenho, cada uma com o titulo dela", async () => {
    const { rodape } = await renderizar("true");
    const titulos = [...rodape.matchAll(/<h2 [^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);
    expect(titulos).toEqual(["A Associação", "Encontre um médico", "Fale com a AMI"]);
  });

  it("le endereco, telefones, CNPJ e Instagram de lib/ami.ts, nao escreve a mao", async () => {
    /* Troca os dados de lib/ami.ts por outros: o rodapé precisa mostrar os
       trocados, e nenhum dos de verdade. */
    vi.doMock("@/lib/ami", async (original) => {
      const real = await original<typeof import("@/lib/ami")>();
      return {
        ...real,
        AMI: {
          ...real.AMI,
          cnpj: "11.222.333/0001-44",
          telefones: ["(11) 2222-3333"],
          endereco: { ...real.AMI.endereco, logradouro: "Rua de Teste", numero: "7", cep: "12345-678" },
          redes: { ...real.AMI.redes, instagram: "https://exemplo.test/instagram" },
        },
      };
    });
    try {
      const { rodape } = await renderizar("true");
      expect(rodape).toContain("CNPJ <!-- -->11.222.333/0001-44");
      expect(rodape).toContain("Rua de Teste<!-- -->, <!-- -->7");
      expect(rodape).toContain("CEP <!-- -->12345-678");
      expect(rodape).toContain(
        `<a href="${hrefTelefone("(11) 2222-3333")}" class="numero-tabular">(11) 2222-3333</a>`,
      );
      expect(rodape).toContain('href="https://exemplo.test/instagram"');
      for (const deVerdade of [AMI.cnpj, ...AMI.telefones, AMI.endereco.cep, AMI.redes.instagram]) {
        expect(rodape, deVerdade).not.toContain(deVerdade);
      }
    } finally {
      vi.doUnmock("@/lib/ami");
    }
  });

  it("os contatos ligam de verdade: telefone, Instagram e CEP", async () => {
    const { rodape } = await renderizar("true");
    for (const t of AMI.telefones) {
      expect(rodape).toContain(`<a href="${hrefTelefone(t)}" class="numero-tabular">${t}</a>`);
    }
    expect(rodape).toMatch(new RegExp(`<a href="${AMI.redes.instagram}" class="[^"]+">Instagram</a>`));
    expect(rodape).toContain(`CEP <!-- -->${AMI.endereco.cep}`);
  });

  it("o aviso de demonstracao sai so com a chave; o informativo sai sempre", async () => {
    const comChave = (await renderizar("true")).rodape;
    const semChave = (await renderizar("false")).rodape;
    expect(comChave).toContain("Os dados de profissionais exibidos são fictícios");
    expect(semChave).not.toContain("fictícios");
    for (const r of [comChave, semChave]) {
      expect(r).toContain("O conteúdo deste site é informativo e não substitui a consulta");
    }
  });

  it("os links das colunas, com seus destinos, nesta ordem", async () => {
    const { rodape } = await renderizar("true");
    expect([
      ...links(trecho(rodape, 'aria-labelledby="rodape-associacao"')),
      ...links(trecho(rodape, 'aria-labelledby="rodape-medicos"')),
    ]).toEqual([
      ["Quem somos", "/associacao"],
      ["Diretoria", "/associacao/diretoria"],
      ["Notícias", "/noticias"],
      ["Seja associado", "/associacao/seja-associado"],
      ["Sua AMI", "/#sua-ami"],
      ["Buscar", "/busca"],
      ["Especialidades", "/medicos"],
      ["Bairros", "/busca"],
    ]);
  });

  it("os tres links legais, com seus destinos, nesta ordem", async () => {
    const { rodape } = await renderizar("true");
    expect(links(trecho(rodape, 'aria-label="Informações legais"'))).toEqual([
      ["Política de privacidade", "/politica-de-privacidade"],
      ["Termos de uso", "/termos-de-uso"],
      ["Política de cookies", "/politica-de-cookies"],
    ]);
  });

  it("as listas longas de especialidades e bairros sairam: so os links contados", async () => {
    /* 8 nas colunas, os telefones, o Instagram e 3 legais. Uma lista de
       especialidades ou de bairros de volta passaria desse número. */
    const { rodape } = await renderizar("true");
    expect(links(rodape)).toHaveLength(8 + AMI.telefones.length + 1 + 3);
    expect(rodape).toContain('href="/medicos"');
  });

  it("tem a textura do verde, e a luz que passeia e enfeite fora da arvore de acessibilidade", async () => {
    const { rodape } = await renderizar("true");
    expect(rodape).toMatch(new RegExp(`^<footer class="textura-verde ${estilos.rodape}">`));
    expect(rodape).toContain(`<div class="brilho ${estilos.luz}" aria-hidden="true"></div>`);
  });

  it("CNPJ e telefones na fonte do texto, com algarismos tabulares, nao na monoespacada", async () => {
    /* A spec (seção 4) deixa a monoespaçada só no registro do médico; no
       desenho, CNPJ e telefones são `.num`, algarismos tabulares. */
    const { rodape } = await renderizar("true");
    expect(rodape).not.toContain("registro");
    expect(rodape).toContain(`<div class="numero-tabular ${estilos.cnpj}">CNPJ <!-- -->${AMI.cnpj}</div>`);
    const telefones = [...rodape.matchAll(/<a href="tel:[^"]+" class="([^"]*)">/g)].map((m) => m[1]);
    expect(telefones.length).toBeGreaterThan(0);
    for (const classe of telefones) expect(classe).toBe("numero-tabular");
  });
});

describe("o CSS do rodape", () => {
  it("emenda no bloco de cima com a regua de ritmo", () => {
    expect(regra(CSS_ROD, ".rodape")).toMatch(/margin-top:\s*var\(--ritmo\)/);
  });

  it("emenda sem espaco so quando a pagina termina numa faixa de ponta a ponta", () => {
    /* Regra de CSS: quem a aplica é o navegador, e os dois casos (termina
       em faixa, não termina) a auditoria visual mede na tela
       (scripts/auditoria-visual.js, `ultimoAoRodape`). Aqui
       se confere que ela existe, com o seletor que pergunta pelo ÚLTIMO
       bloco, e não por qualquer faixa da página. Que as faixas levam a
       marca, e qual bloco fecha a home, está em
       testes/home-renderizada.test.ts. */
    const sel =
      ":global(main):has(> [data-faixa]:last-child, > :last-child > [data-faixa]:last-child) + .rodape";
    expect(regra(CSS_ROD, sel)).toMatch(/margin-top:\s*0;/);
  });

  it("no celular deixa 100px mais a area segura embaixo, para a barra nao cobrir o fim", () => {
    expect(regra(noCelular(CSS_ROD), ".rodape")).toMatch(
      /padding:\s*44px 0 calc\(100px \+ env\(safe-area-inset-bottom\)\)/,
    );
  });

  it("passar o mouse nos links deixa branco, nao verde", () => {
    const r = regra(CSS_ROD, ".coluna a:hover,\n.base a:hover");
    expect(r).toContain("var(--color-white)");
    expect(r).not.toMatch(/lima|green/);
  });

  it("nao ha cor em codigo hexadecimal: so tokens e branco translucido", () => {
    expect(CSS_ROD).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  /*
    A cor do texto do corpo é 92% de branco, e NÃO os 82% do desenho aprovado.
    Foi decisão: a luz do canto passa por baixo do texto, e no ponto mais claro
    do fundo 82% dava 4,04:1 (abaixo dos 4,5:1 do AA) e 92% dá 4,60:1, calculado
    à mão. Quem quiser voltar aos 82% do desenho precisa medir de novo antes de
    mexer neste número; o texto de baixo (`.base`, 70%) tem a mesma amarra.
  */
  it("o texto do corpo e branco a 92%, nao 82%, por contraste", () => {
    expect(regra(CSS_ROD, ".rodape")).toMatch(/color:\s*rgba\(255, 255, 255, 0\.92\)/);
    expect(regra(CSS_ROD, ".base")).toMatch(/color:\s*rgba\(255, 255, 255, 0\.7\)/);
  });
});

describe("a barra do pe", () => {
  it("existe em todas as paginas publicas, depois do rodape", () => {
    expect(LAYOUT).toContain("<BarraDoPe");
    expect(LAYOUT.indexOf("<BarraDoPe")).toBeGreaterThan(LAYOUT.indexOf("<Rodape"));
  });

  it("leva a busca da home na home e a /busca fora dela", () => {
    expect(BARRA).toContain('href="#encontre"');
    expect(BARRA).toContain('href="/busca"');
    expect(BARRA).toContain('destino === "#encontre"');
    expect(destinoDaBusca("/")).toBe("#encontre");
    expect(destinoDaBusca("/medicos")).toBe("/busca");
    expect(destinoDaBusca("/busca")).toBe("/busca");
    expect(destinoDaBusca("/noticias/uma-materia")).toBe("/busca");
  });

  it("liga pelo telefone de lib/ami.ts", () => {
    expect(BARRA).toContain("hrefTelefone");
    expect(BARRA).toContain("AMI.telefones[0]");
  });

  it("depois do pulo, foca o campo de busca, 600ms depois", () => {
    expect(BARRA).toMatch(/ESPERA_DO_PULO_MS = 600/);
    expect(BARRA).toContain("#encontre input");
    expect(BARRA).toMatch(/\.focus\(\{ preventScroll: true \}\)/);
  });

  it("some enquanto a busca esta na tela: observador com limiar de 20%", () => {
    expect(BARRA).toContain("IntersectionObserver");
    expect(BARRA).toMatch(/threshold: 0\.2/);
  });

  it("aceita a ausencia do carrossel e do bloco de busca", () => {
    expect(BARRA).toContain('[data-bloco="carrossel"]');
    expect(BARRA).toMatch(/carrossel \? carrossel\.getBoundingClientRect\(\)\.bottom : null/);
    expect(BARRA).toMatch(/blocoDeBusca\s*\? new IntersectionObserver/);
  });

  it("desfaz o observador e o ouvinte de rolagem ao sair", () => {
    expect(BARRA).toContain("observador?.disconnect()");
    expect(BARRA).toMatch(/removeEventListener\("scroll", atualizar\)/);
  });

  it("o observador le a entrada, e a decisao recebe o que ele leu", () => {
    expect(BARRA).toContain("buscaNaTela = entradas[0].isIntersecting");
    expect(BARRA).toContain("deveMostrarBarra(passou, buscaNaTela)");
    expect(BARRA).toContain("observador?.observe(blocoDeBusca!)");
  });

  it("a classe que mostra a barra e posta quando ela deve aparecer", () => {
    expect(BARRA).toContain("visivel ? styles.visivel");
  });

  it("o ouvinte de rolagem entra e sai em par", () => {
    expect(BARRA).toContain('window.addEventListener("scroll", atualizar, { passive: true })');
    expect(BARRA).toContain('window.removeEventListener("scroll", atualizar)');
  });

  it("o toque na home foca o campo", () => {
    expect(BARRA).toContain("onClick={focarOCampo}");
  });

  it("o efeito se refaz a cada pagina: o layout persiste entre elas", () => {
    expect(BARRA).toMatch(/\},\s*\[caminho\]\);/);
  });

  it("o link de ligar diz para quem liga", () => {
    expect(BARRA).toContain('aria-label="Ligar para a AMI"');
  });

  it("escondida some so depois da animacao; ao aparecer, na hora", () => {
    expect(regra(noCelular(CSS_BARRA), ".barra")).toMatch(/visibility 0s linear 0\.45s/);
    expect(regra(noCelular(CSS_BARRA), ".visivel")).toMatch(/transition-delay:\s*0s/);
  });

  it("e um nav com nome, para o leitor de tela", () => {
    expect(BARRA).toMatch(/<nav\s+aria-label="Atalhos"/);
  });

  it("so existe abaixo de 700px", () => {
    expect(regra(CSS_BARRA, ".barra")).toMatch(/display:\s*none/);
    expect(regra(noCelular(CSS_BARRA), ".barra")).toMatch(/display:\s*flex/);
  });

  it("respeita a area segura do aparelho", () => {
    expect(regra(noCelular(CSS_BARRA), ".barra")).toMatch(
      /bottom:\s*calc\(12px \+ env\(safe-area-inset-bottom\)\)/,
    );
  });

  it("escondida, nao recebe foco do teclado", () => {
    const r = regra(noCelular(CSS_BARRA), ".barra");
    expect(r).toMatch(/transform:\s*translateY\(150%\)/);
    expect(r).toMatch(/visibility:\s*hidden/);
    expect(regra(noCelular(CSS_BARRA), ".visivel")).toMatch(/visibility:\s*visible/);
  });

  it("nao ha cor em codigo hexadecimal: so tokens e branco translucido", () => {
    expect(CSS_BARRA).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("quando a barra do pe aparece", () => {
  it("sem carrossel, depois de 600px de rolagem", () => {
    expect(ROLAGEM_SEM_CARROSSEL).toBe(600);
    expect(passouDoTopo(null, 0)).toBe(false);
    expect(passouDoTopo(null, 600)).toBe(false);
    expect(passouDoTopo(null, 601)).toBe(true);
  });

  it("com carrossel, quando o fundo dele sobe acima do topo da janela", () => {
    expect(passouDoTopo(300, 5000)).toBe(false);
    expect(passouDoTopo(0, 5000)).toBe(false);
    expect(passouDoTopo(-1, 0)).toBe(true);
  });

  it("some enquanto a busca esta na tela, mesmo depois de passar do topo", () => {
    expect(deveMostrarBarra(true, false)).toBe(true);
    expect(deveMostrarBarra(true, true)).toBe(false);
    expect(deveMostrarBarra(false, false)).toBe(false);
    expect(deveMostrarBarra(false, true)).toBe(false);
  });
});
