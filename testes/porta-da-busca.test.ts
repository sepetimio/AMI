import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/*
  A porta da busca: os dois lugares do site onde dá para DIGITAR.

  O maquinário de busca por texto está inteiro há muito tempo — `casaNoNome`
  em lib/dados/filtros.ts, `filtros.termo` lido em app/(site)/busca/page.tsx,
  a serialização em lib/dados/urlFiltros.ts, tudo com teste próprio. O que
  faltou uma vez foi a PORTA: a home perdeu o herói, e com ele o único campo
  de texto do site; `?termo=` continuou funcionando, e continuou inalcançável
  por clique. Nenhum dos testes existentes ficou vermelho, porque nenhum
  deles pergunta se existe onde digitar.

  Este arquivo pergunta. E pergunta pelo HTML RENDERIZADO, não pelo
  texto-fonte: `<form>` dentro de `<a>` é a armadilha concreta deste cartão
  (o navegador desmonta a árvore, e nada em `.tsx` denuncia isso), e uma
  varredura de fonte não distingue um campo vivo de um campo dentro de
  `{false && …}` — ver o comentário no topo de testes/home.test.ts.
*/

/* O painel é componente de cliente e lê a URL por hooks do Next. Aqui não há
   roteador: estes dublês são o mínimo que ele toca. `URLSearchParams` já tem
   `get`, `getAll` e `keys`, que é tudo que o painel usa. */
const QUERY = new URLSearchParams("termo=Mayara&bairro=centro");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/busca",
  useSearchParams: () => QUERY,
}));

const { ServicosDaAmi } = await import("@/components/home/ServicosDaAmi");
const { PainelFiltros } = await import("@/components/diretorio/PainelFiltros");

const CARTOES = renderToString(
  createElement(ServicosDaAmi, {
    total: 24,
    especialidades: 9,
    ultimaNoticia: null,
  }),
);

const PAINEL = renderToString(
  createElement(PainelFiltros, {
    bairros: [{ nome: "Centro", slug: "centro" }],
    total: 3,
  }),
);

/** Um `<form>` dentro de um `<a>` ainda aberto é HTML inválido. */
function formularioDentroDeAncora(html: string): boolean {
  for (const m of html.matchAll(/<form\b/g)) {
    const antes = html.slice(0, m.index);
    const abertas = (antes.match(/<a\b/g) ?? []).length;
    const fechadas = (antes.match(/<\/a>/g) ?? []).length;
    if (abertas > fechadas) return true;
  }
  return false;
}

describe("o cartão Encontre um médico, na home", () => {
  it("manda um termo digitado para /busca, por GET", () => {
    expect(CARTOES).toMatch(/<form[^>]*action="\/busca"/);
    expect(CARTOES).toMatch(/<form[^>]*method="get"/);
  });

  it("o campo se chama termo, que é o que a busca lê", () => {
    /* `filtrosDaQuery` lê `sp.termo`. Qualquer outro nome manda o valor para
       uma chave que ninguém lê, e a busca volta vazia sem erro nenhum. */
    expect(CARTOES).toMatch(/<input[^>]*name="termo"/);
  });

  it("o formulário não está dentro de um link", () => {
    /*
      Os outros dois cartões da grade são `<Link>` inteiros, e a tentação é
      manter a simetria. Se alguém devolver este a `<Link href="/medicos">`
      sem tirar o formulário de dentro, o navegador desmonta a árvore e o
      campo deixa de enviar. Esta asserção é a que fica vermelha nesse dia.
    */
    expect(formularioDentroDeAncora(CARTOES)).toBe(false);
  });

  it("quem não sabe o nome de ninguém ainda chega ao índice", () => {
    /* O campo não substitui `/medicos`: o índice por especialidade e bairro
       é o caminho de quem não tem um nome para digitar. */
    expect(CARTOES).toMatch(/href="\/medicos"/);
  });
});

describe("o painel de filtros, em /busca", () => {
  it("tem campo de texto, para quem chegou por link de bairro", () => {
    /* `/busca` só é alcançável por link já filtrado (rodapé e ladrilhos da
       home). Sem campo aqui, refinar por nome exige voltar à home. */
    expect(PAINEL).toMatch(/<input[^>]*name="termo"/);
  });

  it("o campo vem preenchido com o termo atual", () => {
    /* Campo vazio numa página cujo H1 diz "Resultados para Mayara" faz o
       usuário digitar de novo o que já buscou.

       A asserção olha a TAG inteira, e não a sequência `name=…value=`: a
       ordem em que o React imprime os atributos é detalhe de implementação
       dele, e amarrar o teste a ela é combinar uma falha para o dia em que
       essa ordem mudar. */
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(PAINEL)?.[0] ?? "";
    expect(campo, "não achei o campo de termo no painel").not.toBe("");
    expect(campo).toContain('value="Mayara"');
  });
});
