import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { AMI, anosDeAmi } from "@/lib/ami";
import { DURACAO_DO_CONTADOR, easeOutCubic, iniciarContagem, valorNoInstante } from "@/lib/contador";
import { NumerosDaAmi } from "@/components/home/NumerosDaAmi";
import { EncontreUmMedico } from "@/components/home/EncontreUmMedico";
import estilosNum from "@/components/home/NumerosDaAmi.module.css";
import estilosBusca from "@/components/home/EncontreUmMedico.module.css";
import { SINONIMOS, normalizar } from "@/lib/dados/sinonimos";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  Os números da AMI e o bloco "Encontre um médico", medidos no HTML de
  servidor (`renderToString`) e, na lógica, por função pura.

  Duas coisas aqui só se leem do código-fonte, porque só existem no
  navegador: a ligação do `Contador` com o `IntersectionObserver` e a
  preferência de menos movimento, e o CSS (quem aplica é o navegador). Nesses
  casos o teste lê o arquivo, regra por regra.
*/

const CSS_NUM = fonte("../components/home/NumerosDaAmi.module.css");
const CSS_BUSCA = fonte("../components/home/EncontreUmMedico.module.css");
const CSS_GLOBAL = fonte("../app/globals.css");
const CSS_ROD = fonte("../components/layout/Rodape.module.css");
const CONTADOR = semComentarios(fonte("../components/home/Contador.tsx"));

/* Sem comentários de CSS, para a prosa que explica uma regra não casar com a
   asserção que a procura. */
const semNotas = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/* O conteúdo entre as chaves de um bloco que começa com `abre` (um @media),
   contando chaves, para pegar o bloco inteiro e só ele. */
function bloco(css: string, abre: string): string {
  const ini = css.indexOf(`${abre} {`);
  expect(ini, `falta o bloco ${abre}`).toBeGreaterThan(-1);
  let nivel = 0;
  for (let i = css.indexOf("{", ini); i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}" && --nivel === 0) return css.slice(css.indexOf("{", ini) + 1, i);
  }
  throw new Error(`bloco ${abre} sem fim`);
}

/* Todos os blocos que começam com `abre`, juntos: em globals.css há mais de
   um @media de 700px. */
function blocos(css: string, abre: string): string {
  const partes: string[] = [];
  for (let i = css.indexOf(`${abre} {`); i > -1; i = css.indexOf(`${abre} {`, i + 1)) {
    partes.push(bloco(css.slice(i), abre));
  }
  return partes.join("\n");
}

/* O corpo de uma regra `seletor { ... }`, com o seletor exato começando a
   linha (o de várias linhas vai com a quebra e o recuo), para a asserção
   olhar a regra certa e não o arquivo todo. */
function regra(css: string, seletor: string): string {
  const alvo = `${seletor} {`;
  for (let k = css.indexOf(alvo); k > -1; k = css.indexOf(alvo, k + 1)) {
    if (css.slice(css.lastIndexOf("\n", k - 1) + 1, k).trim() === "") {
      return css.slice(k, css.indexOf("}", k));
    }
  }
  throw new Error(`falta a regra ${seletor}`);
}

/* O CSS fora de qualquer @media: o que vale no computador. */
function base(css: string): string {
  let saida = "";
  let i = 0;
  while (i < css.length) {
    const m = css.indexOf("@media", i);
    if (m === -1) return saida + css.slice(i);
    saida += css.slice(i, m);
    let nivel = 0;
    let j = css.indexOf("{", m);
    for (; j < css.length; j++) {
      if (css[j] === "{") nivel++;
      if (css[j] === "}" && --nivel === 0) break;
    }
    i = j + 1;
  }
  return saida;
}

describe("anos de AMI", () => {
  it("e calculado do ano de fundacao, nao escrito a mao", () => {
    expect(anosDeAmi(new Date("2026-10-03T12:00:00-03:00"))).toBe(51);
    expect(anosDeAmi(new Date("2030-01-02T12:00:00-03:00"))).toBe(55);
  });

  it("conta o ano pelo relogio de Imperatriz, nao pelo do servidor", () => {
    /* 22h do dia 31 em Imperatriz já é dia 1º em UTC. */
    expect(anosDeAmi(new Date("2026-12-31T22:00:00-03:00"))).toBe(51);
    expect(anosDeAmi(new Date("2027-01-01T00:30:00-03:00"))).toBe(52);
  });
});

describe("a conta do contador", () => {
  it("dura 1,4s e usa a curva easeOutCubic", () => {
    expect(DURACAO_DO_CONTADOR).toBe(1400);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("comeca em 0, termina no valor final e fica nele", () => {
    expect(valorNoInstante(51, 0)).toBe(0);
    expect(valorNoInstante(51, -50)).toBe(0);
    expect(valorNoInstante(51, 1400)).toBe(51);
    expect(valorNoInstante(51, 5000)).toBe(51);
  });

  it("no meio, o valor da curva arredondado para inteiro", () => {
    /* 51 × 0,875 = 44,625 → 45; 24 × (1 − 0,75³) = 13,875 → 14. */
    expect(valorNoInstante(51, 700)).toBe(45);
    expect(valorNoInstante(24, 350)).toBe(14);
    for (let t = 0; t <= 1400; t += 70) {
      expect(Number.isInteger(valorNoInstante(8, t)), `t=${t}`).toBe(true);
    }
  });
});

/*
  Um relógio falso para o laço do contador: `agendar` guarda o passo, e
  `quadro()` roda o pendente 16ms depois do anterior, como uma tela de 60Hz.
*/
function relogioFalso() {
  let agora = 1000;
  let proximoId = 0;
  const fila = new Map<number, (t: number) => void>();
  const mostrados: (number | null)[] = [];
  return {
    mostrados,
    fila,
    agora: () => agora,
    agendar: (passo: (t: number) => void) => {
      fila.set(++proximoId, passo);
      return proximoId;
    },
    cancelar: (id: number) => {
      fila.delete(id);
    },
    mostrar: (q: number | null) => {
      mostrados.push(q);
    },
    /* Roda o quadro pendente; devolve false se não havia nenhum. */
    quadro() {
      const [id, passo] = [...fila][0] ?? [];
      if (id === undefined || !passo) return false;
      fila.delete(id);
      agora += 16;
      passo(agora);
      return true;
    },
  };
}

describe("o laco do contador", () => {
  it("mostra 0, depois a curva, e no fim devolve a tela ao valor (null)", () => {
    const r = relogioFalso();
    iniciarContagem({ valor: 51, ...r });
    expect(r.mostrados).toEqual([0]);
    while (r.quadro());
    expect(r.mostrados.at(-1)).toBeNull();
    const curva = r.mostrados.slice(1, -1) as number[];
    expect(curva.length).toBeGreaterThan(10);
    for (let i = 1; i < curva.length; i++) expect(curva[i]).toBeGreaterThanOrEqual(curva[i - 1]);
    expect(curva[0]).toBe(valorNoInstante(51, 16));
    expect(curva).toContain(45);
  });

  it("agenda quadros ate 1,4s e para", () => {
    const r = relogioFalso();
    iniciarContagem({ valor: 24, ...r });
    let quadros = 0;
    while (r.quadro()) quadros++;
    /* 1400 / 16 = 87,5: 87 quadros mostram a curva, o 88º encerra. */
    expect(quadros).toBe(88);
    expect(r.fila.size).toBe(0);
  });

  it("a funcao devolvida cancela tudo, e nada aparece depois dela", () => {
    const r = relogioFalso();
    const parar = iniciarContagem({ valor: 14, ...r });
    r.quadro();
    r.quadro();
    const antes = r.mostrados.length;
    parar();
    expect(r.fila.size).toBe(0);
    expect(r.quadro()).toBe(false);
    expect(r.mostrados.length).toBe(antes);
  });

  it("um passo ja na fila quando a contagem para nao mostra nada", () => {
    /* Cancelar falha em silêncio se o navegador já tirou o quadro da fila. */
    const r = relogioFalso();
    const parar = iniciarContagem({ valor: 14, ...r });
    const [, passo] = [...r.fila][0];
    parar();
    const antes = r.mostrados.length;
    passo(1100);
    expect(r.mostrados.length).toBe(antes);
  });
});

describe("o contador ligado ao navegador", () => {
  /* A ligação com o IntersectionObserver e o matchMedia só existe no
     navegador; aqui ela é lida do código, trecho por trecho. */
  it("so comeca a contar quando o numero esta na tela, e desliga o observador", () => {
    expect(CONTADOR).toMatch(
      /\(entradas\) => \{\s*if \(!entradas\.some\(\(e\) => e\.isIntersecting\)\) return;\s*observador\.disconnect\(\);\s*parar = iniciarContagem\(\{/,
    );
    expect(CONTADOR).toMatch(/observador\.observe\(el\);/);
  });

  it("o relogio e o agendador sao os do navegador", () => {
    expect(CONTADOR).toMatch(/agora: \(\) => performance\.now\(\),/);
    expect(CONTADOR).toMatch(/agendar: \(passo\) => requestAnimationFrame\(passo\),/);
    expect(CONTADOR).toMatch(/cancelar: \(id\) => cancelAnimationFrame\(id\),/);
    expect(CONTADOR).toMatch(/mostrar: setQuadroAtual,/);
  });

  it("a limpeza desliga o observador e para a contagem", () => {
    expect(CONTADOR).toMatch(/return \(\) => \{\s*observador\.disconnect\(\);\s*parar\(\);\s*setQuadroAtual\(null\);\s*\};/);
  });

  it("quem pede menos movimento ve o numero parado", () => {
    expect(CONTADOR).toMatch(
      /if \(window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches \|\| valor <= 0\) return;/,
    );
  });
});

describe("os numeros", () => {
  const html = renderToString(createElement(NumerosDaAmi, { anos: 51, medicos: 24, especialidades: 14, parceiras: null }));
  it("saem com o valor final no HTML (sem JavaScript, o numero certo ja esta la)", () => {
    for (const n of ["51", "24", "14"]) expect(html).toContain(`>${n}<`);
  });
  it("com os rotulos aprovados", () => {
    for (const r of ["anos de AMI", "médicos no diretório", "especialidades"]) expect(html).toContain(r);
  });
  it("marca o bloco para a auditoria", () => {
    expect(html).toContain('data-bloco="numeros"');
  });

  it("cada numero com seu rotulo, nesta ordem", () => {
    const par = new RegExp(
      `<div class="${estilosNum.grande}"><span>(\\d+)</span></div><div class="${estilosNum.rotulo}">([^<]+)<`,
      "g",
    );
    const pares = [...html.matchAll(par)].map((m) => [m[1], m[2]]);
    expect(pares).toEqual([
      ["51", "anos de AMI"],
      ["24", "médicos no diretório"],
      ["14", "especialidades"],
    ]);
  });

  it("os tres botoes, com seus destinos, nesta ordem", () => {
    const botoes = [...html.matchAll(/<a class="botao-linha" href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[2], m[1]]);
    expect(botoes).toEqual([
      ["Conheça a história", "/associacao"],
      ["Ver os médicos", "/busca"],
      ["Ver especialidades", "/medicos"],
    ]);
  });

  it("nenhum ladrilho nem icone: cada coluna abre com o numero", () => {
    expect(html).not.toContain("ladrilho-icone");
    expect(html).not.toContain("<svg");
    const abertura = new RegExp(`<div class="${estilosNum.numero}"><div class="${estilosNum.grande}">`, "g");
    expect(html.match(abertura)).toHaveLength(3);
  });

  it("o ano de fundacao vem de lib/ami.ts, e nenhum bairro aparece", () => {
    expect(html).toContain(`Em atividade desde ${AMI.fundadaEm}, reunindo`);
    expect(html).not.toMatch(/bairro/i);
  });

  it("o ano do texto muda junto com o de lib/ami.ts", async () => {
    /* Com o ano de fundação trocado no módulo, o texto tem de acompanhar: um
       "1975" escrito à mão no componente não passaria aqui. */
    vi.resetModules();
    vi.doMock("@/lib/ami", async (original) => {
      const real = await original<typeof import("@/lib/ami")>();
      return { ...real, AMI: { ...real.AMI, fundadaEm: "1999" } };
    });
    try {
      const { NumerosDaAmi: ComOutroAno } = await import("@/components/home/NumerosDaAmi");
      const h = renderToString(createElement(ComOutroAno, { anos: 1, medicos: 1, especialidades: 1, parceiras: null }));
      expect(h).toContain("Em atividade desde 1999, reunindo");
    } finally {
      vi.doUnmock("@/lib/ami");
      vi.resetModules();
    }
  });

  it("nenhum texto de apoio nomeia especialidade: elas vem do banco", () => {
    /* Só letras e espaços, sem acento nem caixa: "Urologia," e "urologia"
       viram a mesma palavra. A lista de nomes é a do vocabulário do site
       (lib/dados/sinonimos.ts): o formal, o singular e o plural. */
    const palavras = (s: string) => ` ${normalizar(s).replace(/[^a-z0-9]+/g, " ")} `;
    const texto = palavras(html.replace(/<[^>]+>/g, " "));
    for (const s of SINONIMOS) {
      for (const nome of [s.especialidade, s.singular, s.plural]) {
        expect(texto, nome).not.toContain(palavras(nome));
      }
    }
    expect(html).toContain("As especialidades com mais médicos no diretório da AMI.");
  });

  it("no singular quando o banco devolve um", () => {
    const um = renderToString(createElement(NumerosDaAmi, { anos: 51, medicos: 1, especialidades: 1, parceiras: null }));
    const rotulos = [...um.matchAll(new RegExp(`<div class="${estilosNum.rotulo}">([^<]+)<`, "g"))].map((m) => m[1]);
    expect(rotulos).toEqual(["anos de AMI", "médico no diretório", "especialidade"]);
  });

  it("sem parceiras, sao tres, e o contêiner diz isso", () => {
    expect(html).toMatch(/<section data-bloco="numeros" data-quantos="3" /);
    expect(html.match(new RegExp(`class="${estilosNum.numero}"`, "g"))).toHaveLength(3);
    expect(html).not.toContain("parceira");
  });
});

describe("os numeros com as empresas parceiras", () => {
  const html = renderToString(
    createElement(NumerosDaAmi, { anos: 51, medicos: 24, especialidades: 14, parceiras: 6 }),
  );

  it("sao quatro, e o contêiner diz isso", () => {
    expect(html).toMatch(/<section data-bloco="numeros" data-quantos="4" /);
    expect(html.match(new RegExp(`class="${estilosNum.numero}"`, "g"))).toHaveLength(4);
  });

  it("o quarto e o das parceiras, com o valor dado, depois dos outros tres", () => {
    const par = new RegExp(
      `<div class="${estilosNum.grande}"><span>(\\d+)</span></div><div class="${estilosNum.rotulo}">([^<]+)<`,
      "g",
    );
    expect([...html.matchAll(par)].map((m) => [m[1], m[2]])).toEqual([
      ["51", "anos de AMI"],
      ["24", "médicos no diretório"],
      ["14", "especialidades"],
      ["6", "empresas parceiras"],
    ]);
  });

  it("o apoio nao promete beneficio, e o botao leva a faixa dos parceiros", () => {
    expect(html).toContain(`<p class="${estilosNum.apoio}">Empresas que caminham com a AMI.</p>`);
    const botoes = [...html.matchAll(/<a class="botao-linha" href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[2], m[1]]);
    expect(botoes.at(-1)).toEqual(["Ver parceiras", "/#parceiros"]);
    expect(botoes).toHaveLength(4);
  });

  it("o quarto tambem sem ladrilho nem icone: abre com o numero", () => {
    expect(html).not.toContain("ladrilho-icone");
    expect(html).not.toContain("<svg");
    const abertura = new RegExp(`<div class="${estilosNum.numero}"><div class="${estilosNum.grande}">`, "g");
    expect(html.match(abertura)).toHaveLength(4);
  });

  it("no singular com uma", () => {
    const uma = renderToString(
      createElement(NumerosDaAmi, { anos: 51, medicos: 24, especialidades: 14, parceiras: 1 }),
    );
    const rotulos = [...uma.matchAll(new RegExp(`<div class="${estilosNum.rotulo}">([^<]+)<`, "g"))].map((m) => m[1]);
    expect(rotulos.at(-1)).toBe("empresa parceira");
  });

  it("zero parceiras conta como falta: tres numeros, sem 0 empresas parceiras", () => {
    /* `moldurasDaHome` nunca manda 0 (sem cadastro, manda 6 ou null), mas,
       se mandar, o componente não desenha "0 empresas parceiras". */
    const zero = renderToString(
      createElement(NumerosDaAmi, { anos: 51, medicos: 24, especialidades: 14, parceiras: 0 }),
    );
    const nulo = renderToString(
      createElement(NumerosDaAmi, { anos: 51, medicos: 24, especialidades: 14, parceiras: null }),
    );
    expect(zero).toBe(nulo);
    expect(zero).toContain('data-quantos="3"');
    expect(zero).not.toContain("parceira");
  });
});

describe("o CSS dos numeros", () => {
  const css = semNotas(CSS_NUM);

  it("no computador, tres colunas com fio entre elas e os botoes no pe da coluna", () => {
    expect(regra(base(css), ".numeros")).toMatch(/grid-template-columns:\s*repeat\(3, 1fr\)/);
    expect(regra(base(css), ".numero")).toMatch(/border-left:\s*1px solid var\(--color-line-strong\)/);
    expect(regra(base(css), ".numero :global(.botao-linha)")).toMatch(/margin-top:\s*auto/);
  });

  it("sem caixa: nenhum fundo nem sombra no bloco do computador", () => {
    expect(regra(base(css), ".numeros")).not.toMatch(/background|box-shadow/);
    expect(regra(base(css), ".numero")).not.toMatch(/background|box-shadow/);
  });

  it("com quatro, quatro colunas no computador, como no desenho", () => {
    expect(regra(base(css), '.numeros[data-quantos="4"]')).toMatch(/grid-template-columns:\s*repeat\(4, 1fr\)/);
  });

  it("no tablet, com tres, continuam tres por linha, com o fio entre eles", () => {
    /* Toda troca de colunas e todo fio que sai, no tablet, são só do caso de
       quatro: nenhuma regra do tablet vale para três. */
    const tablet = bloco(css, "@media (max-width: 980px)");
    const soDeQuatro = tablet.replace(/\.numeros\[data-quantos="4"\][^{]*\{[^}]*\}/g, "");
    expect(soDeQuatro).not.toMatch(/grid-template-columns|border-left|border-top/);
  });

  it("no tablet, com quatro, dois por linha, sem fio vertical e com um fio entre as linhas", () => {
    const tablet = bloco(css, "@media (max-width: 980px)");
    expect(regra(tablet, '.numeros[data-quantos="4"]')).toMatch(/grid-template-columns:\s*1fr 1fr/);
    expect(regra(tablet, '.numeros[data-quantos="4"] .numero')).toMatch(/border-left:\s*0/);
    expect(regra(tablet, '.numeros[data-quantos="4"] .numero:nth-child(n + 3)')).toMatch(
      /border-top:\s*1px solid var\(--color-line-strong\)/,
    );
  });

  it("no celular, cartoezinhos brancos dois por linha; com tres, o terceiro na largura toda", () => {
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".numeros")).toMatch(/grid-template-columns:\s*1fr 1fr/);
    const cartao = regra(cel, ".numero,\n  .numero:first-child,\n  .numero:last-child");
    expect(cartao).toMatch(/background:\s*var\(--color-surface\)/);
    expect(cartao).toMatch(/box-shadow:\s*var\(--shadow-erguido\)/);
    expect(regra(cel, ".apoio,\n  .numero :global(.botao-linha)")).toMatch(/display:\s*none/);
    expect(regra(cel, '.numeros[data-quantos="3"] .numero:nth-child(3)')).toMatch(/grid-column:\s*1 \/ -1/);
  });

  it("no celular, com quatro, o fio do tablet nao entra nos cartoezinhos", () => {
    /* A regra do tablet vale também no celular (980px inclui 700px) e é mais
       específica que a do cartãozinho: sem esta, o terceiro e o quarto
       cartões ganhavam um fio em cima. */
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, '.numeros[data-quantos="4"] .numero:nth-child(n + 3)')).toMatch(/border-top:\s*0/);
  });

  it("nenhuma regra de ladrilho nem de icone, e o numero abre a coluna sem espaco em cima", () => {
    expect(css).not.toContain("ladrilho");
    expect(css).not.toContain("svg");
    expect(css).not.toContain(":hover");
    expect(regra(base(css), ".grande")).toMatch(/margin: 0 0 8px;/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".grande")).toMatch(/margin: 0 0 4px;/);
  });

  it("quem decide entre tres e quatro e o atributo, nao a contagem de filhos", () => {
    expect(css).not.toMatch(/:has\(|nth-last-child|:nth-child\(\d\):last-child/);
  });
});

describe("encontre um medico", () => {
  const itens = Array.from({ length: 14 }, (_, i) => ({ nome: `E${i}`, slug: `e${i}`, total: 14 - i }));
  const html = renderToString(createElement(EncontreUmMedico, { especialidades: itens }));
  it("e um formulario de verdade para /busca, com o campo termo", () => {
    expect(html).toMatch(/<form[^>]*action="\/busca"/);
    expect(html).toContain('name="termo"');
  });
  it("mostra as sete especialidades com mais medicos e o link para todas", () => {
    expect(html.match(/href="\/medicos\/e\d+"/g)?.length).toBe(7);
    expect(html).toContain("veja todas as 14 especialidades");
  });
  it("tem o id que a barra do pe e o menu usam", () => {
    expect(html).toContain('id="encontre"');
  });

  it("escolhe as sete com mais medicos mesmo fora de ordem, sem as vazias", () => {
    const embaralhadas = [
      { nome: "Pouca", slug: "pouca", total: 1 },
      { nome: "Vazia", slug: "vazia", total: 0 },
      ...itens.slice(0, 7).reverse(),
      { nome: "Outra", slug: "outra", total: 2 },
    ];
    const h = renderToString(createElement(EncontreUmMedico, { especialidades: embaralhadas }));
    const slugs = [...h.matchAll(/href="\/medicos\/([a-z0-9]+)"/g)].map((m) => m[1]);
    expect(slugs).toEqual(["e0", "e1", "e2", "e3", "e4", "e5", "e6"]);
    expect(h).not.toContain("/medicos/vazia");

    /* Com menos de sete com médicos, a vazia continua de fora. */
    const poucas = renderToString(
      createElement(EncontreUmMedico, {
        especialidades: [
          { nome: "Uma", slug: "uma", total: 3 },
          { nome: "Vazia", slug: "vazia", total: 0 },
        ],
      }),
    );
    expect([...poucas.matchAll(/href="\/medicos\/([a-z]+)"/g)].map((m) => m[1])).toEqual(["uma"]);
  });

  it("cada pilula com o nome e o numero de medicos", () => {
    expect(html).toMatch(/href="\/medicos\/e0">E0 <span[^>]*>14<span class="sr-only"> médicos<\/span><\/span><\/a>/);
  });

  it("o link para todas leva ao indice /medicos", () => {
    expect(html).toMatch(/<a href="\/medicos">veja todas as 14 especialidades<\/a>/);
  });

  it("o formulario pede GET, o campo tem rotulo e o exemplo e o curto", () => {
    expect(html).toMatch(/<form[^>]*method="get"/);
    expect(html).toMatch(/<label for="encontre-termo"[^>]*>Nome do médico ou especialidade<\/label>/);
    expect(html).toMatch(/<input[^>]*id="encontre-termo"/);
    expect(html).toMatch(/<input[^>]*placeholder="Nome ou especialidade"/);
  });

  it("o botao envia, diz Buscar e leva a seta sem classe de cor (fica branca como o texto)", () => {
    const botao = html.match(/<button[^>]*>[\s\S]*?<\/button>/)?.[0] ?? "";
    expect(botao).toMatch(/^<button type="submit" class="botao [^"]+">Buscar/);
    expect(botao).toMatch(/<svg[^>]*class=""/);
  });

  it("a lupa leva a classe que a pinta de cinza, e so ela", () => {
    expect(html).toContain(`class="${estilosBusca.lupa}"`);
    expect(html.match(new RegExp(estilosBusca.lupa, "g"))?.length).toBe(1);
  });

  it("e a faixa verde com a luz, e o rotulo marca a coluna da auditoria", () => {
    expect(html).toMatch(/<section[^>]*data-bloco="encontre"[^>]*class="revelar textura-verde /);
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(html).toMatch(/<span class="rotulo-secao [^"]+" data-coluna="">Encontre um médico<\/span>/);
    expect(html).toContain("Quem atende em Imperatriz, num só lugar");
  });

  it("o 'veja todas as N' conta so as especialidades com medicos", () => {
    const comVazias = [...itens, { nome: "Z1", slug: "z1", total: 0 }, { nome: "Z2", slug: "z2", total: 0 }];
    const h = renderToString(createElement(EncontreUmMedico, { especialidades: comVazias }));
    expect(h).toContain("veja todas as 14 especialidades");
  });

  it("com uma especialidade so, nao diz 'todas as 1'", () => {
    const h = renderToString(createElement(EncontreUmMedico, { especialidades: [{ nome: "A", slug: "a", total: 1 }] }));
    expect(h).not.toContain("todas as 1 ");
    expect(h).toMatch(/<a href="\/medicos">veja as especialidades<\/a>/);
  });
});

describe("o CSS da busca", () => {
  const css = semNotas(CSS_BUSCA);
  const cel = bloco(css, "@media (max-width: 700px)");

  it("e faixa de ponta a ponta: a margem lateral e a das faixas", () => {
    expect(regra(base(css), ".encontre")).toMatch(/padding:\s*96px var\(--borda-faixa\)/);
    expect(regra(cel, ".encontre")).toMatch(/padding:\s*44px var\(--borda-faixa\)/);
  });

  it("duas colunas no computador, uma abaixo de 1180px", () => {
    expect(regra(base(css), ".encontre")).toMatch(/grid-template-columns:\s*1fr 1\.25fr/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".encontre")).toMatch(/grid-template-columns:\s*1fr;/);
  });

  it("no celular as pilulas deslizam numa fileira, alinhadas pela margem das faixas", () => {
    const chips = regra(cel, ".chips");
    expect(chips).toMatch(/flex-wrap:\s*nowrap/);
    expect(chips).toMatch(/overflow-x:\s*auto/);
    expect(chips).toMatch(/margin:\s*16px calc\(-1 \* var\(--borda-faixa\)\) 0/);
    expect(chips).toMatch(/padding:\s*2px var\(--borda-faixa\)/);
    expect(chips).toMatch(/scroll-padding-inline:\s*var\(--borda-faixa\)/);
  });

  it("no celular o botao fica so com a seta, com alvo de 44px", () => {
    const b = regra(cel, ".buscar");
    expect(b).toMatch(/width:\s*44px/);
    expect(b).toMatch(/height:\s*44px/);
    expect(b).toMatch(/font-size:\s*0/);
  });

  it("o texto so perde o contorno onde o campo inteiro ganha o anel (:has)", () => {
    const sup = bloco(css, "@supports selector(:has(*))");
    expect(regra(sup, ".campo:has(input:focus-visible)")).toMatch(/outline:\s*2px solid var\(--color-ami-lima-400\)/);
    expect(regra(sup, ".campo input:focus-visible")).toMatch(/outline:\s*none/);
    /* Nenhum `outline: none` fora do bloco: sem `:has`, o texto mantém o
       contorno da regra global. */
    expect(css.match(/outline:\s*none/g)?.length).toBe(sup.match(/outline:\s*none/g)?.length);
  });

  it("nenhuma regra pinta o svg do botao: a seta fica branca", () => {
    /* Numa rodada do desenho a seta saiu cinza porque a regra da lupa pegava
       todo ícone do campo. Aqui a lupa tem classe própria. */
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (/svg/.test(m[1])) expect(m[2], m[1].trim()).not.toMatch(/(?<![-\w])color:/);
    }
    expect(regra(base(css), ".lupa")).toMatch(/color:\s*var\(--color-ink-400\)/);
  });
});

/*
  Contraste do texto sobre o verde da busca.

  O fundo não é uma cor só: é um degradê com dois brilhos fixos, o grão e a
  luz que passeia (`.brilho`), que cruza o bloco em 18s. Os fundos abaixo são
  o ponto mais claro que cada texto chega a ter atrás de si, medidos no
  navegador em 03/10/2026, assim: a posição real de cada
  linha de texto, a 320, 360, 390, 430, 768, 1024, 1180, 1280, 1440 e
  1920px, com a luz em 21 pontos do caminho dela e o grão pelo efeito médio
  (branco em `overlay`, alfa médio 115/255, opacidade 0,22). Quem mudar a
  textura, a luz ou o layout mede de novo.

  As cores do texto são lidas do CSS, não escritas aqui.
*/
describe("o texto sobre o verde passa em AA (4,5:1)", () => {
  const css = semNotas(CSS_BUSCA);
  const lima = /--color-ami-lima-400:\s*(#[0-9A-Fa-f]{6})/.exec(CSS_GLOBAL)![1];

  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const razao = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const sobre = (fundo: number[], cor: number[], alfa: number) => fundo.map((v, i) => v + alfa * (cor[i] - v));
  const BRANCO = [255, 255, 255];

  /* Fundo mais claro atrás de cada texto (r, g, b), já com o branco a 5% da
     pílula onde há pílula. */
  const PIOR = {
    rotuloForaDoCelular: [35, 78, 27], // 768px
    rotuloNoCelular: [57, 101, 42], // 320px
    texto: [53, 95, 38], // 430px
    pilula: [61, 94, 47], // 1440px
    rodape: [36, 84, 28], // 430px
    link: [34, 79, 27], // 430px
  };

  it("o rotulo: lima fora do celular, lima clareado no celular", () => {
    expect(razao(hex(lima), PIOR.rotuloForaDoCelular)).toBeGreaterThanOrEqual(4.5);
    const m = /color-mix\(in srgb, var\(--color-ami-lima-400\) (\d+)%, white\)/.exec(
      regra(bloco(css, "@media (max-width: 700px)"), ".sobre"),
    );
    expect(m, "o rotulo do celular nao e mais o lima clareado").not.toBeNull();
    const clareado = sobre(hex(lima), BRANCO, 1 - Number(m![1]) / 100);
    expect(razao(clareado, PIOR.rotuloNoCelular)).toBeGreaterThanOrEqual(4.5);
    /* E prova que o clareado faz falta: o lima puro reprova ali. */
    expect(razao(hex(lima), PIOR.rotuloNoCelular)).toBeLessThan(4.5);
  });

  it("o texto, a pilula e a frase de baixo", () => {
    const cor = (seletor: string) => hex(/color:\s*(#[0-9a-fA-F]{6})/.exec(regra(base(css), seletor))![1]);
    expect(razao(cor(".texto"), PIOR.texto)).toBeGreaterThanOrEqual(4.5);
    expect(razao(cor(".chip"), PIOR.pilula)).toBeGreaterThanOrEqual(4.5);
    expect(razao(cor(".rodapeBusca"), PIOR.rodape)).toBeGreaterThanOrEqual(4.5);
    expect(razao(hex(lima), PIOR.link)).toBeGreaterThanOrEqual(4.5);
    expect(regra(base(css), ".rodapeBusca a")).toMatch(/color:\s*var\(--color-ami-lima-400\)/);
  });

  it("o numero da pilula, branco translucido, passa no ponto mais claro", () => {
    const a = Number(/color:\s*rgba\(255, 255, 255, ([\d.]+)\)/.exec(regra(base(css), ".num"))![1]);
    expect(razao(sobre(PIOR.pilula, BRANCO, a), PIOR.pilula)).toBeGreaterThanOrEqual(4.5);
    /* Os 55% do desenho reprovavam. */
    expect(razao(sobre(PIOR.pilula, BRANCO, 0.55), PIOR.pilula)).toBeLessThan(4.5);
  });
});

describe("a margem das faixas de ponta a ponta", () => {
  it("e global, ao lado de --m e --ritmo, com a formula do desenho", () => {
    expect(CSS_GLOBAL).toMatch(
      /--borda-faixa:\s*max\(\s*calc\(24px \+ var\(--m\)\),\s*calc\(\(100% - 1240px\) \/ 2 \+ 24px \+ var\(--m\)\)\s*\);/,
    );
    expect(blocos(CSS_GLOBAL, "@media (max-width: 700px)")).toMatch(/--borda-faixa:\s*calc\(12px \+ var\(--m\)\);/);
  });

  it("o rodape le a global e nao tem mais a local", () => {
    expect(regra(CSS_ROD, ".caixa")).toMatch(/padding:\s*0 var\(--borda-faixa\)/);
    expect(semNotas(CSS_ROD)).not.toMatch(/--borda:/);
  });
});
