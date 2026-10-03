import { Writable } from "node:stream";
import { createElement, type ReactNode } from "react";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Medico } from "@/lib/dados/tipos";

/*
  A porta da busca: os dois lugares do site público onde dá para DIGITAR —
  o bloco "Encontre um médico", na home, e o painel de filtros de `/busca`.
  E um lugar onde NÃO dá: o mesmo painel nas páginas de especialidade.

  O maquinário de busca por texto está inteiro há muito tempo — `casaNoNome`
  em lib/dados/filtros.ts, `filtros.termo` lido em app/(site)/busca/page.tsx,
  a serialização em lib/dados/urlFiltros.ts, tudo com teste próprio. O que
  faltou uma vez foi a PORTA: a home perdeu o formulário que levava a
  `/busca`, e com ele o único campo de texto do site; `?termo=` continuou
  funcionando, e continuou inalcançável por clique. Nenhum dos testes
  existentes ficou vermelho, porque nenhum deles pergunta se existe onde
  digitar.

  Este arquivo pergunta. E pergunta pelo HTML RENDERIZADO, não pelo
  texto-fonte: `<form>` dentro de `<a>` foi a armadilha concreta do cartão
  de antes, em que os vizinhos eram links inteiros (o navegador desmonta a
  árvore, e nada em `.tsx` denuncia isso), e uma
  varredura de fonte não distingue um campo vivo de um campo dentro de
  `{false && …}` — ver o comentário no topo de testes/home.test.ts.

  O painel é perguntado pelas duas PÁGINAS de verdade que o usam
  (app/(site)/busca/page.tsx e app/(site)/medicos/[especialidade]/page.tsx),
  com as fontes de dados trocadas por dublês, e não pelo componente solto:
  quem decide se o campo aparece é a página, pela prop `campoDeTermo`.
*/

/* O painel é componente de cliente e lê a URL por hooks do Next. Aqui não há
   roteador: estes dublês são o mínimo que ele toca. `URLSearchParams` já tem
   `get`, `getAll` e `keys`, que é tudo que o painel usa. `notFound` é o que
   a página de especialidade importa do mesmo módulo; aqui ele só precisa
   existir, porque os dublês abaixo nunca levam a página até ele. */
const QUERY = new URLSearchParams("termo=Mayara&bairro=centro");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/busca",
  useSearchParams: () => QUERY,
  notFound: () => {
    throw new Error("notFound() não devia ser chamado neste teste");
  },
}));

const MEDICO: Medico = {
  id: 1,
  slug: "mayara-exemplo",
  nome: "Mayara Exemplo",
  crm: "1234",
  crmUf: "MA",
  foto: null,
  bio: null,
  telemedicina: false,
  associadoAmi: false,
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true },
  ],
  locais: [
    {
      id: 1,
      logradouro: "Rua Exemplo",
      numero: "1",
      bairro: { id: 1, nome: "Centro", slug: "centro" },
      telefone: null,
      whatsapp: null,
      estacionamento: false,
      acessibilidade: [],
    },
  ],
};

vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => [MEDICO],
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Cardiologia", slug: "cardiologia", total: 1 },
  ],
  especialidadePorSlug: async () => ({
    nome: "Cardiologia",
    slug: "cardiologia",
    oQueFaz: null,
    quandoProcurar: null,
  }),
  bairrosComContagem: async () => [{ nome: "Centro", slug: "centro", total: 1 }],
}));

const { EncontreUmMedico } = await import("@/components/home/EncontreUmMedico");
const { PainelFiltros } = await import("@/components/diretorio/PainelFiltros");
const { default: PaginaBusca } = await import("@/app/(site)/busca/page");
const { default: PaginaEspecialidade } = await import(
  "@/app/(site)/medicos/[especialidade]/page"
);

/* Mesma forma de testes/home-renderizada.test.ts: `renderToPipeableStream`
   espera a árvore inteira ficar pronta antes de entregar o HTML. */
function html(arvore: ReactNode): Promise<string> {
  return new Promise<string>((pronto, falhou) => {
    let saida = "";
    const destino = new Writable({
      write(pedaco, _codificacao, seguir) {
        saida += pedaco.toString();
        seguir();
      },
      final(seguir) {
        pronto(saida);
        seguir();
      },
    });
    const fluxo = renderToPipeableStream(arvore, {
      onAllReady: () => fluxo.pipe(destino),
      onError: falhou,
    });
  });
}

const BUSCA_PARAMS = {
  searchParams: Promise.resolve({ termo: "Mayara", bairro: "centro" }),
};

const CARTOES = renderToString(
  createElement(EncontreUmMedico, {
    especialidades: [{ nome: "Cardiologia", slug: "cardiologia", total: 1 }],
  }),
);

const BUSCA = await html(await PaginaBusca(BUSCA_PARAMS));

const ESPECIALIDADE = await html(
  await PaginaEspecialidade({
    params: Promise.resolve({ especialidade: "cardiologia" }),
    ...BUSCA_PARAMS,
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

describe("o bloco Encontre um médico, na home", () => {
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
      As pílulas e o "veja todas" do mesmo bloco são links. Se alguém
      embrulhar o bloco num `<Link>`, o navegador desmonta a árvore e o
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
    expect(BUSCA).toMatch(/<input[^>]*name="termo"/);
  });

  it("o campo vem preenchido com o termo atual", () => {
    /* Campo vazio numa página cujo H1 diz "Resultados para Mayara" faz o
       usuário digitar de novo o que já buscou.

       A asserção olha a TAG inteira, e não a sequência `name=…value=`: a
       ordem em que o React imprime os atributos é detalhe de implementação
       dele, e amarrar o teste a ela é combinar uma falha para o dia em que
       essa ordem mudar. */
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(BUSCA)?.[0] ?? "";
    expect(campo, "não achei o campo de termo no painel").not.toBe("");
    expect(campo).toContain('value="Mayara"');
  });
});

describe("o painel de filtros, numa página de especialidade", () => {
  it("não tem o campo de texto", () => {
    /*
      A página já está presa a uma especialidade, e o rótulo "Nome ou
      especialidade" prometia outra coisa: `?termo=pediatria` em
      Cardiologia dava "Nenhum médico" com o contador de filtros em zero.
      O campo entrou aqui por acidente, quando foi posto no painel para
      `/busca`; ninguém o decidiu para esta página.

      A conferência de que o painel saiu (o seletor de bairro) existe para
      que este teste não passe só porque a página quebrou e não desenhou
      painel nenhum.
    */
    expect(ESPECIALIDADE).toContain('id="filtro-bairro"');
    expect(ESPECIALIDADE).not.toMatch(/name="termo"/);
    expect(ESPECIALIDADE).not.toContain("Nome ou especialidade");
  });

  it("o painel sem a prop não desenha o campo", () => {
    /* O padrão é desligado: uma terceira página que passe a usar o painel
       não herda o campo sem que alguém decida. */
    const solto = renderToString(
      createElement(PainelFiltros, {
        bairros: [{ nome: "Centro", slug: "centro" }],
        total: 3,
      }),
    );
    expect(solto).toContain('id="filtro-bairro"');
    expect(solto).not.toMatch(/name="termo"/);
  });
});
