import { afterEach, describe, expect, it, vi } from "vitest";
import { estaNoAr, paraBanner } from "@/lib/sanity/banners";

const AGORA = new Date("2026-08-23T12:00:00Z");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("estaNoAr", () => {
  it("sem data de validade, fica para sempre", () => {
    expect(estaNoAr({ expiraEm: null }, AGORA)).toBe(true);
  });

  it("com data no futuro, aparece", () => {
    expect(estaNoAr({ expiraEm: "2026-09-01" }, AGORA)).toBe(true);
  });

  it("com data de ontem, some", () => {
    expect(estaNoAr({ expiraEm: "2026-08-22" }, AGORA)).toBe(false);
  });

  it("no proprio dia da validade, ainda aparece", () => {
    /*
      "Aparece até 23/08" significa que 23/08 é o último dia em que aparece,
      não o primeiro em que some. Quem preenche pensa na data do evento.
    */
    expect(estaNoAr({ expiraEm: "2026-08-23" }, AGORA)).toBe(true);
  });

  it("no ultimo segundo LOCAL do proprio dia, ainda aparece", () => {
    /*
      O teste anterior usa AGORA ao meio-dia, quase doze horas antes do fim
      do dia de validade - por isso ele passa tanto com `>=` quanto com `>`,
      e sozinho não prova que o "igual" da comparação importa. Este caso
      fecha esse buraco: coloca AGORA exatamente no último instante LOCAL
      (offset "-03:00", o mesmo que `estaNoAr` usa para ancorar `fim`) do
      próprio dia de validade - o único ponto em que `fim.getTime()` e
      `agora.getTime()` são iguais e `>=` e `>` discordam.

      Precisa do offset "-03:00" aqui, e não "Z": um `AGORA` em UTC nunca
      encosta no instante exato que `fim` agora usa (ver o teste "22h
      locais", acima), e o teste voltaria a não provar nada, calado,
      exatamente como o de antes da correção do fuso.
    */
    const ultimoInstanteDoDiaLocal = new Date("2026-08-23T23:59:59-03:00");
    expect(
      estaNoAr({ expiraEm: "2026-08-23" }, ultimoInstanteDoDiaLocal),
    ).toBe(true);
  });

  it("as 22h locais do dia da validade ainda aparecem (fuso de Imperatriz, nao UTC)", () => {
    /*
      Imperatriz e UTC-3. Ancorar o fim do dia em "T23:59:59Z" (UTC) faz o
      banner sumir as 20h59 LOCAIS do dia da validade - tres horas antes do
      que o campo promete por escrito ("o ultimo dia em que ele aparece").

      Mesma classe de defeito que dataPorExtenso() ja resolveu em
      lib/formato.ts (teste "le data sem hora no fuso local, nao em UTC" em
      testes/formato.test.ts): data sem hora precisa ser ancorada no fuso de
      quem visita, com offset explicito "-03:00", nao em UTC.

      22h locais em Imperatriz no dia 23/08 e um instante real dentro da
      janela que o defeito cortava (entre 20h59 e 23h59 locais) - o banner
      tem que continuar visivel.
    */
    const as22hLocais = new Date("2026-08-23T22:00:00-03:00");
    expect(estaNoAr({ expiraEm: "2026-08-23" }, as22hLocais)).toBe(true);
  });

  it("com data que o Date nao entende, degrada em vez de quebrar", () => {
    /*
      O campo `expiraEm` e um `date` do Studio, cuja UI so escreve
      "AAAA-MM-DD" - por essa porta, uma string invalida nao acontece. Mas
      `estaNoAr` recebe o que veio do banco, e o banco pode ter sido escrito
      por outra coisa (migracao, API, edicao manual do documento).

      `new Date("lixo" + "T23:59:59-03:00")` produz uma Invalid Date, cujo
      `getTime()` e NaN. Toda comparacao com NaN e falsa, entao a funcao nao
      lanca excecao: ela devolve `false`, e o banner some como se tivesse
      vencido. E a mesma filosofia de `urlDaImagem` em lib/sanity/imagem.ts -
      uma entrada quebrada custa aquele item, nunca a pagina inteira. Fica
      registrado aqui para que ninguem troque a comparacao por algo que lance
      em cima de NaN sem perceber que muda esse comportamento.
    */
    expect(() =>
      estaNoAr({ expiraEm: "nao-e-uma-data" }, AGORA),
    ).not.toThrow();
    expect(estaNoAr({ expiraEm: "nao-e-uma-data" }, AGORA)).toBe(false);
  });
});

describe("paraBanner", () => {
  const BRUTO = {
    id: "1",
    nome: "Assembleia geral",
    imagem: {
      asset: { _ref: "image-abc123def456-3000x856-jpg" },
      alt: "Assembleia geral no dia 12 de marco, as 19h, na sede da AMI",
    },
    destino: "/associacao",
    ordem: 10,
    expiraEm: null,
  };

  it("monta o banner quando a imagem resolve", () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
    const banner = paraBanner(BRUTO);
    expect(banner).not.toBeNull();
    expect(banner?.imagem).toContain("cdn.sanity.io");
    expect(banner?.alt).toBe(BRUTO.imagem.alt);
    expect(banner?.destino).toBe("/associacao");
    expect(banner?.ordem).toBe(10);
  });

  it("descarta o banner inteiro quando o _ref da imagem esta corrompido", () => {
    /*
      `defined(imagem.asset)` no GROQ so garante que existe um asset, nao
      que a URL sai: um `_ref` corrompido (upload em andamento, referencia
      quebrada) passa o filtro do banco e so se revela aqui. O carrossel nao
      pode receber `<img src="">` - mesmo padrao de TextoRico.tsx, que
      descarta o bloco de imagem inteiro pelo mesmo motivo.
    */
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
    const comRefQuebrado = {
      ...BRUTO,
      imagem: { asset: { _ref: "nao-e-um-ref-valido" }, alt: BRUTO.imagem.alt },
    };
    expect(paraBanner(comRefQuebrado)).toBeNull();
  });
});
