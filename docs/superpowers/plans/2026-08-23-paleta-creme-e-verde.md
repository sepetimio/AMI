# A paleta creme e verde — plano de implementação

> **Para quem executa:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam caixinha (`- [ ]`).

**Objetivo:** trocar o campo cinza-azulado do site por um creme, e o verde lavado por uma escala derivada da própria marca da AMI — com um teste que calcula os contrastes e reprova sozinho quem quebrar.

**Arquitetura:** quase tudo é valor de token em `app/globals.css`. Os componentes usam os tokens pelo nome e mudam sozinhos — medido: **zero cor escrita à mão** em `app/` e `components/`, zero classe arbitrária do Tailwind, e só três `rgba()`. O teste de contraste é escrito **antes** da troca, passa com os valores de hoje, e é ele que pega a regressão real que a troca provoca.

**Tecnologias:** Tailwind 4 (tokens em `@theme`), Vitest, Next.js 16.

**Spec:** `docs/superpowers/specs/2026-08-23-paleta-creme-e-verde-design.md`

## Restrições globais

- **Toda razão de contraste no código é medida, nunca escrita de memória.** O arquivo já foi corrompido assim uma vez, e o comentário dele registra
- **Mínimo de 4,5:1** para qualquer texto de corpo sobre qualquer fundo em que ele apareça
- **`--color-ami-lima-400` NUNCA é texto sobre fundo claro.** Dá 1,48:1 no creme. Só fundo de texto escuro, ou marca sobre verde
- **A marca não se toca.** `#00A457` e `#248322` estão em `public/marca/*.svg` e são da AMI
- **Português em tudo que o usuário lê**; mensagens de commit **sem acento**
- **Nenhuma migração de banco** — esta fatia não encosta em dado
- Rodar: `npx vitest run` · Tipos: `npx tsc --noEmit` · Build: `npm run build`
- O repositório mistura CRLF e LF. Edições cirúrgicas, sem normalizar arquivo inteiro
- **Nunca use `Write` num arquivo que já existe sem ler antes**

---

## A paleta final, medida

| token | valor | razão | papel |
|---|---|---|---|
| `--color-canvas` | `#F2EFE6` | — | campo da página |
| `--color-surface` | `#FBFAF5` | — | cartão |
| `--color-ink-900` | `#0c0e12` | 16,80:1 no creme | título e texto de peso |
| `--color-ink-600` | `#565c66` | 5,86:1 no creme | corpo secundário |
| `--color-ink-400` | `#61666F` | **5,02:1** no creme | legenda, data, contagem |
| `--color-ink-300` | `#8d939e` | 2,69:1 | só placeholder e ícone desabilitado |
| `--color-line` | `#E4E0D4` | 1,15:1 | fio |
| `--color-line-strong` | `#D8D3C4` | 1,30:1 | fio forte |
| `--color-ami-green-900` | `#071A07` | creme sobre ele 17,33:1 | cabeçalho e rodapé |
| `--color-ami-green-800` | `#0D2E0C` | creme sobre ele 14,22:1 | faixa de seção |
| `--color-ami-green-700` | `#124211` | 10,07:1 como texto no creme | borda e estado escuro |
| `--color-ami-green-600` | `#1A5E18` | **6,87:1** como texto no creme | AÇÃO |
| `--color-ami-lima-400` | `#A8D470` | 8,72:1 sobre green-800 | acento |
| `--color-ami-lima-100` | `#E2E9CC` | ação sobre ela 6,31:1 | lavagem de passagem de mouse |

A escala verde é monotônica, conferida por luminância: `0,0080 → 0,0207 → 0,0407 → 0,0829`.

**Tokens que somem:**

| token | usos hoje | destino |
|---|---|---|
| `--color-ami-green-950` | 3 | vira `ami-green-900` |
| `--color-ami-mint-400` | 5 | vira `ami-lima-400` |
| `--color-ami-mint-100` | 13 | vira `ami-lima-100` |
| `--color-ami-green-500` | **0** | apagado, já morto |
| `--color-surface-fundo` | **0** | apagado, já morto |

---

## Tarefa 1: O teste de contraste

Escrito **antes** da paleta e passando com os valores de hoje. É ele que vai pegar a regressão da tarefa 2.

**Arquivos:**
- Criar: `testes/paleta.test.ts`
- Ler (não modificar): `app/globals.css`

**Interfaces:**
- Consome: `fonte(relativo)` de `testes/apoio.ts`
- Produz: `tokensDeCor(css)`, `luminancia(hex)`, `razaoDeContraste(a, b)` — exportados do próprio arquivo de teste, para a tarefa 2 não reimplementar

- [ ] **Passo 1: Ver o estado de hoje**

```bash
npx vitest run
grep -c "\-\-color-" app/globals.css
```

Anote a contagem de testes. É a linha de base.

- [ ] **Passo 2: Escrever o teste**

Crie `testes/paleta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fonte } from "@/testes/apoio";

/*
  As razões de contraste da paleta, calculadas — não lidas de comentário.

  `app/globals.css` diz "Quem alterar qualquer tom aqui mede de novo". Isso é
  um comentário, e comentário não mede nada: ele foi ignorado uma vez, e o
  próprio arquivo registra o resultado — `ink-400` foi para 3,48:1 e reprovava
  em AA no uso dele, que é texto de corpo.

  Este arquivo lê os tokens do CSS e faz a conta. Não confere o que está
  escrito ao lado do valor; confere o valor.
*/

/** Todos os `--color-x: #hex` de um CSS, por nome. */
export function tokensDeCor(css: string): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    mapa[m[1]] = m[2].toUpperCase();
  }
  return mapa;
}

/** Luminância relativa, fórmula da WCAG 2.1. */
export function luminancia(hex: string): number {
  const canais = [0, 2, 4]
    .map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

export function razaoDeContraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const CSS = fonte("../app/globals.css");
const T = tokensDeCor(CSS);

/** Mínimo da WCAG AA para texto de corpo. */
const MINIMO = 4.5;

describe("a conta", () => {
  it("bate com valores conhecidos", () => {
    /*
      Preto sobre branco é 21:1 exato. Sem esta âncora, um erro na fórmula
      passaria despercebido e todas as asserções abaixo mediriam a coisa errada
      com confiança.
    */
    expect(razaoDeContraste("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(razaoDeContraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 2);
  });
});

describe("os tokens existem", () => {
  const EXIGIDOS = [
    "canvas",
    "surface",
    "ink-900",
    "ink-600",
    "ink-400",
    "ink-300",
    "line",
    "line-strong",
  ];

  it("todos os papéis do sistema estão declarados", () => {
    for (const nome of EXIGIDOS) {
      expect(T[nome], `falta --color-${nome} em app/globals.css`).toBeTruthy();
    }
  });
});

describe("texto sobre os dois fundos claros", () => {
  const TEXTO_DE_CORPO = ["ink-900", "ink-600", "ink-400"];

  for (const fundo of ["canvas", "surface"]) {
    for (const tinta of TEXTO_DE_CORPO) {
      it(`${tinta} sobre ${fundo}`, () => {
        const r = razaoDeContraste(T[tinta], T[fundo]);
        expect(
          r,
          `--color-${tinta} sobre --color-${fundo} dá ${r.toFixed(2)}:1, abaixo de ${MINIMO}:1`,
        ).toBeGreaterThanOrEqual(MINIMO);
      });
    }
  }

  it("ink-300 fica de fora de propósito", () => {
    /*
      `ink-300` é placeholder e ícone desabilitado — nunca texto que alguém
      precisa ler. Se um dia ele passar de 4,5:1, o motivo dele deixou de
      existir e o comentário de globals.css precisa ser revisto.
    */
    expect(razaoDeContraste(T["ink-300"], T["canvas"])).toBeLessThan(MINIMO);
  });
});
```

- [ ] **Passo 3: Rodar e ver passar com os valores de hoje**

```bash
npx vitest run testes/paleta.test.ts
```

Esperado: PASSA. Os valores de hoje (`canvas: #f5f6f8`) atendem, ainda que `ink-400` esteja perto do limite.

- [ ] **Passo 4: Provar que o teste morde**

Troque temporariamente em `app/globals.css`:

```
--color-ink-600: #565c66;   →   --color-ink-600: #a0a4ac;
```

```bash
npx vitest run testes/paleta.test.ts
```

Esperado: FALHA em "ink-600 sobre canvas", com a razão na mensagem. **Desfaça** e confirme que volta a passar. Cole as duas saídas literais no relatório.

- [ ] **Passo 5: Provar que a âncora da conta morde**

Troque temporariamente `0.2126` por `0.5126` na função `luminancia`.

```bash
npx vitest run testes/paleta.test.ts
```

Esperado: FALHA em "bate com valores conhecidos". **Desfaça.**

Sem essa âncora, um erro na fórmula faria todas as outras asserções medirem errado com confiança — que é pior que não medir.

- [ ] **Passo 6: Commit**

```bash
git add testes/paleta.test.ts
git commit -m "Teste que calcula as razoes de contraste da paleta

globals.css diz em comentario que quem alterar tom deve medir de novo.
Comentario nao mede: foi ignorado uma vez e o proprio arquivo registra o
resultado. Este teste le os tokens e faz a conta."
```

---

## Tarefa 2: A paleta

O teste da tarefa 1 vai reprovar `ink-400`. **Isso é esperado e é a demonstração de que ele serve.**

**Arquivos:**
- Modificar: `app/globals.css`, bloco `@theme` (a partir da linha 21)

**Interfaces:**
- Consome: o teste da tarefa 1
- Produz: os tokens da tabela acima. As tarefas 3 e 4 dependem de `ami-lima-400`, `ami-lima-100`, `ami-green-900` e `ami-green-800` existirem com esses nomes

- [ ] **Passo 1: Ler o bloco inteiro antes de tocar**

```bash
sed -n '21,80p' app/globals.css
```

Os comentários desse bloco explicam **por que** cada tom existe. Eles são o registro de decisões medidas, não decoração. Reescreva os que ficarem falsos; não apague os que continuarem verdadeiros.

- [ ] **Passo 2: Trocar o campo e a superfície**

```
--color-canvas: #F2EFE6;
--color-surface: #FBFAF5;
```

Reescreva o comentário acima deles. O que está lá hoje diz que `canvas` é *"cinza-prata frio, sem uma gota de verde"* — vira falso. O novo diz que é creme, e por quê: o dono pediu branco que não fosse branco puro, e o creme aquece a página sem trazer o verde de volta ao fundo.

- [ ] **Passo 3: Rodar e ver a regressão aparecer**

```bash
npx vitest run testes/paleta.test.ts
```

**Esperado: FALHA em "ink-400 sobre canvas"**, com algo como *"dá 4,33:1, abaixo de 4,5:1"*.

O creme é mais escuro que o branco, então toda a escala de tinta perde contraste junto. Cole a saída literal no relatório: é a prova de que a tarefa 1 valeu.

- [ ] **Passo 4: Corrigir `ink-400`**

```
--color-ink-400: #61666F; /* 5,02:1 no creme, 5,52:1 na superfície · legenda e data */
```

Era `#6b7079`. Meio ponto acima do mínimo, não colado nele.

- [ ] **Passo 5: Trocar os fios**

```
--color-line: #E4E0D4;
--color-line-strong: #D8D3C4;
```

Fio não precisa de razão de leitura — precisa aparecer sobre o creme sem virar risco preto. Os valores de hoje são frios e somem sobre creme.

- [ ] **Passo 6: Trocar a escala verde**

Substitua o bloco de verde inteiro por:

```
  /* --- VERDE: derivado da própria marca ---

     `public/marca/ami-marca.svg` tem dois verdes: #00A457 esmeralda e
     #248322, escuro e puxando para o amarelo. Toda a escala abaixo sai do
     segundo. Antes disto a escala era de outra família, azulada, e nenhum
     dos tons tinha relação com a marca.

     As razões foram calculadas contra o creme (#F2EFE6), e `testes/paleta.test.ts`
     as recalcula a cada rodada. Quem alterar um tom aqui não precisa lembrar
     de medir: o teste mede. */
  --color-ami-green-900: #071A07; /* cabeçalho e rodapé · creme sobre ele 17,33:1 */
  --color-ami-green-800: #0D2E0C; /* faixa de seção · creme sobre ele 14,22:1 */
  --color-ami-green-700: #124211; /* borda e estado escuro · 10,07:1 no creme */
  --color-ami-green-600: #1A5E18; /* AÇÃO: 6,87:1 no creme */

  /* --- LIMA: o acento ---

     Sai do mesmo #248322, clareado. NUNCA é texto sobre fundo claro: dá
     1,48:1 no creme, invisível. Só fundo de texto escuro (11,33:1) ou marca
     sobre o verde (8,72:1). Isto é física, não preferência. */
  --color-ami-lima-400: #A8D470;
  --color-ami-lima-100: #E2E9CC; /* lavagem de passagem de mouse */
```

Apague `--color-ami-green-950`, `--color-ami-green-500`, `--color-surface-fundo`, `--color-ami-mint-400` e `--color-ami-mint-100`.

- [ ] **Passo 7: Conferir `warn` e `danger` no creme**

Eles não foram medidos contra o fundo novo. Rode:

```bash
node -e '
const h=x=>[0,2,4].map(i=>parseInt(x.slice(1).slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);
const L=x=>{const c=h(x);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const R=(a,b)=>{const[x,y]=[L(a),L(b)].sort((m,n)=>n-m);return((x+.05)/(y+.05)).toFixed(2)};
console.log("warn   #8a6a00 no creme:", R("#8a6a00","#F2EFE6"));
console.log("danger #a33232 no creme:", R("#a33232","#F2EFE6"));
'
```

Se algum ficar abaixo de 4,5:1, escureça até passar com folga e **acrescente os dois ao teste da tarefa 1**, na lista de texto de corpo. Cole a saída no relatório de qualquer forma.

- [ ] **Passo 8: Rodar tudo**

```bash
npx vitest run
npx tsc --noEmit
```

Esperado: `paleta.test.ts` verde. **Outros testes podem quebrar** — os que citam nome de token. Conserte-os na tarefa 3, não aqui; anote quais quebraram.

- [ ] **Passo 9: Commit**

```bash
git add app/globals.css
git commit -m "A paleta vira creme e o verde sai da propria marca

O campo era cinza-azulado e o verde era de outra familia. Agora o campo e
creme e a escala verde deriva do #248322 do arquivo da marca.

O teste da tarefa anterior pegou a regressao real: ink-400 caiu para 4,33:1
no creme, abaixo do minimo, porque creme e mais escuro que branco. O mesmo
token ja tinha reprovado uma vez. Corrigido para #61666F, 5,02:1."
```

---

## Tarefa 3: Os nomes que mudaram

`mint` virou `lima`, e `green-950` foi consolidado. O código ainda usa os nomes velhos.

**Arquivos:**
- Modificar: todos os que usarem `ami-mint-100`, `ami-mint-400`, `ami-green-950`
- Modificar: os testes que quebraram na tarefa 2

- [ ] **Passo 1: Achar todos**

```bash
grep -rn "ami-mint-100\|ami-mint-400\|ami-green-950\|ami-green-500\|surface-fundo" --include="*.tsx" --include="*.ts" --include="*.css" app/ components/ testes/
```

Esperado, pela contagem feita no levantamento: `ami-mint-100` em 13 lugares, `ami-mint-400` em 5, `ami-green-950` em 3. Se aparecer número diferente, anote — o levantamento foi de hoje, mas confira.

- [ ] **Passo 2: Trocar**

| de | para | por quê |
|---|---|---|
| `ami-mint-100` | `ami-lima-100` | mesma função: lavagem de passagem de mouse |
| `ami-mint-400` | `ami-lima-400` | mesma função: texto claro sobre verde |
| `ami-green-950` | `ami-green-900` | o 950 foi consolidado no 900 |

Faça por busca e substituição exata do nome do token, não por expressão ampla — `ami-green-950` e `ami-green-9` não são a mesma busca.

- [ ] **Passo 3: Conferir que não sobrou nenhum**

```bash
grep -rn "ami-mint\|ami-green-950\|ami-green-500\|surface-fundo" --include="*.tsx" --include="*.ts" --include="*.css" app/ components/ testes/
```

**Esperado: nenhuma linha.** Token que não existe mais no `@theme` vira classe morta no Tailwind: não gera CSS, não dá erro, e o elemento fica sem cor nenhuma. Falha silenciosa.

- [ ] **Passo 4: Rodar tudo**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

Esperado: os três limpos.

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "mint vira lima, e green-950 consolida em green-900

Token que sai do @theme e nao sai do componente vira classe morta: o
Tailwind nao gera CSS, nao da erro, e o elemento fica sem cor. Falha
silenciosa, e por isso o passo termina num grep que precisa voltar vazio."
```

---

## Tarefa 4: As cores escritas à mão

Três `rgba()` e um gradiente escapam do sistema de tokens — e por isso escapam do teste.

**Arquivos:**
- Modificar: `app/(site)/page.tsx` (linhas 84 e 104)
- Modificar: `components/diretorio/Placa.tsx` (linha 56)
- Modificar: `app/globals.css` (linha 113, `--shadow-lamina`)

- [ ] **Passo 1: Ver as quatro**

```bash
grep -rn "rgba\?(" --include="*.tsx" app/ components/
grep -n "shadow-lamina" app/globals.css
```

- [ ] **Passo 2: Os dois gradientes do herói**

`app/(site)/page.tsx:84` usa `rgba(31,107,58,...)` e `rgba(11,48,24,...)` — os verdes velhos, escritos em decimal. Troque pelos novos: `#1A5E18` é `rgba(26,94,24,...)` e `#0D2E0C` é `rgba(13,46,12,...)`. Mantenha as opacidades como estão.

`app/(site)/page.tsx:104` mistura token com `rgba(11,48,24,0)` — um transparente. Troque por `rgba(13,46,12,0)`. E `--color-ami-green-500` não existe mais: use `--color-ami-green-600`.

> **Nota para quem executa:** este herói é substituído inteiro pela fatia da home, que já está desenhada. Não vale reestruturá-lo agora — só evitar que ele fique quebrado entre uma fatia e outra.

- [ ] **Passo 3: A sombra da placa**

`components/diretorio/Placa.tsx:56` tem `rgba(165,220,175,0.22)` — o mint velho. Troque por `rgba(168,212,112,0.22)`, que é o lima novo.

- [ ] **Passo 4: A lâmina**

`app/globals.css:113` é `inset 0 1px 0 rgba(255, 255, 255, 0.9)` — um brilho branco no topo de superfícies. Sobre creme, branco puro aparece como uma linha fria.

Troque por `rgba(255, 253, 248, 0.9)`, que é a superfície nova. Confira na tela se o efeito ainda se vê; se sumir, suba a opacidade em vez de voltar ao branco.

- [ ] **Passo 5: Conferir que não sobrou cor solta**

```bash
grep -rn "#[0-9a-fA-F]\{6\}\b" --include="*.tsx" app/ components/ | grep -v "marca/"
```

**Esperado: nenhuma linha.** No levantamento não havia nenhuma; se aparecer alguma agora, foi introduzida por esta fatia e precisa virar token.

- [ ] **Passo 6: Rodar tudo**

```bash
npx vitest run && npx tsc --noEmit && npm run build
```

- [ ] **Passo 7: Commit**

```bash
git add -A
git commit -m "As quatro cores escritas a mao acompanham a paleta

Gradiente do heroi, sombra da placa e a lamina de brilho. Elas escapam do
sistema de tokens e por isso escapam do teste de contraste — sao as unicas
que precisam de olho."
```

---

## Tarefa 5: A conferência com os olhos

Sem código novo. Cor não se confere lendo hexadecimal.

**Arquivos:**
- Modificar: `docs/estado-do-projeto.md`

- [ ] **Passo 1: Subir o site**

```bash
npm run build && npx next start -p 3100
```

**Com o `npm run dev` desligado.** Dois servidores sobre o mesmo banco já custaram uma investigação inteira neste projeto.

- [ ] **Passo 2: Olhar cada página, larga e estreita**

`/` · `/medicos` · uma especialidade · um perfil de médico · `/noticias` · uma notícia · `/associacao` · `/associacao/diretoria` · `/politica-de-privacidade` · `/painel/entrar`

Em cada uma, procure: texto que sumiu no fundo, fio invisível, botão que perdeu a borda, e a etiqueta "Associado AMI".

- [ ] **Passo 3: O que mais interessa ao dono**

**A faixa de verde profundo lê como verde ou como preto?**

Foi a única decisão em que ele foi contra a recomendação: eu propus `#1A5218` (croma 58, "verde nítido") e ele escolheu `#0D2E0C` (croma 34). Está registrado na seção 5 da spec.

Anote a sua impressão no relatório, com uma captura de tela. A decisão é dele, mas ele pediu para ver montado.

- [ ] **Passo 4: O painel**

O painel usa o mesmo `app/globals.css` e mudou junto, e isso **não foi discutido com o dono**. Está na seção 10 da spec como decisão a confirmar.

Olhe `/painel/entrar` e diga no relatório se a paleta serve a ele ou se destoa.

- [ ] **Passo 5: Atualizar o documento de estado**

Em `docs/estado-do-projeto.md`, registre a paleta nova, o teste de contraste, e que a fatia da home vem em seguida, já desenhada em `docs/superpowers/specs/2026-08-23-home-nova-decisoes.md`.

- [ ] **Passo 6: Commit**

```bash
git add -A
git commit -m "Registra a paleta creme e o teste de contraste no estado do projeto"
```

---

## Autorrevisão do plano

**Cobertura da spec:**

| seção da spec | tarefa |
|---|---|
| 1, por que a fatia existe | informativa |
| 2, o que as referências dizem | informativa |
| 3, a descoberta da marca | 2 (a escala deriva de `#248322`) |
| 4, a paleta e os números | 2 |
| 4, o defeito de `ink-400` | 1 e 2 — o teste pega, a tarefa 2 corrige |
| 4, o limite do acento | 2 (comentário) e 1 (o teste não o inclui como texto) |
| 5, a ressalva do verde profundo | 5, passo 3 |
| 6, o tamanho do trabalho | 2, 3 e 4 |
| 7, a trava que falta | 1 |
| 8, verificação | 1 e 5 |
| 9, o que fica de fora | nenhuma tarefa, por definição |
| 10, riscos | 4 (cor solta), 5 (faixa e painel) |

**Marcadores por preencher:** nenhum. Todo passo de código traz o código ou o comando.

**Consistência de nomes:** `tokensDeCor`, `luminancia` e `razaoDeContraste` são definidos na tarefa 1 e não são consumidos por outras tarefas — o passo 7 da tarefa 2 usa um script solto de propósito, para não depender de importar de um arquivo de teste. Os nomes de token (`ami-lima-400`, `ami-lima-100`, `ami-green-900`, `ami-green-800`) são criados na tarefa 2 e consumidos na 3 e na 4, com a mesma grafia.

**Uma lacuna que eu reconheço:** o teste da tarefa 1 confere texto sobre os dois fundos claros, mas **não** confere creme sobre verde, acento sobre verde, nem tinta sobre acento — os pares que a spec lista na seção 7. Isso é deliberado: esses pares dependem de saber **qual token vai sobre qual**, e essa informação não está no CSS, está nos componentes. Cobri-los exigiria uma lista escrita à mão no teste, que apodrece. O passo 7 da tarefa 2 e a conferência da tarefa 5 cobrem esses pares por medição pontual e por olho. **Se a revisão discordar, a lista à mão é aceitável — desde que o teste falhe quando um token sair dela.**
