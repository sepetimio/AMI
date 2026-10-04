import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARTE_CELULAR,
  ARTE_LARGA,
  GROQ_BANNERS,
  LARGURAS_DA_ARTE,
  LARGURAS_DA_ARTE_CELULAR,
  LARGURAS_DA_FOTO,
  estaNoAr,
  imagemComSrcset,
  paraBanner,
} from "@/lib/sanity/banners";
import { tipos } from "@/sanity/schemas";

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
    if (banner?.tipo !== "arte") throw new Error("devia ser arte");
    expect(banner.imagem).toContain("cdn.sanity.io");
    expect(banner.alt).toBe(BRUTO.imagem.alt);
    expect(banner.destino).toBe("/associacao");
    expect(banner.ordem).toBe(10);
  });

  it("descarta o banner inteiro quando o _ref da imagem esta corrompido", () => {
    /*
      `defined(imagem.asset)` no GROQ so garante que existe um asset, nao
      que a URL sai: um `_ref` corrompido (upload em andamento, referencia
      quebrada) passa o filtro do banco e so se revela aqui. O carrossel nao
      pode receber `<img src="">` - mesmo padrao de CorpoDoTexto.tsx, que
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

describe("paraBanner, dois tipos", () => {
  const IMAGEM_OK = {
    asset: { _ref: "image-abc123def456-3000x856-jpg" },
    alt: "Assembleia geral no dia 12 de marco, as 19h, na sede da AMI",
  };
  const QUEBRADA = { asset: { _ref: "nao-e-um-ref-valido" } };

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  });

  it("banner sem tipo e com imagem e arte (os ja cadastrados continuam valendo)", () => {
    const b = paraBanner({ id: "a", nome: "x", imagem: IMAGEM_OK, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b?.tipo).toBe("arte");
  });

  it("arte sem versao de celular sai com imagemCelular null", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b && b.tipo === "arte" && b.imagemCelular).toBeNull();
  });

  it("arte com versao de celular pede 1080 de largura; a larga pede 3000", () => {
    const b = paraBanner({
      id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK,
      imagemCelular: { asset: { _ref: "image-fed654cba321-1080x1350-jpg" } },
      destino: null, ordem: 10, expiraEm: null,
    } as never);
    if (!b || b.tipo !== "arte") throw new Error("devia ser arte");
    expect(b.imagem).toContain(`w=${ARTE_LARGA.largura}`);
    expect(b.imagemCelular).toContain(`w=${ARTE_CELULAR.largura}`);
  });

  it("as medidas das duas artes sao as do carrossel aprovado", () => {
    expect(ARTE_LARGA).toEqual({ largura: 3000, altura: 1288 });
    expect(ARTE_CELULAR).toEqual({ largura: 1080, altura: 1350 });
  });

  it("arte com a versao de celular quebrada perde so a versao de celular", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK, imagemCelular: QUEBRADA, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b?.tipo).toBe("arte");
    expect(b && b.tipo === "arte" && b.imagemCelular).toBeNull();
  });

  it("arte sem tema vale escuro", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b && b.tipo === "arte" && b.tema).toBe("escuro");
  });

  it("arte com tema claro continua clara", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK, tema: "claro", destino: null, ordem: 10, expiraEm: null } as never);
    expect(b && b.tipo === "arte" && b.tema).toBe("claro");
  });

  it("arte sem imagem, ou com a imagem quebrada, e descartada", () => {
    expect(paraBanner({ id: "a", nome: "x", tipo: "arte", destino: null, ordem: 10, expiraEm: null } as never)).toBeNull();
    expect(paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: QUEBRADA, destino: null, ordem: 10, expiraEm: null } as never)).toBeNull();
  });

  it("composto sem foto continua valendo, com foto null", () => {
    const b = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "Os médicos de Imperatriz", destino: "/x", ordem: 20, expiraEm: null } as never);
    expect(b).toMatchObject({ tipo: "composto", titulo: "Os médicos de Imperatriz", foto: null });
  });

  it("composto sem titulo e descartado", () => {
    expect(paraBanner({ id: "c", nome: "y", tipo: "composto", destino: null, ordem: 20, expiraEm: null } as never)).toBeNull();
  });

  it("composto com foto: pede 1600 de largura, leva a descricao e os textos", () => {
    const b = paraBanner({
      id: "c", nome: "y", tipo: "composto", titulo: "Assembleia",
      foto: { asset: { _ref: "image-abc123def456-1600x900-jpg" }, alt: "Plenario cheio" },
      rotulo: "Agenda", texto: "Dia 12, as 19h.", botao: "Saiba mais",
      destino: "/x", ordem: 20, expiraEm: null,
    } as never);
    if (!b || b.tipo !== "composto") throw new Error("devia ser composto");
    expect(b.foto).toContain("cdn.sanity.io");
    expect(b.foto).toContain("w=1600");
    expect(b).toMatchObject({ fotoAlt: "Plenario cheio", rotulo: "Agenda", texto: "Dia 12, as 19h.", botao: "Saiba mais" });
  });

  it("composto com a foto quebrada perde so a foto", () => {
    const b = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "Assembleia", foto: QUEBRADA, destino: null, ordem: 20, expiraEm: null } as never);
    expect(b).toMatchObject({ tipo: "composto", titulo: "Assembleia", foto: null });
  });

  it("composto sem os campos opcionais sai com null neles", () => {
    const b = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "Assembleia", destino: null, ordem: 20, expiraEm: null } as never);
    expect(b).toMatchObject({ rotulo: null, texto: null, botao: null, destino: null, fotoAlt: "" });
  });

  it("composto nao herda a imagem de arte que sobrou no documento", () => {
    /* Quem troca o tipo no Studio deixa a `imagem` antiga guardada (so fica
       escondida). O composto nao pode virar arte por causa disso. */
    const b = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "Assembleia", imagem: IMAGEM_OK, destino: null, ordem: 20, expiraEm: null } as never);
    expect(b?.tipo).toBe("composto");
  });
});

describe("o srcset das imagens do carrossel", () => {
  const IMAGEM = { asset: { _ref: "image-abc123def456-3000x1288-jpg" }, alt: "Arte" };
  const CELULAR = { asset: { _ref: "image-fed654cba321-1080x1350-jpg" } };
  const FOTO = { asset: { _ref: "image-0a1b2c3d4e5f-1600x1200-jpg" }, alt: "Foto" };
  const QUEBRADA = { asset: { _ref: "nao-e-um-ref-valido" } };

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  });

  /* Cada entrada do srcset: o endereço e a largura que ele declara. */
  function entradas(srcset: string | null | undefined): { url: string; w: number }[] {
    expect(srcset, "sem srcset").toBeTruthy();
    return srcset!.split(", ").map((e) => {
      const [url, w] = e.split(" ");
      return { url, w: Number(/^(\d+)w$/.exec(w)?.[1]) };
    });
  }

  /* A largura declarada é a que o endereço pede ao CDN, e o `src` é a maior. */
  function confere(srcset: string | null | undefined, src: string | null | undefined, larguras: number[]) {
    const lista = entradas(srcset);
    expect(lista.map((e) => e.w)).toEqual(larguras);
    for (const { url, w } of lista) {
      expect(url).toContain("cdn.sanity.io");
      expect(new URL(url).searchParams.get("w")).toBe(String(w));
    }
    expect(src).toBe(lista.at(-1)!.url);
  }

  it("as listas de larguras", () => {
    expect(LARGURAS_DA_ARTE).toEqual([800, 1200, 1800, 2400, 3000]);
    expect(LARGURAS_DA_ARTE_CELULAR).toEqual([540, 1080]);
    expect(LARGURAS_DA_FOTO).toEqual([600, 1000, 1600]);
  });

  it("a arte larga em 800, 1200, 1800, 2400 e 3000; a de celular em 540 e 1080", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM, imagemCelular: CELULAR, destino: null, ordem: 1, expiraEm: null } as never);
    if (!b || b.tipo !== "arte") throw new Error("devia ser arte");
    confere(b.imagemSrcset, b.imagem, [800, 1200, 1800, 2400, 3000]);
    confere(b.imagemCelularSrcset, b.imagemCelular, [540, 1080]);
  });

  it("a foto do composto em 600, 1000 e 1600", () => {
    const b = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "T", foto: FOTO, destino: null, ordem: 1, expiraEm: null } as never);
    if (!b || b.tipo !== "composto") throw new Error("devia ser composto");
    confere(b.fotoSrcset, b.foto, [600, 1000, 1600]);
  });

  it("sem a imagem, ou com ela quebrada, o srcset some junto com o endereço", () => {
    const sem = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM, imagemCelular: QUEBRADA, destino: null, ordem: 1, expiraEm: null } as never);
    expect(sem).toMatchObject({ imagemCelular: null, imagemCelularSrcset: null });
    const semFoto = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "T", destino: null, ordem: 1, expiraEm: null } as never);
    expect(semFoto).toMatchObject({ foto: null, fotoSrcset: null });
    expect(imagemComSrcset(QUEBRADA, LARGURAS_DA_FOTO)).toBeNull();
    expect(imagemComSrcset(null, LARGURAS_DA_FOTO)).toBeNull();
  });
});

describe("a consulta e o cadastro falam dos mesmos campos", () => {
  it("todo campo do banner no Studio é projetado pela consulta", () => {
    /* Campo novo no Studio sem entrar no GROQ chega ao site como undefined,
       calado. A consulta é uma string exportada, não o código-fonte. */
    const banner = tipos.find((t) => t.name === "banner") as unknown as {
      fields: { name: string }[];
    };
    for (const { name } of banner.fields) {
      expect(GROQ_BANNERS, `a consulta não projeta "${name}"`).toMatch(
        new RegExp(String.raw`(^|[\s,])${name}(\{|,|\s|$)`),
      );
    }
  });
});

describe("paraBanner, ponto de interesse e tema", () => {
  const IMAGEM = {
    asset: { _ref: "image-abc123def456-3000x1288-jpg" },
    alt: "Assembleia geral no dia 12 de marco, as 19h, na sede da AMI",
  };
  const FOTO = { asset: { _ref: "image-abc123def456-1600x900-jpg" }, alt: "Plenario" };
  const ARTE = { id: "a", nome: "x", tipo: "arte", destino: null, ordem: 10, expiraEm: null };
  const COMPOSTO = { id: "c", nome: "y", tipo: "composto", titulo: "Assembleia", destino: null, ordem: 20, expiraEm: null };

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  });

  const foco = (b: ReturnType<typeof paraBanner>) => (b ? b.foco : "sem banner");

  it("a arte leva o ponto de interesse da imagem larga", () => {
    const b = paraBanner({ ...ARTE, imagem: { ...IMAGEM, hotspot: { x: 0.25, y: 0.6, width: 0.3, height: 0.3 } } } as never);
    expect(foco(b)).toEqual({ x: 0.25, y: 0.6 });
  });

  it("o composto leva o ponto de interesse da foto", () => {
    const b = paraBanner({ ...COMPOSTO, foto: { ...FOTO, hotspot: { x: 0.7, y: 0.4 } } } as never);
    expect(foco(b)).toEqual({ x: 0.7, y: 0.4 });
  });

  it("sem ponto de interesse marcado, o foco e null", () => {
    expect(foco(paraBanner({ ...ARTE, imagem: IMAGEM } as never))).toBeNull();
    expect(foco(paraBanner({ ...ARTE, imagem: { ...IMAGEM, hotspot: null } } as never))).toBeNull();
    expect(foco(paraBanner({ ...COMPOSTO, foto: FOTO } as never))).toBeNull();
    expect(foco(paraBanner({ ...COMPOSTO } as never))).toBeNull();
  });

  it("ponto de interesse incompleto ou fora de 0 a 1 vale como sem marcacao", () => {
    for (const hotspot of [{ x: 0.5 }, { y: 0.5 }, { x: -0.1, y: 0.5 }, { x: 0.5, y: 1.2 }, { x: Number.NaN, y: 0.5 }, { x: "0.5", y: 0.5 }, { x: 0.5, y: "0.5" }]) {
      expect(foco(paraBanner({ ...ARTE, imagem: { ...IMAGEM, hotspot } } as never)), JSON.stringify(hotspot)).toBeNull();
    }
  });

  it("os limites 0 e 1 valem", () => {
    const b = paraBanner({ ...ARTE, imagem: { ...IMAGEM, hotspot: { x: 0, y: 1 } } } as never);
    expect(foco(b)).toEqual({ x: 0, y: 1 });
  });

  it("o composto nao pega o ponto de interesse da arte que sobrou no documento", () => {
    const b = paraBanner({ ...COMPOSTO, imagem: { ...IMAGEM, hotspot: { x: 0.1, y: 0.1 } } } as never);
    expect(foco(b)).toBeNull();
  });

  it("tema que nao e escuro nem claro vale escuro", () => {
    for (const tema of ["azul", "", null, 3]) {
      const b = paraBanner({ ...ARTE, imagem: IMAGEM, tema } as never);
      expect(b && b.tipo === "arte" && b.tema, String(tema)).toBe("escuro");
    }
  });
});
