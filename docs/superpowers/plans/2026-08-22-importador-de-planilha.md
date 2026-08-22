# Importador de planilha de associados — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carregar os cerca de 500 associados da AMI a partir de uma planilha, com conferência antes de gravar, e publicá-los em lote depois.

**Architecture:** O núcleo é uma biblioteca pura em `lib/importador/` que recebe as linhas da planilha e um retrato do banco e devolve um plano; nada nela toca disco, rede ou credencial. Os comandos em `scripts/` são cascas finas que leem o arquivo, buscam o retrato, imprimem o relatório e, só com `--gravar`, executam. A conferência e a gravação derivam do mesmo plano, então o que o relatório descreve é o que a gravação faz.

**Tech Stack:** TypeScript, Node, vitest, `@supabase/supabase-js`, `read-excel-file`, `write-excel-file`, `tsx`.

**Spec:** [`docs/superpowers/specs/2026-08-22-importador-de-planilha-design.md`](../specs/2026-08-22-importador-de-planilha-design.md)

## Global Constraints

Estas regras valem para **toda** tarefa. Não se repetem em cada uma.

- **Português em todo identificador**, comentário e mensagem. O projeto inteiro é assim: `crmUf` no domínio, `crm_uf` no banco.
- **`lib/importador/` é puro.** Nenhum `import` de `node:fs`, `node:process`, `@supabase/supabase-js` ou de qualquer coisa em `scripts/`. Recebe o estado do banco como argumento.
- **`scripts/` fica fora do aplicativo Next.** Nenhum arquivo sob `app/`, `components/` ou `lib/dados/` importa nada de `scripts/`.
- **A variável da chave secreta é `SUPABASE_CHAVE_IMPORTADOR`.** Nunca com prefixo `NEXT_PUBLIC_`.
- **Nenhum `delete` e nenhum `truncate`** em `lib/importador/` nem em `scripts/`. A tarefa 9 transforma isso em teste.
- **Testes em `testes/`**, nomeados `importador-*.test.ts`, com `describe`/`it` do vitest e alias `@/`. Rodam com `npx vitest run`.
- **CRLF:** o repositório está num checkout Windows. Ao editar arquivo existente por script, normalizar com `.replace(/\r\n/g, "\n")` antes de casar padrão, senão a substituição falha em silêncio.
- **Commits em português**, no imperativo, terminando com `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

### Fatos das bibliotecas, medidos em 22/08/2026 — não confiar em memória

Ambas mudaram a API em relação ao que a maioria dos exemplos na internet mostra.

| Biblioteca | O que **não** funciona | O que funciona |
|---|---|---|
| `write-excel-file@4.1.1` | `writeExcelFile(dados, { filePath })` — **resolve sem erro e não cria arquivo nenhum** | `await writeExcelFile(dados).toFile(caminho)` |
| `read-excel-file@9.3.10` | `readXlsxFile(caminho)` devolvendo linhas | `readXlsxFile(caminho)` devolve `[{ sheet, data }]`; use o export nomeado `readSheet(caminho)`, que devolve as linhas |

Comportamento de leitura, também medido:

- Célula vazia vem como `null`
- Número em célula vem como `number` — um CRM digitado como número chega `4821`, não `"4821"`
- Texto com zero à esquerda só preserva o zero se a célula for texto: `"00512"` volta `"00512"`
- Espaço nas pontas já vem aparado pela biblioteca; espaço duplicado no meio **não**
- Linha totalmente vazia no meio da planilha volta como `[null, null, ...]`
- Linhas vazias no fim são descartadas pela biblioteca antes de chegar ao código

### Fatos do banco que o plano assume

Conferidos em `supabase/migrations/0001_diretorio.sql`:

- `profissional` tem `unique (crm, crm_uf)` — é a chave natural, garantida pelo banco
- `profissional.slug` é `unique`
- `profissional_especialidade` tem chave primária `(profissional_id, especialidade_id)` e coluna `principal boolean not null default false`
- `local.estabelecimento_id` aceita nulo — consultório sem estabelecimento é caso previsto
- `local.bairro_id` é `not null` — endereço sem bairro não pode ser gravado
- `atendimento` tem `unique (profissional_id, local_id)`
- `profissional.publicado` é `boolean not null default false`

E de `lib/dados/sinonimos.ts`: já existem `SINONIMOS`, `normalizar(s)` e `especialidadeCasaTermo(especialidade, termo)`. Reaproveitar, não reescrever.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `lib/importador/tipos.ts` | Todos os tipos compartilhados | 1 |
| `lib/importador/texto.ts` | Normalização, slug, distância de edição | 1 |
| `lib/importador/colunas.ts` | As 13 colunas e o reconhecimento do cabeçalho | 2 |
| `lib/importador/linha.ts` | Uma linha crua → linha válida ou erro | 3 |
| `lib/importador/agrupar.ts` | Linhas → médicos, juntando CRM repetido | 4 |
| `lib/importador/catalogo.ts` | Resolver especialidade e bairro | 5 |
| `lib/importador/plano.ts` | Médicos + retrato → plano | 6 |
| `lib/importador/relatorio.ts` | Plano → texto | 7 |
| `scripts/credencial.ts` | Chave secreta e cliente privilegiado | 8 |
| `scripts/retrato.ts` | Ler o banco para um `Retrato` | 8 |
| `scripts/gravar.ts` | Executar o plano | 9 |
| `scripts/modelo.ts` | Gerar `modelo-associados.xlsx` | 10 |
| `scripts/importar.ts` | O comando `importar` | 10 |
| `scripts/publicar.ts` | O comando `publicar` | 11 |
| `docs/como-remontar-o-ambiente.md` | Passos numerados de reconfiguração | 12 |

---

## Task 1: Tipos, texto e dependências

**Files:**
- Modify: `package.json`
- Create: `lib/importador/tipos.ts`
- Create: `lib/importador/texto.ts`
- Test: `testes/importador-texto.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `semAcento`, `chave`, `paraSlug`, `distanciaDeEdicao`, `maisParecido`, e todos os tipos usados pelas tarefas 2 a 11

- [ ] **Step 1: Instalar as dependências**

```bash
npm i -D read-excel-file@^9.3.10 write-excel-file@^4.1.1 tsx
```

`tsx` entra explícito: o script `doc-legal` já depende dele e ele só existe hoje por dependência transitiva.

- [ ] **Step 2: Criar `lib/importador/tipos.ts`**

```ts
/*
  Os tipos que atravessam o importador inteiro.

  Ficam num arquivo só, sem nenhuma implementação, porque as tarefas 2 a 11
  se referem a eles e um tipo declarado dentro do módulo que o usa primeiro
  cria dependência de ida e volta.
*/

/** O que `read-excel-file` devolve numa célula. Medido, não suposto. */
export type Celula = string | number | boolean | Date | null;

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const;

export type Uf = (typeof UFS)[number];

export const NOMES_DE_COLUNA = [
  "nome", "crm", "uf_do_crm", "especialidade", "rqe", "telemedicina",
  "logradouro", "numero", "complemento", "bairro", "cep", "telefone",
  "whatsapp",
] as const;

export type NomeDeColuna = (typeof NOMES_DE_COLUNA)[number];

export type Cabecalho = {
  /** Coluna reconhecida → índice dela na linha. */
  indices: Partial<Record<NomeDeColuna, number>>;
  /** Títulos presentes no arquivo que o importador não usa. */
  ignoradas: string[];
};

/** Problema que NÃO impede o médico de entrar. */
export type Aviso =
  | { tipo: "campo-descartado"; linha: number; campo: NomeDeColuna; motivo: string }
  | { tipo: "especialidade-desconhecida"; linha: number; texto: string }
  | { tipo: "especialidade-fora-do-catalogo"; linha: number; texto: string }
  | { tipo: "rqe-perdido"; linha: number; rqe: string }
  | { tipo: "endereco-sem-bairro"; linha: number }
  | { tipo: "nome-mudou"; linha: number; de: string; para: string; slug: string };

/** Problema que descarta a linha inteira. */
export type ErroDeLinha = { linha: number; motivo: string };

export type EnderecoLido = {
  linha: number;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
};

export type LinhaLida = {
  /** Número da linha na planilha como a AMI a enxerga. O cabeçalho é 1. */
  linha: number;
  nome: string;
  crm: string;
  crmUf: Uf;
  especialidade: string | null;
  rqe: string | null;
  /** Nulo quando a célula está vazia: "não sei", e não "falso". */
  telemedicina: boolean | null;
  endereco: EnderecoLido | null;
  avisos: Aviso[];
};

export type EspecialidadeDaPlanilha = {
  texto: string;
  rqe: string | null;
  linha: number;
};

export type MedicoDaPlanilha = {
  crm: string;
  crmUf: Uf;
  nome: string;
  telemedicina: boolean | null;
  especialidades: EspecialidadeDaPlanilha[];
  enderecos: EnderecoLido[];
  linhas: number[];
};

/* --- O retrato do banco, montado por scripts/retrato.ts --- */

export type Retrato = {
  profissionais: {
    id: number;
    slug: string;
    nome: string;
    crm: string;
    crmUf: string;
    telemedicina: boolean;
    associadoAmi: boolean;
    publicado: boolean;
  }[];
  especialidades: { id: number; nome: string; slug: string }[];
  bairros: { id: number; nome: string; slug: string }[];
  locais: {
    id: number;
    profissionalId: number;
    logradouro: string;
    numero: string | null;
    complemento: string | null;
    bairroId: number;
    cep: string | null;
    telefone: string | null;
    whatsapp: string | null;
  }[];
  vinculosEspecialidade: {
    profissionalId: number;
    especialidadeId: number;
    rqe: string | null;
  }[];
};

/* --- O plano --- */

export type Mudanca = { campo: string; de: string; para: string };

export type BairroPlanejado =
  | { tipo: "existente"; id: number }
  | { tipo: "novo"; slug: string };

export type EnderecoPlanejado = {
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: BairroPlanejado;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
};

export type VinculoPlanejado = {
  especialidadeId: number;
  rqe: string | null;
  principal: boolean;
};

export type MedicoNovo = {
  crm: string;
  crmUf: string;
  nome: string;
  slug: string;
  telemedicina: boolean;
  especialidades: VinculoPlanejado[];
  enderecos: EnderecoPlanejado[];
  linhas: number[];
};

export type MedicoAtualizado = {
  id: number;
  crm: string;
  crmUf: string;
  nome: string;
  mudancas: Mudanca[];
  especialidadesNovas: VinculoPlanejado[];
  enderecosNovos: EnderecoPlanejado[];
  enderecosAtualizados: { id: number; mudancas: Mudanca[] }[];
  /** Quantos endereços o banco tem para este médico e a planilha não trouxe. */
  enderecosSoNoBanco: number;
  linhas: number[];
};

export type BairroNovo = {
  nome: string;
  slug: string;
  medicos: number;
  /** Nome de bairro existente ou novo com que este se parece demais. */
  parecidoCom: string | null;
};

export type Plano = {
  arquivo: string;
  linhasLidas: number;
  medicosDistintos: number;
  colunasIgnoradas: string[];
  bairrosNovos: BairroNovo[];
  criar: MedicoNovo[];
  atualizar: MedicoAtualizado[];
  erros: ErroDeLinha[];
  avisos: Aviso[];
  ausentes: { crm: string; crmUf: string; nome: string }[];
};
```

- [ ] **Step 3: Escrever o teste que falha, em `testes/importador-texto.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  chave,
  distanciaDeEdicao,
  maisParecido,
  paraSlug,
  semAcento,
} from "@/lib/importador/texto";

describe("semAcento", () => {
  it("tira acento sem mexer no resto", () => {
    expect(semAcento("Juçara")).toBe("Jucara");
    expect(semAcento("São João")).toBe("Sao Joao");
  });
});

describe("chave", () => {
  it("é a mesma para escritas diferentes do mesmo bairro", () => {
    expect(chave("Nova Imperatriz")).toBe(chave("nova imperatriz"));
    expect(chave("  JUÇARA  ")).toBe(chave("Juçara"));
  });

  it("colapsa espaço do meio, que a biblioteca de planilha não apara", () => {
    expect(chave("Rua  Coriolano   Milhomem")).toBe("rua coriolano milhomem");
  });
});

describe("paraSlug", () => {
  it("gera o mesmo formato que o banco já usa", () => {
    expect(paraSlug("Juçara")).toBe("jucara");
    expect(paraSlug("Maranhão Novo")).toBe("maranhao-novo");
    expect(paraSlug("Parque do Buriti")).toBe("parque-do-buriti");
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(paraSlug("  Centro!  ")).toBe("centro");
    expect(paraSlug("Vila Lobão -")).toBe("vila-lobao");
  });
});

describe("distanciaDeEdicao", () => {
  it("conta as trocas mínimas", () => {
    expect(distanciaDeEdicao("imperatriz", "imperatris")).toBe(1);
    expect(distanciaDeEdicao("centro", "centro")).toBe(0);
    expect(distanciaDeEdicao("bacuri", "bacurizinho")).toBe(5);
  });
});

describe("maisParecido", () => {
  it("acha o erro de digitação", () => {
    expect(maisParecido("Nova Imperatris", ["Centro", "Nova Imperatriz"])).toBe(
      "Nova Imperatriz",
    );
  });

  it("não inventa parentesco entre bairros diferentes de verdade", () => {
    expect(maisParecido("Bacurizinho", ["Centro", "Bacuri"])).toBe(null);
  });

  it("não compara nome curto, onde uma letra já é outro bairro", () => {
    expect(maisParecido("Sol", ["Sul"])).toBe(null);
  });

  it("ignora acento e caixa ao comparar", () => {
    expect(maisParecido("jucara", ["Juçara"])).toBe("Juçara");
  });
});
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-texto.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/texto"`

- [ ] **Step 5: Implementar `lib/importador/texto.ts`**

```ts
/*
  Normalização de texto do importador.

  Separado de `lib/dados/sinonimos.ts` de propósito: lá `normalizar` serve à
  busca do visitante e pode mudar por razões de busca. Aqui as mesmas
  operações decidem se dois bairros são o mesmo bairro e qual endereço um
  perfil terá para sempre. Amarrar as duas faria uma melhoria de busca mudar
  URL de perfil publicado.
*/

export function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Forma canônica para comparar dois textos que deveriam ser o mesmo.
 * Sem acento, minúsculo, espaços colapsados e aparados.
 */
export function chave(s: string): string {
  return semAcento(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Slug no mesmo formato que o banco já usa — igual ao de
 * `supabase/seed/gerar-seed.ts`, para que bairro criado pelo importador não
 * fique diferente de bairro criado pelo seed.
 */
export function paraSlug(s: string): string {
  return semAcento(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Levenshtein. Usado só para desconfiar de erro de digitação em bairro. */
export function distanciaDeEdicao(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        atual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + custo,
      );
    }
    anterior = atual;
  }

  return anterior[b.length];
}

/*
  Dois nomes normalizados de tamanho >= 5 e distância <= 2 são tratados como
  provável erro de digitação.

  O piso de 5 não é gosto: em nome curto uma letra de diferença costuma ser
  outro bairro de verdade, e um aviso falso a cada linha ensina quem lê o
  relatório a ignorar o aviso — que é pior do que não ter aviso.
*/
const TAMANHO_MINIMO = 5;
const DISTANCIA_MAXIMA = 2;

/** Devolve o candidato parecido demais com o alvo, ou nulo. */
export function maisParecido(alvo: string, candidatos: string[]): string | null {
  const a = chave(alvo);
  if (a.length < TAMANHO_MINIMO) return null;

  let melhor: string | null = null;
  let menor = Infinity;

  for (const c of candidatos) {
    const b = chave(c);
    if (b.length < TAMANHO_MINIMO) continue;
    if (a === b) continue;

    const d = distanciaDeEdicao(a, b);
    if (d <= DISTANCIA_MAXIMA && d < menor) {
      menor = d;
      melhor = c;
    }
  }

  return melhor;
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-texto.test.ts`
Expected: PASS, 11 testes

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/importador/ testes/importador-texto.test.ts
git commit -m "Cria a fundação de texto do importador

Normalização própria, separada da de busca em lib/dados/sinonimos.ts: lá
ela serve ao visitante e pode mudar por razões de busca; aqui ela decide
se dois bairros são o mesmo e qual URL um perfil terá para sempre.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Reconhecimento do cabeçalho

**Files:**
- Create: `lib/importador/colunas.ts`
- Test: `testes/importador-colunas.test.ts`

**Interfaces:**
- Consumes: `Celula`, `Cabecalho`, `NomeDeColuna`, `NOMES_DE_COLUNA` de `lib/importador/tipos.ts`; `chave` de `lib/importador/texto.ts`
- Produces: `TITULOS: Record<NomeDeColuna, string>`, `lerCabecalho(primeiraLinha: Celula[]): Cabecalho`

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-colunas.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { TITULOS, lerCabecalho } from "@/lib/importador/colunas";
import { NOMES_DE_COLUNA } from "@/lib/importador/tipos";

describe("TITULOS", () => {
  it("tem título para cada uma das 13 colunas", () => {
    expect(NOMES_DE_COLUNA).toHaveLength(13);
    for (const c of NOMES_DE_COLUNA) {
      expect(TITULOS[c]).toBeTruthy();
    }
  });
});

describe("lerCabecalho", () => {
  it("reconhece o cabeçalho do modelo, na ordem do modelo", () => {
    const cab = lerCabecalho([...NOMES_DE_COLUNA]);
    expect(cab.indices.nome).toBe(0);
    expect(cab.indices.crm).toBe(1);
    expect(cab.indices.whatsapp).toBe(12);
    expect(cab.ignoradas).toEqual([]);
  });

  it("reconhece em qualquer ordem", () => {
    const cab = lerCabecalho(["crm", "nome"]);
    expect(cab.indices.crm).toBe(0);
    expect(cab.indices.nome).toBe(1);
  });

  it("aceita acento, caixa e espaço no lugar do sublinhado", () => {
    const cab = lerCabecalho(["Nome", "CRM", "UF do CRM", "Especialidade"]);
    expect(cab.indices.nome).toBe(0);
    expect(cab.indices.crm).toBe(1);
    expect(cab.indices.uf_do_crm).toBe(2);
    expect(cab.indices.especialidade).toBe(3);
  });

  it("lista o que não reconheceu, com o título como estava no arquivo", () => {
    const cab = lerCabecalho(["nome", "crm", "E-mail", "bio"]);
    expect(cab.ignoradas).toEqual(["E-mail", "bio"]);
  });

  it("ignora célula vazia do cabeçalho sem chamar de coluna desconhecida", () => {
    const cab = lerCabecalho(["nome", "crm", null, "  "]);
    expect(cab.ignoradas).toEqual([]);
  });

  it("a primeira ocorrência vence quando um título se repete", () => {
    const cab = lerCabecalho(["nome", "crm", "nome"]);
    expect(cab.indices.nome).toBe(0);
  });

  it("cabeçalho sem nome nem crm devolve os índices ausentes", () => {
    const cab = lerCabecalho(["telefone"]);
    expect(cab.indices.nome).toBeUndefined();
    expect(cab.indices.crm).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-colunas.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/colunas"`

- [ ] **Step 3: Implementar `lib/importador/colunas.ts`**

```ts
import { chave } from "@/lib/importador/texto";
import {
  NOMES_DE_COLUNA,
  type Cabecalho,
  type Celula,
  type NomeDeColuna,
} from "@/lib/importador/tipos";

/*
  As 13 colunas.

  O título é o que sai no modelo e o que a AMI enxerga. O reconhecimento é
  frouxo de propósito — casa por forma normalizada, com o sublinhado valendo
  espaço — porque a planilha vai voltar editada por várias pessoas e "UF do
  CRM" digitado à mão não pode reprovar o arquivo inteiro.
*/
export const TITULOS: Record<NomeDeColuna, string> = {
  nome: "nome",
  crm: "crm",
  uf_do_crm: "uf_do_crm",
  especialidade: "especialidade",
  rqe: "rqe",
  telemedicina: "telemedicina",
  logradouro: "logradouro",
  numero: "numero",
  complemento: "complemento",
  bairro: "bairro",
  cep: "cep",
  telefone: "telefone",
  whatsapp: "whatsapp",
};

/** Chave de comparação: sublinhado e hífen contam como espaço. */
function chaveDeTitulo(s: string): string {
  return chave(s.replace(/[_-]+/g, " "));
}

const PORCHAVE = new Map<string, NomeDeColuna>(
  NOMES_DE_COLUNA.map((c) => [chaveDeTitulo(TITULOS[c]), c]),
);

export function lerCabecalho(primeiraLinha: Celula[]): Cabecalho {
  const indices: Partial<Record<NomeDeColuna, number>> = {};
  const ignoradas: string[] = [];

  primeiraLinha.forEach((celula, i) => {
    const bruto = celula === null ? "" : String(celula);
    if (!bruto.trim()) return;

    const reconhecida = PORCHAVE.get(chaveDeTitulo(bruto));

    if (!reconhecida) {
      ignoradas.push(bruto.trim());
      return;
    }

    /* A primeira ocorrência vence: coluna repetida é engano de quem editou,
       e a segunda costuma estar vazia. */
    if (indices[reconhecida] === undefined) indices[reconhecida] = i;
  });

  return { indices, ignoradas };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-colunas.test.ts`
Expected: PASS, 8 testes

- [ ] **Step 5: Commit**

```bash
git add lib/importador/colunas.ts testes/importador-colunas.test.ts
git commit -m "Reconhece o cabeçalho da planilha

Casa por forma normalizada, com sublinhado valendo espaço, porque a
planilha volta editada por várias pessoas e 'UF do CRM' digitado à mão
não pode reprovar o arquivo inteiro. Coluna que não reconhece vira lista
de ignoradas, para que nada da AMI suma calado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Leitura e validação de linha

**Files:**
- Create: `lib/importador/linha.ts`
- Test: `testes/importador-linha.test.ts`

**Interfaces:**
- Consumes: `Cabecalho`, `Celula`, `LinhaLida`, `ErroDeLinha`, `Uf`, `UFS`, `Aviso`, `EnderecoLido` de `tipos.ts`; `chave` de `texto.ts`
- Produces: `ehLinhaVazia(celulas: Celula[]): boolean`, `lerLinha(celulas: Celula[], cab: Cabecalho, linha: number): LinhaLida | ErroDeLinha`, `ehErro(r: LinhaLida | ErroDeLinha): r is ErroDeLinha`

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-linha.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { ehErro, ehLinhaVazia, lerLinha } from "@/lib/importador/linha";
import { NOMES_DE_COLUNA, type Cabecalho, type Celula } from "@/lib/importador/tipos";

/* Cabeçalho completo, na ordem de NOMES_DE_COLUNA, para os testes. */
const CAB: Cabecalho = {
  indices: Object.fromEntries(NOMES_DE_COLUNA.map((c, i) => [c, i])),
  ignoradas: [],
};

/** Monta uma linha a partir de pares coluna/valor. */
function linha(valores: Partial<Record<(typeof NOMES_DE_COLUNA)[number], Celula>>): Celula[] {
  return NOMES_DE_COLUNA.map((c) => valores[c] ?? null);
}

describe("ehLinhaVazia", () => {
  it("reconhece a linha em branco do meio da planilha", () => {
    expect(ehLinhaVazia([null, null, null])).toBe(true);
    expect(ehLinhaVazia([null, "   ", null])).toBe(true);
    expect(ehLinhaVazia([])).toBe(true);
  });

  it("não confunde com linha que só tem o nome", () => {
    expect(ehLinhaVazia([null, "Ana", null])).toBe(false);
  });

  it("não confunde com o número zero", () => {
    expect(ehLinhaVazia([0])).toBe(false);
  });
});

describe("lerLinha — o que rejeita a linha inteira", () => {
  it("nome vazio", () => {
    const r = lerLinha(linha({ crm: 4821 }), CAB, 5);
    expect(ehErro(r) && r.motivo).toContain("nome");
    expect(ehErro(r) && r.linha).toBe(5);
  });

  it("crm vazio", () => {
    const r = lerLinha(linha({ nome: "Ana Souza" }), CAB, 88);
    expect(ehErro(r) && r.motivo).toContain("CRM");
  });

  it("crm sem dígito nenhum", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: "a definir" }), CAB, 9);
    expect(ehErro(r)).toBe(true);
  });

  it("uf que não existe", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: 1, uf_do_crm: "MAA" }), CAB, 355);
    expect(ehErro(r) && r.motivo).toContain("MAA");
  });
});

describe("lerLinha — o que entra", () => {
  it("crm chegando como número vira texto", () => {
    const r = lerLinha(linha({ nome: "Ana Souza", crm: 4821 }), CAB, 2);
    expect(ehErro(r)).toBe(false);
    if (ehErro(r)) return;
    expect(r.crm).toBe("4821");
  });

  it("crm com pontuação perde a pontuação", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: "CRM 4.821" }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.crm).toBe("4821");
  });

  it("crm em texto preserva o zero à esquerda", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: "00512" }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.crm).toBe("00512");
  });

  it("uf vazia vira MA, e uf minúscula vira maiúscula", () => {
    const a = lerLinha(linha({ nome: "Ana", crm: 1 }), CAB, 2);
    const b = lerLinha(linha({ nome: "Bia", crm: 2, uf_do_crm: "to" }), CAB, 3);
    if (ehErro(a) || ehErro(b)) throw new Error("não deveria rejeitar");
    expect(a.crmUf).toBe("MA");
    expect(b.crmUf).toBe("TO");
  });

  it("colapsa espaço duplicado do nome, que a biblioteca não apara", () => {
    const r = lerLinha(linha({ nome: "Ana   Paula  Souza", crm: 1 }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.nome).toBe("Ana Paula Souza");
  });

  it("telemedicina entende sim, não, s, n, x e vazio", () => {
    const casos: [Celula, boolean | null][] = [
      ["sim", true], ["SIM", true], ["s", true], ["x", true], [true, true],
      ["não", false], ["nao", false], ["n", false], [false, false],
      [null, null], ["", null],
    ];
    for (const [valor, esperado] of casos) {
      const r = lerLinha(linha({ nome: "Ana", crm: 1, telemedicina: valor }), CAB, 2);
      if (ehErro(r)) throw new Error("não deveria rejeitar");
      expect(r.telemedicina, `valor ${JSON.stringify(valor)}`).toBe(esperado);
    }
  });
});

describe("lerLinha — o que descarta só o campo", () => {
  it("telefone curto some e o médico fica", () => {
    const r = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "Rua A", bairro: "Centro", telefone: "3524" }),
      CAB,
      102,
    );
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco?.telefone).toBeNull();
    expect(r.avisos).toContainEqual(
      expect.objectContaining({ tipo: "campo-descartado", campo: "telefone", linha: 102 }),
    );
  });

  it("telefone de 10 e de 11 dígitos entram, só com dígitos", () => {
    const a = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "R", bairro: "Centro", telefone: "(99) 3524-3716" }),
      CAB, 2,
    );
    const b = lerLinha(
      linha({ nome: "Bia", crm: 2, logradouro: "R", bairro: "Centro", whatsapp: "99988020205" }),
      CAB, 3,
    );
    if (ehErro(a) || ehErro(b)) throw new Error("não deveria rejeitar");
    expect(a.endereco?.telefone).toBe("9935243716");
    expect(b.endereco?.whatsapp).toBe("99988020205");
  });

  it("cep de 8 dígitos entra, com ou sem hífen, e o curto some", () => {
    const bom = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "R", bairro: "Centro", cep: "65900-330" }),
      CAB, 2,
    );
    const numero = lerLinha(
      linha({ nome: "Bia", crm: 2, logradouro: "R", bairro: "Centro", cep: 65900330 }),
      CAB, 3,
    );
    const ruim = lerLinha(
      linha({ nome: "Cid", crm: 3, logradouro: "R", bairro: "Centro", cep: "6590" }),
      CAB, 267,
    );
    if (ehErro(bom) || ehErro(numero) || ehErro(ruim)) throw new Error("não deveria rejeitar");
    expect(bom.endereco?.cep).toBe("65900330");
    expect(numero.endereco?.cep).toBe("65900330");
    expect(ruim.endereco?.cep).toBeNull();
    expect(ruim.avisos).toContainEqual(
      expect.objectContaining({ tipo: "campo-descartado", campo: "cep", linha: 267 }),
    );
  });
});

describe("lerLinha — o endereço", () => {
  it("sem logradouro não há endereço, e isso não é problema", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: 1 }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco).toBeNull();
    expect(r.avisos).toEqual([]);
  });

  it("logradouro sem bairro não vira endereço, e avisa", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: 1, logradouro: "Rua A" }), CAB, 40);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco).toBeNull();
    expect(r.avisos).toContainEqual({ tipo: "endereco-sem-bairro", linha: 40 });
  });

  it("número chegando como número vira texto", () => {
    const r = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "Rua Coriolano Milhomem", numero: 39, bairro: "Centro" }),
      CAB, 2,
    );
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco?.numero).toBe("39");
    expect(r.endereco?.logradouro).toBe("Rua Coriolano Milhomem");
    expect(r.endereco?.bairro).toBe("Centro");
  });
});

describe("lerLinha — especialidade e RQE", () => {
  it("guarda o texto cru da especialidade, sem resolver", () => {
    const r = lerLinha(
      linha({ nome: "Ana", crm: 1, especialidade: "  Cardiologia ", rqe: 1234 }),
      CAB, 2,
    );
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.especialidade).toBe("Cardiologia");
    expect(r.rqe).toBe("1234");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-linha.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/linha"`

- [ ] **Step 3: Implementar `lib/importador/linha.ts`**

```ts
import { chave } from "@/lib/importador/texto";
import {
  UFS,
  type Aviso,
  type Cabecalho,
  type Celula,
  type EnderecoLido,
  type ErroDeLinha,
  type LinhaLida,
  type NomeDeColuna,
  type Uf,
} from "@/lib/importador/tipos";

/*
  Uma linha da planilha vira ou um médico ou um erro.

  Três níveis de problema, e só o primeiro descarta a linha:

  1. IDENTIDADE quebrada — nome, CRM ou UF. Sem isso não há a quem atribuir
     o resto, e adivinhar cola um consultório no médico errado
  2. CAMPO que não normaliza — telefone, whatsapp, CEP. O médico entra sem
     ele. Gravar um telefone que não é telefone é pior do que não ter
  3. ESPECIALIDADE não resolvida — decidida na tarefa 5, contra o catálogo
*/

/** Converte a célula em texto aparado, com espaço do meio colapsado. */
function texto(c: Celula): string {
  if (c === null || c === undefined) return "";
  if (c instanceof Date) return c.toISOString().slice(0, 10);
  return String(c).replace(/\s+/g, " ").trim();
}

function valor(celulas: Celula[], cab: Cabecalho, coluna: NomeDeColuna): string {
  const i = cab.indices[coluna];
  return i === undefined ? "" : texto(celulas[i]);
}

export function ehLinhaVazia(celulas: Celula[]): boolean {
  return celulas.every((c) => texto(c) === "");
}

export function ehErro(r: LinhaLida | ErroDeLinha): r is ErroDeLinha {
  return "motivo" in r;
}

const SIM = new Set(["sim", "s", "x", "true", "1", "verdadeiro"]);
const NAO = new Set(["nao", "n", "false", "0", "falso"]);

function lerBooleano(bruto: string): boolean | null {
  if (!bruto) return null;
  const k = chave(bruto);
  if (SIM.has(k)) return true;
  if (NAO.has(k)) return false;
  return null;
}

/** Só dígitos, ou nulo com aviso se a contagem não bater. */
function digitos(
  bruto: string,
  campo: NomeDeColuna,
  linha: number,
  aceitos: number[],
  avisos: Aviso[],
): string | null {
  if (!bruto) return null;

  const so = bruto.replace(/\D/g, "");
  if (aceitos.includes(so.length)) return so;

  avisos.push({
    tipo: "campo-descartado",
    campo,
    linha,
    motivo: `"${bruto}" tem ${so.length} ${so.length === 1 ? "dígito" : "dígitos"}`,
  });
  return null;
}

export function lerLinha(
  celulas: Celula[],
  cab: Cabecalho,
  linha: number,
): LinhaLida | ErroDeLinha {
  const avisos: Aviso[] = [];

  /* --- Nível 1: identidade --- */

  const nome = valor(celulas, cab, "nome");
  if (!nome) return { linha, motivo: "sem nome" };

  const crmBruto = valor(celulas, cab, "crm");
  if (!crmBruto) return { linha, motivo: "CRM vazio" };

  /*
    Só os dígitos, e o texto cru preserva zero à esquerda quando a célula é
    texto. Célula numérica perde o zero antes de o código ver — é o Excel que
    perde, não nós, e não há como recuperar.
  */
  const crm = crmBruto.replace(/\D/g, "");
  if (!crm) return { linha, motivo: `CRM "${crmBruto}" não tem dígito nenhum` };

  const ufBruta = valor(celulas, cab, "uf_do_crm");
  const crmUf = (ufBruta ? ufBruta.toUpperCase() : "MA") as Uf;
  if (!(UFS as readonly string[]).includes(crmUf)) {
    return { linha, motivo: `UF do CRM "${ufBruta}" não existe` };
  }

  /* --- Nível 2: campos --- */

  const especialidade = valor(celulas, cab, "especialidade") || null;
  const rqe = valor(celulas, cab, "rqe") || null;
  const telemedicina = lerBooleano(valor(celulas, cab, "telemedicina"));

  const logradouro = valor(celulas, cab, "logradouro");
  const bairro = valor(celulas, cab, "bairro");

  let endereco: EnderecoLido | null = null;

  if (logradouro && !bairro) {
    /* `local.bairro_id` é `not null` no banco: endereço sem bairro não tem
       como ser gravado, e inventar um bairro seria fabricar dado. */
    avisos.push({ tipo: "endereco-sem-bairro", linha });
  } else if (logradouro && bairro) {
    endereco = {
      linha,
      logradouro,
      numero: valor(celulas, cab, "numero") || null,
      complemento: valor(celulas, cab, "complemento") || null,
      bairro,
      cep: digitos(valor(celulas, cab, "cep"), "cep", linha, [8], avisos),
      telefone: digitos(
        valor(celulas, cab, "telefone"), "telefone", linha, [10, 11], avisos,
      ),
      whatsapp: digitos(
        valor(celulas, cab, "whatsapp"), "whatsapp", linha, [10, 11], avisos,
      ),
    };
  }

  return { linha, nome, crm, crmUf, especialidade, rqe, telemedicina, endereco, avisos };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-linha.test.ts`
Expected: PASS, 17 testes

- [ ] **Step 5: Commit**

```bash
git add lib/importador/linha.ts testes/importador-linha.test.ts
git commit -m "Lê e valida uma linha da planilha

Três níveis de problema, e só a identidade quebrada descarta a linha:
telefone de quatro dígitos custa o campo, não o cadastro. Endereço sem
bairro não vira endereço porque local.bairro_id é not null no banco, e
inventar bairro seria fabricar dado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Agrupamento por médico

**Files:**
- Create: `lib/importador/agrupar.ts`
- Test: `testes/importador-agrupar.test.ts`

**Interfaces:**
- Consumes: `LinhaLida`, `ErroDeLinha`, `MedicoDaPlanilha` de `tipos.ts`; `chave` de `texto.ts`
- Produces: `agrupar(linhas: LinhaLida[]): { medicos: MedicoDaPlanilha[]; erros: ErroDeLinha[] }`

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-agrupar.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { agrupar } from "@/lib/importador/agrupar";
import type { EnderecoLido, LinhaLida } from "@/lib/importador/tipos";

function endereco(linha: number, logradouro: string): EnderecoLido {
  return {
    linha, logradouro, numero: null, complemento: null,
    bairro: "Centro", cep: null, telefone: null, whatsapp: null,
  };
}

function lida(p: Partial<LinhaLida> & { linha: number; nome: string; crm: string }): LinhaLida {
  return {
    crmUf: "MA", especialidade: null, rqe: null, telemedicina: null,
    endereco: null, avisos: [], ...p,
  } as LinhaLida;
}

describe("agrupar", () => {
  it("uma linha vira um médico", () => {
    const { medicos, erros } = agrupar([lida({ linha: 2, nome: "Ana Souza", crm: "1" })]);
    expect(erros).toEqual([]);
    expect(medicos).toHaveLength(1);
    expect(medicos[0].nome).toBe("Ana Souza");
    expect(medicos[0].linhas).toEqual([2]);
  });

  it("mesmo CRM e mesmo nome juntam, somando endereços", () => {
    const { medicos, erros } = agrupar([
      lida({ linha: 2, nome: "Ana Souza", crm: "1", endereco: endereco(2, "Rua A") }),
      lida({ linha: 3, nome: "Ana Souza", crm: "1", endereco: endereco(3, "Rua B") }),
    ]);
    expect(erros).toEqual([]);
    expect(medicos).toHaveLength(1);
    expect(medicos[0].enderecos.map((e) => e.logradouro)).toEqual(["Rua A", "Rua B"]);
    expect(medicos[0].linhas).toEqual([2, 3]);
  });

  it("mesmo CRM com nome diferente é erro na segunda linha, não médico novo", () => {
    const { medicos, erros } = agrupar([
      lida({ linha: 97, nome: "Ana Souza", crm: "4821" }),
      lida({ linha: 214, nome: "Bruno Lima", crm: "4821" }),
    ]);
    expect(medicos).toHaveLength(1);
    expect(medicos[0].nome).toBe("Ana Souza");
    expect(erros).toHaveLength(1);
    expect(erros[0].linha).toBe(214);
    expect(erros[0].motivo).toContain("97");
  });

  it("diferença só de acento ou caixa no nome não é erro", () => {
    const { medicos, erros } = agrupar([
      lida({ linha: 2, nome: "João Peçanha", crm: "1" }),
      lida({ linha: 3, nome: "joao pecanha", crm: "1" }),
    ]);
    expect(erros).toEqual([]);
    expect(medicos).toHaveLength(1);
    /* A primeira grafia vence: é a que já entrou. */
    expect(medicos[0].nome).toBe("João Peçanha");
  });

  it("mesmo CRM em UF diferente são dois médicos", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", crmUf: "MA" }),
      lida({ linha: 3, nome: "Bia", crm: "1", crmUf: "TO" }),
    ]);
    expect(medicos).toHaveLength(2);
  });

  it("junta especialidades diferentes do mesmo médico, com o RQE de cada", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", especialidade: "Cardiologia", rqe: "11" }),
      lida({ linha: 3, nome: "Ana", crm: "1", especialidade: "Clínica Médica", rqe: null }),
    ]);
    expect(medicos[0].especialidades).toEqual([
      { texto: "Cardiologia", rqe: "11", linha: 2 },
      { texto: "Clínica Médica", rqe: null, linha: 3 },
    ]);
  });

  it("a mesma especialidade repetida não duplica", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", especialidade: "Cardiologia", rqe: "11" }),
      lida({ linha: 3, nome: "Ana", crm: "1", especialidade: "cardiologia", rqe: null }),
    ]);
    expect(medicos[0].especialidades).toHaveLength(1);
    expect(medicos[0].especialidades[0].rqe).toBe("11");
  });

  it("telemedicina preenchida em qualquer linha vale para o médico", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", telemedicina: null }),
      lida({ linha: 3, nome: "Ana", crm: "1", telemedicina: true }),
    ]);
    expect(medicos[0].telemedicina).toBe(true);
  });

  it("preserva a ordem de aparição na planilha", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Zeca", crm: "9" }),
      lida({ linha: 3, nome: "Ana", crm: "1" }),
    ]);
    expect(medicos.map((m) => m.nome)).toEqual(["Zeca", "Ana"]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-agrupar.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/agrupar"`

- [ ] **Step 3: Implementar `lib/importador/agrupar.ts`**

```ts
import { chave } from "@/lib/importador/texto";
import type {
  ErroDeLinha,
  LinhaLida,
  MedicoDaPlanilha,
} from "@/lib/importador/tipos";

/*
  CRM repetido é o mesmo médico com um segundo local — é como a AMI
  representa quem atende em dois consultórios sem formato aninhado.

  E o mesmo CRM com NOME DIFERENTE é erro, não segundo endereço. Quase sempre
  é CRM digitado errado, e gravar colaria um consultório no médico errado. A
  comparação ignora acento e caixa, porque "João Peçanha" e "joao pecanha"
  são a mesma pessoa digitada por duas pessoas.
*/
export function agrupar(linhas: LinhaLida[]): {
  medicos: MedicoDaPlanilha[];
  erros: ErroDeLinha[];
} {
  const porChave = new Map<string, MedicoDaPlanilha>();
  const primeiraLinhaDe = new Map<string, number>();
  const medicos: MedicoDaPlanilha[] = [];
  const erros: ErroDeLinha[] = [];

  for (const l of linhas) {
    const k = `${l.crm}|${l.crmUf}`;
    const existente = porChave.get(k);

    if (!existente) {
      const novo: MedicoDaPlanilha = {
        crm: l.crm,
        crmUf: l.crmUf,
        nome: l.nome,
        telemedicina: l.telemedicina,
        especialidades: l.especialidade
          ? [{ texto: l.especialidade, rqe: l.rqe, linha: l.linha }]
          : [],
        enderecos: l.endereco ? [l.endereco] : [],
        linhas: [l.linha],
      };
      porChave.set(k, novo);
      primeiraLinhaDe.set(k, l.linha);
      medicos.push(novo);
      continue;
    }

    if (chave(existente.nome) !== chave(l.nome)) {
      erros.push({
        linha: l.linha,
        motivo:
          `CRM ${l.crm} já apareceu na linha ${primeiraLinhaDe.get(k)} ` +
          `com outro nome ("${existente.nome}")`,
      });
      continue;
    }

    existente.linhas.push(l.linha);

    if (l.endereco) existente.enderecos.push(l.endereco);

    /* Primeira resposta preenchida vence. Célula vazia é "não sei". */
    if (existente.telemedicina === null) existente.telemedicina = l.telemedicina;

    if (l.especialidade) {
      const k2 = chave(l.especialidade);
      const jaTem = existente.especialidades.find((e) => chave(e.texto) === k2);
      if (!jaTem) {
        existente.especialidades.push({
          texto: l.especialidade,
          rqe: l.rqe,
          linha: l.linha,
        });
      } else if (!jaTem.rqe && l.rqe) {
        jaTem.rqe = l.rqe;
      }
    }
  }

  return { medicos, erros };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-agrupar.test.ts`
Expected: PASS, 9 testes

- [ ] **Step 5: Commit**

```bash
git add lib/importador/agrupar.ts testes/importador-agrupar.test.ts
git commit -m "Junta as linhas do mesmo médico pelo CRM

CRM repetido é o mesmo médico com um segundo consultório. Com nome
diferente vira erro, porque quase sempre é CRM digitado errado, e gravar
colaria um consultório no médico errado. A comparação de nome ignora
acento e caixa: duas pessoas digitando a mesma pessoa escrevem diferente.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Resolver especialidade e bairro

**Files:**
- Create: `lib/importador/catalogo.ts`
- Test: `testes/importador-catalogo.test.ts`

**Interfaces:**
- Consumes: `Retrato` de `tipos.ts`; `chave`, `paraSlug`, `maisParecido` de `texto.ts`; `SINONIMOS`, `normalizar` de `lib/dados/sinonimos.ts`
- Produces:
```ts
export type ResolucaoEspecialidade =
  | { tipo: "achada"; id: number; nome: string }
  | { tipo: "desconhecida" }
  | { tipo: "fora-do-catalogo"; nome: string };

export type ResolucaoBairro =
  | { tipo: "existente"; id: number; nome: string }
  | { tipo: "novo"; nome: string; slug: string };

export function resolverEspecialidade(
  texto: string,
  catalogo: Retrato["especialidades"],
): ResolucaoEspecialidade;

export function resolverBairro(
  texto: string,
  catalogo: Retrato["bairros"],
): ResolucaoBairro;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-catalogo.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { resolverBairro, resolverEspecialidade } from "@/lib/importador/catalogo";

const ESPECIALIDADES = [
  { id: 1, nome: "Clínica Médica", slug: "clinica-medica" },
  { id: 2, nome: "Cardiologia", slug: "cardiologia" },
  { id: 3, nome: "Ginecologia e Obstetrícia", slug: "ginecologia-e-obstetricia" },
];

const BAIRROS = [
  { id: 1, nome: "Centro", slug: "centro" },
  { id: 2, nome: "Nova Imperatriz", slug: "nova-imperatriz" },
  { id: 3, nome: "Juçara", slug: "jucara" },
];

describe("resolverEspecialidade — degrau 1, nome exato", () => {
  it("acha pelo nome como está no catálogo", () => {
    expect(resolverEspecialidade("Cardiologia", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 2, nome: "Cardiologia",
    });
  });
});

describe("resolverEspecialidade — degrau 2, sem acento e sem caixa", () => {
  it("acha 'clinica medica' minúsculo e sem acento", () => {
    expect(resolverEspecialidade("clinica medica", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 1, nome: "Clínica Médica",
    });
  });

  it("acha com espaço sobrando", () => {
    expect(resolverEspecialidade("  Cardiologia  ", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 2, nome: "Cardiologia",
    });
  });
});

describe("resolverEspecialidade — degrau 3, mapa de sinônimos", () => {
  it("'clinico' acha Clínica Médica", () => {
    expect(resolverEspecialidade("clinico", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 1, nome: "Clínica Médica",
    });
  });

  it("'cardiologista' acha Cardiologia", () => {
    expect(resolverEspecialidade("cardiologista", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 2, nome: "Cardiologia",
    });
  });

  it("'obstetra' acha Ginecologia e Obstetrícia", () => {
    expect(resolverEspecialidade("obstetra", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 3, nome: "Ginecologia e Obstetrícia",
    });
  });
});

describe("resolverEspecialidade — as duas pendências, que são diferentes", () => {
  it("nome que os sinônimos conhecem mas o banco não tem", () => {
    /* Pediatria está em SINONIMOS e NÃO está no catálogo deste teste. */
    expect(resolverEspecialidade("pediatra", ESPECIALIDADES)).toEqual({
      tipo: "fora-do-catalogo", nome: "Pediatria",
    });
  });

  it("nome que ninguém conhece", () => {
    expect(resolverEspecialidade("Ortopedía", ESPECIALIDADES)).toEqual({
      tipo: "desconhecida",
    });
  });

  it("texto vazio é desconhecido, não estoura", () => {
    expect(resolverEspecialidade("", ESPECIALIDADES)).toEqual({ tipo: "desconhecida" });
  });
});

describe("resolverBairro", () => {
  it("acha pelo nome exato", () => {
    expect(resolverBairro("Centro", BAIRROS)).toEqual({
      tipo: "existente", id: 1, nome: "Centro",
    });
  });

  it("acha sem acento e sem caixa", () => {
    expect(resolverBairro("jucara", BAIRROS)).toEqual({
      tipo: "existente", id: 3, nome: "Juçara",
    });
  });

  it("acha pelo slug, que é como alguém pode ter copiado da URL", () => {
    expect(resolverBairro("nova-imperatriz", BAIRROS)).toEqual({
      tipo: "existente", id: 2, nome: "Nova Imperatriz",
    });
  });

  it("bairro que não existe vira novo, com slug pronto", () => {
    expect(resolverBairro("Bacurizinho", BAIRROS)).toEqual({
      tipo: "novo", nome: "Bacurizinho", slug: "bacurizinho",
    });
  });

  it("não decide sozinho sobre parecido — isso é do relatório", () => {
    expect(resolverBairro("Nova Imperatris", BAIRROS)).toEqual({
      tipo: "novo", nome: "Nova Imperatris", slug: "nova-imperatris",
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-catalogo.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/catalogo"`

- [ ] **Step 3: Implementar `lib/importador/catalogo.ts`**

```ts
import { SINONIMOS, normalizar } from "@/lib/dados/sinonimos";
import { chave, paraSlug } from "@/lib/importador/texto";
import type { Retrato } from "@/lib/importador/tipos";

export type ResolucaoEspecialidade =
  | { tipo: "achada"; id: number; nome: string }
  | { tipo: "desconhecida" }
  | { tipo: "fora-do-catalogo"; nome: string };

export type ResolucaoBairro =
  | { tipo: "existente"; id: number; nome: string }
  | { tipo: "novo"; nome: string; slug: string };

/*
  Especialidade e bairro seguem regras OPOSTAS, e é deliberado.

  Especialidade nunca é criada: cada uma tem texto editorial ("o que faz",
  "quando procurar") e vira URL indexada. Criada em branco produz página de
  faceta sem prosa.

  Bairro é criado: o catálogo tem 8 linhas e Imperatriz tem dezenas. Tratar
  bairro novo como erro reprovaria quase toda linha na primeira rodada.
*/

/**
 * Escada de três degraus. As duas pendências são distintas porque o conserto
 * difere: "desconhecida" pede corrigir a planilha; "fora-do-catalogo" pede
 * acrescentar a especialidade ao banco.
 */
export function resolverEspecialidade(
  texto: string,
  catalogo: Retrato["especialidades"],
): ResolucaoEspecialidade {
  if (!texto.trim()) return { tipo: "desconhecida" };

  /* Degraus 1 e 2 de uma vez: `chave` já iguala acento e caixa, e o nome
     exato é um caso particular disso. */
  const k = chave(texto);
  const direta = catalogo.find((e) => chave(e.nome) === k);
  if (direta) return { tipo: "achada", id: direta.id, nome: direta.nome };

  /*
    Degrau 3. Compara contra o singular, o plural e os tokens extras de
    `SINONIMOS`, com `normalizar` — a mesma função que a busca do site usa,
    para que "clinico" signifique a mesma coisa nos dois lugares.
  */
  const n = normalizar(texto);
  const sinonimo = SINONIMOS.find(
    (s) =>
      normalizar(s.singular) === n ||
      normalizar(s.plural) === n ||
      (s.tokensExtras ?? []).some((t) => normalizar(t) === n),
  );

  if (!sinonimo) return { tipo: "desconhecida" };

  const noCatalogo = catalogo.find(
    (e) => chave(e.nome) === chave(sinonimo.especialidade),
  );

  return noCatalogo
    ? { tipo: "achada", id: noCatalogo.id, nome: noCatalogo.nome }
    : { tipo: "fora-do-catalogo", nome: sinonimo.especialidade };
}

/** Casa por nome ou por slug. O aviso de parecido é decidido no plano. */
export function resolverBairro(
  texto: string,
  catalogo: Retrato["bairros"],
): ResolucaoBairro {
  const k = chave(texto);
  const s = paraSlug(texto);

  const achado = catalogo.find((b) => chave(b.nome) === k || b.slug === s);
  if (achado) return { tipo: "existente", id: achado.id, nome: achado.nome };

  return { tipo: "novo", nome: texto.trim(), slug: s };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-catalogo.test.ts`
Expected: PASS, 13 testes

- [ ] **Step 5: Commit**

```bash
git add lib/importador/catalogo.ts testes/importador-catalogo.test.ts
git commit -m "Resolve especialidade e bairro contra o catálogo

Regras opostas, de propósito. Especialidade nunca é criada: cada uma tem
texto editorial e vira URL indexada, e criada em branco produz faceta sem
prosa. Bairro é criado, porque o catálogo tem 8 linhas e Imperatriz tem
dezenas -- tratar bairro novo como erro reprovaria quase toda linha.

As duas pendências de especialidade são distintas porque o conserto
difere: desconhecida pede corrigir a planilha, fora-do-catalogo pede
acrescentar a especialidade ao banco.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: O plano

**Files:**
- Create: `lib/importador/plano.ts`
- Test: `testes/importador-plano.test.ts`

**Interfaces:**
- Consumes: tudo de `tipos.ts`; `chave`, `paraSlug`, `maisParecido` de `texto.ts`; `resolverEspecialidade`, `resolverBairro` de `catalogo.ts`
- Produces:
```ts
export type ContextoDoPlano = {
  arquivo: string;
  linhasLidas: number;
  colunasIgnoradas: string[];
  erros: ErroDeLinha[];
  avisos: Aviso[];
};

export function montarPlano(
  medicos: MedicoDaPlanilha[],
  retrato: Retrato,
  contexto: ContextoDoPlano,
): Plano;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-plano.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { montarPlano, type ContextoDoPlano } from "@/lib/importador/plano";
import type {
  EnderecoLido,
  MedicoDaPlanilha,
  Retrato,
} from "@/lib/importador/tipos";

const VAZIO: Retrato = {
  profissionais: [],
  especialidades: [
    { id: 1, nome: "Clínica Médica", slug: "clinica-medica" },
    { id: 2, nome: "Cardiologia", slug: "cardiologia" },
  ],
  bairros: [{ id: 1, nome: "Centro", slug: "centro" }],
  locais: [],
  vinculosEspecialidade: [],
};

const CONTEXTO: ContextoDoPlano = {
  arquivo: "associados.xlsx",
  linhasLidas: 1,
  colunasIgnoradas: [],
  erros: [],
  avisos: [],
};

function endereco(p: Partial<EnderecoLido> = {}): EnderecoLido {
  return {
    linha: 2, logradouro: "Rua Coriolano Milhomem", numero: "39",
    complemento: null, bairro: "Centro", cep: null,
    telefone: null, whatsapp: null, ...p,
  };
}

function medico(p: Partial<MedicoDaPlanilha> = {}): MedicoDaPlanilha {
  return {
    crm: "4821", crmUf: "MA", nome: "Ana Souza", telemedicina: null,
    especialidades: [], enderecos: [], linhas: [2], ...p,
  };
}

describe("montarPlano — criação", () => {
  it("médico que não existe entra em criar, com slug do nome", () => {
    const p = montarPlano([medico()], VAZIO, CONTEXTO);
    expect(p.atualizar).toEqual([]);
    expect(p.criar).toHaveLength(1);
    expect(p.criar[0].slug).toBe("ana-souza");
    expect(p.criar[0].crm).toBe("4821");
  });

  it("telemedicina vazia vira falso na criação, que é o padrão do banco", () => {
    const p = montarPlano([medico()], VAZIO, CONTEXTO);
    expect(p.criar[0].telemedicina).toBe(false);
  });

  it("dois médicos de mesmo nome recebem slugs diferentes", () => {
    const p = montarPlano(
      [medico({ crm: "1" }), medico({ crm: "2", linhas: [3] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.criar.map((m) => m.slug)).toEqual(["ana-souza", "ana-souza-2"]);
  });

  it("slug já ocupado no banco não é reusado", () => {
    const retrato: Retrato = {
      ...VAZIO,
      profissionais: [{
        id: 9, slug: "ana-souza", nome: "Ana Souza", crm: "999", crmUf: "MA",
        telemedicina: false, associadoAmi: true, publicado: true,
      }],
    };
    const p = montarPlano([medico({ crm: "1" })], retrato, CONTEXTO);
    expect(p.criar[0].slug).toBe("ana-souza-2");
  });

  it("a primeira especialidade vira a principal", () => {
    const p = montarPlano(
      [medico({
        especialidades: [
          { texto: "Cardiologia", rqe: "11", linha: 2 },
          { texto: "Clínica Médica", rqe: null, linha: 3 },
        ],
      })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.criar[0].especialidades).toEqual([
      { especialidadeId: 2, rqe: "11", principal: true },
      { especialidadeId: 1, rqe: null, principal: false },
    ]);
  });
});

describe("montarPlano — especialidade não resolvida", () => {
  it("o médico entra mesmo assim, sem especialidade", () => {
    const p = montarPlano(
      [medico({ especialidades: [{ texto: "Ortopedía", rqe: null, linha: 2 }] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.criar).toHaveLength(1);
    expect(p.criar[0].especialidades).toEqual([]);
    expect(p.avisos).toContainEqual({
      tipo: "especialidade-desconhecida", linha: 2, texto: "Ortopedía",
    });
  });

  it("o RQE perdido junto é relatado, não some calado", () => {
    const p = montarPlano(
      [medico({ especialidades: [{ texto: "Ortopedía", rqe: "1234", linha: 41 }] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.avisos).toContainEqual({ tipo: "rqe-perdido", linha: 41, rqe: "1234" });
  });

  it("especialidade conhecida fora do catálogo tem aviso próprio", () => {
    const p = montarPlano(
      [medico({ especialidades: [{ texto: "pediatra", rqe: null, linha: 2 }] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.avisos).toContainEqual({
      tipo: "especialidade-fora-do-catalogo", linha: 2, texto: "Pediatria",
    });
  });
});

describe("montarPlano — bairros novos", () => {
  it("bairro fora do catálogo entra na lista, com a contagem de médicos", () => {
    const p = montarPlano(
      [
        medico({ crm: "1", enderecos: [endereco({ bairro: "Bacurizinho" })] }),
        medico({ crm: "2", enderecos: [endereco({ bairro: "bacurizinho" })] }),
      ],
      VAZIO,
      CONTEXTO,
    );
    expect(p.bairrosNovos).toEqual([
      { nome: "Bacurizinho", slug: "bacurizinho", medicos: 2, parecidoCom: null },
    ]);
  });

  it("bairro parecido demais com um existente é marcado", () => {
    const retrato: Retrato = {
      ...VAZIO,
      bairros: [
        { id: 1, nome: "Centro", slug: "centro" },
        { id: 2, nome: "Nova Imperatriz", slug: "nova-imperatriz" },
      ],
    };
    const p = montarPlano(
      [medico({ enderecos: [endereco({ bairro: "Nova Imperatris" })] })],
      retrato,
      CONTEXTO,
    );
    expect(p.bairrosNovos[0].parecidoCom).toBe("Nova Imperatriz");
  });

  it("bairro existente não entra na lista de novos", () => {
    const p = montarPlano([medico({ enderecos: [endereco()] })], VAZIO, CONTEXTO);
    expect(p.bairrosNovos).toEqual([]);
    expect(p.criar[0].enderecos[0].bairro).toEqual({ tipo: "existente", id: 1 });
  });
});

describe("montarPlano — atualização", () => {
  const comAna: Retrato = {
    ...VAZIO,
    profissionais: [{
      id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "4821", crmUf: "MA",
      telemedicina: false, associadoAmi: false, publicado: false,
    }],
  };

  it("médico existente vai para atualizar, não para criar", () => {
    const p = montarPlano([medico()], comAna, CONTEXTO);
    expect(p.criar).toEqual([]);
    expect(p.atualizar).toHaveLength(1);
    expect(p.atualizar[0].id).toBe(7);
  });

  it("associado_ami falso no banco vira mudança, porque a planilha é a lista", () => {
    const p = montarPlano([medico()], comAna, CONTEXTO);
    expect(p.atualizar[0].mudancas).toContainEqual({
      campo: "associado_ami", de: "não", para: "sim",
    });
  });

  it("célula vazia não apaga campo preenchido", () => {
    const retrato: Retrato = {
      ...comAna,
      profissionais: [{ ...comAna.profissionais[0], telemedicina: true, associadoAmi: true }],
    };
    const p = montarPlano([medico({ telemedicina: null })], retrato, CONTEXTO);
    expect(p.atualizar[0].mudancas).toEqual([]);
  });

  it("nome corrigido muda o nome e NÃO muda o slug", () => {
    const p = montarPlano([medico({ nome: "Ana Sousa" })], comAna, CONTEXTO);
    expect(p.atualizar[0].mudancas).toContainEqual({
      campo: "nome", de: "Ana Souza", para: "Ana Sousa",
    });
    expect(p.avisos).toContainEqual({
      tipo: "nome-mudou", linha: 2, de: "Ana Souza", para: "Ana Sousa", slug: "ana-souza",
    });
  });

  it("diferença só de acento no nome não é mudança", () => {
    const p = montarPlano([medico({ nome: "ana souza" })], comAna, CONTEXTO);
    expect(p.atualizar[0].mudancas.some((m) => m.campo === "nome")).toBe(false);
  });
});

describe("montarPlano — endereços de médico existente", () => {
  const base: Retrato = {
    ...VAZIO,
    profissionais: [{
      id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "4821", crmUf: "MA",
      telemedicina: false, associadoAmi: true, publicado: false,
    }],
    locais: [{
      id: 30, profissionalId: 7, logradouro: "Rua Coriolano Milhomem",
      numero: "39", complemento: null, bairroId: 1, cep: null,
      telefone: "9935243716", whatsapp: null,
    }],
  };

  it("mesmo logradouro, número e bairro é atualização, não endereço novo", () => {
    const p = montarPlano(
      [medico({ enderecos: [endereco({ telefone: "9988020205" })] })],
      base,
      CONTEXTO,
    );
    expect(p.atualizar[0].enderecosNovos).toEqual([]);
    expect(p.atualizar[0].enderecosAtualizados).toEqual([
      { id: 30, mudancas: [{ campo: "telefone", de: "9935243716", para: "9988020205" }] },
    ]);
  });

  it("logradouro diferente é endereço novo", () => {
    const p = montarPlano(
      [medico({ enderecos: [endereco({ logradouro: "Avenida Bernardo Sayão" })] })],
      base,
      CONTEXTO,
    );
    expect(p.atualizar[0].enderecosNovos).toHaveLength(1);
  });

  it("endereço só no banco é contado, nunca apagado", () => {
    const p = montarPlano([medico({ enderecos: [] })], base, CONTEXTO);
    expect(p.atualizar[0].enderecosSoNoBanco).toBe(1);
    expect(p.atualizar[0].enderecosAtualizados).toEqual([]);
  });
});

describe("montarPlano — ausentes", () => {
  it("quem está no banco e não veio na planilha é só relatado", () => {
    const retrato: Retrato = {
      ...VAZIO,
      profissionais: [{
        id: 9, slug: "outro-medico", nome: "Outro Médico", crm: "999", crmUf: "MA",
        telemedicina: false, associadoAmi: true, publicado: true,
      }],
    };
    const p = montarPlano([medico()], retrato, CONTEXTO);
    expect(p.ausentes).toEqual([{ crm: "999", crmUf: "MA", nome: "Outro Médico" }]);
  });
});

describe("montarPlano — o contexto atravessa intacto", () => {
  it("erros, colunas ignoradas e contagem chegam ao plano", () => {
    const p = montarPlano([medico()], VAZIO, {
      ...CONTEXTO,
      linhasLidas: 523,
      colunasIgnoradas: ["email"],
      erros: [{ linha: 88, motivo: "CRM vazio" }],
      avisos: [{ tipo: "campo-descartado", linha: 102, campo: "telefone", motivo: "curto" }],
    });
    expect(p.linhasLidas).toBe(523);
    expect(p.medicosDistintos).toBe(1);
    expect(p.colunasIgnoradas).toEqual(["email"]);
    expect(p.erros).toHaveLength(1);
    expect(p.avisos).toContainEqual(
      expect.objectContaining({ tipo: "campo-descartado", linha: 102 }),
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-plano.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/plano"`

- [ ] **Step 3: Implementar `lib/importador/plano.ts`**

```ts
import { resolverBairro, resolverEspecialidade } from "@/lib/importador/catalogo";
import { chave, maisParecido, paraSlug } from "@/lib/importador/texto";
import type {
  Aviso,
  BairroNovo,
  EnderecoLido,
  EnderecoPlanejado,
  ErroDeLinha,
  MedicoAtualizado,
  MedicoDaPlanilha,
  MedicoNovo,
  Mudanca,
  Plano,
  Retrato,
  VinculoPlanejado,
} from "@/lib/importador/tipos";

export type ContextoDoPlano = {
  arquivo: string;
  linhasLidas: number;
  colunasIgnoradas: string[];
  erros: ErroDeLinha[];
  avisos: Aviso[];
};

/*
  O plano é a única fonte da verdade do importador: a conferência imprime o
  que está aqui, e a gravação executa o que está aqui. Não há caminho em que
  os dois divirjam, e é o que torna verdadeira a promessa de que o relatório
  descreve o que vai acontecer.

  Função pura: recebe o retrato do banco como argumento em vez de consultá-lo.
*/

/** Igualdade de campo de texto, tolerante a acento, caixa e espaço. */
function igual(a: string | null, b: string | null): boolean {
  return chave(a ?? "") === chave(b ?? "");
}

function anotarMudanca(
  mudancas: Mudanca[],
  campo: string,
  de: string | null,
  para: string | null,
): void {
  /* Célula vazia nunca apaga: "não tenho essa informação", não "apague". */
  if (para === null || para === "") return;
  if (igual(de, para)) return;
  mudancas.push({ campo, de: de ?? "", para });
}

/** Chave de comparação de endereço: logradouro, número e bairro. */
function chaveDeEndereco(
  logradouro: string,
  numero: string | null,
  bairro: string,
): string {
  return [chave(logradouro), chave(numero ?? ""), chave(bairro)].join("|");
}

export function montarPlano(
  medicos: MedicoDaPlanilha[],
  retrato: Retrato,
  contexto: ContextoDoPlano,
): Plano {
  const avisos: Aviso[] = [...contexto.avisos];
  const criar: MedicoNovo[] = [];
  const atualizar: MedicoAtualizado[] = [];

  const bairroPorId = new Map(retrato.bairros.map((b) => [b.id, b]));

  /* --- Bairros novos, acumulados enquanto os endereços são planejados --- */
  const novosPorSlug = new Map<string, { nome: string; medicos: Set<string> }>();

  function planejarEndereco(e: EnderecoLido, crmChave: string): EnderecoPlanejado {
    const r = resolverBairro(e.bairro, retrato.bairros);

    if (r.tipo === "novo") {
      const ja = novosPorSlug.get(r.slug);
      if (ja) ja.medicos.add(crmChave);
      else novosPorSlug.set(r.slug, { nome: r.nome, medicos: new Set([crmChave]) });
    }

    return {
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: r.tipo === "existente" ? { tipo: "existente", id: r.id } : { tipo: "novo", slug: r.slug },
      cep: e.cep,
      telefone: e.telefone,
      whatsapp: e.whatsapp,
    };
  }

  /* --- Especialidades: resolve e acumula as pendências --- */
  function planejarEspecialidades(m: MedicoDaPlanilha): VinculoPlanejado[] {
    const vinculos: VinculoPlanejado[] = [];

    for (const e of m.especialidades) {
      const r = resolverEspecialidade(e.texto, retrato.especialidades);

      if (r.tipo === "achada") {
        vinculos.push({
          especialidadeId: r.id,
          rqe: e.rqe,
          /* A primeira vira principal. Sem isso, o site escolhe por
             `especialidades[0]`, cuja ordem o PostgREST não promete — o que
             faria o mesmo perfil mostrar especialidades diferentes entre
             renderizações. */
          principal: vinculos.length === 0,
        });
        continue;
      }

      avisos.push(
        r.tipo === "desconhecida"
          ? { tipo: "especialidade-desconhecida", linha: e.linha, texto: e.texto }
          : { tipo: "especialidade-fora-do-catalogo", linha: e.linha, texto: r.nome },
      );

      /* O RQE mora em `profissional_especialidade`. Sem o laço ele não tem
         onde ser gravado, e some. Relatar é o mínimo. */
      if (e.rqe) avisos.push({ tipo: "rqe-perdido", linha: e.linha, rqe: e.rqe });
    }

    return vinculos;
  }

  /* --- Slugs: atribuídos uma vez, para sempre --- */
  const slugsOcupados = new Set(retrato.profissionais.map((p) => p.slug));

  function slugLivre(nome: string): string {
    const base = paraSlug(nome) || "medico";
    if (!slugsOcupados.has(base)) {
      slugsOcupados.add(base);
      return base;
    }
    for (let n = 2; ; n++) {
      const tentativa = `${base}-${n}`;
      if (!slugsOcupados.has(tentativa)) {
        slugsOcupados.add(tentativa);
        return tentativa;
      }
    }
  }

  /* --- O laço principal --- */

  const porChaveNatural = new Map(
    retrato.profissionais.map((p) => [`${p.crm}|${p.crmUf}`, p]),
  );
  const vistos = new Set<string>();

  for (const m of medicos) {
    const k = `${m.crm}|${m.crmUf}`;
    vistos.add(k);

    const existente = porChaveNatural.get(k);
    const especialidades = planejarEspecialidades(m);
    const enderecos = m.enderecos.map((e) => planejarEndereco(e, k));

    if (!existente) {
      criar.push({
        crm: m.crm,
        crmUf: m.crmUf,
        nome: m.nome,
        slug: slugLivre(m.nome),
        telemedicina: m.telemedicina ?? false,
        especialidades,
        enderecos,
        linhas: m.linhas,
      });
      continue;
    }

    /* --- Campos do médico --- */
    const mudancas: Mudanca[] = [];

    anotarMudanca(mudancas, "nome", existente.nome, m.nome);
    if (mudancas.some((x) => x.campo === "nome")) {
      avisos.push({
        tipo: "nome-mudou",
        linha: m.linhas[0],
        de: existente.nome,
        para: m.nome,
        slug: existente.slug,
      });
    }

    if (m.telemedicina !== null && m.telemedicina !== existente.telemedicina) {
      mudancas.push({
        campo: "telemedicina",
        de: existente.telemedicina ? "sim" : "não",
        para: m.telemedicina ? "sim" : "não",
      });
    }

    /* A planilha É a lista de associados. Quem está nela é associado. */
    if (!existente.associadoAmi) {
      mudancas.push({ campo: "associado_ami", de: "não", para: "sim" });
    }

    /* --- Especialidades que ainda não existem no laço --- */
    const jaLigadas = new Set(
      retrato.vinculosEspecialidade
        .filter((v) => v.profissionalId === existente.id)
        .map((v) => v.especialidadeId),
    );
    const especialidadesNovas = especialidades.filter(
      (v) => !jaLigadas.has(v.especialidadeId),
    );

    /* --- Endereços --- */
    const doBanco = retrato.locais.filter((l) => l.profissionalId === existente.id);
    const porChaveDeEndereco = new Map(
      doBanco.map((l) => [
        chaveDeEndereco(l.logradouro, l.numero, bairroPorId.get(l.bairroId)?.nome ?? ""),
        l,
      ]),
    );

    const enderecosNovos: EnderecoPlanejado[] = [];
    const enderecosAtualizados: { id: number; mudancas: Mudanca[] }[] = [];
    const casados = new Set<number>();

    m.enderecos.forEach((lido, i) => {
      const casa = porChaveDeEndereco.get(
        chaveDeEndereco(lido.logradouro, lido.numero, lido.bairro),
      );

      if (!casa) {
        enderecosNovos.push(enderecos[i]);
        return;
      }

      casados.add(casa.id);

      const mud: Mudanca[] = [];
      anotarMudanca(mud, "complemento", casa.complemento, lido.complemento);
      anotarMudanca(mud, "cep", casa.cep, lido.cep);
      anotarMudanca(mud, "telefone", casa.telefone, lido.telefone);
      anotarMudanca(mud, "whatsapp", casa.whatsapp, lido.whatsapp);

      if (mud.length) enderecosAtualizados.push({ id: casa.id, mudancas: mud });
    });

    atualizar.push({
      id: existente.id,
      crm: m.crm,
      crmUf: m.crmUf,
      nome: m.nome,
      mudancas,
      especialidadesNovas,
      enderecosNovos,
      enderecosAtualizados,
      enderecosSoNoBanco: doBanco.filter((l) => !casados.has(l.id)).length,
      linhas: m.linhas,
    });
  }

  /* --- Bairros novos, com o aviso de parecido --- */
  const nomesConhecidos = [
    ...retrato.bairros.map((b) => b.nome),
    ...[...novosPorSlug.values()].map((n) => n.nome),
  ];

  const bairrosNovos: BairroNovo[] = [...novosPorSlug.entries()].map(
    ([slug, { nome, medicos: quantos }]) => ({
      nome,
      slug,
      medicos: quantos.size,
      parecidoCom: maisParecido(
        nome,
        nomesConhecidos.filter((n) => chave(n) !== chave(nome)),
      ),
    }),
  );

  /* --- Ausentes: contados, nunca tocados --- */
  const ausentes = retrato.profissionais
    .filter((p) => !vistos.has(`${p.crm}|${p.crmUf}`))
    .map((p) => ({ crm: p.crm, crmUf: p.crmUf, nome: p.nome }));

  return {
    arquivo: contexto.arquivo,
    linhasLidas: contexto.linhasLidas,
    medicosDistintos: medicos.length,
    colunasIgnoradas: contexto.colunasIgnoradas,
    bairrosNovos,
    criar,
    atualizar,
    erros: contexto.erros,
    avisos,
    ausentes,
  };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-plano.test.ts`
Expected: PASS, 20 testes

- [ ] **Step 5: Commit**

```bash
git add lib/importador/plano.ts testes/importador-plano.test.ts
git commit -m "Monta o plano: o que cria, o que atualiza, o que só relata

O plano é a fonte única do importador: a conferência imprime o que está
aqui e a gravação executa o que está aqui, sem caminho em que os dois
divirjam. É o que torna verdadeira a promessa de que o relatório descreve
o que vai acontecer.

Três regras que o teste trava: célula vazia nunca apaga, slug é atribuído
uma vez e nunca recalculado, e a primeira especialidade vira principal --
sem isso o site escolheria por especialidades[0], cuja ordem o PostgREST
não promete.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: O relatório

**Files:**
- Create: `lib/importador/relatorio.ts`
- Test: `testes/importador-relatorio.test.ts`

**Interfaces:**
- Consumes: `Plano` de `tipos.ts`
- Produces: `relatorio(plano: Plano): string`, `planoEstaLimpo(plano: Plano): boolean`

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-relatorio.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { planoEstaLimpo, relatorio } from "@/lib/importador/relatorio";
import type { Plano } from "@/lib/importador/tipos";

const BASE: Plano = {
  arquivo: "associados.xlsx",
  linhasLidas: 0,
  medicosDistintos: 0,
  colunasIgnoradas: [],
  bairrosNovos: [],
  criar: [],
  atualizar: [],
  erros: [],
  avisos: [],
  ausentes: [],
};

describe("relatorio", () => {
  it("abre com o nome do arquivo e as contagens", () => {
    const t = relatorio({ ...BASE, linhasLidas: 523, medicosDistintos: 498 });
    expect(t).toContain("associados.xlsx");
    expect(t).toContain("523 linhas lidas");
    expect(t).toContain("498 médicos distintos");
  });

  it("lista as colunas que o arquivo trouxe e o importador não usa", () => {
    const t = relatorio({ ...BASE, colunasIgnoradas: ["email", "bio"] });
    expect(t).toContain("email");
    expect(t).toContain("bio");
  });

  it("marca o bairro parecido demais com um existente", () => {
    const t = relatorio({
      ...BASE,
      bairrosNovos: [
        { nome: "Bacurizinho", slug: "bacurizinho", medicos: 12, parecidoCom: null },
        { nome: "Nova Imperatris", slug: "nova-imperatris", medicos: 1, parecidoCom: "Nova Imperatriz" },
      ],
    });
    expect(t).toContain("Bacurizinho");
    expect(t).toContain("Nova Imperatriz");
    expect(t).toMatch(/parecido/i);
  });

  it("cita o número da linha em todo erro", () => {
    const t = relatorio({
      ...BASE,
      erros: [
        { linha: 88, motivo: "CRM vazio" },
        { linha: 355, motivo: 'UF do CRM "MAA" não existe' },
      ],
    });
    expect(t).toContain("linha  88");
    expect(t).toContain("linha 355");
    expect(t).toContain("CRM vazio");
  });

  it("separa as duas pendências de especialidade", () => {
    const t = relatorio({
      ...BASE,
      avisos: [
        { tipo: "especialidade-desconhecida", linha: 2, texto: "Ortopedía" },
        { tipo: "especialidade-fora-do-catalogo", linha: 3, texto: "Cirurgia Vascular" },
      ],
    });
    expect(t).toContain("Ortopedía");
    expect(t).toContain("Cirurgia Vascular");
    expect(t).toMatch(/fora do catálogo/i);
    expect(t).toMatch(/não reconhecida/i);
  });

  it("relata o RQE perdido com a linha", () => {
    const t = relatorio({
      ...BASE,
      avisos: [{ tipo: "rqe-perdido", linha: 41, rqe: "1234" }],
    });
    expect(t).toMatch(/RQE/);
    expect(t).toContain("41");
  });

  it("diz que nada será feito com os ausentes", () => {
    const t = relatorio({
      ...BASE,
      ausentes: [{ crm: "999", crmUf: "MA", nome: "Outro Médico" }],
    });
    expect(t).toMatch(/Nada será feito/i);
  });

  it("não imprime seção vazia", () => {
    const t = relatorio(BASE);
    expect(t).not.toMatch(/BAIRROS NOVOS/);
    expect(t).not.toMatch(/LINHAS REJEITADAS/);
    expect(t).not.toMatch(/NO BANCO E FORA/);
  });
});

describe("planoEstaLimpo", () => {
  it("plano sem erro e sem pendência está limpo", () => {
    expect(planoEstaLimpo(BASE)).toBe(true);
  });

  it("erro de linha suja o plano", () => {
    expect(planoEstaLimpo({ ...BASE, erros: [{ linha: 1, motivo: "x" }] })).toBe(false);
  });

  it("especialidade não resolvida suja o plano", () => {
    expect(
      planoEstaLimpo({
        ...BASE,
        avisos: [{ tipo: "especialidade-desconhecida", linha: 2, texto: "x" }],
      }),
    ).toBe(false);
  });

  it("nome que mudou não suja: é informação, não problema", () => {
    expect(
      planoEstaLimpo({
        ...BASE,
        avisos: [{ tipo: "nome-mudou", linha: 2, de: "a", para: "b", slug: "a" }],
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-relatorio.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/relatorio"`

- [ ] **Step 3: Implementar `lib/importador/relatorio.ts`**

```ts
import type { Aviso, Plano } from "@/lib/importador/tipos";

/*
  O relatório da conferência.

  Duas regras que valem mais do que a aparência:

  1. Todo erro cita o NÚMERO DA LINHA do arquivo. É o que a AMI enxerga ao
     abrir a planilha, e é a diferença entre "conserte alguma coisa" e
     "conserte a linha 214"
  2. Seção sem conteúdo não é impressa. Relatório com dez cabeçalhos vazios
     ensina quem lê a passar os olhos, e aí o aviso que importa passa junto
*/

const LARGURA = 22;

function pontilhado(rotulo: string): string {
  const sobra = Math.max(1, LARGURA - rotulo.length);
  return `${rotulo} ${".".repeat(sobra)}`;
}

function secao(titulo: string, linhas: string[]): string[] {
  if (!linhas.length) return [];
  return ["", titulo, ...linhas];
}

function daLinha(n: number): string {
  return `linha ${String(n).padStart(3, " ")}`;
}

/** Avisos que exigem decisão de alguém antes de gravar. */
function ehPendencia(a: Aviso): boolean {
  return a.tipo !== "nome-mudou";
}

export function planoEstaLimpo(plano: Plano): boolean {
  return plano.erros.length === 0 && !plano.avisos.some(ehPendencia);
}

export function relatorio(plano: Plano): string {
  const l: string[] = [];

  l.push(`CONFERÊNCIA — ${plano.arquivo}`);
  l.push(
    `${plano.linhasLidas} linhas lidas · ${plano.medicosDistintos} médicos distintos`,
  );
  l.push("");
  l.push(`  cria       ${String(plano.criar.length).padStart(6)} médicos`);
  l.push(`  atualiza   ${String(plano.atualizar.length).padStart(6)} médicos`);
  l.push(`  rejeita    ${String(plano.erros.length).padStart(6)} linhas`);

  if (plano.colunasIgnoradas.length) {
    l.push(
      `  ignora     ${String(plano.colunasIgnoradas.length).padStart(6)} ` +
        `${plano.colunasIgnoradas.length === 1 ? "coluna" : "colunas"} do arquivo: ` +
        plano.colunasIgnoradas.join(", "),
    );
  }

  l.push(
    ...secao(
      "BAIRROS NOVOS (serão criados)",
      plano.bairrosNovos.map((b) => {
        const base = `  ${pontilhado(b.nome)} ${b.medicos} ${b.medicos === 1 ? "médico" : "médicos"}`;
        return b.parecidoCom ? `${base}    (!) parecido com "${b.parecidoCom}"` : base;
      }),
    ),
  );

  /* Especialidades: agrupadas por texto, para que 6 médicos com o mesmo
     problema virem uma linha e não seis. */
  const porTexto = new Map<string, { linhas: number[]; fora: boolean }>();
  for (const a of plano.avisos) {
    if (a.tipo !== "especialidade-desconhecida" && a.tipo !== "especialidade-fora-do-catalogo") {
      continue;
    }
    const ja = porTexto.get(a.texto);
    const fora = a.tipo === "especialidade-fora-do-catalogo";
    if (ja) ja.linhas.push(a.linha);
    else porTexto.set(a.texto, { linhas: [a.linha], fora });
  }

  const rqePerdidos = plano.avisos.filter((a) => a.tipo === "rqe-perdido");

  l.push(
    ...secao("ESPECIALIDADES NÃO RESOLVIDAS", [
      ...[...porTexto.entries()].map(([texto, { linhas, fora }]) => {
        const quantos = `${linhas.length} ${linhas.length === 1 ? "médico" : "médicos"}`;
        const nota = fora ? "conhecida, fora do catálogo do banco" : "não reconhecida";
        return `  ${pontilhado(`"${texto}"`)} ${quantos}    ${nota}`;
      }),
      ...(rqePerdidos.length
        ? [
            `  ${rqePerdidos.length} ${rqePerdidos.length === 1 ? "tinha" : "destes tinham"} ` +
              `RQE, que não será gravado (${rqePerdidos
                .map((a) => (a.tipo === "rqe-perdido" ? a.linha : 0))
                .join(", ")})`,
          ]
        : []),
    ]),
  );

  l.push(
    ...secao(
      "CAMPOS DESCARTADOS (o médico entra sem eles)",
      plano.avisos
        .filter((a) => a.tipo === "campo-descartado")
        .map((a) =>
          a.tipo === "campo-descartado"
            ? `  ${daLinha(a.linha)}  ${a.campo} ${a.motivo}`
            : "",
        ),
    ),
  );

  l.push(
    ...secao(
      "ENDEREÇOS SEM BAIRRO (não serão gravados)",
      plano.avisos
        .filter((a) => a.tipo === "endereco-sem-bairro")
        .map((a) => `  ${daLinha(a.linha)}  o banco exige bairro em todo endereço`),
    ),
  );

  l.push(
    ...secao(
      "NOMES QUE MUDARAM (o endereço do perfil continua o mesmo)",
      plano.avisos
        .filter((a) => a.tipo === "nome-mudou")
        .map((a) =>
          a.tipo === "nome-mudou"
            ? `  ${daLinha(a.linha)}  "${a.de}" → "${a.para}", perfil segue em /medico/${a.slug}`
            : "",
        ),
    ),
  );

  l.push(
    ...secao("NO BANCO E FORA DESTE ARQUIVO", [
      `  ${plano.ausentes.length} ${plano.ausentes.length === 1 ? "médico" : "médicos"}. ` +
        "Nada será feito com eles.",
    ].filter(() => plano.ausentes.length > 0)),
  );

  l.push(
    ...secao(
      "LINHAS REJEITADAS",
      plano.erros.map((e) => `  ${daLinha(e.linha)}  ${e.motivo}`),
    ),
  );

  return l.join("\n");
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-relatorio.test.ts`
Expected: PASS, 12 testes

- [ ] **Step 5: Commit**

```bash
git add lib/importador/relatorio.ts testes/importador-relatorio.test.ts
git commit -m "Imprime a conferência

Todo erro cita o número da linha do arquivo: é a diferença entre
'conserte alguma coisa' e 'conserte a linha 214'. Seção sem conteúdo não
é impressa, porque relatório com dez cabeçalhos vazios ensina quem lê a
passar os olhos, e aí o aviso que importa passa junto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Credencial e retrato do banco

**Files:**
- Create: `scripts/credencial.ts`
- Create: `scripts/retrato.ts`
- Modify: `.env.local.exemplo`
- Test: `testes/importador-credencial.test.ts`

**Interfaces:**
- Consumes: `Retrato` de `lib/importador/tipos.ts`
- Produces:
```ts
// scripts/credencial.ts
export const NOME_DA_VARIAVEL = "SUPABASE_CHAVE_IMPORTADOR";
export function chaveDoAmbiente(ambiente: NodeJS.ProcessEnv): string | null;
export async function obterChave(): Promise<string>;
export async function clientePrivilegiado(): Promise<SupabaseClient>;

// scripts/retrato.ts
export async function lerRetrato(cliente: SupabaseClient): Promise<Retrato>;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-credencial.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { NOME_DA_VARIAVEL, chaveDoAmbiente } from "@/scripts/credencial";

describe("NOME_DA_VARIAVEL", () => {
  it("não leva o prefixo que joga o valor no navegador", () => {
    expect(NOME_DA_VARIAVEL.startsWith("NEXT_PUBLIC_")).toBe(false);
  });
});

describe("chaveDoAmbiente", () => {
  it("lê a variável quando ela existe", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "sb_secret_abc" })).toBe("sb_secret_abc");
  });

  it("devolve nulo quando não existe, para o comando perguntar", () => {
    expect(chaveDoAmbiente({})).toBeNull();
  });

  it("trata string vazia e só-espaço como ausente", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "" })).toBeNull();
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "   " })).toBeNull();
  });

  it("apara espaço colado junto na hora de copiar", () => {
    expect(chaveDoAmbiente({ [NOME_DA_VARIAVEL]: " sb_secret_abc \n" })).toBe("sb_secret_abc");
  });

  it("recusa a chave pública, que não escreve e não daria erro claro depois", () => {
    expect(() => chaveDoAmbiente({ [NOME_DA_VARIAVEL]: "sb_publishable_abc" })).toThrow(
      /pública/i,
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-credencial.test.ts`
Expected: FAIL — `Failed to resolve import "@/scripts/credencial"`

- [ ] **Step 3: Implementar `scripts/credencial.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

/*
  A credencial privilegiada do importador.

  Este arquivo é o ÚNICO ponto do projeto que lê esta variável, e mora em
  `scripts/`, fora do aplicativo Next — nada que o Next empacota alcança
  daqui. `lib/dados/cliente.ts` continua com a chave pública e não é tocado.

  A chave é uma chave secreta DEDICADA do Supabase (`sb_secret_...`), criada
  no painel com o nome `importador`, e não a `service_role`. A `service_role`
  é a chave-mestra do projeto e não tem revogação isolada; uma chave dedicada
  é revogada sozinha, e o site nem pisca, porque ele nunca a usou.
*/

export const NOME_DA_VARIAVEL = "SUPABASE_CHAVE_IMPORTADOR";

/**
 * Lê a chave do ambiente. Devolve nulo quando não há, para o comando
 * perguntar em vez de estourar.
 *
 * Recusa a chave pública explicitamente: com ela a RLS vale, toda escrita é
 * negada, e o erro que aparece é do PostgREST — que não diz "você usou a
 * chave errada". Falhar aqui, com o motivo, poupa a investigação.
 */
export function chaveDoAmbiente(ambiente: NodeJS.ProcessEnv): string | null {
  const bruta = (ambiente[NOME_DA_VARIAVEL] ?? "").trim();
  if (!bruta) return null;

  if (bruta.startsWith("sb_publishable_") || bruta.includes("anon")) {
    throw new Error(
      `${NOME_DA_VARIAVEL} está com a chave pública. O importador precisa da ` +
        "chave secreta dedicada (sb_secret_...), criada no painel do Supabase " +
        'em Project Settings, API Keys, com o nome "importador".',
    );
  }

  return bruta;
}

/** Do ambiente, ou perguntada na hora — sem gravar em lugar nenhum. */
export async function obterChave(): Promise<string> {
  const doAmbiente = chaveDoAmbiente(process.env);
  if (doAmbiente) return doAmbiente;

  const leitor = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const digitada = (
      await leitor.question(
        `${NOME_DA_VARIAVEL} não está definida.\n` +
          "Cole a chave secreta do importador (nada será gravado): ",
      )
    ).trim();

    if (!digitada) throw new Error("Nenhuma chave informada.");
    return digitada;
  } finally {
    leitor.close();
  }
}

export async function clientePrivilegiado(): Promise<SupabaseClient> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL. Copie .env.local.exemplo para .env.local.",
    );
  }

  return createClient(url, await obterChave(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: Implementar `scripts/retrato.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Retrato } from "@/lib/importador/tipos";

/*
  O retrato do banco: uma leitura só, entregue inteira ao plano.

  É por isso que a chave precisa ser privilegiada mesmo para conferir. Tudo
  que o importador cria entra despublicado, e a chave pública só enxerga
  `publicado = true`. Lendo com ela, a segunda rodada não veria ninguém que a
  primeira criou: relataria as mesmas 500 criações e bateria em violação de
  chave única.

  São poucos milhares de linhas para 500 médicos. Uma consulta por tabela é
  mais simples de ler e de conferir do que junções aninhadas, e o custo em
  segundos não importa numa operação que roda uma dúzia de vezes na vida.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

async function tudo(cliente: SupabaseClient, tabela: string, colunas: string) {
  const { data, error } = await cliente.from(tabela).select(colunas);
  if (error) throw new Error(`Falha ao ler ${tabela}: ${error.message}`);
  return (data ?? []) as any[];
}

export async function lerRetrato(cliente: SupabaseClient): Promise<Retrato> {
  const [profissionais, especialidades, bairros, locais, atendimentos, vinculos] =
    await Promise.all([
      tudo(cliente, "profissional",
        "id, slug, nome, crm, crm_uf, telemedicina, associado_ami, publicado"),
      tudo(cliente, "especialidade", "id, nome, slug"),
      tudo(cliente, "bairro", "id, nome, slug"),
      tudo(cliente, "local",
        "id, logradouro, numero, complemento, bairro_id, cep, telefone, whatsapp"),
      tudo(cliente, "atendimento", "profissional_id, local_id"),
      tudo(cliente, "profissional_especialidade",
        "profissional_id, especialidade_id, rqe"),
    ]);

  const donoDoLocal = new Map<number, number>(
    atendimentos.map((a) => [a.local_id, a.profissional_id]),
  );

  return {
    profissionais: profissionais.map((p) => ({
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      crm: p.crm,
      crmUf: p.crm_uf,
      telemedicina: p.telemedicina,
      associadoAmi: p.associado_ami,
      publicado: p.publicado,
    })),
    especialidades: especialidades.map((e) => ({ id: e.id, nome: e.nome, slug: e.slug })),
    bairros: bairros.map((b) => ({ id: b.id, nome: b.nome, slug: b.slug })),
    /* Local sem atendimento é órfão — sobra de gravação interrompida. Fica
       de fora do retrato para não casar com endereço da planilha e virar
       "atualização" de algo que não pertence a ninguém. */
    locais: locais
      .filter((l) => donoDoLocal.has(l.id))
      .map((l) => ({
        id: l.id,
        profissionalId: donoDoLocal.get(l.id)!,
        logradouro: l.logradouro,
        numero: l.numero,
        complemento: l.complemento,
        bairroId: l.bairro_id,
        cep: l.cep,
        telefone: l.telefone,
        whatsapp: l.whatsapp,
      })),
    vinculosEspecialidade: vinculos.map((v) => ({
      profissionalId: v.profissional_id,
      especialidadeId: v.especialidade_id,
      rqe: v.rqe,
    })),
  };
}
```

- [ ] **Step 5: Acrescentar a variável a `.env.local.exemplo`**

Anexar ao fim do arquivo, sem valor:

```
# --- O importador de planilha. ---------------------------------------------
# Chave SECRETA DEDICADA do Supabase, criada em Project Settings, API Keys,
# botão New secret key, com o nome `importador`. Não é a `service_role`: a
# service_role é a chave-mestra do projeto e não tem revogação isolada.
#
# Ela existe só para o comando `npm run importar`, que roda na sua máquina e
# fica fora do aplicativo. NUNCA leva prefixo NEXT_PUBLIC_ — com o prefixo, o
# valor vai para dentro do JavaScript que o navegador baixa. Não coloque na
# Vercel nem em nenhum serviço de hospedagem.
#
# Não precisa guardar cópia dela em lugar nenhum: se perder, revogue a antiga
# e crie outra. Ver docs/como-remontar-o-ambiente.md.
#
# Deixar em branco é aceitável: sem ela, o comando pergunta na hora de rodar
# e não grava o que você digitar.
SUPABASE_CHAVE_IMPORTADOR=
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-credencial.test.ts`
Expected: PASS, 5 testes

- [ ] **Step 7: Commit**

```bash
git add scripts/credencial.ts scripts/retrato.ts .env.local.exemplo testes/importador-credencial.test.ts
git commit -m "Lê a credencial dedicada e o retrato do banco

A chave é uma chave secreta dedicada do Supabase, criada com o nome
importador, e não a service_role: a service_role é a chave-mestra e não
tem revogação isolada. Este arquivo é o único ponto do projeto que lê a
variável, e mora fora do aplicativo Next.

Recusa a chave pública com motivo explícito, porque com ela a RLS vale,
toda escrita é negada, e o erro do PostgREST não diz que a chave está
errada.

Local sem atendimento fica de fora do retrato: é sobra de gravação
interrompida, e casá-lo com endereço da planilha atualizaria algo que não
pertence a ninguém.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Gravação

**Files:**
- Create: `scripts/gravar.ts`
- Test: `testes/importador-gravar.test.ts`

**Interfaces:**
- Consumes: `Plano`, `EnderecoPlanejado` de `lib/importador/tipos.ts`
- Produces:
```ts
export type ResumoDaGravacao = {
  bairrosCriados: number;
  medicosCriados: number;
  medicosAtualizados: number;
  enderecosCriados: number;
  enderecosAtualizados: number;
  vinculosCriados: number;
};
export async function gravar(cliente: SupabaseClient, plano: Plano): Promise<ResumoDaGravacao>;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-gravar.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  O importador não pode remover nada.

  Esta verificação é grosseira de propósito: ela lê o código-fonte e falha se
  a palavra aparecer. É a regra que protege 500 cadastros de um erro de
  implementação, e ela vale mais sendo boba e infalível do que sendo elegante
  e furável.
*/
const FONTES = [
  "../scripts/gravar.ts",
  "../scripts/importar.ts",
  "../scripts/publicar.ts",
  "../scripts/retrato.ts",
  "../lib/importador/plano.ts",
];

describe("nenhuma remoção no importador", () => {
  for (const relativo of FONTES) {
    it(`${relativo} não contém delete nem truncate`, () => {
      const caminho = fileURLToPath(new URL(relativo, import.meta.url));
      const fonte = readFileSync(caminho, "utf8").toLowerCase();

      expect(fonte).not.toMatch(/\.delete\s*\(/);
      expect(fonte).not.toMatch(/\btruncate\b/);
      expect(fonte).not.toMatch(/\bdrop\s+table\b/);
    });
  }
});
```

Nota para quem implementa: este teste roda contra arquivos das tarefas 9, 10 e 11. Enquanto `scripts/importar.ts` e `scripts/publicar.ts` não existirem, ele falha por arquivo ausente — o que é correto. Rode-o completo ao fim da tarefa 11.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-gravar.test.ts`
Expected: FAIL — `ENOENT` em `scripts/gravar.ts`

- [ ] **Step 3: Implementar `scripts/gravar.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnderecoPlanejado, Plano } from "@/lib/importador/tipos";

/*
  A gravação.

  NÃO EXISTE TRANSAÇÃO. O supabase-js fala por HTTP e o PostgREST não abre
  transação entre requisições. A resposta é ser REPETÍVEL: toda operação é
  por chave natural, então rodar de novo depois de uma interrupção completa o
  que faltou em vez de duplicar.

  E nada aqui publica ninguém. Os perfis entram com `publicado = false`, e a
  RLS esconde perfil, endereço, atendimento e horário de quem não está
  publicado — uma gravação interrompida é invisível para o visitante.

  Ordem: bairros primeiro, porque os endereços dependem deles.

  NENHUM `delete`, NENHUM `truncate`. `testes/importador-gravar.test.ts`
  falha se alguém acrescentar um.
*/

export type ResumoDaGravacao = {
  bairrosCriados: number;
  medicosCriados: number;
  medicosAtualizados: number;
  enderecosCriados: number;
  enderecosAtualizados: number;
  vinculosCriados: number;
};

function erro(o: { error: { message: string } | null }, o_que: string): void {
  if (o.error) throw new Error(`${o_que}: ${o.error.message}`);
}

export async function gravar(
  cliente: SupabaseClient,
  plano: Plano,
): Promise<ResumoDaGravacao> {
  const resumo: ResumoDaGravacao = {
    bairrosCriados: 0,
    medicosCriados: 0,
    medicosAtualizados: 0,
    enderecosCriados: 0,
    enderecosAtualizados: 0,
    vinculosCriados: 0,
  };

  /* --- 1. Bairros --- */
  const idDoBairroNovo = new Map<string, number>();

  if (plano.bairrosNovos.length) {
    const { data, error } = await cliente
      .from("bairro")
      .upsert(
        plano.bairrosNovos.map((b) => ({ nome: b.nome, slug: b.slug })),
        { onConflict: "slug" },
      )
      .select("id, slug");
    erro({ error }, "Falha ao criar bairros");

    for (const b of data ?? []) idDoBairroNovo.set(b.slug, b.id);
    resumo.bairrosCriados = plano.bairrosNovos.length;
  }

  function bairroId(e: EnderecoPlanejado): number {
    if (e.bairro.tipo === "existente") return e.bairro.id;
    const id = idDoBairroNovo.get(e.bairro.slug);
    if (id === undefined) {
      throw new Error(`Bairro "${e.bairro.slug}" não recebeu id ao ser criado.`);
    }
    return id;
  }

  /* --- 2. Médicos novos --- */
  const idPorChaveNatural = new Map<string, number>();

  if (plano.criar.length) {
    const { data, error } = await cliente
      .from("profissional")
      .upsert(
        plano.criar.map((m) => ({
          slug: m.slug,
          nome: m.nome,
          crm: m.crm,
          crm_uf: m.crmUf,
          telemedicina: m.telemedicina,
          associado_ami: true,
          /* Sempre. Publicar é o outro comando, com filtro próprio. */
          publicado: false,
        })),
        { onConflict: "crm,crm_uf" },
      )
      .select("id, crm, crm_uf");
    erro({ error }, "Falha ao criar médicos");

    for (const p of data ?? []) idPorChaveNatural.set(`${p.crm}|${p.crm_uf}`, p.id);
    resumo.medicosCriados = plano.criar.length;
  }

  /* --- 3. Médicos existentes --- */
  for (const m of plano.atualizar) {
    if (!m.mudancas.length) continue;

    const campos: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    for (const mud of m.mudancas) {
      if (mud.campo === "nome") campos.nome = mud.para;
      if (mud.campo === "telemedicina") campos.telemedicina = mud.para === "sim";
      if (mud.campo === "associado_ami") campos.associado_ami = true;
    }

    const { error } = await cliente.from("profissional").update(campos).eq("id", m.id);
    erro({ error }, `Falha ao atualizar o médico ${m.crm}/${m.crmUf}`);
    resumo.medicosAtualizados++;
  }

  /* --- 4. Especialidades --- */
  const vinculos: { profissional_id: number; especialidade_id: number; rqe: string | null; principal: boolean }[] = [];

  for (const m of plano.criar) {
    const id = idPorChaveNatural.get(`${m.crm}|${m.crmUf}`);
    if (id === undefined) continue;
    for (const v of m.especialidades) {
      vinculos.push({
        profissional_id: id,
        especialidade_id: v.especialidadeId,
        rqe: v.rqe,
        principal: v.principal,
      });
    }
  }

  for (const m of plano.atualizar) {
    for (const v of m.especialidadesNovas) {
      vinculos.push({
        profissional_id: m.id,
        especialidade_id: v.especialidadeId,
        rqe: v.rqe,
        /* Médico que já existe já tem sua principal decidida. Não mexer. */
        principal: false,
      });
    }
  }

  if (vinculos.length) {
    const { error } = await cliente
      .from("profissional_especialidade")
      .upsert(vinculos, { onConflict: "profissional_id,especialidade_id" });
    erro({ error }, "Falha ao ligar especialidades");
    resumo.vinculosCriados = vinculos.length;
  }

  /* --- 5. Endereços e atendimentos --- */

  async function criarEnderecos(
    profissionalId: number,
    enderecos: EnderecoPlanejado[],
  ): Promise<void> {
    if (!enderecos.length) return;

    const { data, error } = await cliente
      .from("local")
      .insert(
        enderecos.map((e) => ({
          logradouro: e.logradouro,
          numero: e.numero,
          complemento: e.complemento,
          bairro_id: bairroId(e),
          cep: e.cep,
          telefone: e.telefone,
          whatsapp: e.whatsapp,
        })),
      )
      .select("id");
    erro({ error }, "Falha ao criar endereços");

    const ids = (data ?? []).map((l) => l.id as number);
    resumo.enderecosCriados += ids.length;

    /*
      O atendimento entra imediatamente depois. Uma interrupção entre as duas
      deixa endereço órfão — invisível ao visitante, porque `local_publicado`
      exige médico ou estabelecimento publicado, e ignorado pelo retrato da
      rodada seguinte, que só considera local com atendimento.
    */
    const { error: erroAtendimento } = await cliente
      .from("atendimento")
      .upsert(
        ids.map((local_id) => ({ profissional_id: profissionalId, local_id })),
        { onConflict: "profissional_id,local_id" },
      );
    erro({ error: erroAtendimento }, "Falha ao ligar endereços ao médico");
  }

  for (const m of plano.criar) {
    const id = idPorChaveNatural.get(`${m.crm}|${m.crmUf}`);
    if (id === undefined) continue;
    await criarEnderecos(id, m.enderecos);
  }

  for (const m of plano.atualizar) {
    await criarEnderecos(m.id, m.enderecosNovos);

    for (const e of m.enderecosAtualizados) {
      const campos: Record<string, unknown> = {};
      for (const mud of e.mudancas) campos[mud.campo] = mud.para;

      const { error } = await cliente.from("local").update(campos).eq("id", e.id);
      erro({ error }, `Falha ao atualizar o endereço ${e.id}`);
      resumo.enderecosAtualizados++;
    }
  }

  return resumo;
}
```

- [ ] **Step 4: Rodar e confirmar que o teste passa para `gravar.ts`**

Run: `npx vitest run testes/importador-gravar.test.ts -t "gravar.ts"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/gravar.ts testes/importador-gravar.test.ts
git commit -m "Executa o plano, sem transação e sem remoção

Não existe transação: o PostgREST não abre transação entre requisições. A
resposta é ser repetível -- tudo por chave natural, então rodar de novo
depois de uma interrupção completa o que faltou em vez de duplicar. E
nada aqui publica ninguém, então gravação interrompida é invisível ao
visitante.

O teste lê o código-fonte e falha se delete ou truncate aparecer.
Grosseiro de propósito: vale mais bobo e infalível do que elegante e
furável.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10: O modelo e o comando `importar`

**Files:**
- Create: `scripts/modelo.ts`
- Create: `scripts/importar.ts`
- Modify: `package.json`
- Test: `testes/importador-modelo.test.ts`

**Interfaces:**
- Consumes: tudo de `lib/importador/`; `clientePrivilegiado` de `scripts/credencial.ts`; `lerRetrato` de `scripts/retrato.ts`; `gravar` de `scripts/gravar.ts`
- Produces: `gerarModelo(caminho: string): Promise<void>`, `lerPlanilha(caminho: string): Promise<Celula[][]>`

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-modelo.test.ts`**

```ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { gerarModelo, lerPlanilha } from "@/scripts/modelo";
import { lerCabecalho } from "@/lib/importador/colunas";
import { ehErro, ehLinhaVazia, lerLinha } from "@/lib/importador/linha";
import { NOMES_DE_COLUNA } from "@/lib/importador/tipos";

const pasta = mkdtempSync(join(tmpdir(), "ami-modelo-"));
afterAll(() => rmSync(pasta, { recursive: true, force: true }));

describe("gerarModelo", () => {
  it("escreve um arquivo que dá para ler de volta", async () => {
    const caminho = join(pasta, "modelo.xlsx");
    await gerarModelo(caminho);

    const linhas = await lerPlanilha(caminho);
    expect(linhas.length).toBeGreaterThan(0);
  });

  it("o cabeçalho do modelo é reconhecido pelo próprio importador", async () => {
    const caminho = join(pasta, "ida-e-volta.xlsx");
    await gerarModelo(caminho);

    const linhas = await lerPlanilha(caminho);
    const cab = lerCabecalho(linhas[0]);

    expect(cab.ignoradas).toEqual([]);
    for (const c of NOMES_DE_COLUNA) {
      expect(cab.indices[c], `coluna ${c}`).toBeDefined();
    }
  });

  it("a linha de exemplo do modelo passa pela validação", async () => {
    const caminho = join(pasta, "exemplo.xlsx");
    await gerarModelo(caminho);

    const linhas = await lerPlanilha(caminho);
    const cab = lerCabecalho(linhas[0]);
    const dados = linhas.slice(1).filter((l) => !ehLinhaVazia(l));

    expect(dados.length).toBeGreaterThan(0);

    const r = lerLinha(dados[0], cab, 2);
    expect(ehErro(r)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-modelo.test.ts`
Expected: FAIL — `Failed to resolve import "@/scripts/modelo"`

- [ ] **Step 3: Implementar `scripts/modelo.ts`**

```ts
import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { TITULOS } from "@/lib/importador/colunas";
import { NOMES_DE_COLUNA, type Celula } from "@/lib/importador/tipos";

/*
  ATENÇÃO às duas APIs. Medidas em 22/08/2026, e as duas mudaram em relação
  ao que a maioria dos exemplos mostra:

  - write-excel-file 4.x: `writeExcelFile(dados, { filePath })` RESOLVE SEM
    ERRO E NÃO CRIA ARQUIVO NENHUM. O certo é `.toFile(caminho)`
  - read-excel-file 9.x: o export padrão devolve `[{ sheet, data }]`, não as
    linhas. `readSheet` devolve as linhas
*/

/** Lê a primeira aba. Linhas vazias no fim já vêm descartadas. */
export async function lerPlanilha(caminho: string): Promise<Celula[][]> {
  return (await readSheet(caminho)) as Celula[][];
}

/*
  Uma linha de exemplo, com dados obviamente fictícios.

  Não é enfeite: sem ela, "logradouro" e "complemento" são adivinhação, e a
  primeira planilha volta com o número da casa dentro do logradouro. O teste
  garante que este exemplo passa pela própria validação do importador — um
  modelo que o importador rejeita seria a pior instrução possível.
*/
const EXEMPLO: Record<(typeof NOMES_DE_COLUNA)[number], string> = {
  nome: "Maria Exemplo da Silva",
  crm: "1234",
  uf_do_crm: "MA",
  especialidade: "Cardiologia",
  rqe: "5678",
  telemedicina: "não",
  logradouro: "Rua Exemplo",
  numero: "100",
  complemento: "Sala 302",
  bairro: "Centro",
  cep: "65900-000",
  telefone: "(99) 3524-0000",
  whatsapp: "(99) 98800-0000",
};

export async function gerarModelo(caminho: string): Promise<void> {
  const cabecalho = NOMES_DE_COLUNA.map((c) => ({
    value: TITULOS[c],
    fontWeight: "bold" as const,
  }));

  const exemplo = NOMES_DE_COLUNA.map((c) => ({ value: EXEMPLO[c] }));

  await writeXlsxFile([cabecalho, exemplo], {
    columns: NOMES_DE_COLUNA.map(() => ({ width: 22 })),
  }).toFile(caminho);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-modelo.test.ts`
Expected: PASS, 3 testes

- [ ] **Step 5: Implementar `scripts/importar.ts`**

```ts
import { lerCabecalho } from "@/lib/importador/colunas";
import { agrupar } from "@/lib/importador/agrupar";
import { ehErro, ehLinhaVazia, lerLinha } from "@/lib/importador/linha";
import { montarPlano } from "@/lib/importador/plano";
import { planoEstaLimpo, relatorio } from "@/lib/importador/relatorio";
import type { Aviso, ErroDeLinha, LinhaLida } from "@/lib/importador/tipos";
import { clientePrivilegiado } from "@/scripts/credencial";
import { gerarModelo, lerPlanilha } from "@/scripts/modelo";
import { lerRetrato } from "@/scripts/retrato";
import { gravar } from "@/scripts/gravar";
import { basename } from "node:path";

/*
  O comando.

  A conferência é o padrão e não grava nada. Gravar exige a palavra
  `--gravar` escrita à mão: o caminho fácil é o inofensivo.

  Uso:
    npm run importar -- --modelo
    npm run importar -- associados.xlsx
    npm run importar -- associados.xlsx --gravar
*/

const USO = `
Uso:
  npm run importar -- --modelo               gera modelo-associados.xlsx
  npm run importar -- <arquivo.xlsx>         confere, sem gravar nada
  npm run importar -- <arquivo.xlsx> --gravar  grava
`.trim();

async function principal(): Promise<void> {
  const argumentos = process.argv.slice(2);
  const querGravar = argumentos.includes("--gravar");
  const soltos = argumentos.filter((a) => !a.startsWith("--"));

  if (argumentos.includes("--modelo")) {
    const destino = soltos[0] ?? "modelo-associados.xlsx";
    await gerarModelo(destino);
    console.log(`Modelo escrito em ${destino}`);
    return;
  }

  const arquivo = soltos[0];
  if (!arquivo) {
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  /* --- Ler e validar --- */
  const linhas = await lerPlanilha(arquivo);
  if (!linhas.length) throw new Error(`${arquivo} está vazio.`);

  const cabecalho = lerCabecalho(linhas[0]);

  for (const obrigatoria of ["nome", "crm"] as const) {
    if (cabecalho.indices[obrigatoria] === undefined) {
      throw new Error(
        `O arquivo não tem a coluna "${obrigatoria}". ` +
          "Rode `npm run importar -- --modelo` para ver o formato esperado.",
      );
    }
  }

  const lidas: LinhaLida[] = [];
  const erros: ErroDeLinha[] = [];
  const avisos: Aviso[] = [];
  let linhasLidas = 0;

  linhas.slice(1).forEach((celulas, i) => {
    if (ehLinhaVazia(celulas)) return;

    /* +2: o cabeçalho é a linha 1, e o índice começa em zero. É o número que
       a AMI vê ao abrir a planilha. */
    const numero = i + 2;
    linhasLidas++;

    const r = lerLinha(celulas, cabecalho, numero);
    if (ehErro(r)) erros.push(r);
    else {
      lidas.push(r);
      avisos.push(...r.avisos);
    }
  });

  const { medicos, erros: errosDeAgrupamento } = agrupar(lidas);

  /* --- Retrato e plano --- */
  const cliente = await clientePrivilegiado();
  const retrato = await lerRetrato(cliente);

  const plano = montarPlano(medicos, retrato, {
    arquivo: basename(arquivo),
    linhasLidas,
    colunasIgnoradas: cabecalho.ignoradas,
    erros: [...erros, ...errosDeAgrupamento].sort((a, b) => a.linha - b.linha),
    avisos,
  });

  console.log(relatorio(plano));

  if (!querGravar) {
    console.log("");
    console.log(
      planoEstaLimpo(plano)
        ? "Nada foi gravado. Para gravar: acrescente --gravar ao comando."
        : "Nada foi gravado. Corrija a planilha e rode de novo — conferir não custa nada.",
    );
    return;
  }

  /* --- Gravar --- */
  console.log("");
  console.log("Gravando…");

  const resumo = await gravar(cliente, plano);

  console.log("");
  console.log(`  bairros criados        ${resumo.bairrosCriados}`);
  console.log(`  médicos criados        ${resumo.medicosCriados}`);
  console.log(`  médicos atualizados    ${resumo.medicosAtualizados}`);
  console.log(`  endereços criados      ${resumo.enderecosCriados}`);
  console.log(`  endereços atualizados  ${resumo.enderecosAtualizados}`);
  console.log(`  especialidades ligadas ${resumo.vinculosCriados}`);
  console.log("");
  console.log(
    "Ninguém foi publicado. Para colocar no ar: npm run publicar -- --com-especialidade --com-local",
  );
}

principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
```

- [ ] **Step 6: Acrescentar os comandos a `package.json`**

Em `"scripts"`, ao lado de `"doc-legal"`:

```json
"importar": "tsx scripts/importar.ts",
"publicar": "tsx scripts/publicar.ts"
```

- [ ] **Step 7: Provar o comando de ponta a ponta, sem banco**

```bash
npm run importar -- --modelo /tmp/modelo.xlsx
```

Expected: imprime `Modelo escrito em /tmp/modelo.xlsx`, e o arquivo existe. No Windows, usar um caminho da pasta do projeto e apagar depois.

```bash
npm run importar
```

Expected: imprime o texto de uso e sai com código 1.

- [ ] **Step 8: Rodar a suíte inteira**

Run: `npx vitest run`
Expected: PASS — os 247 testes anteriores mais os do importador

- [ ] **Step 9: Commit**

```bash
git add scripts/modelo.ts scripts/importar.ts package.json testes/importador-modelo.test.ts
git commit -m "Gera o modelo e liga o comando importar

A conferência é o padrão e não grava nada; gravar exige --gravar escrito
à mão. O modelo traz uma linha de exemplo obviamente fictícia, e o teste
garante que ela passa pela própria validação do importador -- um modelo
que o importador rejeita seria a pior instrução possível.

Duas armadilhas de API registradas em comentário: write-excel-file 4.x
resolve sem erro e não cria arquivo quando recebe filePath, e o export
padrão de read-excel-file 9.x devolve abas, não linhas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 11: Publicação em lote

**Files:**
- Create: `scripts/publicar.ts`
- Create: `lib/importador/publicacao.ts`
- Test: `testes/importador-publicacao.test.ts`

**Interfaces:**
- Consumes: `Retrato` de `lib/importador/tipos.ts`
- Produces:
```ts
export type FiltrosDePublicacao = { comEspecialidade: boolean; comLocal: boolean };
export type Candidato = { id: number; nome: string; slug: string; crm: string; crmUf: string };
export type Selecao = { publicar: Candidato[]; barrados: { candidato: Candidato; motivo: string }[] };
export function selecionarParaPublicar(retrato: Retrato, filtros: FiltrosDePublicacao): Selecao;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/importador-publicacao.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { selecionarParaPublicar } from "@/lib/importador/publicacao";
import type { Retrato } from "@/lib/importador/tipos";

function retrato(p: Partial<Retrato> = {}): Retrato {
  return {
    profissionais: [],
    especialidades: [{ id: 1, nome: "Cardiologia", slug: "cardiologia" }],
    bairros: [{ id: 1, nome: "Centro", slug: "centro" }],
    locais: [],
    vinculosEspecialidade: [],
    ...p,
  };
}

const ANA = {
  id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "1", crmUf: "MA",
  telemedicina: false, associadoAmi: true, publicado: false,
};

const TODOS = { comEspecialidade: true, comLocal: true };

describe("selecionarParaPublicar", () => {
  it("médico com especialidade e endereço entra", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [ANA],
        vinculosEspecialidade: [{ profissionalId: 7, especialidadeId: 1, rqe: null }],
        locais: [{
          id: 30, profissionalId: 7, logradouro: "R", numero: null,
          complemento: null, bairroId: 1, cep: null, telefone: null, whatsapp: null,
        }],
      }),
      TODOS,
    );
    expect(s.publicar.map((c) => c.id)).toEqual([7]);
    expect(s.barrados).toEqual([]);
  });

  it("sem especialidade é barrado, com o motivo", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [ANA],
        locais: [{
          id: 30, profissionalId: 7, logradouro: "R", numero: null,
          complemento: null, bairroId: 1, cep: null, telefone: null, whatsapp: null,
        }],
      }),
      TODOS,
    );
    expect(s.publicar).toEqual([]);
    expect(s.barrados[0].motivo).toMatch(/especialidade/i);
  });

  it("sem endereço é barrado, com o motivo", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [ANA],
        vinculosEspecialidade: [{ profissionalId: 7, especialidadeId: 1, rqe: null }],
      }),
      TODOS,
    );
    expect(s.publicar).toEqual([]);
    expect(s.barrados[0].motivo).toMatch(/endereço/i);
  });

  it("quem já está publicado não entra de novo", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [{ ...ANA, publicado: true }],
        vinculosEspecialidade: [{ profissionalId: 7, especialidadeId: 1, rqe: null }],
        locais: [{
          id: 30, profissionalId: 7, logradouro: "R", numero: null,
          complemento: null, bairroId: 1, cep: null, telefone: null, whatsapp: null,
        }],
      }),
      TODOS,
    );
    expect(s.publicar).toEqual([]);
    expect(s.barrados).toEqual([]);
  });

  it("sem filtro nenhum, publica quem só tem CRM", () => {
    const s = selecionarParaPublicar(
      retrato({ profissionais: [ANA] }),
      { comEspecialidade: false, comLocal: false },
    );
    expect(s.publicar.map((c) => c.id)).toEqual([7]);
  });

  it("acumula os dois motivos quando faltam os dois", () => {
    const s = selecionarParaPublicar(retrato({ profissionais: [ANA] }), TODOS);
    expect(s.barrados[0].motivo).toMatch(/especialidade/i);
    expect(s.barrados[0].motivo).toMatch(/endereço/i);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/importador-publicacao.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/importador/publicacao"`

- [ ] **Step 3: Implementar `lib/importador/publicacao.ts`**

```ts
import type { Retrato } from "@/lib/importador/tipos";

/*
  Quem pode ir ao ar.

  Perfil sem especialidade não aparece em faceta nenhuma e não serve para
  ninguém; publicá-lo só engorda o número. Perfil sem endereço não responde à
  pergunta que traz a pessoa ao site, que é onde o médico atende.

  Função pura, pelo mesmo motivo do plano: a conferência e a gravação usam a
  mesma seleção, então não há caminho em que divirjam.
*/

export type FiltrosDePublicacao = {
  comEspecialidade: boolean;
  comLocal: boolean;
};

export type Candidato = {
  id: number;
  nome: string;
  slug: string;
  crm: string;
  crmUf: string;
};

export type Selecao = {
  publicar: Candidato[];
  barrados: { candidato: Candidato; motivo: string }[];
};

export function selecionarParaPublicar(
  retrato: Retrato,
  filtros: FiltrosDePublicacao,
): Selecao {
  const comEspecialidade = new Set(
    retrato.vinculosEspecialidade.map((v) => v.profissionalId),
  );
  const comLocal = new Set(retrato.locais.map((l) => l.profissionalId));

  const publicar: Candidato[] = [];
  const barrados: { candidato: Candidato; motivo: string }[] = [];

  for (const p of retrato.profissionais) {
    /* Já está no ar: não é candidato nem barrado, simplesmente não é assunto. */
    if (p.publicado) continue;

    const candidato: Candidato = {
      id: p.id, nome: p.nome, slug: p.slug, crm: p.crm, crmUf: p.crmUf,
    };

    const faltas: string[] = [];
    if (filtros.comEspecialidade && !comEspecialidade.has(p.id)) {
      faltas.push("sem especialidade");
    }
    if (filtros.comLocal && !comLocal.has(p.id)) {
      faltas.push("sem endereço");
    }

    if (faltas.length) barrados.push({ candidato, motivo: faltas.join(" e ") });
    else publicar.push(candidato);
  }

  return { publicar, barrados };
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/importador-publicacao.test.ts`
Expected: PASS, 6 testes

- [ ] **Step 5: Implementar `scripts/publicar.ts`**

```ts
import { selecionarParaPublicar } from "@/lib/importador/publicacao";
import { clientePrivilegiado } from "@/scripts/credencial";
import { lerRetrato } from "@/scripts/retrato";

/*
  Publicação em lote.

  Mesma forma do importador: conferência por padrão, `--gravar` para valer.

  Este comando é o único do projeto que muda `publicado` de falso para
  verdadeiro. O importador nunca publica ninguém — 500 perfis vazios no ar de
  uma vez fazem o Google classificar o site como conteúdo raso, e recuperar
  leva meses.

  Não existe caminho de volta aqui: despublicar não é operação deste comando,
  e o importador não remove nem despublica ninguém.
*/

const USO = `
Uso:
  npm run publicar -- --com-especialidade --com-local
  npm run publicar -- --com-especialidade --com-local --gravar
`.trim();

/* O PostgREST tem limite de tamanho de URL, e o filtro `in` vai na URL. */
const LOTE = 200;

async function principal(): Promise<void> {
  const argumentos = process.argv.slice(2);

  const filtros = {
    comEspecialidade: argumentos.includes("--com-especialidade"),
    comLocal: argumentos.includes("--com-local"),
  };
  const querGravar = argumentos.includes("--gravar");

  if (!argumentos.length) {
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  const cliente = await clientePrivilegiado();
  const retrato = await lerRetrato(cliente);
  const selecao = selecionarParaPublicar(retrato, filtros);

  const jaNoAr = retrato.profissionais.filter((p) => p.publicado).length;

  console.log("PUBLICAÇÃO EM LOTE");
  console.log("");
  console.log(`  já no ar        ${jaNoAr}`);
  console.log(`  vai publicar    ${selecao.publicar.length}`);
  console.log(`  fica de fora    ${selecao.barrados.length}`);

  if (selecao.barrados.length) {
    console.log("");
    console.log("FICAM DE FORA");
    for (const b of selecao.barrados.slice(0, 20)) {
      console.log(`  CRM/${b.candidato.crmUf} ${b.candidato.crm}  ${b.candidato.nome} — ${b.motivo}`);
    }
    if (selecao.barrados.length > 20) {
      console.log(`  … e mais ${selecao.barrados.length - 20}`);
    }
  }

  if (!querGravar) {
    console.log("");
    console.log("Nada foi publicado. Para publicar: acrescente --gravar ao comando.");
    return;
  }

  if (!selecao.publicar.length) {
    console.log("");
    console.log("Ninguém a publicar.");
    return;
  }

  for (let i = 0; i < selecao.publicar.length; i += LOTE) {
    const ids = selecao.publicar.slice(i, i + LOTE).map((c) => c.id);
    const { error } = await cliente
      .from("profissional")
      .update({ publicado: true, atualizado_em: new Date().toISOString() })
      .in("id", ids);

    if (error) throw new Error(`Falha ao publicar: ${error.message}`);
    console.log(`  publicados ${Math.min(i + LOTE, selecao.publicar.length)} de ${selecao.publicar.length}`);
  }

  console.log("");
  console.log(
    "Lembre-se: o site continua invisível para o Google enquanto " +
      "NEXT_PUBLIC_DADOS_DEMONSTRACAO for true.",
  );
}

principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
```

- [ ] **Step 6: Rodar a verificação de remoção, agora completa**

Run: `npx vitest run testes/importador-gravar.test.ts`
Expected: PASS, 5 testes — os cinco arquivos existem e nenhum contém `delete` ou `truncate`

- [ ] **Step 7: Rodar a suíte inteira e a build**

Run: `npx vitest run`
Expected: PASS

Run: `npx next build`
Expected: build limpa. `scripts/` não entra na build; se entrar, algo em `app/` ou `lib/` importou de lá e isso é defeito a corrigir.

- [ ] **Step 8: Commit**

```bash
git add lib/importador/publicacao.ts scripts/publicar.ts testes/importador-publicacao.test.ts
git commit -m "Publica em lote, com filtro de completude

Único comando do projeto que muda publicado para verdadeiro. O importador
nunca publica: 500 perfis vazios no ar de uma vez fazem o Google
classificar o site como conteúdo raso, e recuperar leva meses.

Quem fica de fora aparece com nome, CRM e motivo, porque 'ficaram 43 de
fora' sem dizer quais não ajuda ninguém a consertar.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 12: Documentação

**Files:**
- Create: `docs/como-remontar-o-ambiente.md`
- Modify: `docs/estado-do-projeto.md`

**Interfaces:**
- Consumes: nada
- Produces: nada — é documentação

- [ ] **Step 1: Escrever `docs/como-remontar-o-ambiente.md`**

O documento responde a uma pergunta: **a máquina se perdeu, e agora?** Em passos numerados, com o nome do botão de cada tela. Estrutura obrigatória:

1. **O que não se perde** — tabela com: código no GitHub `sepetimio/AMI`; cadastro no Supabase; conteúdo editorial no Sanity. E a frase de que o único arquivo fora do versionamento é `.env.local`, e nada dentro dele é insubstituível.
2. **Remontar do zero** — clonar, `npm install`, copiar `.env.local.exemplo` para `.env.local`.
3. **De onde vem cada variável**, uma seção por serviço, com o caminho de telas:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: supabase.com → o projeto → **Project Settings** → **API Keys**
   - `SUPABASE_CHAVE_IMPORTADOR`: mesma tela → **New secret key** → nome `importador`
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` e `NEXT_PUBLIC_SANITY_DATASET`: sanity.io/manage → o projeto
   - `SANITY_WEBHOOK_SECRET`: sanity.io/manage → **API** → **Webhooks** → campo **Secret**. Se não der para ler o valor antigo, inventar um novo e colar nos dois lugares
   - `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_DADOS_DEMONSTRACAO`: valores fixos, explicados em `.env.local.exemplo`
4. **Se a máquina foi comprometida** — os três passos de revogação: Supabase → Project Settings → API Keys → achar `importador` → **Revoke**. E a frase de que o site não pisca, porque ele nunca usou essa chave.
5. **Não guarde cópia da chave** — a regra explícita, com o motivo: ela se recria em dois minutos, e guardar cópia paga risco de vazamento para economizar esses dois minutos. Se quiser mesmo tê-la à mão, gerenciador de senhas, nunca documento na nuvem.

- [ ] **Step 2: Atualizar `docs/estado-do-projeto.md`**

Duas mudanças:

Na seção 4, tirar o importador da lista do que não começou e registrar o que existe:

```markdown
- ~~**Importador de planilha**~~ **Construído.** Três comandos: `npm run importar -- --modelo` gera a planilha modelo, `npm run importar -- arquivo.xlsx` confere sem gravar, e `--gravar` executa. A publicação é comando à parte, `npm run publicar`, com filtro de completude. Falta a planilha real da AMI
```

Acrescentar ao fim, antes de "Histórico de qualidade":

```markdown
## Como carregar o cadastro real

1. `npm run importar -- --modelo` e mandar `modelo-associados.xlsx` para a AMI
2. Quando voltar preenchido: `npm run importar -- associados.xlsx`, que não grava nada
3. Mandar os erros do relatório para a AMI, corrigir, repetir o passo 2 quantas vezes for preciso
4. Relatório limpo: `npm run importar -- associados.xlsx --gravar`
5. `npm run publicar -- --com-especialidade --com-local` para conferir, e de novo com `--gravar`
6. Só então virar `NEXT_PUBLIC_DADOS_DEMONSTRACAO` para `false`

A chave de escrita vem de `SUPABASE_CHAVE_IMPORTADOR`, explicada em
[`docs/como-remontar-o-ambiente.md`](como-remontar-o-ambiente.md).
```

- [ ] **Step 3: Conferir que os links dos documentos resolvem**

```bash
grep -o "](\([^)]*\.md\)" docs/estado-do-projeto.md | sed 's/](//' | while read -r f; do test -f "docs/$f" && echo "ok $f" || echo "QUEBRADO $f"; done
```

Expected: nenhuma linha começando com `QUEBRADO`

- [ ] **Step 4: Commit**

```bash
git add docs/como-remontar-o-ambiente.md docs/estado-do-projeto.md
git commit -m "Documenta a remontagem do ambiente e o caminho da importação

'É só reconfigurar' é fácil de escrever e ruim de descobrir sozinho às
onze da noite. O documento diz de qual tela de qual serviço vem cada
variável, e traz a regra explícita de não guardar cópia da chave: ela se
recria em dois minutos, e guardar cópia paga risco de vazamento para
economizar esses dois minutos.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Autorrevisão do plano

Feita depois de escrever, contra a especificação.

**Cobertura da spec, seção a seção:**

| Seção da spec | Tarefa |
|---|---|
| 4 — três invocações de `importar`, dois comandos | 10, 11 |
| 4 — onde o código mora | estrutura de arquivos |
| 4 — bibliotecas, e o `xlsx` descartado | 1, 10 |
| 5 — as 13 colunas | 2 |
| 5 — três níveis de problema | 3 |
| 5 — três campos que o importador preenche | 6, 9 |
| 5 — CRM repetido | 4 |
| 5 — colunas ignoradas aparecem | 2, 7 |
| 6 — chave natural | 6 |
| 6 — escada da especialidade, duas pendências | 5 |
| 6 — RQE cai junto e é relatado | 6, 7 |
| 6 — bairro criado, com aviso de parecido | 5, 6 |
| 6 — slug nunca recalculado | 6 |
| 6 — célula vazia não apaga | 6 |
| 6 — endereços casam ou criam; ausente é relatado | 6 |
| 7 — o relatório | 7 |
| 8 — sem transação, repetível | 9 |
| 8 — ordem da gravação | 9 |
| 8 — nenhuma remoção, com teste | 9 |
| 9 — publicação em lote | 11 |
| 10 — credencial dedicada, duas origens | 8 |
| 10 — se a máquina se perder | 12 |
| 11 — testes | todas |
| 12 — `tsx` explícito | 1 |

**Consistência de tipos:** `Cabecalho`, `LinhaLida`, `MedicoDaPlanilha`, `Retrato`, `Plano` e `EnderecoPlanejado` são declarados uma vez em `lib/importador/tipos.ts` (tarefa 1) e importados por todas as demais. `chave`, `paraSlug` e `maisParecido` mantêm o mesmo nome da tarefa 1 à 6. `ehErro` é definido na tarefa 3 e usado na 10.

**Duas lacunas achadas e corrigidas na revisão:**

1. **Endereço sem bairro não tinha destino.** `local.bairro_id` é `not null`, então logradouro sem bairro não pode ser gravado. A primeira versão do plano deixava isso virar erro de banco na hora de gravar — depois da conferência ter dito que estava tudo bem. Virou o aviso `endereco-sem-bairro`, decidido na tarefa 3 e impresso na 7.
2. **`principal` ficaria sempre falso.** O site lê `find(e => e.principal) ?? especialidades[0]`, e a ordem de `especialidades[0]` vem do PostgREST, que não promete ordem estável — o comentário em `lib/dados/medicos.ts` diz isso. Sem marcar a primeira como principal, um médico com duas especialidades mostraria uma ou outra entre renderizações. A tarefa 6 marca; a tarefa 9 grava.
