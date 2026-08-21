import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listarDiretoria,
  ordenarDiretoria,
  resolverCrmDoDiretor,
  type Diretor,
} from "@/lib/dados/diretoria";

/*
  Dublê do cliente do Supabase, com uma exigência: ele **honra a projeção**,
  devolvendo só as colunas que a consulta pediu.

  Um dublê que devolvesse a linha inteira sem olhar o `select` não pegaria a
  regressão que motivou este teste, que foi exatamente apagar `crm, crm_uf`
  do embed do perfil. A página foi a zero CRM na tela e os 239 testes seguiram
  verdes, porque todos exercitavam `resolverCrmDoDiretor` com o objeto
  `perfil` já pronto na mão. Devolver menos do que se tem é o comportamento
  do PostgREST que importa aqui.
*/
const consulta = vi.hoisted(() => ({
  selecionado: "",
  linhas: [] as Record<string, unknown>[],
}));

/* Divide a lista de colunas por vírgulas de topo, ignorando as que estão
   dentro dos parênteses de um embed. */
function colunasDeTopo(selecionado: string): string[] {
  const campos: string[] = [];
  let profundidade = 0;
  let atual = "";
  for (const ch of selecionado) {
    if (ch === "(") profundidade++;
    if (ch === ")") profundidade--;
    if (ch === "," && profundidade === 0) {
      campos.push(atual);
      atual = "";
      continue;
    }
    atual += ch;
  }
  campos.push(atual);
  return campos.map((c) => c.trim()).filter(Boolean);
}

function colunasDoEmbed(selecionado: string): string[] {
  const embed = selecionado.match(/profissional:profissional_id\s*\(([^)]*)\)/);
  return embed ? embed[1].split(",").map((c) => c.trim()).filter(Boolean) : [];
}

function projetar(linha: Record<string, unknown>, selecionado: string) {
  const topo = colunasDeTopo(selecionado).map((c) => c.split(":")[0]);
  const saida: Record<string, unknown> = {};
  for (const campo of topo) {
    if (campo.startsWith("profissional")) continue;
    if (campo in linha) saida[campo] = linha[campo];
  }
  const perfil = linha.profissional as Record<string, unknown> | null | undefined;
  if (selecionado.includes("profissional:profissional_id")) {
    saida.profissional = perfil
      ? Object.fromEntries(
          colunasDoEmbed(selecionado)
            .filter((campo) => campo in perfil)
            .map((campo) => [campo, perfil[campo]]),
        )
      : null;
  }
  return saida;
}

vi.mock("@/lib/dados/cliente", () => ({
  clienteServidor: () => ({
    from: () => ({
      select: (campos: string) => {
        consulta.selecionado = campos;
        return {
          eq: async () => ({
            data: consulta.linhas.map((l) => projetar(l, campos)),
            error: null,
          }),
        };
      },
    }),
  }),
}));

const D = (p: Partial<Diretor>): Diretor => ({
  id: 1,
  nome: "Fulano",
  cargo: "Diretor",
  ordem: 10,
  slugDoPerfil: null,
  crm: null,
  crmUf: null,
  medico: true,
  foto: null,
  ...p,
});

describe("ordenarDiretoria", () => {
  it("respeita a ordem definida pela AMI", () => {
    /* A hierarquia da diretoria não é alfabética nem cronológica: presidente
       vem antes de vice, que vem antes de tesoureiro. Só a AMI sabe a ordem,
       e ela vive na coluna `ordem`. */
    const fora = [D({ id: 3, ordem: 30 }), D({ id: 1, ordem: 10 }), D({ id: 2, ordem: 20 })];
    expect(ordenarDiretoria(fora).map((d) => d.id)).toEqual([1, 2, 3]);
  });

  it("desempata por nome quando a ordem repete", () => {
    /* Dois vogais com a mesma ordem é caso normal. Sem desempate, a ordem
       na tela mudaria a cada consulta ao banco, e a página pareceria
       instável sem motivo. */
    const empate = [
      D({ id: 1, nome: "Zilda", ordem: 40 }),
      D({ id: 2, nome: "Ana", ordem: 40 }),
    ];
    expect(ordenarDiretoria(empate).map((d) => d.nome)).toEqual(["Ana", "Zilda"]);
  });

  it("não altera o array recebido", () => {
    const original = [D({ id: 2, ordem: 20 }), D({ id: 1, ordem: 10 })];
    ordenarDiretoria(original);
    expect(original.map((d) => d.id)).toEqual([2, 1]);
  });
});

describe("resolverCrmDoDiretor", () => {
  it("prefere a coluna própria da linha de diretoria", () => {
    /* A restrição `diretor_medico_tem_inscricao` (0004_diretoria_crm.sql)
       exige `crm`/`crm_uf` na própria linha de todo diretor médico
       publicado. É a única inscrição que o banco garante existir e que o
       visitante anônimo sempre enxerga, então é ela que manda quando as duas
       origens divergem. */
    expect(
      resolverCrmDoDiretor(
        { crm: "20364", crmUf: "MA" },
        { crm: "10274", crmUf: "MA" },
      ),
    ).toEqual({ crm: "20364", crmUf: "MA" });
  });

  it("usa só a coluna própria quando não há perfil ligado", () => {
    /* Caso do diretor recém-eleito, ainda sem perfil no diretório. */
    expect(
      resolverCrmDoDiretor({ crm: "20364", crmUf: "MA" }, null),
    ).toEqual({ crm: "20364", crmUf: "MA" });
  });

  it("cai no perfil ligado quando a coluna própria está vazia", () => {
    /* Este é o caso que faltava, e a falta dele deixou passar uma regressão
       ao vivo: a página da diretoria ficou sem nenhum CRM na tela porque a
       consulta parou de projetar o CRM do perfil, e nenhum teste reclamou.

       A reserva não enfraquece a garantia. A garantia mora na restrição do
       banco, que continua exigindo as colunas próprias. Aqui, quando o
       perfil existe e está publicado, `profissional.crm` é `not null` e veio
       da mesma verificação que liberou aquele médico para o diretório: é
       dado correto e ao alcance. Omiti-lo seria produzir exatamente a tela
       que a Resolução CFM 2.336/2023, Art. 4º, I proíbe. */
    expect(
      resolverCrmDoDiretor(
        { crm: null, crmUf: null },
        { crm: "10274", crmUf: "MA" },
      ),
    ).toEqual({ crm: "10274", crmUf: "MA" });
  });

  it("ignora a origem que tem só metade da inscrição", () => {
    /* CRM sem UF não identifica ninguém: duas UFs numeram inscrições de
       forma independente. Meia inscrição vale zero, e passa a vez. */
    expect(
      resolverCrmDoDiretor(
        { crm: "20364", crmUf: null },
        { crm: "10274", crmUf: "MA" },
      ),
    ).toEqual({ crm: "10274", crmUf: "MA" });
  });

  it("devolve vazio quando nenhuma das duas origens tem inscrição", () => {
    /* Havia aqui dois casos com entrada e expectativa idênticas, anunciados
       como estados diferentes por causa de `medico`. Não eram: `medico` não
       é parâmetro desta função, e nunca poderia mudar o resultado. Um só,
       então, cobrindo as duas leituras do mesmo retorno:

       Com `medico = false`, um contador na tesouraria por exemplo, é o
       estado normal: a restrição do banco não exige CRM dele e não há nada
       para o cartão mostrar.

       Com `medico = true`, é um diretor médico publicado sem CRM em lugar
       nenhum, estado que a restrição `diretor_medico_tem_inscricao` torna
       impossível de gravar. Se ainda assim chegar aqui, devolver vazio é o
       que faz `CartaoDiretor` omitir a linha inteira em vez de escrever
       "MÉDICO · CRM/null" ao lado de um nome.

       Quem quiser separar os dois de verdade tem de testar a restrição
       contra um banco, não esta função. */
    expect(
      resolverCrmDoDiretor({ crm: null, crmUf: null }, null),
    ).toEqual({ crm: null, crmUf: null });
  });
});

describe("listarDiretoria", () => {
  beforeEach(() => {
    consulta.selecionado = "";
    consulta.linhas = [];
  });

  const LINHA = {
    id: 1,
    nome: "Larissa Nogueira",
    cargo: "Diretora científica",
    ordem: 30,
    crm: null,
    crm_uf: null,
    medico: true,
    profissional: {
      slug: "larissa-nogueira",
      crm: "10274",
      crm_uf: "MA",
      foto: null,
    },
  };

  it("projeta o CRM do perfil ligado, e não só slug e foto", () => {
    /* Esta é a asserção que faltava. `resolverCrmDoDiretor` pode estar
       perfeita e a tela ficar sem CRM assim mesmo, porque quem decide se o
       dado chega à função é a lista de colunas da consulta. Foi por aí que a
       regressão passou. */
    consulta.linhas = [LINHA];
    return listarDiretoria().then(() => {
      const embed = consulta.selecionado.match(
        /profissional:profissional_id\s*\(([^)]*)\)/,
      );
      expect(embed).not.toBeNull();
      const colunas = embed![1].split(",").map((c) => c.trim());
      expect(colunas).toContain("crm");
      expect(colunas).toContain("crm_uf");
    });
  });

  it("exibe o CRM do perfil quando a coluna própria está vazia", () => {
    /* O caminho inteiro, da consulta ao objeto que o cartão recebe. Com o
       dublê honrando a projeção, apagar `crm, crm_uf` do embed derruba este
       teste junto com o de cima. */
    consulta.linhas = [LINHA];
    return listarDiretoria().then(([diretor]) => {
      expect(diretor.crm).toBe("10274");
      expect(diretor.crmUf).toBe("MA");
      expect(diretor.slugDoPerfil).toBe("larissa-nogueira");
    });
  });

  it("prefere a coluna própria da linha quando ela tem conteúdo", () => {
    consulta.linhas = [{ ...LINHA, crm: "20364", crm_uf: "MA" }];
    return listarDiretoria().then(([diretor]) => {
      expect(diretor.crm).toBe("20364");
    });
  });

  it("não sai com CRM quando não há coluna própria nem perfil visível", () => {
    /* O estado que a RLS produz: diretor ligado a um profissional ainda
       despublicado, que o visitante anônimo não enxerga, então o embed volta
       nulo. É por isso que a restrição do banco exige a coluna própria. */
    consulta.linhas = [{ ...LINHA, profissional: null }];
    return listarDiretoria().then(([diretor]) => {
      expect(diretor.crm).toBeNull();
      expect(diretor.crmUf).toBeNull();
      expect(diretor.slugDoPerfil).toBeNull();
    });
  });
});
