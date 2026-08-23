import { describe, expect, it } from "vitest";
import {
  paraLocal,
  RECURSOS_DE_ACESSIBILIDADE,
  reconciliarAcessibilidade,
  validarLocal,
} from "@/lib/painel/locais";
import { fonte, semComentarios } from "@/testes/apoio";

const BAIRROS = [1, 2, 3];

function campos(over: Partial<Parameters<typeof validarLocal>[0]> = {}) {
  return {
    logradouro: "Rua Simplício Moreira",
    numero: "1200",
    complemento: "",
    bairroId: "1",
    cep: "65900-000",
    telefone: "99 3524-3716",
    whatsapp: "",
    estacionamento: false,
    ...over,
  };
}

describe("validarLocal", () => {
  it("aceita o mínimo: logradouro e bairro", () => {
    const r = validarLocal(
      campos({ numero: "", cep: "", telefone: "", whatsapp: "" }),
      BAIRROS,
    );
    expect(r.ok).toBe(true);
  });

  it("recusa logradouro vazio", () => {
    const r = validarLocal(campos({ logradouro: "   " }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.logradouro).toBeTruthy();
  });

  it("recusa bairro que não está na lista", () => {
    const r = validarLocal(campos({ bairroId: "99" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.bairroId).toBeTruthy();
  });

  it("devolve todos os erros de uma vez", () => {
    const r = validarLocal(campos({ logradouro: "", bairroId: "99" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).length).toBe(2);
  });

  it("guarda só os dígitos do telefone", () => {
    const r = validarLocal(campos({ telefone: "(99) 3524-3716" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.telefone).toBe("9935243716");
  });

  it("campo opcional vazio vira nulo, não string vazia", () => {
    const r = validarLocal(campos({ numero: "", cep: "", whatsapp: "" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valor.numero).toBeNull();
      expect(r.valor.cep).toBeNull();
      expect(r.valor.whatsapp).toBeNull();
    }
  });

  it("recusa telefone que não tem dígito nenhum", () => {
    const r = validarLocal(campos({ telefone: "ligar de manhã" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.telefone).toBeTruthy();
  });

  /*
    Espelha os dois testes de telefone acima. Sem estes, o WhatsApp só está
    protegido pela paridade de código com telefone, não por teste — os oito
    testes originais nunca passavam `whatsapp` com valor não vazio, e uma
    mutação que apagasse a validação do WhatsApp inteira continuava verde.
  */
  it("guarda só os dígitos do whatsapp", () => {
    const r = validarLocal(campos({ whatsapp: "(99) 98802-0205" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.whatsapp).toBe("99988020205");
  });

  it("recusa whatsapp que não tem dígito nenhum", () => {
    const r = validarLocal(campos({ whatsapp: "só no telefone mesmo" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.whatsapp).toBeTruthy();
  });

  it("espaço a mais no logradouro é limpo, não recusado", () => {
    const r = validarLocal(campos({ logradouro: "  Rua   Simplício   Moreira " }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.logradouro).toBe("Rua Simplício Moreira");
  });
});

/*
  Os cinco valores que a restrição de `local_acessibilidade` aceita, em
  `0001_diretorio.sql`. Sem este teste, um sexto valor digitado de cabeça — ou
  um dos cinco digitado errado — passaria batido até quebrar contra o banco em
  produção, na primeira gravação.
*/
describe("RECURSOS_DE_ACESSIBILIDADE", () => {
  it("são exatamente os cinco que a restrição do banco aceita", () => {
    expect(RECURSOS_DE_ACESSIBILIDADE.map((r) => r.valor).sort()).toEqual(
      [
        "acesso_cadeirante",
        "banheiro_adaptado",
        "elevador",
        "interprete_libras",
        "piso_tatil",
      ].sort(),
    );
  });

  it("cada um tem rótulo em português", () => {
    for (const r of RECURSOS_DE_ACESSIBILIDADE) {
      expect(r.rotulo.length).toBeGreaterThan(0);
      expect(r.rotulo).not.toBe(r.valor);
    }
  });
});

/*
  paraLocal calcula quantosMedicos, a regra que a tarefa 8 inteira existia
  para proteger: sem ela testada, é possível quebrar o aviso de endereço
  compartilhado sem nenhum teste avisar. Mesmo padrão de paraLista em
  testes/painel-consultas.test.ts: linha crua do banco entra, domínio sai.
*/
describe("paraLocal", () => {
  const linha = {
    id: 9,
    logradouro: "Rua Simplício Moreira",
    numero: "1200",
    complemento: null,
    cep: null,
    telefone: "9935243716",
    whatsapp: null,
    estacionamento: true,
    bairro: { id: 2, nome: "Centro" },
    atendimento: [{ profissional_id: 1 }, { profissional_id: 2 }],
    local_acessibilidade: [{ recurso: "elevador" }, { recurso: "piso_tatil" }],
  };

  it("conta um médico por linha de atendimento", () => {
    expect(paraLocal(linha).quantosMedicos).toBe(2);
  });

  it("atendimento vazio devolve zero", () => {
    expect(paraLocal({ ...linha, atendimento: [] }).quantosMedicos).toBe(0);
  });

  it("atendimento ausente também devolve zero, sem estourar", () => {
    const { atendimento: _semUso, ...semAtendimento } = linha;
    expect(paraLocal(semAtendimento).quantosMedicos).toBe(0);
  });

  it("campos opcionais nulos atravessam como nulo, não string vazia", () => {
    const m = paraLocal(linha);
    expect(m.complemento).toBeNull();
    expect(m.cep).toBeNull();
    expect(m.whatsapp).toBeNull();
  });

  it("traduz o resto para o domínio", () => {
    const m = paraLocal(linha);
    expect(m.id).toBe(9);
    expect(m.logradouro).toBe("Rua Simplício Moreira");
    expect(m.bairro).toEqual({ id: 2, nome: "Centro" });
    expect(m.telefone).toBe("9935243716");
    expect(m.estacionamento).toBe(true);
  });

  it("traduz local_acessibilidade para a lista de recursos", () => {
    expect(paraLocal(linha).acessibilidade).toEqual(["elevador", "piso_tatil"]);
  });

  it("local_acessibilidade ausente também devolve vazio, sem estourar", () => {
    const { local_acessibilidade: _semUso, ...semAcessibilidade } = linha;
    expect(paraLocal(semAcessibilidade).acessibilidade).toEqual([]);
  });
});

/*
  A diferença entre reconciliar e apagar tudo e recriar mora inteira nesta
  função — testada em isolado porque `salvarAcessibilidade`, em
  `acoes-local.ts`, é `async` e fala com o banco, e não dá para exercitar a
  decisão sem mockar Supabase inteiro (este projeto testa só lógica pura de
  `lib/`, ver vitest.config.ts).
*/
describe("reconciliarAcessibilidade", () => {
  it("remove só o que saiu e insere só o que entrou", () => {
    const r = reconciliarAcessibilidade(
      ["acesso_cadeirante", "elevador"],
      ["elevador", "piso_tatil"],
    );
    expect(r.remover).toEqual(["acesso_cadeirante"]);
    expect(r.inserir).toEqual(["piso_tatil"]);
  });

  /*
    Esta é a asserção que distingue reconciliar de apagar-tudo-e-recriar. Uma
    implementação que apaga tudo trataria "elevador" como removido mesmo
    continuando marcado — o que, contra o banco de verdade, é uma janela em
    que o consultório fica sem nenhum recurso se a gravação seguinte falhar.
  */
  it("o que ficou marcado nas duas pontas não é tocado", () => {
    const r = reconciliarAcessibilidade(["elevador"], ["elevador"]);
    expect(r.remover).toEqual([]);
    expect(r.inserir).toEqual([]);
  });

  it("conjunto vazio nas duas pontas não mexe em nada", () => {
    const r = reconciliarAcessibilidade([], []);
    expect(r.remover).toEqual([]);
    expect(r.inserir).toEqual([]);
  });

  it("tudo marcado do zero insere tudo e não remove nada", () => {
    const r = reconciliarAcessibilidade([], ["elevador", "piso_tatil"]);
    expect(r.remover).toEqual([]);
    expect(r.inserir).toEqual(["elevador", "piso_tatil"]);
  });

  it("desmarcar tudo remove tudo e não insere nada", () => {
    const r = reconciliarAcessibilidade(["elevador", "piso_tatil"], []);
    expect(r.remover).toEqual(["elevador", "piso_tatil"]);
    expect(r.inserir).toEqual([]);
  });
});

describe("acoes-local.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-local.ts"));

  it("nunca remove da tabela local", () => {
    /*
      Remoção é permitida em duas tabelas de ligação/anexo — atendimento
      (tarefa 9) e local_acessibilidade (esta tarefa) — nunca em local. Apagar
      o endereço em si derrubaria o consultório para todo mundo que o usa, não
      só para o médico que a tela está editando.
    */
    const PERMITIDAS = ["atendimento", "local_acessibilidade"];
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|$)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) expect(PERMITIDAS).toContain(tabela);
    }
  });

  it("salvarAcessibilidade reconcilia, não apaga tudo e recria", () => {
    /*
      Ancorada em texto de propósito: `reconciliarAcessibilidade` é quem
      decide o que remover e o que inserir (testada em isolado, acima). Uma
      implementação que apagasse tudo e recriasse continuaria passando pelos
      testes estruturais acima — mesma tabela permitida, mesma contagem de
      `.select()`, mesmo `if (!data)` antes de invalidar — porque nenhum deles
      olha PARA O QUE a chamada de apagar filtra. Só uma leitura do texto pega
      isso.
    */
    expect(codigo).toContain("reconciliarAcessibilidade(");
  });

  /*
    Asserção que faltava, achada mutando `salvarAcessibilidade` para tirar a
    conferência de quantidade de uma das duas gravações condicionais (remover
    e inserir) e rodando a suíte: nada reclamou. `if (!data)` sozinho não
    basta aqui, porque o `.in("recurso", paraRemover)` pode achar SÓ ALGUMAS
    das linhas que a política do banco deveria admitir — o PostgREST devolve
    um array não vazio, `data` passa em `if (!data)`, e a gravação parcial
    declara sucesso. É a mesma classe de defeito do `.maybeSingle()` nas
    outras ações, mas ali `data` é um objeto e "veio ou não veio" já é toda a
    pergunta; aqui `data` é um array, e "veio a quantidade certa" é uma
    pergunta a mais que só a contagem responde.
  */
  it("cada gravação de acessibilidade confere a quantidade, não só a presença", () => {
    expect(codigo).toContain("data.length !== paraRemover.length");
    expect(codigo).toContain("data.length !== paraInserir.length");
  });

  it("toda gravação pede as linhas afetadas de volta", () => {
    const escritas = [...codigo.matchAll(/\.(insert|update|delete)\s*\(/g)];
    const selects = [...codigo.matchAll(/\.select\s*\(/g)];
    expect(escritas.length).toBeGreaterThan(0);
    expect(selects.length).toBeGreaterThanOrEqual(escritas.length);
  });

  it("cada ação confere se veio linha antes de invalidar", () => {
    /*
      Ancora na CHAMADA `invalidar()`, não em `revalidatePath(`. Medir a posição
      de `revalidatePath(` mede a DEFINIÇÃO do helper, não o momento em que ele
      roda. E confere por ação: no arquivo inteiro, o `if (!data)` de uma ação
      cobriria o `invalidar()` de outra.

      `criarLocal` e `salvarLocal` conferem sob nomes diferentes — `if
      (!criado.data)`, `if (!ligado.data)`, `if (!data)` — por isso a busca casa
      qualquer uma dessas três formas, em vez de fixar um nome de variável.
    */
    const acoes = codigo.split("export async function").slice(1);
    expect(acoes.length).toBeGreaterThan(0);

    for (const acao of acoes) {
      if (!acao.includes("invalidar()")) continue;
      const confere = acao.search(/if \(!(\w+\.)?data\)/);
      expect(confere, "ação que invalida sem conferir se veio linha").toBeGreaterThan(-1);
      expect(confere).toBeLessThan(acao.indexOf("invalidar()"));
    }
  });

  it("chama exigirAdmin antes de qualquer escrita", () => {
    const guarda = codigo.indexOf("exigirAdmin(");
    const escrita = codigo.search(/\.(insert|update|delete)\s*\(/);
    expect(guarda).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(guarda);
  });
});
