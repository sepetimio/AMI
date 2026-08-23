import { describe, expect, it } from "vitest";
import { ROTULO_ACESSIBILIDADE } from "@/lib/dados/tipos";
import {
  acharEnderecoIgual,
  chaveDeEndereco,
  lerCamposDoLocal,
  paraLocal,
  paraLocalNaLista,
  RECURSOS_DE_ACESSIBILIDADE,
  reconciliarAcessibilidade,
  validarLocal,
} from "@/lib/painel/locais";
import { acoesQueGravam, fonte, gravacoes, semComentarios } from "@/testes/apoio";

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

/*
  Irmã de `lerCamposDoMedico` em painel-edicao.test.ts, e pelo mesmo motivo:
  dentro da ação, a leitura do formulário não tinha teste nenhum.
*/
describe("lerCamposDoLocal", () => {
  function formulario(pares: Record<string, string> = {}): FormData {
    const dados = new FormData();
    for (const [chave, valor] of Object.entries(pares)) dados.append(chave, valor);
    return dados;
  }

  it("cada campo chega ao lugar certo, os oito de uma vez", () => {
    expect(
      lerCamposDoLocal(
        formulario({
          logradouro: "Rua Simplício Moreira",
          numero: "1200",
          complemento: "sala 4",
          bairroId: "2",
          cep: "65900-000",
          telefone: "99 3524-3716",
          whatsapp: "99 98802-0205",
          estacionamento: "on",
        }),
      ),
    ).toEqual({
      logradouro: "Rua Simplício Moreira",
      numero: "1200",
      complemento: "sala 4",
      bairroId: "2",
      cep: "65900-000",
      telefone: "99 3524-3716",
      whatsapp: "99 98802-0205",
      estacionamento: true,
    });
  });

  it("caixa desmarcada vira false, não undefined", () => {
    expect(lerCamposDoLocal(formulario()).estacionamento).toBe(false);
  });

  it("campo ausente vira string vazia, não a palavra \"null\"", () => {
    const campos = lerCamposDoLocal(formulario());
    expect(campos.logradouro).toBe("");
    expect(campos.numero).toBe("");
    expect(campos.bairroId).toBe("");
    expect(campos.telefone).toBe("");
    expect(campos.whatsapp).toBe("");
  });

  it("campo esvaziado atravessa vazio, e é isso que apaga o telefone", () => {
    /*
      A regra do importador — célula vazia nunca apaga — vale para planilha,
      onde branco significa "não tenho essa informação". Num formulário
      PRÉ-PREENCHIDO, campo que o operador esvaziou é uma afirmação: "este
      consultório não tem telefone". Se o vazio não atravessasse daqui, o
      telefone seria inapagável pela tela. Ver a seção 9 da especificação.
    */
    expect(lerCamposDoLocal(formulario({ telefone: "" })).telefone).toBe("");
  });
});

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

  /*
    O painel deriva de `ROTULO_ACESSIBILIDADE` (lib/dados/tipos.ts) em vez de
    repetir os cinco pares à mão — a mesma lista que o cartão do médico usa no
    site público. Sem este teste, um sexto recurso acrescentado só de um dos
    lados não quebraria nada: o painel deixaria marcar um recurso que o site
    nunca mostra, ou o site mostraria um que o painel não deixa editar.
  */
  it("o conjunto de valores é exatamente o mesmo que o site usa em ROTULO_ACESSIBILIDADE", () => {
    expect(RECURSOS_DE_ACESSIBILIDADE.map((r) => r.valor).sort()).toEqual(
      Object.keys(ROTULO_ACESSIBILIDADE).sort(),
    );
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
  `local` não tem unicidade e nunca é removível: cada endereço duplicado é
  lixo permanente, e ele parte o `quantosMedicos` em dois — desligando calado
  o aviso de endereço compartilhado, que é a razão de o campo existir.
*/
describe("chaveDeEndereco", () => {
  it("acento, caixa e espaço a mais não fazem endereço diferente", () => {
    expect(chaveDeEndereco("  Rua   Simplício  MOREIRA ", "1200", 2)).toBe(
      chaveDeEndereco("rua simplicio moreira", "1200", 2),
    );
  });

  it("número diferente é endereço diferente", () => {
    expect(chaveDeEndereco("Rua Simplício Moreira", "1200", 2)).not.toBe(
      chaveDeEndereco("Rua Simplício Moreira", "1300", 2),
    );
  });

  it("bairro diferente é endereço diferente, com a mesma rua e o mesmo número", () => {
    expect(chaveDeEndereco("Rua Sete", "10", 2)).not.toBe(chaveDeEndereco("Rua Sete", "10", 3));
  });

  it("número nulo e número vazio são o mesmo endereço", () => {
    expect(chaveDeEndereco("Rua Sete", null, 2)).toBe(chaveDeEndereco("Rua Sete", "  ", 2));
  });

  it("sem número não colide com o número 1", () => {
    /*
      A junção é por separador, não por concatenação: sem ele, ("Rua Sete",
      null, 21) e ("Rua Sete", "2", 1) dariam a mesma chave.
    */
    expect(chaveDeEndereco("Rua Sete", null, 21)).not.toBe(chaveDeEndereco("Rua Sete", "2", 1));
  });
});

describe("acharEnderecoIgual", () => {
  const existentes = [
    { id: 5, logradouro: "Rua Simplício Moreira", numero: "1200", bairro_id: 2 },
    { id: 8, logradouro: "Avenida Bernardo Sayão", numero: null, bairro_id: 3 },
  ];

  it("acha o equivalente escrito de outro jeito", () => {
    const novo = { logradouro: "rua simplicio  moreira", numero: "1200", bairro_id: 2 };
    expect(acharEnderecoIgual(novo, existentes)).toBe(5);
  });

  it("endereço que não existe devolve nulo, e aí a ação cria", () => {
    const novo = { logradouro: "Rua Nova", numero: "1", bairro_id: 2 };
    expect(acharEnderecoIgual(novo, existentes)).toBeNull();
  });

  it("mesma rua em bairro diferente não é o mesmo endereço", () => {
    const novo = { logradouro: "Rua Simplício Moreira", numero: "1200", bairro_id: 9 };
    expect(acharEnderecoIgual(novo, existentes)).toBeNull();
  });

  it("sem nenhum endereço cadastrado, devolve nulo em vez de estourar", () => {
    expect(acharEnderecoIgual({ logradouro: "Rua Sete", numero: null, bairro_id: 1 }, [])).toBeNull();
  });

  it("com duplicatas já no banco, liga à primeira em vez de recusar", () => {
    /*
      As duplicatas que já existirem continuam existindo — remover endereço
      não é permitido. O que esta função garante é que não entra a terceira.
    */
    const comDuplicata = [
      ...existentes,
      { id: 11, logradouro: "Rua Simplício Moreira", numero: "1200", bairro_id: 2 },
    ];
    const novo = { logradouro: "Rua Simplício Moreira", numero: "1200", bairro_id: 2 };
    expect(acharEnderecoIgual(novo, comDuplicata)).toBe(5);
  });
});

/*
  O menu de "ligar a consultório existente" mostra rua, número e bairro. O que
  ele recebia era `LocalDoMedico` de TODO consultório do sistema — telefone,
  WhatsApp, CEP, acessibilidade e a contagem de médicos de cada um —
  serializado para o navegador dentro de um Client Component. `buscarLocais`,
  a outra leitura que existia para isto, nunca foi chamada por ninguém.
*/
describe("paraLocalNaLista", () => {
  const linha = {
    id: 9,
    logradouro: "Rua Simplício Moreira",
    numero: "1200",
    bairro: { id: 2, nome: "Centro" },
  };

  it("traz o id, a rua, o número e o nome do bairro", () => {
    expect(paraLocalNaLista(linha)).toEqual({
      id: 9,
      logradouro: "Rua Simplício Moreira",
      numero: "1200",
      bairro: "Centro",
    });
  });

  it("número nulo atravessa como nulo, não string vazia", () => {
    expect(paraLocalNaLista({ ...linha, numero: null }).numero).toBeNull();
  });

  it("não copia nada além dos quatro campos, mesmo se a linha trouxer", () => {
    const gorda = { ...linha, telefone: "9935243716", whatsapp: "99988020205", cep: "65900-000" };
    expect(Object.keys(paraLocalNaLista(gorda)).sort()).toEqual(
      ["bairro", "id", "logradouro", "numero"],
    );
  });
});

describe("todosOsLocais", () => {
  it("não pede ao banco nada que o menu não mostra", () => {
    /*
      Varredura de fonte porque a leitura é `async` e fala com o banco. O que
      está sendo vigiado é o que sai do banco: `paraLocalNaLista` recortar
      depois não adiantaria nada se a consulta continuasse trazendo o cadastro
      inteiro — o custo é a viagem e a serialização, não o objeto final.
    */
    const arquivo = semComentarios(fonte("../lib/painel/locais.ts"));

    /*
      A constante `SELECAO_DE_LOCAL` é substituída pelo texto dela antes do
      exame. Sem isso, voltar a `.select(SELECAO_DE_LOCAL)` — que é a regressão
      provável, porque era o que estava escrito aqui — passa verde: o nome da
      constante não contém a palavra "telefone", o valor dela contém.
    */
    const selecaoInteira = /const SELECAO_DE_LOCAL = `([\s\S]*?)`/.exec(arquivo)?.[1];
    expect(selecaoInteira, "não achei SELECAO_DE_LOCAL").toBeTruthy();

    const corpo = arquivo
      .split("export async function todosOsLocais")[1]
      ?.replaceAll("SELECAO_DE_LOCAL", selecaoInteira ?? "");
    expect(corpo, "não achei todosOsLocais").toBeTruthy();

    for (const campo of ["telefone", "whatsapp", "cep", "local_acessibilidade", "atendimento"]) {
      expect(corpo, `todosOsLocais pede ${campo} ao banco`).not.toContain(campo);
    }
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

/*
  Todo `select` desta tela abre vazio.

  O de "ligar consultório existente" abria já com o primeiro endereço
  escolhido: quem clicasse em "Ligar" sem escolher ligava o médico ao
  consultório de outra pessoa, e isso vai ao ar na página pública. O de bairro,
  no mesmo arquivo, já abria vazio — era inconsistência interna, não descuido
  isolado.
*/
describe("BlocoLocais.tsx", () => {
  const tela = semComentarios(fonte("../components/painel/BlocoLocais.tsx"));

  it("nenhum select abre com uma opção já escolhida", () => {
    const selects = [...tela.matchAll(/<select[\s\S]*?<\/select>/g)].map((m) => m[0]);
    expect(selects.length, "não achei select nenhum").toBeGreaterThan(0);

    for (const s of selects) {
      const id = /id="([^"]+)"/.exec(s)?.[1] ?? /id=\{([^}]+)\}/.exec(s)?.[1] ?? "(sem id)";
      expect(s, `o select ${id} não tem opção vazia desabilitada`).toMatch(
        /<option value="" disabled>/,
      );
      expect(s, `o select ${id} não abre na opção vazia`).toContain("defaultValue=");
    }
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

  it("criarLocal procura endereço igual antes de criar outro", () => {
    /*
      Ancorada em texto, como a de `reconciliarAcessibilidade` abaixo: as
      asserções estruturais deste arquivo não olham PARA O QUE a ação faz
      antes de gravar. Uma versão que criasse sempre continuaria passando por
      todas elas.

      A ordem é medida: procurar depois de criar não evita duplicata nenhuma.
    */
    const criar = codigo.split("export async function criarLocal")[1] ?? "";
    const procura = criar.indexOf("acharEnderecoIgual(");
    const cria = criar.search(/\.from\("local"\)\s*\.insert\(/);

    expect(procura, "criarLocal não procura endereço equivalente").toBeGreaterThan(-1);
    expect(cria, "não achei a criação do endereço").toBeGreaterThan(-1);
    expect(procura, "procura o endereço equivalente depois de criar").toBeLessThan(cria);
    expect(criar, "não avisa que ligou a um endereço já cadastrado").toContain("aviso");
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

  it("cada gravação pede as linhas afetadas de volta na própria cadeia", () => {
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
      O gatilho é GRAVAR, não invalidar. A versão anterior dispensava do exame
      a ação que não chamasse `invalidar()` — a condição que dispensava era a
      própria coisa examinada, e uma ação que apagasse `atendimento` sem
      `if (!data)` e sem `invalidar()` passava verde.

      Ancora na CHAMADA `invalidar()`, não em `revalidatePath(`: medir a
      posição de `revalidatePath(` mede a DEFINIÇÃO do helper, não o momento em
      que ele roda. E confere por ação: no arquivo inteiro, o `if (!data)` de
      uma ação cobriria o `invalidar()` de outra.

      `criarLocal` e `salvarLocal` conferem sob nomes diferentes — `if
      (!criado.data)`, `if (!ligado.data)`, `if (!data)` — por isso a busca casa
      qualquer uma dessas três formas, em vez de fixar um nome de variável.
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
      `exigirAdmin()` de `criarLocal` — a primeira função do arquivo — cobre a
      escrita de toda ação depois dela, e uma ação nova que pulasse a guarda
      passaria verde. Mesmo corte de `export async function` que a asserção de
      `invalidar()` já usa, acima.
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
});
