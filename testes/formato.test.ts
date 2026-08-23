import { describe, expect, it } from "vitest";
import {
  contagem,
  dataPorExtenso,
  formatarTelefone,
  identificacaoMedica,
} from "@/lib/formato";

describe("formatarTelefone", () => {
  it("formata celular de 11 dígitos", () => {
    expect(formatarTelefone("99988887777")).toBe("(99) 98888-7777");
  });

  it("formata fixo de 10 dígitos", () => {
    expect(formatarTelefone("9933334444")).toBe("(99) 3333-4444");
  });

  it("ignora o que não for dígito na entrada", () => {
    expect(formatarTelefone("+55 (99) 98888-7777")).toBe("(99) 98888-7777");
  });

  it("devolve a entrada quando o tamanho não é reconhecido", () => {
    expect(formatarTelefone("123")).toBe("123");
  });
});

describe("identificacaoMedica", () => {
  it("acompanha o CRM da palavra MÉDICO, como exige a CFM 2.336/2023", () => {
    expect(identificacaoMedica("12345", "MA")).toBe("MÉDICO · CRM/MA 12345");
  });

  it("normaliza a UF para maiúscula", () => {
    expect(identificacaoMedica("999", "ma")).toBe("MÉDICO · CRM/MA 999");
  });
});

describe("contagem", () => {
  it("usa o singular quando há exatamente um", () => {
    expect(contagem(1, "médico", "médicos")).toBe("1 médico");
  });

  it("usa o plural nos demais casos, inclusive zero", () => {
    expect(contagem(0, "médico", "médicos")).toBe("0 médicos");
    expect(contagem(24, "médico", "médicos")).toBe("24 médicos");
  });
});

describe("dataPorExtenso", () => {
  it("escreve a data em português", () => {
    expect(dataPorExtenso("2026-08-21T14:30:00Z")).toBe("21 de agosto de 2026");
  });

  it("lê a data no fuso de Imperatriz, e não no do servidor", () => {
    /* O Studio grava o instante correspondente à hora local de quem
       preencheu. Meia-noite de 1º de março em Imperatriz é 03:00 UTC, e é
       assim que a data volta do Sanity.

       Sem `timeZone` fixo, a Vercel formataria em UTC e a data sairia certa
       por acaso neste caso, mas errada para qualquer publicação da madrugada.
       Verificado com Intl antes de entrar no plano. */
    expect(dataPorExtenso("2026-03-01T03:00:00Z")).toBe("1 de março de 2026");
  });

  it("um instante de meia-noite UTC cai no dia anterior, e é isso mesmo", () => {
    /* 00:00 UTC é 21:00 do dia anterior em Imperatriz, e o leitor de lá deve
       ver o dia dele, não o de Greenwich. Documentado como teste em vez de
       contornado: um valor assim só aparece se alguém escrever a data direto
       pela API, sem passar pelo Studio.

       A primeira versão deste plano afirmava "1 de março" aqui, o que estava
       errado. Pego na varredura anterior à execução. */
    expect(dataPorExtenso("2026-03-01T00:00:00Z")).toBe("28 de fevereiro de 2026");
  });

  it("devolve string vazia para entrada inválida", () => {
    /* Data ausente é caso real: `atualizadoEm` é opcional no schema. Melhor
       não desenhar nada do que desenhar "Invalid Date". */
    expect(dataPorExtenso("")).toBe("");
    expect(dataPorExtenso("nao-e-data")).toBe("");
  });

  it("lê data sem hora no fuso local, não em UTC", () => {
    /* "2026-08-21" é o formato de uma coluna `date` pura do Postgres, caso de
       `mandato_inicio`/`mandato_fim` em `diretoria` (tarefa 8). `new Date`
       sozinho lê data-só como meia-noite UTC, que em America/Fortaleza
       (UTC-3) já é o dia anterior: sem tratamento, esta entrada devolvia
       "20 de agosto de 2026", um dia errado, achado na revisão desta tarefa
       depois de rodar a função e conferir a saída. */
    expect(dataPorExtenso("2026-08-21")).toBe("21 de agosto de 2026");
  });

  it("data sem hora e o timestamp de meio-dia local equivalente concordam", () => {
    /* Trava as duas leituras lado a lado: a entrada sem hora e a entrada com
       hora explícita ao meio-dia de Imperatriz têm de produzir exatamente a
       mesma data por extenso, senão o tratamento de uma delas regrediu. */
    expect(dataPorExtenso("2026-08-21")).toBe(
      dataPorExtenso("2026-08-21T12:00:00-03:00"),
    );
  });
});
