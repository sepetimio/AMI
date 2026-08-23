import { describe, expect, it } from "vitest";
import {
  avisoDeRqeFaltando,
  ordenarEspecialidades,
  quemHerdaAPrincipal,
  validarRqe,
  type EspecialidadeDoMedico,
} from "@/lib/painel/especialidades";
import { acoesQueGravam, fonte, gravacoes, semComentarios } from "@/testes/apoio";

describe("validarRqe", () => {
  it("aceita vazio, porque clínico geral sem RQE é caso normal", () => {
    const r = validarRqe("");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("espaço em branco também vira nulo", () => {
    const r = validarRqe("   ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("guarda só os dígitos", () => {
    const r = validarRqe("RQE 12345");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBe("12345");
  });

  it("recusa texto sem nenhum dígito", () => {
    const r = validarRqe("não tenho");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("número");
  });
});

describe("avisoDeRqeFaltando", () => {
  it("sem nome nenhum, não avisa", () => {
    expect(avisoDeRqeFaltando([])).toBeNull();
  });

  it("com um nome, avisa citando ele", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia"]);
    expect(aviso).toContain("Cardiologia");
  });

  it("com dois nomes, cita os dois", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia", "Pediatria"]);
    expect(aviso).toContain("Cardiologia");
    expect(aviso).toContain("Pediatria");
  });
});

describe("ordenarEspecialidades", () => {
  const e = (nome: string, principal: boolean, id = 1): EspecialidadeDoMedico => ({
    id,
    nome,
    rqe: null,
    principal,
  });

  it("a principal vem primeiro, mesmo estando por último na entrada", () => {
    const entrada = [e("Cardiologia", false, 1), e("Alergologia", false, 2), e("Zoologia", true, 3)];
    const saida = ordenarEspecialidades(entrada);
    expect(saida[0].nome).toBe("Zoologia");
  });

  it("sem nenhuma principal, a ordem é só alfabética", () => {
    const entrada = [e("Cardiologia", false, 1), e("Alergologia", false, 2), e("Pediatria", false, 3)];
    const saida = ordenarEspecialidades(entrada).map((x) => x.nome);
    expect(saida).toEqual(["Alergologia", "Cardiologia", "Pediatria"]);
  });

  it("a ordenação é de português: acento não empurra para o fim", () => {
    const entrada = [e("Zoologia", false, 1), e("Álgebra", false, 2)];
    const saida = ordenarEspecialidades(entrada).map((x) => x.nome);
    expect(saida).toEqual(["Álgebra", "Zoologia"]);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(ordenarEspecialidades([])).toEqual([]);
  });
});

/*
  A tela garante no MÁXIMO uma principal; esta função é a metade que garante
  PELO MENOS uma. Sem ela, remover a principal deixava o médico com
  especialidades e nenhuma marcada, e o site caía no desempate
  `?? especialidades[0]` sobre um array que o PostgREST devolve sem ordenação
  — título, meta description, breadcrumb, JSON-LD e busca, todos decididos por
  sorteio e congelados no cache por uma hora.
*/
describe("quemHerdaAPrincipal", () => {
  const e = (id: number, nome: string, principal = false): EspecialidadeDoMedico => ({
    id,
    nome,
    rqe: null,
    principal,
  });

  it("removendo a principal com duas sobrando, promove a alfabeticamente primeira", () => {
    const lista = [e(1, "Zoologia", true), e(2, "Pediatria"), e(3, "Cardiologia")];
    expect(quemHerdaAPrincipal(lista, 1)?.nome).toBe("Cardiologia");
  });

  it("a ordem é de português: acento não empurra para o fim", () => {
    /*
      "Buco-maxilo" antes de "Ácaros" na entrada, de propósito: uma
      ordenação de código, sem `localeCompare(…, "pt-BR")`, põe "Á" (U+00C1)
      depois de "B" e devolve Buco-maxilo — e não ordenar nada devolve
      Buco-maxilo também. Só a ordem de português devolve Ácaros.
    */
    const lista = [e(1, "Zoologia", true), e(2, "Buco-maxilo"), e(3, "Ácaros")];
    expect(quemHerdaAPrincipal(lista, 1)?.nome).toBe("Ácaros");
  });

  it("removendo uma não-principal, não promove ninguém", () => {
    const lista = [e(1, "Zoologia", true), e(2, "Pediatria"), e(3, "Cardiologia")];
    expect(quemHerdaAPrincipal(lista, 3)).toBeNull();
  });

  it("removendo a última, não promove nada", () => {
    expect(quemHerdaAPrincipal([e(1, "Cardiologia", true)], 1)).toBeNull();
  });

  it("id que não está na lista não promove ninguém", () => {
    const lista = [e(1, "Zoologia", true), e(2, "Pediatria")];
    expect(quemHerdaAPrincipal(lista, 99)).toBeNull();
  });

  it("sem nenhuma marcada como principal, não promove ninguém", () => {
    /*
      Estado que só o banco produz, e produziu: nada além desta função e do
      insert da primeira especialidade marca `principal`. Promover aqui seria
      inventar uma decisão que ninguém tomou, num caminho em que quem removeu
      não estava mexendo na principal.
    */
    const lista = [e(1, "Zoologia"), e(2, "Pediatria")];
    expect(quemHerdaAPrincipal(lista, 1)).toBeNull();
  });

  it("não mexe na lista que recebe", () => {
    const lista = [e(1, "Zoologia", true), e(2, "Pediatria"), e(3, "Cardiologia")];
    quemHerdaAPrincipal(lista, 1);
    expect(lista.map((x) => x.nome)).toEqual(["Zoologia", "Pediatria", "Cardiologia"]);
  });
});

describe("acoes-especialidade.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-especialidade.ts"));

  it("cada gravação pede as linhas afetadas de volta na própria cadeia", () => {
    /*
      Por gravação, dentro da cadeia dela — não contando `.select(` no arquivo
      inteiro. A contagem misturava leitura com escrita: uma leitura solta
      pagava pela gravação que não pedia nada de volta, e a folga crescia a
      cada leitura nova.
    */
    const todas = gravacoes(codigo);
    expect(todas.length, "nenhuma gravação achada neste arquivo").toBeGreaterThan(0);

    for (const { acao, escrita, cadeia } of todas) {
      expect(
        /\.select\s*\(/.test(cadeia),
        `${acao}: a gravação ${escrita} não pede as linhas afetadas de volta`,
      ).toBe(true);
    }
  });

  it("cada ação que grava confere se veio linha, antes de invalidar", () => {
    /*
      O gatilho é GRAVAR, não invalidar: dispensar do exame a ação que não
      chama `invalidar()` é dispensar pela própria coisa examinada.

      Ancora na CHAMADA `invalidar()`, não em `revalidatePath(`. Medir a posição
      de `revalidatePath(` mede a DEFINIÇÃO do helper, não o momento em que ele
      roda — com a definição no fim do arquivo, uma ação que invalidasse antes
      de conferir a linha passaria verde. E confere por ação: no arquivo inteiro,
      o `if (!data)` de uma ação cobriria o `invalidar()` de outra.
    */
    const gravam = acoesQueGravam(codigo);
    expect(gravam.length, "nenhuma ação que grava neste arquivo").toBeGreaterThan(0);

    for (const { nome, corpo } of gravam) {
      const confere = corpo.search(/if \(!(\w+\.)?data\)/);
      expect(confere, `${nome} grava sem conferir se veio linha`).toBeGreaterThan(-1);

      const invalida = corpo.indexOf("invalidar()");
      if (invalida > -1) {
        expect(confere, `${nome} invalida antes de conferir se veio linha`).toBeLessThan(
          invalida,
        );
      }
    }
  });

  it("cada ação chama exigirAdmin antes de gravar", () => {
    /*
      Por ação, não pelo arquivo inteiro: medido no arquivo inteiro, o
      `exigirAdmin()` da primeira função do arquivo cobre a escrita de toda
      ação depois dela, e uma ação nova que pulasse a guarda passaria verde.
      Mesmo corte de `export async function` que a asserção de `invalidar()`
      já usa, acima.
    */
    const acoes = codigo.split("export async function").slice(1);
    expect(acoes.length).toBeGreaterThan(0);

    for (const acao of acoes) {
      const escrita = acao.search(/\.(insert|update|delete)\s*\(/);
      if (escrita === -1) continue;
      const guarda = acao.indexOf("exigirAdmin(");
      expect(guarda, "ação que grava sem chamar exigirAdmin").toBeGreaterThan(-1);
      expect(guarda).toBeLessThan(escrita);
    }
  });

  it("removerEspecialidade promove uma herdeira, e lê a lista antes de apagar", () => {
    /*
      Ancorada em texto, como a de `reconciliarAcessibilidade` em
      painel-locais.test.ts: as asserções estruturais deste arquivo não olham
      PARA O QUE a ação faz depois de apagar. Uma versão que só apagasse
      continuaria passando por todas elas — mesma tabela permitida, mesmo
      `.select()` por gravação, mesmo `if (!data)` antes de invalidar.

      A ordem importa e é medida: o que decide quem herda é a linha que está
      prestes a sumir, e ler depois de apagar não acha mais nada.
    */
    const leitura = codigo.indexOf("especialidadesDoMedico(");
    const decisao = codigo.indexOf("quemHerdaAPrincipal(");
    const apaga = codigo.indexOf(".delete(");

    expect(leitura, "não lê as especialidades atuais").toBeGreaterThan(-1);
    expect(decisao, "não decide quem herda a principal").toBeGreaterThan(-1);
    expect(leitura, "lê as especialidades depois de apagar").toBeLessThan(apaga);
    expect(decisao, "decide quem herda depois de apagar").toBeLessThan(apaga);
  });

  it("só remove de profissional_especialidade", () => {
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|$)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) {
        expect(tabela).toBe("profissional_especialidade");
      }
    }
  });
});
