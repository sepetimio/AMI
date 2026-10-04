# Encontre um médico (busca e perfil) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/busca` e `/medico/[slug]` ficam iguais ao desenho aprovado (`docs/desenho-aprovado/encontre/`), o site inteiro deixa de mostrar bairro, telemedicina, acessibilidade e o selo de associado, e nenhuma página interna abre rolada para baixo.

**Architecture:** As decisões sobre um médico (iniciais, consultório principal, telefone do cartão, links do mapa e do WhatsApp, "outros médicos", contagem) viram funções puras em `lib/encontre.ts`. A foto, o cartão e a grade são três componentes de servidor em `components/diretorio/`, usados pela busca, pelo perfil e pela página de especialidade. A busca e o perfil são páginas novas sem `Cabeceira`, com o CSS **transcrito das regras do desenho** (o trecho do `<style>` depois do comentário "Fatia B · Encontre um médico") em CSS Modules, trocando código de cor por token. O filtro passa a ser só `termo` e `especialidade`, e a ordem, sempre alfabética.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (`@theme`), CSS Modules, Supabase, Vitest, `@phosphor-icons/react/dist/ssr`.

**Spec:** `docs/superpowers/specs/2026-10-03-encontre-um-medico-design.md` — leia inteira antes de começar. É a autoridade. O desenho (`docs/desenho-aprovado/encontre/busca.html` e `perfil.html`, que abrem direto no navegador, e as fotos `.jpg` da mesma pasta) é a referência de todo valor visual; quando o plano e o desenho discordarem num valor, vale o desenho. A spec da reforma visual (`docs/superpowers/specs/2026-10-03-redesign-visual-design.md`) continua valendo para tokens, fontes, botões, réguas e a trava.

**Diário da fatia A:** `.superpowers/sdd/2026-10-03-redesign-fatia-a/progress.md`, rulings 1 a 44. Os que pesam aqui estão nas Global Constraints.

## Global Constraints

Valem para toda tarefa, sem exceção.

**Do projeto (vêm da fatia A e continuam):**

- Texto que o usuário lê: português. Mensagens de commit: português **sem acento**.
- Este Next.js tem mudanças em relação ao que você conhece: antes de usar API do Next, leia o guia em `node_modules/next/dist/docs/`.
- **Nenhum número de contraste escrito de memória.** Os do relatório do desenho foram medidos em 03/10/2026; qualquer outro, meça.
- **Nenhum comentário promete o que o código não faz**, e **nenhum comentário aponta para `.superpowers/`** nem para "tarefa N" deste plano. Comentário que cita arquivo apagado nesta fatia é comentário falso: `grep` antes do commit.
- **Prove por mutação** toda asserção nova: quebre o código de propósito, veja o teste ficar vermelho, desfaça. **Desfazer = regravar o conteúdo original** (Edit de volta, ou Write com o conteúdo que você leu antes). **Nunca** `git checkout -- <arquivo>` nem `git restore`.
- **`core.autocrlf=true`, e o repositório mistura CRLF e LF** (ex.: `lib/dados/filtros.ts` e `components/diretorio/Placa.tsx` são CRLF; `app/layout.tsx` é LF). Edite de forma cirúrgica (Edit), nunca regrave um arquivo existente inteiro sem lê-lo antes. Antes de cada commit: `git status --short` só pode listar arquivos da tarefa; um arquivo listado sem mudança de conteúdo (`git diff --ignore-cr-at-eol -- <arquivo>` vazio) é diferença só de fim de linha — regrave-o com o fim de linha original. Faça `git add` arquivo por arquivo, nunca `git add -A`.
- **BOM:** `lib/dados/filtros.ts`, `lib/dados/medicos.ts` e `lib/dados/especialidades.ts` começam com BOM (`﻿`). Mantenha.
- Rodar em toda tarefa: `npx vitest run` · `npx tsc --noEmit` · `npm run build`. Tudo verde antes do commit.
- **O servidor de desenvolvimento da porta 3000 é do cliente: não derrube, não reinicie.** Só leitura nele. Para medir em produção: `npm run build` e `npx next start -p 3300`; no fim, derrube pelo PID (no Windows o filho sobrevive: `Get-NetTCPConnection -LocalPort 3300` acha o PID).
- Você **não** despacha subagentes.
- **Ruling 11:** componente se testa por **renderização** (`renderToString`, ou `htmlDe` de `testes/renderizar.ts` para página com parte assíncrona); lógica, por **função pura**. Ler o código como texto só vale para CSS e para a ligação com o navegador (observador, evento, atributo que o Next lê).
- **`sizes` das imagens pela largura desenhada**, com as réguas do CSS de quem usa (lição do Ruling 44).
- **Cores:** nenhum tom creme ou quente (`testes/tom-quente.test.ts` varre o site). Efeito de mouse é borda mais escura, sombra neutra e 1px de subida; **nunca** verde claro.
- **Contraste:** todo texto a pelo menos 4,5:1.
- **Trava:** `NEXT_PUBLIC_DADOS_DEMONSTRACAO` só desliga com `"false"` exato. Nada desta fatia é moldura "a entrar": as iniciais no lugar da foto saem nos dois modos (spec 1.5).
- **O que o cliente recusou e não volta:** fundo creme; verde-limão claro como fundo; sombra com tom de verde; passar o mouse e ficar verde claro; botão verde chapado ou quase preto; caixa atrás de caixa; celular que só empilha; nada cortado na borda do celular; espaços desiguais; desalinhamento; **a `Cabeceira` cinza nas páginas internas** (recusada duas vezes: sai da busca e do perfil nesta fatia).
- **Réguas:** `--m` 48/28/20px, `--ritmo` 72/56/32px, `--gap` 24/16/12px, `--borda-faixa` (faixas de ponta a ponta); quebras em 1180, 980, 820, 700, 400 e 380px, como no desenho.
- **Marcas para a auditoria:** todo bloco de primeiro nível das páginas novas leva `data-bloco="<nome>"` (busca: `busca`, `resultados`; perfil: `perfil`, `onde-atende`, `sobre`, `outros`, `nota`); o primeiro texto de cada bloco que fica na coluna do texto leva `data-coluna`; a faixa de ponta a ponta leva `data-faixa`.
- **Tradução de cor do desenho para o site** (use o token, nunca o código):

  | No desenho | No site |
  |---|---|
  | `--chao #EEF1EF` | `var(--color-canvas)` |
  | `--painel #FFFFFF` / `#fff` | `var(--color-surface)` |
  | `--linha #E5E7EB` | `var(--color-line)` |
  | `#D1D5DB`, `#D5D9DF`, `#D9DDE3` (bordas e fios) | `var(--color-line-strong)` |
  | `--tinta #0c0e12` | `var(--color-ink-900)` |
  | `--tinta-2 #4F5661` | `var(--color-ink-600)` |
  | `--tinta-3 #646B75` | `var(--color-ink-400)` |
  | `--v800` / `--v600` | `var(--color-ami-green-800)` / `var(--color-ami-green-600)` |
  | `--lima #A8D470` | `var(--color-ami-lima-400)` |
  | `--raio 22px` | `var(--radius-painel)` |
  | `--sombra` | `var(--shadow-erguido)` |
  | `#cfd8c9` (texto sobre o verde) | em código, como já está em `EncontreUmMedico.module.css` |
  | `#DDE2E0` (fundo da foto enquanto carrega) | em código, só em `FotoDoMedico.module.css` |
  | `#B9BFC8` (borda do `.botao-contorno` no mouse) | em código, só em `app/globals.css` |

  Sombras do desenho com `rgba(16,24,40,…)`, `rgba(12,14,18,…)` e `rgba(0,0,0,.25)` vão como estão (são neutras).

**Da spec nova (fatia B, grupo 1):**

- **Só associados aparecem no site.** O site não lê `associadoAmi` para exibir nada: sai o filtro "Somente associados", o selo "Associado AMI" e o parâmetro `associados`. O dado continua no banco e no painel.
- **Bairro sai do site**, exceto como parte do **endereço** do consultório no perfil e como **título do cartão** de cada consultório.
- **Telemedicina e acessibilidade não aparecem no site.** Os dados continuam no banco e no painel. (O JSON-LD do perfil fica como está: ver a decisão D3 no fim.)
- **Cartão do médico:** só foto, nome, a linha "MÉDICO · CRM/UF nnnnn", a especialidade principal com RQE (quando houver) e o botão "Ligar". Nada mais.
- **"MÉDICO"** para todos, como hoje (`identificacaoMedica`, `lib/formato.ts`). "MÉDICA" depende da AMI.
- **Filtros:** só a caixa "Nome ou especialidade" (`termo`) e a lista "Todas as especialidades" (`especialidade`). **A ordem é sempre alfabética**, e a busca diz isso.
- A busca de texto vai **por formulário** (Enter ou "Buscar"); **não** filtra enquanto se digita.
- Parâmetros antigos (`bairro`, `telemedicina`, `acessibilidade`, `associados`, `ordem`) são ignorados: sem erro, sem redirecionamento.
- O **envio de foto pelo painel não entra** (fatia à parte, depende do armazenamento do Supabase).
- Busca e perfil **sem `Cabeceira` e sem breadcrumb visível**. As outras páginas internas continuam com a `Cabeceira` até o desenho de cada grupo, e só perdem os bairros e ganham a correção da rolagem.

---

## Mapa de arquivos

| Arquivo | O que é | Tarefa |
|---|---|---|
| `app/layout.tsx` | `data-scroll-behavior="smooth"` no `<html>` | 1 |
| `lib/encontre.ts` (novo) | funções puras de busca e perfil | 2 |
| `components/base/Icone.tsx` | 4 ícones novos | 2 |
| `components/diretorio/FotoDoMedico.tsx` + `.module.css` (novos) | retrato ou iniciais | 3 |
| `components/diretorio/CartaoMedico.tsx` + `.module.css` (novos) | o cartão | 3 |
| `components/diretorio/GradeMedicos.tsx` + `.module.css` (novos) | a grade de cartões | 3 |
| `testes/css.ts` (novo) | `semNotas`, `bloco`, `regra`, `base` para ler CSS | 3 |
| `lib/dados/urlFiltros.ts` | `especialidade` na URL, `enderecoDaBusca`, depois só os dois filtros | 4, 5 |
| `components/busca/FaixaDaBusca.tsx`, `FormularioDaBusca.tsx`, `ResultadosDaBusca.tsx` + CSS (novos) | a busca | 4 |
| `app/(site)/encontre.module.css` (novo) | coluna e ritmo das páginas novas | 4 |
| `app/(site)/busca/page.tsx` | reescrita | 4, 5 |
| `testes/renderizar.ts` | `htmlDe` | 4 |
| `lib/dados/tipos.ts`, `filtros.ts`, `medicos.ts` | filtros reduzidos, ordem alfabética | 5 |
| `next.config.ts` | redirecionamento de `/medicos/:e/:b` | 5 |
| `app/sitemap.ts` | sem cruzamentos | 5 |
| `components/home/Parceiros.tsx` (era `BairrosEParceiros.tsx`) | só parceiros | 6 |
| `components/home/NumerosDaAmi.tsx` | três números | 6 |
| `lib/dados/facetas.ts` | parágrafo sem bairro, telemedicina, acessibilidade, associado | 6 |
| `components/perfil/TopoDoPerfil.tsx`, `OndeAtende.tsx`, `Perfil.module.css` (novos) | o perfil | 7 |
| `app/(site)/medico/[slug]/page.tsx` | reescrita | 7, 8 |
| `components/perfil/BarraDoMedico.tsx` (novo) | barra do pé do perfil | 8 |
| `scripts/auditoria-visual.js` | "abre no topo", "Ligar" alinhados, barras | 1, 9 |

Apagados: `components/diretorio/PainelFiltros.tsx` (4), `ListaMedicos.tsx` e `app/(site)/medicos/[especialidade]/[bairro]/page.tsx` (5), `LadrilhosBairros.tsx` + `.module.css` (6), `LinhaMedico.tsx` e `components/base/Chip.tsx` (7).

**Ordem das tarefas e por que difere da decomposição sugerida:** os filtros reduzidos não podem vir antes da busca nova, porque o `PainelFiltros` (que usa `bairro`, `telemedicina`, `acessibilidade`, `associados`, `ordem`) é a interface da busca de hoje; tirar os campos do tipo `Filtros` quebraria a compilação da busca e da página de cruzamento. Por isso: funções puras (2) → cartão (3) → busca nova, que aposenta o `PainelFiltros` (4) → filtros reduzidos e fim da rota de bairro, que dependia deles (5) → bairros fora do resto do site (6).

---

### Task 1: A página nova abre no topo

**O diagnóstico já foi feito** (03/10/2026, no servidor da porta 3000, só leitura, clicando no menu a partir da home e esperando a rolagem parar):

| Destino | Vindo da home parada no topo | Vindo da home rolada 1500px |
|---|---|---|
| `/busca` | 456 | 0 |
| `/medicos` | 427 | 0 |
| `/associacao` | 392 | 0 |
| `/contato` | 286 | 0 |
| `/noticias` | 186 | 0 |

Os números batem com a spec (seção 3). **A causa não é a `Cabeceira`:**

1. `app/globals.css` põe `scroll-behavior: smooth` no `html`. O **Next 16 deixou de desligar a rolagem suave na troca de página** (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, "Scroll Behavior Override"): só desliga se o `<html>` tiver `data-scroll-behavior="smooth"` (código em `node_modules/next/dist/shared/lib/router/utils/disable-smooth-scroll.js`). O próprio Next avisa no console da porta 3000: "Detected `scroll-behavior: smooth` on the `<html>` element…".
2. Ao entrar na página nova, o Next (`layout-router.js`, `InnerScrollHandlerNew`) acha o topo do primeiro elemento da página acima da janela (a `Cabeceira` começa em y = −44 por causa do `-mt-32`), manda `scrollTop = 0` e depois chama `scrollIntoView` em **cada filho do fragmento da página, do último para o primeiro**. Com rolagem suave, essas chamadas viram animações que se atropelam; a do `<header>` da `Cabeceira` não tem para onde ir (alvo negativo), e a animação anterior, a do bloco logo abaixo dela, vence: a página para no topo desse bloco (427px em `/medicos`).

Medidas das duas correções candidatas, uma de cada vez (injetadas só na aba de teste):

| Variante | `/busca` topo / rolada | `/medicos` topo / rolada | `/contato` topo / rolada |
|---|---|---|---|
| `data-scroll-behavior="smooth"` no `<html>` | 0 / 0 | 0 / 0 | 0 / 0 |
| `Cabeceira` sem `-mt-32` | 0 / **84** | 0 / **84** | — |

Só o atributo resolve; tirar o `-mt-32` sozinho deixa a página a 84px quando se chega de uma página rolada. **Decisão:** corrigir pelo atributo, que vale para toda página do site, e **não** mexer na `Cabeceira` (mudaria o desenho de seis páginas que ainda não foram redesenhadas, sem ganho medido).

**Files:**
- Modify: `app/layout.tsx`
- Create: `testes/rolagem.test.ts`
- Modify: `scripts/auditoria-visual.js` (conferência 12, "abre no topo")

**Interfaces:**
- Produces: `<html data-scroll-behavior="smooth">`; a conferência 12 da auditoria, que a Task 9 roda.

- [ ] **Step 1: Escrever o teste que trava a causa**

`testes/rolagem.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  Nenhuma página interna abre rolada.

  O `<html>` tem rolagem suave (app/globals.css), e o Next 16 só a desliga
  na troca de página quando o `<html>` traz `data-scroll-behavior="smooth"`.
  Sem o atributo, a volta ao topo da página nova vira animação, e os
  posicionamentos que o Next faz em seguida, um por bloco da página,
  atropelam essa animação: medido em 03/10/2026, a página parava de 186 a
  456px abaixo do topo.

  É ligação com o navegador, que não roda sem ele: aqui se lê o código. A
  medida na tela é da auditoria (scripts/auditoria-visual.js, conferência
  "abre no topo").
*/
const LAYOUT = semComentarios(fonte("../app/layout.tsx"));
const CSS = semComentarios(fonte("../app/globals.css"));
const NEXT = fonte("../node_modules/next/dist/shared/lib/router/utils/disable-smooth-scroll.js");

describe("a página nova abre no topo", () => {
  it("o html tem rolagem suave, e por isso avisa o Next", () => {
    expect(CSS).toMatch(/html\s*\{[^}]*scroll-behavior:\s*smooth/);
    expect(LAYOUT).toMatch(/<html\b[^>]*\bdata-scroll-behavior="smooth"/);
  });

  it("o Next desta versão lê exatamente esse atributo", () => {
    /* Se uma atualização do Next trocar o nome, este fica vermelho antes de
       a página voltar a abrir rolada. */
    expect(NEXT).toContain("htmlElement.dataset.scrollBehavior === 'smooth'");
    expect(NEXT).toContain("htmlElement.style.scrollBehavior = 'auto'");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/rolagem.test.ts`
Expected: FAIL no primeiro `it` (o atributo não existe); o segundo passa.

- [ ] **Step 3: O atributo**

Em `app/layout.tsx`, troque o `return` de `LayoutRaiz` por:

```tsx
  /*
    `data-scroll-behavior="smooth"`: o `<html>` tem rolagem suave
    (app/globals.css), e o Next 16 só a desliga na troca de página quando vê
    este atributo. Sem ele, a página nova abria rolada para baixo, de 186 a
    456px (medido em 03/10/2026): a volta ao topo virava animação, e os
    posicionamentos seguintes do Next a interrompiam.
  */
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${fonteCorpo.variable} ${fonteTitulo.variable} ${fonteRegistro.variable}`}
    >
      <body>{children}</body>
    </html>
  );
```

- [ ] **Step 4: Rodar e ver passar; provar por mutação**

Run: `npx vitest run testes/rolagem.test.ts` → PASS.
Mutação: troque o valor para `data-scroll-behavior="auto"` → vermelho; regrave o original → verde.

- [ ] **Step 5: A conferência "abre no topo" na auditoria**

Em `scripts/auditoria-visual.js`:

(a) No comentário do topo, ao fim da lista "O que confere:", acrescente:

```
  - ao chegar pelo menu, vindo de outra página parada no topo ou no meio, a
    página nova abre em `scrollY` 0. É a última conferência, porque troca de
    página: quando a auditoria termina, a aba está noutra página.
```

(b) No fim do arquivo, troque

```js
  botaoPausa?.click();
  semAnimacao.remove();
  return JSON.stringify({ ...info, problemas });
})();
```

por

```js
  botaoPausa?.click();
  semAnimacao.remove();

  /* 12. Nenhuma página abre rolada ao chegar pelo menu. Roda depois de
     tirar o `semAnimacao`: com a rolagem suave desligada pela auditoria, o
     defeito não aparece. Cada destino é visitado vindo de outra página
     parada no topo (o caso que abria rolado) e no meio. */
  const estavel = async () => {
    let ultimo = -1;
    let iguais = 0;
    for (let i = 0; i < 100; i++) {
      await espera(100);
      if (scrollY === ultimo) {
        if (++iguais >= 8) return scrollY;
      } else {
        iguais = 0;
        ultimo = scrollY;
      }
    }
    return scrollY;
  };
  const ir = async (href) => {
    const antes = document.querySelector("main")?.firstElementChild;
    const link = [...document.querySelectorAll("header a")].find(
      (a) => a.getAttribute("href") === href,
    );
    link.click();
    for (let i = 0; i < 150; i++) {
      await espera(100);
      if (
        location.pathname === href &&
        document.querySelector("main")?.firstElementChild !== antes
      )
        break;
    }
    return estavel();
  };
  const destinos = [
    ...new Set(
      [...document.querySelectorAll('header a[href^="/"]')].map((a) =>
        a.getAttribute("href"),
      ),
    ),
  ].filter((h) => !h.includes("#"));
  const aberturas = [];
  for (const href of destinos) {
    for (const desde of ["topo", "meio"]) {
      if (location.pathname === href)
        await ir(destinos.find((d) => d !== href));
      const meio = Math.round((raiz.scrollHeight - innerHeight) / 2);
      window.scrollTo({ top: desde === "topo" ? 0 : meio, behavior: "instant" });
      await espera(300);
      const y = await ir(href);
      aberturas.push(`${href}@${desde}:${y}`);
      if (y !== 0)
        problemas.push(`${href} abriu rolada ${y}px (vindo de outra página, no ${desde})`);
    }
  }
  info.aberturas = aberturas.join(" ");

  return JSON.stringify({ ...info, problemas });
})();
```

- [ ] **Step 6: Medir no navegador**

`npm run build` e `npx next start -p 3300`. Abra `http://localhost:3300/` a 1440px e a 390px, cole `scripts/auditoria-visual.js` no console (ou rode pela ferramenta de navegador), espere a promessa. Expected: `info.aberturas` com `:0` em todos os destinos, e nenhum problema "abriu rolada". Mutação no navegador: tire o atributo, refaça o build, rode de novo: `/busca@topo` volta a dar cerca de 456; regrave o atributo e refaça o build. Derrube o 3300 pelo PID.

- [ ] **Step 7: Rodar tudo e commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

```bash
git add app/layout.tsx testes/rolagem.test.ts scripts/auditoria-visual.js
git commit -m "Pagina nova abre no topo: data-scroll-behavior no html, e a auditoria confere pelo menu"
```

---

### Task 2: Funções puras e os ícones novos

**Files:**
- Create: `lib/encontre.ts`
- Create: `testes/encontre.test.ts`
- Modify: `lib/dados/filtros.ts` (exportar `porNome`)
- Modify: `components/diretorio/Placa.tsx` (usar `iniciais` de `lib/encontre.ts`)
- Modify: `components/base/Icone.tsx`, `testes/icones.test.ts`

**Interfaces:**
- Produces (`lib/dados/filtros.ts`): `export const porNome: (a: Medico, b: Medico) => number`.
- Produces (`lib/encontre.ts`):

```ts
export const LIMITE_DE_OUTROS = 4;
export function iniciais(nome: string): string;
export function especialidadePrincipal(m: Pick<Medico, "especialidades">): EspecialidadeDoMedico | null;
export function consultorioPrincipal(m: Pick<Medico, "locais">): LocalAtendimento | null;
export function telefoneDoCartao(m: Pick<Medico, "locais">): string | null;
export function enderecoDoLocal(l: Pick<LocalAtendimento, "logradouro" | "numero" | "bairro">): [string, string];
export function linkDoMapa(l: Pick<LocalAtendimento, "logradouro" | "numero" | "bairro">): string;
export function linkDoWhatsapp(numero: string): string;
export function outrosMedicos(m: Medico, todos: Medico[], limite?: number): Medico[];
export type OpcaoDeEspecialidade = { valor: string; rotulo: string };
export function opcoesDeEspecialidade(lista: EspecialidadeComContagem[]): OpcaoDeEspecialidade[];
export function textoDaContagem(total: number, especialidade: string | null): string;
export function paragrafosDaBio(bio: string): string[];
```

- Produces (`components/base/Icone.tsx`): `NomeIcone` ganha `"whatsapp" | "comoChegar" | "voltar" | "abaixo"` (Phosphor `WhatsappLogo`, `MapPin`, `ArrowLeft`, `CaretDown`).

- [ ] **Step 1: Os testes**

`testes/encontre.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  LIMITE_DE_OUTROS,
  consultorioPrincipal,
  enderecoDoLocal,
  especialidadePrincipal,
  iniciais,
  linkDoMapa,
  linkDoWhatsapp,
  opcoesDeEspecialidade,
  outrosMedicos,
  paragrafosDaBio,
  telefoneDoCartao,
  textoDaContagem,
} from "@/lib/encontre";
import type { LocalAtendimento, Medico } from "@/lib/dados/tipos";

function local(id: number, bairro: string, extra: Partial<LocalAtendimento> = {}): LocalAtendimento {
  return {
    id,
    logradouro: "Rua Projetada 114",
    numero: "198",
    bairro: { id, nome: bairro, slug: bairro.toLowerCase().replace(/\s+/g, "-") },
    telefone: null,
    whatsapp: null,
    estacionamento: false,
    acessibilidade: [],
    ...extra,
  };
}

let proximoId = 1;
function medico(nome: string, principal: string | null, extra: Partial<Medico> = {}): Medico {
  return {
    id: proximoId++,
    slug: nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-"),
    nome,
    crm: "11918",
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: principal
      ? [{ nome: principal, slug: principal.toLowerCase(), rqe: null, principal: true }]
      : [],
    locais: [],
    ...extra,
  };
}

describe("iniciais", () => {
  it("a primeira letra do primeiro nome e a do último", () => {
    expect(iniciais("Diego Aragão")).toBe("DA");
    expect(iniciais("Maria da Silva Costa")).toBe("MC");
  });
  it("ignora espaço sobrando e mantém o acento", () => {
    expect(iniciais("  Ângela   Prado ")).toBe("ÂP");
  });
  it("nome de uma palavra só: as duas primeiras letras, não a mesma duas vezes", () => {
    expect(iniciais("Jorge")).toBe("JO");
  });
  it("sem nome, uma interrogação", () => {
    expect(iniciais("   ")).toBe("?");
  });
});

describe("especialidade principal e consultório principal", () => {
  it("a marcada como principal, mesmo que não seja a primeira", () => {
    const m = medico("Ana Lima", null, {
      especialidades: [
        { nome: "Pediatria", slug: "pediatria", rqe: null, principal: false },
        { nome: "Neurologia", slug: "neurologia", rqe: "1", principal: true },
      ],
    });
    expect(especialidadePrincipal(m)?.slug).toBe("neurologia");
  });
  it("sem marca, a primeira; sem nenhuma, null", () => {
    const m = medico("Ana Lima", null, {
      especialidades: [
        { nome: "Pediatria", slug: "pediatria", rqe: null, principal: false },
        { nome: "Neurologia", slug: "neurologia", rqe: null, principal: false },
      ],
    });
    expect(especialidadePrincipal(m)?.slug).toBe("pediatria");
    expect(especialidadePrincipal(medico("Ana Lima", null))).toBeNull();
  });
  it("o consultório principal é o primeiro; sem consultório, null", () => {
    const m = medico("Ana Lima", null, { locais: [local(1, "Centro"), local(2, "Juçara")] });
    expect(consultorioPrincipal(m)?.id).toBe(1);
    expect(consultorioPrincipal(medico("Ana Lima", null))).toBeNull();
  });
});

describe("o telefone do cartão", () => {
  it("é o do primeiro consultório que tem telefone", () => {
    const m = medico("Ana Lima", null, {
      locais: [local(1, "Centro"), local(2, "Juçara", { telefone: "(99) 3023-0707" })],
    });
    expect(telefoneDoCartao(m)).toBe("(99) 3023-0707");
  });
  it("sem telefone em nenhum, null", () => {
    expect(telefoneDoCartao(medico("Ana Lima", null, { locais: [local(1, "Centro")] }))).toBeNull();
  });
});

describe("o endereço e os links do consultório", () => {
  const novaImperatriz = local(1, "Nova Imperatriz");

  it("o endereço em duas linhas, como no desenho", () => {
    expect(enderecoDoLocal(novaImperatriz)).toEqual([
      "Rua Projetada 114, 198",
      "Nova Imperatriz, Imperatriz – MA",
    ]);
  });
  it("sem número, a primeira linha é só o logradouro", () => {
    expect(enderecoDoLocal(local(1, "Centro", { numero: null }))[0]).toBe("Rua Projetada 114");
  });
  it("Como chegar: a busca do Google Maps pelo endereço completo, igual à do desenho", () => {
    expect(linkDoMapa(novaImperatriz)).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        "Rua%20Projetada%20114%2C%20198%2C%20Nova%20Imperatriz%2C%20Imperatriz%20%E2%80%93%20MA",
    );
  });
  it("WhatsApp: wa.me/55 e o número só com dígitos", () => {
    expect(linkDoWhatsapp("(99) 3018-9994")).toBe("https://wa.me/559930189994");
    expect(linkDoWhatsapp("99 98802 0205")).toBe("https://wa.me/5599988020205");
  });
  it("WhatsApp que já vem com o 55 não fica com 55 duas vezes", () => {
    expect(linkDoWhatsapp("+55 (99) 98802-0205")).toBe("https://wa.me/5599988020205");
  });
});

describe("outros médicos", () => {
  const aline = medico("Aline Peixoto", "Neurologia");
  const neuro = ["Zeca Moura", "Cristina Bezerra", "Álvaro Dias", "Bruna Reis", "Carlos Lima"].map((n) =>
    medico(n, "Neurologia"),
  );
  const secundaria = medico("Beto Souza", "Cardiologia", {
    especialidades: [
      { nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true },
      { nome: "Neurologia", slug: "neurologia", rqe: null, principal: false },
    ],
  });
  const todos = [aline, secundaria, ...neuro];

  it("até 4, da mesma especialidade principal, sem o próprio, em ordem alfabética", () => {
    expect(outrosMedicos(aline, todos).map((m) => m.nome)).toEqual([
      "Álvaro Dias",
      "Bruna Reis",
      "Carlos Lima",
      "Cristina Bezerra",
    ]);
    expect(LIMITE_DE_OUTROS).toBe(4);
  });
  it("quem tem a especialidade só como secundária não entra", () => {
    expect(outrosMedicos(aline, todos).map((m) => m.nome)).not.toContain("Beto Souza");
  });
  it("com menos que 4, os que houver; sem ninguém, vazio", () => {
    expect(outrosMedicos(aline, [aline, neuro[1]]).map((m) => m.nome)).toEqual(["Cristina Bezerra"]);
    expect(outrosMedicos(aline, [aline, secundaria])).toEqual([]);
  });
  it("médico sem especialidade não tem outros", () => {
    expect(outrosMedicos(medico("Sem Nada", null), todos)).toEqual([]);
  });
  it("não altera a lista recebida", () => {
    const copia = [...todos];
    outrosMedicos(aline, todos);
    expect(todos).toEqual(copia);
  });
});

describe("a lista de especialidades da busca", () => {
  it("em ordem alfabética, com a contagem, sem as vazias", () => {
    expect(
      opcoesDeEspecialidade([
        { nome: "Pediatria", slug: "pediatria", total: 3 },
        { nome: "Cardiologia", slug: "cardiologia", total: 3 },
        { nome: "Urologia", slug: "urologia", total: 0 },
        { nome: "Clínica Médica", slug: "clinica-medica", total: 4 },
      ]),
    ).toEqual([
      { valor: "cardiologia", rotulo: "Cardiologia (3)" },
      { valor: "clinica-medica", rotulo: "Clínica Médica (4)" },
      { valor: "pediatria", rotulo: "Pediatria (3)" },
    ]);
  });
});

describe("a contagem e a biografia", () => {
  it("a contagem concorda e diz a especialidade escolhida", () => {
    expect(textoDaContagem(24, null)).toBe("24 médicos");
    expect(textoDaContagem(1, null)).toBe("1 médico");
    expect(textoDaContagem(0, null)).toBe("0 médicos");
    expect(textoDaContagem(3, "Cardiologia")).toBe("3 médicos em Cardiologia");
  });
  it("a biografia vira um parágrafo por bloco separado por linha em branco", () => {
    expect(paragrafosDaBio("Um.\n\nDois.\n  \nTrês.")).toEqual(["Um.", "Dois.", "Três."]);
    expect(paragrafosDaBio("Linha\núnica")).toEqual(["Linha\núnica"]);
    expect(paragrafosDaBio("   ")).toEqual([]);
  });
});
```

Em `testes/icones.test.ts`: acrescente ao import de `@phosphor-icons/react/dist/ssr` os nomes `ArrowLeft, CaretDown, MapPin, WhatsappLogo`; acrescente ao objeto `esperado`:

```ts
      whatsapp: WhatsappLogo,
      comoChegar: MapPin,
      voltar: ArrowLeft,
      abaixo: CaretDown,
```

e troque o fim do teste para

```ts
    /* E os 22 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(22);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/encontre.test.ts testes/icones.test.ts`
Expected: FAIL (`lib/encontre` não existe; os ícones não existem).

- [ ] **Step 3: Exportar `porNome`**

Em `lib/dados/filtros.ts` (CRLF, com BOM), troque só `const porNome = (a: Medico, b: Medico) =>` por `export const porNome = (a: Medico, b: Medico) =>`. O comentário de cima ("Alfabética em português…") fica.

- [ ] **Step 4: `lib/encontre.ts`**

```ts
import { porNome } from "@/lib/dados/filtros";
import { contagem } from "@/lib/formato";
import type {
  EspecialidadeComContagem,
  EspecialidadeDoMedico,
  LocalAtendimento,
  Medico,
} from "@/lib/dados/tipos";

/*
  O que a busca e o perfil decidem sobre um médico, em funções puras: entra
  o dado, sai o texto ou o endereço. Ficam fora dos componentes para serem
  testadas sem navegador (testes/encontre.test.ts).
*/

/** Quantos "outros médicos" o perfil mostra, no máximo. */
export const LIMITE_DE_OUTROS = 4;

/**
 * As iniciais do espaço da foto, enquanto o médico não manda retrato: a
 * primeira letra do primeiro nome e a do último. Nome de uma palavra só dá
 * as duas primeiras letras dela; "JJ" seria a mesma letra duas vezes.
 */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** A especialidade marcada como principal; sem marca, a primeira; sem nenhuma, null. */
export function especialidadePrincipal(
  m: Pick<Medico, "especialidades">,
): EspecialidadeDoMedico | null {
  return m.especialidades.find((e) => e.principal) ?? m.especialidades[0] ?? null;
}

/**
 * O consultório principal: o primeiro da lista. `locais` chega ordenado pelo
 * id do local (lib/dados/medicos.ts), então é sempre o mesmo.
 */
export function consultorioPrincipal(m: Pick<Medico, "locais">): LocalAtendimento | null {
  return m.locais[0] ?? null;
}

/**
 * O telefone do "Ligar" do cartão: o do primeiro consultório que tem
 * telefone. Sem telefone em nenhum, null, e o cartão fica sem o botão.
 */
export function telefoneDoCartao(m: Pick<Medico, "locais">): string | null {
  return m.locais.find((l) => l.telefone)?.telefone ?? null;
}

/** O endereço em duas linhas, como o cartão do consultório mostra. */
export function enderecoDoLocal(
  l: Pick<LocalAtendimento, "logradouro" | "numero" | "bairro">,
): [string, string] {
  return [
    [l.logradouro, l.numero].filter(Boolean).join(", "),
    `${l.bairro.nome}, Imperatriz – MA`,
  ];
}

/** "Como chegar": a busca do Google Maps pelo endereço, sem chave nem serviço novo. */
export function linkDoMapa(l: Pick<LocalAtendimento, "logradouro" | "numero" | "bairro">): string {
  const endereco = enderecoDoLocal(l).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

/**
 * O link do WhatsApp: `wa.me/55` mais o número só com dígitos. Número que
 * já chega com o 55 (mais de 11 dígitos) fica com os 11 últimos, a mesma
 * regra de `formatarTelefone` (lib/formato.ts).
 */
export function linkDoWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  const nacional = digitos.length > 11 ? digitos.slice(-11) : digitos;
  return `https://wa.me/55${nacional}`;
}

/**
 * "Outros médicos de {especialidade}", no perfil: até `limite` médicos cuja
 * especialidade principal é a mesma deste, sem ele, em ordem alfabética.
 * Médico sem especialidade não tem outros.
 */
export function outrosMedicos(m: Medico, todos: Medico[], limite = LIMITE_DE_OUTROS): Medico[] {
  const principal = especialidadePrincipal(m);
  if (!principal) return [];
  return todos
    .filter((o) => o.slug !== m.slug && especialidadePrincipal(o)?.slug === principal.slug)
    .sort(porNome)
    .slice(0, limite);
}

export type OpcaoDeEspecialidade = { valor: string; rotulo: string };

/** A lista "Todas as especialidades" da busca: alfabética, com a contagem, sem as vazias. */
export function opcoesDeEspecialidade(lista: EspecialidadeComContagem[]): OpcaoDeEspecialidade[] {
  return lista
    .filter((e) => e.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((e) => ({ valor: e.slug, rotulo: `${e.nome} (${e.total})` }));
}

/** A contagem acima da grade: "24 médicos", "1 médico", "3 médicos em Cardiologia". */
export function textoDaContagem(total: number, especialidade: string | null): string {
  const texto = contagem(total, "médico", "médicos");
  return especialidade ? `${texto} em ${especialidade}` : texto;
}

/** A biografia em parágrafos: uma linha em branco separa um do outro. */
export function paragrafosDaBio(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
```

- [ ] **Step 5: A `Placa` usa as mesmas iniciais**

Em `components/diretorio/Placa.tsx` (CRLF): apague a função local `iniciais` e o comentário dela (as 7 primeiras linhas do arquivo) e acrescente no topo `import { iniciais } from "@/lib/encontre";`. Nada mais muda (a `Placa` continua na diretoria, `CartaoDiretor.tsx`).

- [ ] **Step 6: Os ícones**

Em `components/base/Icone.tsx`: acrescente `WhatsappLogo, MapPin, ArrowLeft, CaretDown` ao import de `@phosphor-icons/react/dist/ssr`; acrescente ao tipo `NomeIcone` as linhas `| "whatsapp"`, `| "comoChegar"`, `| "voltar"`, `| "abaixo"`; e ao `mapaDeIcones`:

```ts
  whatsapp: WhatsappLogo,
  comoChegar: MapPin,
  voltar: ArrowLeft,
  abaixo: CaretDown,
```

- [ ] **Step 7: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.
Mutações (uma de cada vez, regravando depois): `linkDoWhatsapp` sem o `slice(-11)`; `outrosMedicos` sem o `.sort(porNome)`; `outrosMedicos` comparando com `o.especialidades.some(...)` em vez da principal; `opcoesDeEspecialidade` sem o `filter`; `iniciais` com `partes[1]` no lugar do último; trocar `abaixo: CaretDown` por `abaixo: CaretRight`. Cada uma deixa um teste vermelho.

```bash
git add lib/encontre.ts testes/encontre.test.ts lib/dados/filtros.ts components/diretorio/Placa.tsx components/base/Icone.tsx testes/icones.test.ts
git commit -m "Funcoes puras da busca e do perfil, e os icones de WhatsApp, mapa, voltar e lista"
```

---

### Task 3: A foto, o cartão e a grade de médicos

**Files:**
- Create: `components/diretorio/FotoDoMedico.tsx`, `components/diretorio/FotoDoMedico.module.css`
- Create: `components/diretorio/CartaoMedico.tsx`, `components/diretorio/CartaoMedico.module.css`
- Create: `components/diretorio/GradeMedicos.tsx`, `components/diretorio/GradeMedicos.module.css`
- Create: `testes/css.ts`, `testes/cartao-medico.test.ts`
- Modify: `app/(site)/medicos/[especialidade]/page.tsx` (a grade no lugar do painel de filtros e da lista)
- Modify: `testes/porta-da-busca.test.ts` (o caso da página de especialidade)

**Interfaces:**
- Consumes: `iniciais`, `especialidadePrincipal`, `telefoneDoCartao` (Task 2); `Icone` com `"telefone"`; `hrefTelefone` (`lib/ami.ts`); `formatarTelefone`, `identificacaoMedica` (`lib/formato.ts`).
- Produces:

```ts
// components/diretorio/FotoDoMedico.tsx
export type CargaDaFoto = "preguicosa" | "imediata" | "primeira";
export function FotoDoMedico(props: {
  nome: string; foto: string | null; alt: string; sizes: string;
  carga?: CargaDaFoto; className?: string;
}): JSX.Element;
// components/diretorio/CartaoMedico.tsx
export const SIZES_DO_CARTAO: string;
export function CartaoMedico(props: { medico: Medico; imediata?: boolean }): JSX.Element; // um <li>
// components/diretorio/GradeMedicos.tsx
export function GradeMedicos(props: { medicos: Medico[]; imediatos?: number }): JSX.Element; // um <ul>
// testes/css.ts
export function semNotas(css: string): string;
export function bloco(css: string, abre: string): string;
export function regra(css: string, seletor: string): string;
export function base(css: string): string;
```

- O espaço do botão: `data-ligar=""` no "Ligar" **e** no espaço vazio de quem não tem telefone (a auditoria da Task 9 mede os dois).

- [ ] **Step 1: O ajudante de CSS dos testes**

`testes/css.ts` (as mesmas quatro funções que `testes/numeros-e-busca.test.ts` declara no próprio arquivo, agora num lugar só para os testes novos):

```ts
import { expect } from "vitest";

/*
  Para ler CSS nos testes: o navegador é quem aplica, então o teste confere a
  regra escrita. Sem comentário (a prosa que explica uma regra não pode casar
  com a asserção que a procura), por bloco de @media e por regra.
*/

/** O CSS sem os comentários. */
export function semNotas(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** O conteúdo entre as chaves do bloco que começa com `abre` (um @media), contando chaves. */
export function bloco(css: string, abre: string): string {
  const ini = css.indexOf(`${abre} {`);
  expect(ini, `falta o bloco ${abre}`).toBeGreaterThan(-1);
  let nivel = 0;
  for (let i = css.indexOf("{", ini); i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}" && --nivel === 0) return css.slice(css.indexOf("{", ini) + 1, i);
  }
  throw new Error(`bloco ${abre} sem fim`);
}

/** O corpo de `seletor { ... }`, com o seletor começando a linha. */
export function regra(css: string, seletor: string): string {
  const alvo = `${seletor} {`;
  for (let k = css.indexOf(alvo); k > -1; k = css.indexOf(alvo, k + 1)) {
    if (css.slice(css.lastIndexOf("\n", k - 1) + 1, k).trim() === "") {
      return css.slice(k, css.indexOf("}", k));
    }
  }
  throw new Error(`falta a regra ${seletor}`);
}

/** O CSS fora de qualquer @media: o que vale no computador. */
export function base(css: string): string {
  let saida = "";
  let i = 0;
  while (i < css.length) {
    const m = css.indexOf("@media", i);
    if (m === -1) return saida + css.slice(i);
    saida += css.slice(i, m);
    let nivel = 0;
    let j = css.indexOf("{", m);
    for (; j < css.length; j++) {
      if (css[j] === "{") nivel++;
      if (css[j] === "}" && --nivel === 0) break;
    }
    i = j + 1;
  }
  return saida;
}
```

- [ ] **Step 2: Os testes do cartão**

`testes/cartao-medico.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoMedico, SIZES_DO_CARTAO } from "@/components/diretorio/CartaoMedico";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import estilosCartao from "@/components/diretorio/CartaoMedico.module.css";
import estilosFoto from "@/components/diretorio/FotoDoMedico.module.css";
import estilosGrade from "@/components/diretorio/GradeMedicos.module.css";
import type { LocalAtendimento, Medico } from "@/lib/dados/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  O cartão do médico, a foto e a grade, no HTML de servidor. O CSS só se lê
  do arquivo (quem aplica é o navegador); a altura igual dos "Ligar" de uma
  fileira é medida pela auditoria (scripts/auditoria-visual.js).
*/

const CSS_CARTAO = semNotas(fonte("../components/diretorio/CartaoMedico.module.css"));
const CSS_FOTO = semNotas(fonte("../components/diretorio/FotoDoMedico.module.css"));
const CSS_GRADE = semNotas(fonte("../components/diretorio/GradeMedicos.module.css"));

function local(id: number, extra: Partial<LocalAtendimento> = {}): LocalAtendimento {
  return {
    id,
    logradouro: "Rua Projetada 114",
    numero: "198",
    bairro: { id, nome: "Juçara", slug: "jucara" },
    telefone: null,
    whatsapp: null,
    estacionamento: true,
    acessibilidade: ["acesso_cadeirante"],
    ...extra,
  };
}

const ALINE: Medico = {
  id: 1,
  slug: "aline-peixoto",
  nome: "Aline Peixoto",
  crm: "11918",
  crmUf: "MA",
  foto: null,
  bio: null,
  telemedicina: true,
  associadoAmi: true,
  especialidades: [{ nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true }],
  locais: [local(1), local(2, { telefone: "(99) 3018-9994" })],
};

/** O texto que aparece, sem tags nem os comentários que o React põe entre textos. */
function visivel(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

const classes = (tag: string) => (/class="([^"]+)"/.exec(tag)?.[1] ?? "").split(" ");

describe("a foto do médico", () => {
  it("sem foto: as iniciais sobre o verde com textura e a luz, fora do leitor de tela", () => {
    const html = renderToString(
      createElement(FotoDoMedico, { nome: "Diego Aragão", foto: null, alt: "", sizes: "116px" }),
    );
    const abre = /^<div [^>]*>/.exec(html)![0];
    expect(abre).toContain('aria-hidden="true"');
    expect(classes(abre)).toEqual(expect.arrayContaining(["textura-verde", estilosFoto.foto, estilosFoto.semFoto]));
    expect(html).toContain('<div class="brilho"></div>');
    expect(html).toContain(`<span class="${estilosFoto.iniciais}">DA</span>`);
    expect(html).not.toContain("<img");
  });

  it("com foto: a imagem com sizes, largura e altura, preguiçosa por padrão", () => {
    const html = renderToString(
      createElement(FotoDoMedico, {
        nome: "Aline Peixoto",
        foto: "https://exemplo.test/aline.jpg",
        alt: "Retrato de Aline Peixoto",
        sizes: "280px",
        className: "x",
      }),
    );
    const abre = /^<div [^>]*>/.exec(html)![0];
    expect(classes(abre)).toEqual(expect.arrayContaining([estilosFoto.foto, estilosFoto.comFoto, "x"]));
    expect(abre).not.toContain("aria-hidden");
    const img = /<img [^>]*>/.exec(html)![0];
    for (const attr of [
      'src="https://exemplo.test/aline.jpg"',
      'alt="Retrato de Aline Peixoto"',
      'sizes="280px"',
      'width="400"',
      'height="500"',
      'loading="lazy"',
      'decoding="async"',
    ]) {
      expect(img, attr).toContain(attr);
    }
    expect(html).not.toContain(">AP<");
  });

  it("imediata: sem loading lazy; primeira: com prioridade alta", () => {
    const foto = { nome: "A B", foto: "https://exemplo.test/a.jpg", alt: "", sizes: "1px" };
    const imediata = renderToString(createElement(FotoDoMedico, { ...foto, carga: "imediata" }));
    expect(imediata).not.toContain("loading=");
    expect(imediata).not.toContain("fetchpriority");
    const primeira = renderToString(createElement(FotoDoMedico, { ...foto, carga: "primeira" }));
    expect(primeira).toContain('fetchpriority="high"');
    expect(primeira).not.toContain("loading=");
  });
});

describe("o cartão do médico", () => {
  const html = renderToString(createElement(CartaoMedico, { medico: ALINE }));

  it("só foto, nome, MÉDICO · CRM, especialidade com RQE e Ligar", () => {
    /* O primeiro texto são as iniciais, no espaço da foto (Aline não tem foto). */
    expect(visivel(html)).toEqual([
      "AP",
      "Aline Peixoto",
      "MÉDICO · CRM/MA 11918",
      "Neurologia",
      "RQE 12222",
      "Ligar",
    ]);
  });

  it("nada de selo, bairro, telemedicina, acessibilidade ou outros endereços", () => {
    for (const fora of ["Associado", "Juçara", "elemedicina", "cadeirante", "Estacionamento", "endereço"]) {
      expect(html, fora).not.toContain(fora);
    }
  });

  it("o nome é o link do perfil, e é ele que estica o alvo pelo cartão", () => {
    expect(html).toMatch(
      new RegExp(`<h3 class="${estilosCartao.nome}"><a href="/medico/aline-peixoto">Aline Peixoto</a></h3>`),
    );
    expect(regra(base(CSS_CARTAO), ".nome a::after")).toMatch(/inset: 0/);
    expect(regra(base(CSS_CARTAO), ".nome a::after")).toMatch(/z-index: 1/);
  });

  it("Ligar liga para o primeiro consultório com telefone, por cima do link do cartão", () => {
    const ligar = /<a [^>]*data-ligar=""[^>]*>/.exec(html)![0];
    expect(ligar).toContain('href="tel:+559930189994"');
    expect(ligar).toContain('aria-label="Ligar para Aline Peixoto, (99) 3018-9994"');
    expect(classes(ligar)).toEqual(["botao", estilosCartao.ligar]);
    expect(regra(base(CSS_CARTAO), ".ligar")).toMatch(/z-index: 2/);
  });

  it("sem telefone: sem Ligar, e o espaço do botão continua lá", () => {
    const sem = renderToString(
      createElement(CartaoMedico, { medico: { ...ALINE, locais: [local(1)] } }),
    );
    expect(sem).not.toContain("tel:");
    expect(sem).not.toContain(">Ligar");
    expect(sem).toContain(`<div class="${estilosCartao.semLigar}" aria-hidden="true" data-ligar=""></div>`);
  });

  it("sem especialidade, sem a linha dela", () => {
    const sem = renderToString(createElement(CartaoMedico, { medico: { ...ALINE, especialidades: [] } }));
    expect(sem).not.toContain(`class="${estilosCartao.esp}"`);
  });

  it("a foto do cartão tem alt vazio (o nome está ao lado) e o sizes da grade", () => {
    const comFoto = renderToString(
      createElement(CartaoMedico, { medico: { ...ALINE, foto: "https://exemplo.test/a.jpg" } }),
    );
    const img = /<img [^>]*>/.exec(comFoto)![0];
    expect(img).toContain('alt=""');
    expect(img).toContain(`sizes="${SIZES_DO_CARTAO}"`);
    expect(img).toContain('loading="lazy"');
    const imediata = renderToString(
      createElement(CartaoMedico, { medico: { ...ALINE, foto: "https://exemplo.test/a.jpg" }, imediata: true }),
    );
    expect(imediata).not.toContain("loading=");
  });
});

describe("a grade", () => {
  const comFoto = (id: number): Medico => ({ ...ALINE, id, slug: `m${id}`, foto: `https://exemplo.test/${id}.jpg` });

  it("um <ul> com um cartão por médico", () => {
    const html = renderToString(createElement(GradeMedicos, { medicos: [comFoto(1), comFoto(2)] }));
    expect(html).toMatch(new RegExp(`^<ul class="${estilosGrade.grade}">`));
    expect(html.match(/<li /g)).toHaveLength(2);
  });

  it("os primeiros `imediatos` sem espera; o resto, preguiçoso", () => {
    const html = renderToString(
      createElement(GradeMedicos, { medicos: [comFoto(1), comFoto(2), comFoto(3)], imediatos: 2 }),
    );
    expect(html.match(/loading="lazy"/g)).toHaveLength(1);
  });
});

describe("o CSS do cartão e da grade", () => {
  it("4 por linha no computador, 3 até 1179px, 2 até 980px, 1 no celular", () => {
    expect(regra(base(CSS_GRADE), ".grade")).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(CSS_GRADE, "@media (max-width: 1180px)"), ".grade")).toMatch(/repeat\(3, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(CSS_GRADE, "@media (max-width: 980px)"), ".grade")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(CSS_GRADE, "@media (max-width: 700px)"), ".grade")).toMatch(/grid-template-columns: 1fr/);
  });

  it("retrato no computador: foto 4:5 em cima, Ligar no pé, na mesma altura em toda fileira", () => {
    expect(regra(base(CSS_CARTAO), ".medico")).toMatch(/flex-direction: column/);
    expect(regra(base(CSS_CARTAO), ".foto")).toMatch(/aspect-ratio: 4 \/ 5/);
    expect(regra(base(CSS_CARTAO), ".ligar")).toMatch(/margin-top: auto/);
    expect(regra(base(CSS_CARTAO), ".ligar")).toMatch(/height: 44px/);
    expect(regra(base(CSS_CARTAO), ".semLigar")).toMatch(/margin-top: auto/);
    expect(regra(base(CSS_CARTAO), ".semLigar")).toMatch(/height: 44px/);
  });

  it("deitado no celular: foto de 116px na lateral, de cima a baixo; 112px a 380px", () => {
    const cel = bloco(CSS_CARTAO, "@media (max-width: 700px)");
    expect(regra(cel, ".medico")).toMatch(/flex-direction: row/);
    expect(regra(cel, ".foto")).toMatch(/width: 116px/);
    expect(regra(cel, ".foto")).toMatch(/align-self: stretch/);
    expect(regra(cel, ".ligar")).toMatch(/height: 40px/);
    expect(regra(cel, ".semLigar")).toMatch(/height: 40px/);
    expect(regra(bloco(CSS_CARTAO, "@media (max-width: 380px)"), ".foto")).toMatch(/width: 112px/);
  });

  it("o sizes do cartão segue as mesmas larguras", () => {
    expect(SIZES_DO_CARTAO).toContain("(max-width: 380px) 112px");
    expect(SIZES_DO_CARTAO).toContain("(max-width: 700px) 116px");
    expect(SIZES_DO_CARTAO.endsWith(", 280px")).toBe(true);
  });

  it("as iniciais em Bricolage, na cor lima, no tamanho que quem usa decide", () => {
    const r = regra(base(CSS_FOTO), ".iniciais");
    expect(r).toMatch(/font-family: var\(--font-titulo\)/);
    expect(r).toMatch(/color: var\(--color-ami-lima-400\)/);
    expect(r).toMatch(/font-size: var\(--tamanho-iniciais, 96px\)/);
    expect(regra(base(CSS_CARTAO), ".foto")).toMatch(/--tamanho-iniciais: 96px/);
    expect(regra(bloco(CSS_CARTAO, "@media (max-width: 700px)"), ".foto")).toMatch(/--tamanho-iniciais: 42px/);
  });

  it("no mouse o cartão sobe com sombra neutra; nenhum verde claro", () => {
    expect(regra(base(CSS_CARTAO), ".medico:hover")).toMatch(/translateY\(-3px\)/);
    expect(regra(base(CSS_CARTAO), ".medico:hover")).not.toMatch(/lima|green/);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run testes/cartao-medico.test.ts`
Expected: FAIL (os componentes não existem).

- [ ] **Step 4: `FotoDoMedico`**

`components/diretorio/FotoDoMedico.module.css` (de `.medico-foto`, `.medico-foto:not(.textura-verde)`, `.medico-foto img`, `.sem-foto`, `.sem-foto .iniciais`, `.sem-foto .brilho` do desenho; o tamanho e a forma do espaço ficam com quem usa):

```css
/*
  O espaço da foto do médico, transcrito do desenho aprovado
  (docs/desenho-aprovado/encontre/busca.html: `.medico-foto`,
  `.medico-foto:not(.textura-verde)`, `.medico-foto img`, `.sem-foto`,
  `.sem-foto .iniciais`, `.sem-foto .brilho`). Tamanho, proporção e canto
  são de quem usa (o cartão, o perfil), pelo `className`; o tamanho das
  iniciais também, pela variável `--tamanho-iniciais`.

  #DDE2E0 é o cinza do desenho atrás do retrato enquanto ele carrega; só
  existe aqui, e não tem token.
*/

.foto {
  position: relative;
  overflow: hidden;
}

.comFoto {
  background: #DDE2E0;
}

.foto img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 30%;
  transition: transform 1.2s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.semFoto {
  display: grid;
  place-items: center;
}

.iniciais {
  font-family: var(--font-titulo);
  font-weight: 600;
  font-size: var(--tamanho-iniciais, 96px);
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--color-ami-lima-400);
}

/* A luz que passeia, maior e mais lenta que a da faixa, no espaço pequeno. */
.semFoto :global(.brilho) {
  top: -60%;
  right: -70%;
  width: 150%;
  height: 150%;
  animation-duration: 22s;
}
```

`components/diretorio/FotoDoMedico.tsx`:

```tsx
import styles from "@/components/diretorio/FotoDoMedico.module.css";
import { iniciais } from "@/lib/encontre";

/** Como a foto baixa: preguiçosa (padrão), logo, ou logo e na frente das outras. */
export type CargaDaFoto = "preguicosa" | "imediata" | "primeira";

/*
  O espaço da foto do médico: o retrato, quando há, ou as iniciais em
  Bricolage na cor lima, sobre o verde com textura e a luz que passeia.

  Sem foto não é moldura "a entrar": é o estado de verdade de quem ainda não
  mandou retrato, e sai também fora do modo demonstração.

  Quem usa decide o tamanho, a proporção e o canto do espaço (`className`) e
  o tamanho das iniciais (a variável `--tamanho-iniciais`, no mesmo
  elemento). A foto é um arquivo só, sem versões em outros tamanhos: `sizes`
  vai junto para dizer a largura desenhada, e só passa a escolher arquivo
  quando a foto vier com `srcSet`.
*/
export function FotoDoMedico({
  nome,
  foto,
  alt,
  sizes,
  carga = "preguicosa",
  className = "",
}: {
  nome: string;
  foto: string | null;
  /** Vazio quando o nome do médico já está ao lado (o cartão). */
  alt: string;
  /** A largura desenhada, com as réguas do CSS de quem usa. */
  sizes: string;
  carga?: CargaDaFoto;
  className?: string;
}) {
  const classes = (...lista: string[]) => lista.filter(Boolean).join(" ");

  if (!foto) {
    return (
      <div aria-hidden="true" className={classes("textura-verde", styles.foto, styles.semFoto, className)}>
        <div className="brilho"></div>
        <span className={styles.iniciais}>{iniciais(nome)}</span>
      </div>
    );
  }

  return (
    <div className={classes(styles.foto, styles.comFoto, className)}>
      <img
        src={foto}
        alt={alt}
        sizes={sizes}
        width={400}
        height={500}
        decoding="async"
        {...(carga === "preguicosa" ? { loading: "lazy" as const } : {})}
        {...(carga === "primeira" ? { fetchPriority: "high" as const } : {})}
      />
    </div>
  );
}
```

- [ ] **Step 5: `CartaoMedico` e `GradeMedicos`**

`components/diretorio/CartaoMedico.module.css` (de `.medico`, `.medico:hover`, `.medico-foto` e `img`, `.medico-corpo`, `.medico-texto`, `.medico-nome`, `.medico-nome a::after`, `.medico-crm`, `.medico-esp`, `.rqe`, `.botao-ligar`, `.medico :where(a,button):focus-visible`, e os @media de 700 e 380px):

```css
/*
  O cartão do médico, transcrito do desenho aprovado
  (docs/desenho-aprovado/encontre/busca.html: `.medico`, `.medico:hover`,
  `.medico-foto`, `.medico-corpo`, `.medico-texto`, `.medico-nome`,
  `.medico-nome a::after`, `.medico-crm`, `.medico-esp`, `.rqe`,
  `.botao-ligar`, e os @media de 700 e 380px). A foto e as iniciais são de
  FotoDoMedico.module.css; aqui só o tamanho do espaço dela no cartão.

  Retrato no computador (foto 4:5 em cima); deitado no celular (foto de
  116px na lateral esquerda, de cima a baixo). O "Ligar" fica no pé do
  cartão (`margin-top: auto`), e quem não tem telefone guarda o mesmo
  espaço (`.semLigar`): os botões de uma fileira ficam na mesma altura.
*/

.medico {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-surface);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-erguido);
  transition:
    transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
    box-shadow 0.35s;
}

.medico:hover {
  transform: translateY(-3px);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05), 0 18px 40px rgba(16, 24, 40, 0.1);
}

.foto {
  aspect-ratio: 4 / 5;
  --tamanho-iniciais: 96px;
}

.medico:hover .foto img {
  transform: scale(1.04);
}

.corpo {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 20px;
}

.texto {
  padding-bottom: 18px;
}

.nome {
  font-size: 21px;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

/* O cartão inteiro leva ao perfil: o link do nome se estica por ele. */
.nome a::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}

.crm {
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-400);
}

.esp {
  margin-top: 6px;
  font-size: 14.5px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--color-ink-900);
}

.rqe {
  white-space: nowrap;
  font-weight: 500;
  font-size: 13.5px;
  color: var(--color-ink-400);
  margin-left: 4px;
}

/* Por cima do link esticado do nome: o toque no "Ligar" liga. */
.ligar {
  position: relative;
  z-index: 2;
  margin-top: auto;
  width: 100%;
  height: 44px;
}

.semLigar {
  margin-top: auto;
  height: 44px;
}

.medico :where(a, button):focus-visible {
  outline-offset: 2px;
}

@media (max-width: 700px) {
  .medico {
    flex-direction: row;
    border-radius: 16px;
  }

  .medico:hover {
    transform: none;
  }

  .foto {
    flex: none;
    width: 116px;
    aspect-ratio: auto;
    align-self: stretch;
    min-height: 156px;
    --tamanho-iniciais: 42px;
  }

  .foto img {
    position: absolute;
    inset: 0;
  }

  /* No espaço estreito a luz ocupa outra posição; mais específica que a de
     FotoDoMedico.module.css, para não depender da ordem dos arquivos. */
  .medico .foto :global(.brilho) {
    width: 220%;
    height: 120%;
    top: -40%;
    right: -120%;
  }

  .corpo {
    min-width: 0;
    padding: 14px 16px;
  }

  .texto {
    padding-bottom: 12px;
  }

  .nome {
    font-size: 18.5px;
  }

  .crm {
    margin-top: 5px;
    font-size: 10.5px;
    letter-spacing: 0.08em;
  }

  .esp {
    margin-top: 4px;
    font-size: 14px;
  }

  .rqe {
    font-size: 13px;
  }

  .ligar {
    width: auto;
    align-self: flex-start;
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
    gap: 8px;
  }

  .ligar svg {
    width: 16px;
    height: 16px;
  }

  .semLigar {
    height: 40px;
  }
}

@media (max-width: 380px) {
  .foto {
    width: 112px;
  }
}
```

`components/diretorio/CartaoMedico.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import styles from "@/components/diretorio/CartaoMedico.module.css";
import { hrefTelefone } from "@/lib/ami";
import { especialidadePrincipal, telefoneDoCartao } from "@/lib/encontre";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import type { Medico } from "@/lib/dados/tipos";

/*
  A largura desenhada da foto do cartão, pelas réguas de GradeMedicos.module.css
  e da caixa de 1240px das páginas (24px de folga de cada lado, 12px no
  celular): 4 por linha com --gap 24 acima de 1180px (280px a partir de
  1240), 3 com --gap 24 até 1180, 2 com --gap 16 até 980, e a foto de 116px
  (112px a 380) no cartão deitado do celular.
*/
export const SIZES_DO_CARTAO =
  "(max-width: 380px) 112px, (max-width: 700px) 116px, " +
  "(max-width: 980px) calc((100vw - 64px) / 2), " +
  "(max-width: 1180px) calc((100vw - 96px) / 3), " +
  "(max-width: 1240px) calc((100vw - 120px) / 4), 280px";

/*
  O cartão do médico, na busca, em "Outros médicos" do perfil e na página de
  especialidade. Só foto, nome, "MÉDICO · CRM/UF", a especialidade principal
  com RQE e o "Ligar": nada de bairro, selo, telemedicina ou acessibilidade.

  A palavra MÉDICO ao lado do CRM é exigência da Resolução CFM 2.336/2023,
  Art. 4º, I (`identificacaoMedica`, lib/formato.ts).

  O cartão inteiro leva ao perfil pelo link do nome, esticado em CSS; o
  "Ligar" fica por cima e liga para o primeiro consultório com telefone
  (`telefoneDoCartao`). Sem telefone, o espaço do botão fica, vazio, para os
  botões da fileira continuarem alinhados. `data-ligar` marca os dois para a
  auditoria visual.
*/
export function CartaoMedico({ medico, imediata = false }: { medico: Medico; imediata?: boolean }) {
  const principal = especialidadePrincipal(medico);
  const telefone = telefoneDoCartao(medico);

  return (
    <li className={styles.medico}>
      <FotoDoMedico
        nome={medico.nome}
        foto={medico.foto}
        alt=""
        sizes={SIZES_DO_CARTAO}
        carga={imediata ? "imediata" : "preguicosa"}
        className={styles.foto}
      />
      <div className={styles.corpo}>
        <div className={styles.texto}>
          <h3 className={styles.nome}>
            <Link href={`/medico/${medico.slug}`}>{medico.nome}</Link>
          </h3>
          <p className={styles.crm}>{identificacaoMedica(medico.crm, medico.crmUf)}</p>
          {principal ? (
            <p className={styles.esp}>
              {principal.nome}
              {principal.rqe ? (
                <>
                  {" "}
                  <span className={styles.rqe}>RQE&nbsp;{principal.rqe}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        {telefone ? (
          <a
            href={hrefTelefone(telefone)}
            className={`botao ${styles.ligar}`}
            aria-label={`Ligar para ${medico.nome}, ${formatarTelefone(telefone)}`}
            data-ligar=""
          >
            <Icone nome="telefone" /> Ligar
          </a>
        ) : (
          <div className={styles.semLigar} aria-hidden="true" data-ligar=""></div>
        )}
      </div>
    </li>
  );
}
```

`components/diretorio/GradeMedicos.module.css` (de `.grade-medicos` e dos @media de 1180, 980 e 700px):

```css
/*
  A grade de cartões de médico, transcrita do desenho aprovado
  (docs/desenho-aprovado/encontre/busca.html: `.grade-medicos` e os @media
  de 1180, 980 e 700px): 4 por linha, 3 até 1179px, 2 até 980px, um por
  linha no celular. Se mudar, mude também SIZES_DO_CARTAO
  (components/diretorio/CartaoMedico.tsx).
*/

.grade {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--gap);
}

@media (max-width: 1180px) {
  .grade {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .grade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .grade {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
```

Atenção: o desenho usa `@media (max-width:1180px)` para 3 por linha; a spec diz "3 até 1179px". A regra do desenho vale a 1180 também (largura exata da quebra do menu); siga o desenho.

`components/diretorio/GradeMedicos.tsx`:

```tsx
import { CartaoMedico } from "@/components/diretorio/CartaoMedico";
import styles from "@/components/diretorio/GradeMedicos.module.css";
import type { Medico } from "@/lib/dados/tipos";

/*
  A grade de cartões. `imediatos`: quantos dos primeiros cartões baixam a
  foto logo, sem `loading="lazy"`, porque ficam na primeira tela; os outros
  esperam a rolagem.
*/
export function GradeMedicos({ medicos, imediatos = 0 }: { medicos: Medico[]; imediatos?: number }) {
  return (
    <ul className={styles.grade}>
      {medicos.map((m, i) => (
        <CartaoMedico key={m.id} medico={m} imediata={i < imediatos} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run testes/cartao-medico.test.ts` → PASS.

- [ ] **Step 7: A página de especialidade usa a grade**

Os filtros de bairro, telemedicina, acessibilidade e associados saem do site; nesta página eles eram o `PainelFiltros`, e a lista era o `LinhaMedico` (com selo, bairro e telemedicina). Em `app/(site)/medicos/[especialidade]/page.tsx`:

(a) Imports: apague `ListaMedicos`, `PainelFiltros` e `filtrosDaQuery`; acrescente `import { GradeMedicos } from "@/components/diretorio/GradeMedicos";`.

(b) Assinatura: `export default async function PaginaEspecialidade({ params }: Props) {` (o tipo `Props` continua com `searchParams`, que o `generateMetadata` usa).

(c) Apague `const filtros = filtrosDaQuery(await searchParams);` e troque `const medicos = await buscarMedicos({ ...filtros, especialidade });` por `const medicos = todosDaEspecialidade;`.

(d) Troque o bloco

```tsx
      <div className="grid gap-8 py-10 md:grid-cols-[260px_1fr]">
        <PainelFiltros bairros={bairros} total={medicos.length} />
        <div>
          <h2 className="sr-only">Resultados</h2>
          <ListaMedicos
            ...
          />
        </div>
      </div>
```

(do `<div className="grid gap-8 …">` até o `</div>` que o fecha) por

```tsx
      {/* A grade de cartões da busca, sem filtro: a página já é a
          especialidade, e os filtros de bairro, telemedicina, acessibilidade
          e associados saíram do site. */}
      <section aria-labelledby="medicos-da-especialidade" className="py-10">
        <h2 id="medicos-da-especialidade" className="sr-only">
          {`Médicos de ${esp.nome}`}
        </h2>
        <GradeMedicos medicos={medicos} />
      </section>
```

`bairros` continua sendo carregado e usado no bloco "por bairro" do fim da página; ele sai na Task 6.

- [ ] **Step 8: O teste da página de especialidade**

Em `testes/porta-da-busca.test.ts`, troque o `describe("o painel de filtros, numa página de especialidade", …)` inteiro por dois:

```ts
describe("a página de especialidade", () => {
  it("não tem campo de texto nem painel de filtros: ela já é a especialidade", () => {
    expect(ESPECIALIDADE).not.toMatch(/name="termo"/);
    expect(ESPECIALIDADE).not.toContain('id="filtro-bairro"');
    /* E não passou só porque a página quebrou: o cartão do médico está lá. */
    expect(ESPECIALIDADE).toContain('href="/medico/mayara-exemplo"');
    expect(ESPECIALIDADE).toContain("MÉDICO · CRM/MA 1234");
  });
});

describe("o painel de filtros, solto", () => {
  it("sem a prop, não desenha o campo", () => {
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
```

(o segundo é o `it("o painel sem a prop não desenha o campo")` de hoje, só mudado de lugar; ele sai junto com o painel na Task 4).

- [ ] **Step 9: Rodar tudo, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.
Mutações: tire o `.semLigar` (cartão sem telefone sem espaço); troque `telefoneDoCartao` por `consultorioPrincipal(medico)?.telefone`; ponha `{medico.associadoAmi ? "Associado AMI" : null}` no cartão; tire `aspect-ratio: 4 / 5`; tire o `z-index: 2` do `.ligar`; em `GradeMedicos`, troque `i < imediatos` por `true`. Cada uma deixa um teste vermelho.
Confira no servidor da porta 3000 (só leitura) uma página de especialidade a 1440 e a 390px.

```bash
git add testes/css.ts testes/cartao-medico.test.ts components/diretorio/FotoDoMedico.tsx components/diretorio/FotoDoMedico.module.css components/diretorio/CartaoMedico.tsx components/diretorio/CartaoMedico.module.css components/diretorio/GradeMedicos.tsx components/diretorio/GradeMedicos.module.css "app/(site)/medicos/[especialidade]/page.tsx" testes/porta-da-busca.test.ts
git commit -m "Cartao do medico com foto ou iniciais, grade de cartoes, e a especialidade sem painel de filtros"
```

---

### Task 4: A página `/busca`

**Files:**
- Modify: `lib/dados/urlFiltros.ts` (`especialidade` na querystring; `enderecoDaBusca`), `testes/urlFiltros.test.ts`
- Create: `components/busca/FaixaDaBusca.tsx`, `components/busca/FaixaDaBusca.module.css`
- Create: `components/busca/FormularioDaBusca.tsx`
- Create: `components/busca/ResultadosDaBusca.tsx`, `components/busca/ResultadosDaBusca.module.css`
- Create: `app/(site)/encontre.module.css`
- Modify: `app/(site)/busca/page.tsx` (reescrita)
- Modify: `components/layout/Cabeceira.tsx` (comentário: a busca saiu dela)
- Delete: `components/diretorio/PainelFiltros.tsx`
- Modify: `testes/renderizar.ts` (`htmlDe`)
- Create: `testes/busca.test.ts`
- Modify: `testes/porta-da-busca.test.ts`, `testes/paleta.test.ts` (só o texto da exceção `ink-300`)

**Interfaces:**
- Consumes: `GradeMedicos` (Task 3); `opcoesDeEspecialidade`, `textoDaContagem`, `OpcaoDeEspecialidade` (Task 2); `Icone` `"lupa"`, `"seta"`, `"fechar"`, `"abaixo"`; as classes `campo`, `lupa`, `buscar` de `components/home/EncontreUmMedico.module.css`.
- Produces:

```ts
// lib/dados/urlFiltros.ts
export function enderecoDaBusca(f: Filtros): string; // "/busca" + queryDosFiltros(f)
// filtrosDaQuery passa a ler também `especialidade`; queryDosFiltros escreve `especialidade` logo depois de `termo`
// testes/renderizar.ts
export function htmlDe(arvore: ReactNode): Promise<string>;
// app/(site)/encontre.module.css
.pagina   // filhos [data-bloco] a --ritmo um do outro; os que não são [data-faixa], na coluna de 1192px
// components/busca
export function FaixaDaBusca(props: { termo: string; escolhida: EspecialidadeComContagem | null; especialidades: EspecialidadeComContagem[] }): JSX.Element;
export function FormularioDaBusca(props: { termo: string; especialidade: string; opcoes: OpcaoDeEspecialidade[] }): JSX.Element; // "use client"
export function ResultadosDaBusca(props: { medicos: Medico[]; escolhida: EspecialidadeComContagem | null }): JSX.Element;
```

- A faixa da busca é `<section id="encontre" data-bloco="busca" data-faixa="">`: o mesmo `id` da busca da home, que a barra do pé já observa.

- [ ] **Step 1: A URL**

Em `testes/urlFiltros.test.ts`, acrescente no fim:

```ts
describe("a especialidade na busca", () => {
  it("filtrosDaQuery lê a especialidade da querystring", () => {
    expect(filtrosDaQuery({ termo: "ana", especialidade: "cardiologia" })).toEqual({
      termo: "ana",
      especialidade: "cardiologia",
    });
    expect(filtrosDaQuery({ especialidade: "  " })).toEqual({});
  });

  it("queryDosFiltros escreve a especialidade logo depois do termo", () => {
    expect(queryDosFiltros({ especialidade: "cardiologia", termo: "ana" })).toBe(
      "?termo=ana&especialidade=cardiologia",
    );
  });

  it("enderecoDaBusca é /busca com a querystring, ou só /busca", () => {
    expect(enderecoDaBusca({ termo: "ana", especialidade: "cardiologia" })).toBe(
      "/busca?termo=ana&especialidade=cardiologia",
    );
    expect(enderecoDaBusca({})).toBe("/busca");
  });
});
```

e acrescente `enderecoDaBusca` ao import do topo.

Run: `npx vitest run testes/urlFiltros.test.ts` → FAIL. Depois, em `lib/dados/urlFiltros.ts`:

- em `filtrosDaQuery`, logo depois do bloco do `termo`:

```ts
  const especialidade = texto(sp.especialidade)?.trim();
  if (especialidade) f.especialidade = especialidade;
```

- em `queryDosFiltros`, logo depois de `if (f.termo) p.set("termo", f.termo);`:

```ts
  if (f.especialidade) p.set("especialidade", f.especialidade);
```

- no fim do arquivo:

```ts
/** O endereço da busca com estes filtros: `/busca` e a querystring de `queryDosFiltros`. */
export function enderecoDaBusca(f: Filtros): string {
  return `/busca${queryDosFiltros(f)}`;
}
```

- no comentário do topo, depois de "…e a página sai como `noindex, follow`.", acrescente: "Em `/busca` a especialidade também vai na querystring (a busca inteira é `noindex`); a página indexável de cada especialidade continua sendo o caminho `/medicos/<slug>`."

Run de novo → PASS.

- [ ] **Step 2: O ajudante de renderização**

Em `testes/renderizar.ts`, acrescente aos imports `import { Writable } from "node:stream";`, `import type { ReactNode } from "react";` e `renderToPipeableStream` ao import de `react-dom/server`, e no fim:

```ts
/*
  Uma página inteira renderizada no servidor, esperando as partes
  assíncronas (`onAllReady`): o caminho de testes/home-renderizada.test.ts,
  num lugar só para os testes de página que vieram depois.
*/
export function htmlDe(arvore: ReactNode): Promise<string> {
  return new Promise<string>((pronto, falhou) => {
    let html = "";
    const destino = new Writable({
      write(pedaco, _codificacao, seguir) {
        html += pedaco.toString();
        seguir();
      },
      final(seguir) {
        pronto(html);
        seguir();
      },
    });
    const fluxo = renderToPipeableStream(arvore, {
      onAllReady: () => fluxo.pipe(destino),
      onError: falhou,
    });
  });
}
```

- [ ] **Step 3: Os testes da busca**

`testes/busca.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import estilosFaixa from "@/components/busca/FaixaDaBusca.module.css";
import estilosResultados from "@/components/busca/ResultadosDaBusca.module.css";
import estilosCampo from "@/components/home/EncontreUmMedico.module.css";
import type { Medico } from "@/lib/dados/tipos";
import { fonte, semComentarios } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A busca de verdade, renderizada: app/(site)/busca/page.tsx com as duas
  fontes de dados trocadas por dublês (os médicos e as especialidades). O
  formulário é componente de cliente e usa o roteador; aqui não há
  roteador, e o dublê é o mínimo que ele toca. O que só o navegador faz (ir
  para outro endereço ao trocar a lista) se lê do código.
*/

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/busca",
}));

const dados = vi.hoisted(() => ({ chamadas: [] as unknown[], medicos: [] as Medico[] }));
vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async (f: unknown) => {
    dados.chamadas.push(f);
    return dados.medicos;
  },
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Pediatria", slug: "pediatria", total: 2 },
    { nome: "Cardiologia", slug: "cardiologia", total: 1 },
  ],
}));

const { default: PaginaBusca } = await import("@/app/(site)/busca/page");

function medico(n: number, foto: string | null = null): Medico {
  return {
    id: n,
    slug: `medico-${n}`,
    nome: `Médico ${n}`,
    crm: String(1000 + n),
    crmUf: "MA",
    foto,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [{ nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true }],
    locais: [],
  };
}

async function busca(sp: Record<string, string>, medicos: Medico[] = [medico(1)]) {
  dados.medicos = medicos;
  return htmlDe(await PaginaBusca({ searchParams: Promise.resolve(sp) }));
}

const visivel = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

describe("a busca", () => {
  it("abre com a faixa verde e o h1 aprovado, sem a Cabeceira nem a trilha", async () => {
    const html = await busca({});
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1 id="busca-titulo"[^>]*>Quem atende em Imperatriz<\/h1>/);
    expect(html).toMatch(
      new RegExp(`<section id="encontre" data-bloco="busca" data-faixa="" aria-labelledby="busca-titulo" class="textura-verde ${estilosFaixa.faixa}">`),
    );
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
  });

  it("o formulário: GET para /busca, o termo preenchido, o campo da home", async () => {
    const html = await busca({ termo: "Mayara" });
    expect(html).toMatch(/<form[^>]*action="\/busca"[^>]*method="get"/);
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(html)![0];
    expect(campo).toContain('value="Mayara"');
    expect(campo).toContain('placeholder="Nome ou especialidade"');
    expect(html).toContain(`class="${estilosCampo.campo} ${estilosFaixa.campo}"`);
    expect(html).toMatch(new RegExp(`<button type="submit" class="botao ${estilosCampo.buscar}">Buscar`));
  });

  it("a lista: todas, depois em ordem alfabética com a contagem, e a escolhida marcada", async () => {
    const html = await busca({ especialidade: "cardiologia" });
    const opcoes = [...html.matchAll(/<option value="([^"]*)"( selected="")?>([^<]*)<\/option>/g)].map((m) => [
      m[1],
      m[3],
      Boolean(m[2]),
    ]);
    expect(opcoes).toEqual([
      ["", "Todas as especialidades", false],
      ["cardiologia", "Cardiologia (1)", true],
      ["pediatria", "Pediatria (2)", false],
    ]);
    expect(html).toMatch(/<select name="especialidade"/);
  });

  it("sem JavaScript, o botão Aplicar dentro do noscript envia o formulário", async () => {
    const html = await busca({});
    expect(html).toMatch(/<noscript><button type="submit" class="botao [^"]+">Aplicar<\/button><\/noscript>/);
  });

  it("a especialidade escolhida vira 'Filtro: X ×', e o × leva à mesma busca sem ela", async () => {
    const html = await busca({ termo: "Mayara", especialidade: "cardiologia" });
    const ini = html.indexOf(`<p class="${estilosFaixa.filtroAtivo}">`);
    expect(ini, "falta a linha do filtro").toBeGreaterThan(-1);
    const filtro = html.slice(ini, html.indexOf("</p>", ini));
    /* "Filtro:" e o nome são vizinhos (o espaço entre eles é o `gap` do CSS). */
    expect(visivel(filtro)).toBe("Filtro:Cardiologia");
    const link = /<a [^>]*>/.exec(filtro)![0];
    expect(link).toContain('href="/busca?termo=Mayara"');
    expect(link).toContain('aria-label="Tirar o filtro de Cardiologia"');
    expect(link).toContain(`class="${estilosFaixa.tira}"`);
  });

  it("sem especialidade escolhida, sem a linha do filtro", async () => {
    const html = await busca({ termo: "Mayara" });
    expect(html).not.toContain("Filtro:");
  });

  it("a contagem diz quantos e em quê, e a página diz a ordem", async () => {
    const um = await busca({ especialidade: "cardiologia" });
    expect(um).toMatch(/<h2 id="contagem"[^>]*>1 médico em Cardiologia<\/h2>/);
    expect(um).toContain(`<p class="${estilosResultados.ordem}">Em ordem alfabética</p>`);
    const todos = await busca({}, [medico(1), medico(2), medico(3)]);
    expect(todos).toMatch(/<h2 id="contagem"[^>]*>3 médicos<\/h2>/);
  });

  it("pede ao banco só o termo, a especialidade e a ordem alfabética; o resto do endereço antigo é ignorado", async () => {
    await busca({
      termo: "Mayara",
      especialidade: "cardiologia",
      bairro: "centro",
      telemedicina: "1",
      acessibilidade: "elevador",
      associados: "1",
      ordem: "relevancia",
    });
    expect(dados.chamadas.at(-1)).toEqual({ termo: "Mayara", especialidade: "cardiologia", ordem: "nome" });
  });

  it("especialidade que não existe é ignorada: sem filtro e sem 'Filtro:'", async () => {
    const html = await busca({ especialidade: "inventada" });
    expect(dados.chamadas.at(-1)).toEqual({ ordem: "nome" });
    expect(html).not.toContain("Filtro:");
    expect(html).toMatch(/<option value="" selected="">Todas as especialidades<\/option>/);
  });

  it("nenhum resultado: a mensagem e o botão que limpa a busca", async () => {
    const html = await busca({ termo: "ninguém" }, []);
    expect(html).toContain(">Nenhum médico encontrado</h3>");
    expect(html).toMatch(/<a class="botao-linha" href="\/busca">Limpar a busca<\/a>/);
    expect(html).not.toContain("<ul");
  });

  it("os quatro primeiros cartões baixam a foto logo; os outros esperam a rolagem", async () => {
    const seis = [1, 2, 3, 4, 5, 6].map((n) => medico(n, `https://exemplo.test/${n}.jpg`));
    const html = await busca({}, seis);
    expect(html.match(/<img /g)).toHaveLength(6);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
  });

  it("os blocos da página, na ordem, no invólucro de coluna e ritmo", async () => {
    const html = await busca({});
    const blocos = [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);
    expect(blocos).toEqual(["busca", "resultados"]);
    expect(html).toMatch(/^<div class="[^"]+"><section id="encontre"/);
  });
});

describe("o formulário ligado ao navegador", () => {
  const FORM = semComentarios(fonte("../components/busca/FormularioDaBusca.tsx"));

  it("enviar não recarrega: vai para o endereço montado pelos filtros", () => {
    expect(FORM).toMatch(/onSubmit=\{\(e\) => \{\s*e\.preventDefault\(\);\s*ir\(e\.currentTarget\);/);
    expect(FORM).toContain("router.push(enderecoDaBusca(filtrosDaQuery(");
  });

  it("trocar a lista já busca; digitar no campo, não", () => {
    /* Por posição, e não por `[^>]*`: o `=>` da função tem um `>`. */
    const ouvinte = FORM.indexOf("onChange={(e) => ir(e.currentTarget.form!)}");
    expect(ouvinte).toBeGreaterThan(FORM.indexOf("<select"));
    expect(ouvinte).toBeLessThan(FORM.indexOf("</select>"));
    expect(FORM.match(/onChange/g)).toHaveLength(1);
  });
});

describe("o CSS da faixa da busca", () => {
  const css = semNotas(fonte("../components/busca/FaixaDaBusca.module.css"));

  it("faixa de ponta a ponta com a margem das faixas: 96px, 64px no tablet, 44px no celular", () => {
    expect(regra(base(css), ".faixa")).toMatch(/padding: 96px var\(--borda-faixa\)/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".faixa")).toMatch(/padding-top: 64px/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".faixa")).toMatch(/padding: 44px var\(--borda-faixa\)/);
  });

  it("texto à esquerda até 340px e os campos à direita; uma coluna abaixo de 1180px", () => {
    expect(regra(base(css), ".faixa")).toMatch(/grid-template-columns: minmax\(0, 340px\) minmax\(0, 1fr\)/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".faixa")).toMatch(/grid-template-columns: 1fr/);
  });

  it("campo e lista lado a lado, empilhados abaixo de 820px", () => {
    expect(regra(base(css), ".filtros")).toMatch(/grid-template-columns: minmax\(0, 1\.55fr\) minmax\(0, 1fr\)/);
    expect(regra(bloco(css, "@media (max-width: 820px)"), ".filtros")).toMatch(/grid-template-columns: 1fr/);
  });

  it("a lista: pílula branca de 60px (56px no celular, com letra de 16px para o iPhone não aproximar)", () => {
    expect(regra(base(css), ".listaEsp select")).toMatch(/height: 60px/);
    const cel = regra(bloco(css, "@media (max-width: 700px)"), ".listaEsp select");
    expect(cel).toMatch(/height: 56px/);
    expect(cel).toMatch(/font-size: 16px/);
  });

  it("o × do filtro clareia em branco no mouse, não fica verde", () => {
    const r = regra(base(css), ".tira:hover");
    expect(r).toMatch(/rgba\(255, 255, 255, 0\.14\)/);
    expect(r).not.toMatch(/lima|green/);
  });

  it("o texto sobre o verde passa em AA no ponto mais claro medido na fatia A", () => {
    /* O ponto mais claro atrás do texto de apoio da busca da home, com a luz
       e o grão médio, medido no navegador em 03/10/2026 (rgb 53, 95, 38):
       a mesma faixa, o mesmo degradê. A conferência visual remede na busca. */
    const fundo = [53, 95, 38];
    const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const razao = (a: number[], b: number[]) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    for (const seletor of [".texto", ".filtroAtivo"]) {
      const cor = /color:\s*(#[0-9a-fA-F]{6})/.exec(regra(base(css), seletor))![1];
      expect(razao(hex(cor), fundo), seletor).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

E em `testes/porta-da-busca.test.ts`:

- tire `const { PainelFiltros } = await import("@/components/diretorio/PainelFiltros");` e o `describe("o painel de filtros, solto", …)` inteiro;
- troque `const BUSCA_PARAMS = { searchParams: Promise.resolve({ termo: "Mayara", bairro: "centro" }) };` por `const BUSCA_PARAMS = { searchParams: Promise.resolve({ termo: "Mayara", especialidade: "cardiologia", bairro: "centro" }) };`;
- troque o `describe("o painel de filtros, em /busca", …)` por:

```ts
describe("a faixa de /busca", () => {
  it("tem campo de texto, para quem chegou por link de especialidade", () => {
    expect(BUSCA).toMatch(/<input[^>]*name="termo"/);
    expect(formularioDentroDeAncora(BUSCA)).toBe(false);
  });

  it("o campo vem preenchido com o termo atual", () => {
    /* A asserção olha a TAG inteira, e não a sequência `name=…value=`: a
       ordem em que o React imprime os atributos é detalhe dele. */
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(BUSCA)?.[0] ?? "";
    expect(campo, "não achei o campo de termo na faixa").not.toBe("");
    expect(campo).toContain('value="Mayara"');
  });
});
```

- no comentário do topo do arquivo, troque "e o painel de filtros de `/busca`. E um lugar onde NÃO dá: o mesmo painel nas páginas de especialidade." por "e a faixa verde de `/busca`. E um lugar onde NÃO dá: a página de especialidade."; troque o último parágrafo do comentário ("O painel é perguntado pelas duas PÁGINAS…") por "As duas páginas (app/(site)/busca/page.tsx e app/(site)/medicos/[especialidade]/page.tsx) são renderizadas de verdade, com as fontes de dados trocadas por dublês.";
- no comentário dos dublês ("O painel é componente de cliente…"), troque "O painel" por "O formulário da busca".

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run testes/busca.test.ts testes/porta-da-busca.test.ts`
Expected: FAIL (componentes inexistentes; a busca ainda é a antiga).

- [ ] **Step 5: A coluna e o ritmo das páginas novas**

`app/(site)/encontre.module.css`:

```css
/*
  A coluna e o ritmo das páginas de "Encontre um médico" (a busca e o
  perfil), com a mesma regra da home (app/(site)/inicio.module.css): os
  blocos são filhos diretos de `.pagina`, a --ritmo um do outro e do
  cabeçalho; os que não são faixa de ponta a ponta (`data-faixa`) ficam na
  caixa de 1240px do desenho, com 24px de folga de cada lado (12px no
  celular). O rodapé fica a --ritmo do último bloco, porque nenhuma das duas
  páginas termina numa faixa (components/layout/Rodape.module.css).
*/

.pagina > [data-bloco] {
  margin-top: var(--ritmo);
}

.pagina > [data-bloco]:not([data-faixa]) {
  width: min(100% - 48px, 1192px);
  margin-inline: auto;
}

@media (max-width: 700px) {
  .pagina > [data-bloco]:not([data-faixa]) {
    width: calc(100% - 24px);
  }
}
```

- [ ] **Step 6: A faixa e o formulário**

`components/busca/FaixaDaBusca.module.css` (de `.encontre.secao.busca-topo`, `.busca-topo h1`, `.busca-topo .sobre`, `.busca-topo h1 + p`, `.filtros`, `.filtros .campo`, `.lista-esp`, `.lista-esp select`, `.lista-esp > i`, `.filtro-ativo`, `.chip.tira`, e os @media de 1180, 980, 820, 700 e 400px; o grid e as margens da faixa vêm de `.encontre` da home):

```css
/*
  A faixa verde do topo da busca, transcrita do desenho aprovado
  (docs/desenho-aprovado/encontre/busca.html: `.encontre.secao.busca-topo`,
  `.busca-topo h1`, `.busca-topo .sobre`, `.busca-topo h1 + p`, `.filtros`,
  `.lista-esp`, `.filtro-ativo`, `.chip.tira`, e os @media de 1180, 980,
  820, 700 e 400px). A matéria verde é a classe global `.textura-verde`. O
  campo branco com a lupa e o botão é o da busca da home
  (components/home/EncontreUmMedico.module.css: `.campo`, `.lupa`,
  `.buscar`), usado do mesmo arquivo pelo formulário, para os dois não
  divergirem.

  #cfd8c9 é o branco esverdeado do texto sobre o verde, o mesmo da busca da
  home; o contraste está em testes/busca.test.ts.

  Duas diferenças medidas em relação ao desenho, as mesmas da busca da home:
  o rótulo do celular é o lima clareado (contraste sobre a luz que passeia),
  e a lista tem letra de 16px no celular (abaixo disso o Safari do iPhone
  aproxima a página ao tocar). O anel de foco da lista é contorno lima, como
  o do campo.
*/

.faixa {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: var(--m);
  align-items: center;
  padding: 96px var(--borda-faixa);
}

.faixa > div {
  min-width: 0;
}

.sobre {
  color: var(--color-ami-lima-400);
}

.titulo {
  margin-top: 14px;
  color: var(--color-white);
  font-size: clamp(38px, 4.2vw, 56px);
  line-height: 1.02;
  max-width: 13ch;
}

.texto {
  margin-top: 18px;
  max-width: 26em;
  color: #cfd8c9;
}

.filtros {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.campo {
  min-width: 0;
}

.listaEsp {
  position: relative;
  display: block;
  min-width: 0;
}

.listaEsp select {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 60px;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-ink-900);
  font: 500 16px var(--font-corpo);
  padding: 0 52px 0 22px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  text-overflow: ellipsis;
}

.listaEsp select:focus-visible {
  outline: 2px solid var(--color-ami-lima-400);
  outline-offset: 3px;
}

.seta {
  position: absolute;
  right: 22px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-ink-400);
  pointer-events: none;
}

/* Só existe sem JavaScript (dentro do <noscript>): vai para a linha de baixo. */
.aplicar {
  justify-self: start;
}

.filtroAtivo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  font-size: 14px;
  color: #cfd8c9;
}

/* A pílula do filtro: o `.chip` da busca da home, com a borda e o fundo
   mais fortes do `.chip.tira` do desenho. */
.tira {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-white);
  font: 600 13px/1 var(--font-corpo);
  white-space: nowrap;
  transition:
    background 0.2s,
    border-color 0.2s,
    transform 0.2s;
}

.tira svg {
  width: 15px;
  height: 15px;
  opacity: 0.85;
}

.tira:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

@media (max-width: 1180px) {
  .faixa {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .texto {
    max-width: 40em;
  }

  .filtros {
    max-width: 760px;
  }
}

@media (max-width: 980px) {
  .faixa {
    padding-top: 64px;
    padding-bottom: 64px;
  }
}

@media (max-width: 820px) {
  .filtros {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

@media (max-width: 700px) {
  .faixa {
    padding: 44px var(--borda-faixa);
  }

  .sobre {
    color: color-mix(in srgb, var(--color-ami-lima-400) 70%, white);
  }

  .titulo {
    font-size: 32px;
    line-height: 1.04;
  }

  .texto {
    margin-top: 12px;
    font-size: 14.5px;
  }

  .listaEsp select {
    height: 56px;
    font-size: 16px;
    padding: 0 48px 0 18px;
  }

  .seta {
    right: 18px;
  }

  .filtroAtivo {
    margin-top: 14px;
  }
}

@media (max-width: 400px) {
  .titulo {
    font-size: 30px;
  }
}
```

`components/busca/FormularioDaBusca.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Icone } from "@/components/base/Icone";
import campo from "@/components/home/EncontreUmMedico.module.css";
import styles from "@/components/busca/FaixaDaBusca.module.css";
import { enderecoDaBusca, filtrosDaQuery } from "@/lib/dados/urlFiltros";
import type { OpcaoDeEspecialidade } from "@/lib/encontre";

/*
  O formulário da busca: o campo "Nome ou especialidade" e a lista "Todas
  as especialidades".

  É um formulário HTML de verdade, GET para `/busca`: sem JavaScript, o
  "Buscar" envia, e o "Aplicar" de dentro do <noscript> envia a lista. Com
  JavaScript, enviar e trocar a lista vão para o endereço montado por
  `enderecoDaBusca` (lib/dados/urlFiltros.ts), sem os campos vazios na URL.
  Digitar no campo não busca nada: a busca é do servidor e fica no endereço.

  Os valores iniciais vêm da URL atual. Quem usa troca a `key` quando a URL
  muda, para o formulário recomeçar com os valores novos.
*/
export function FormularioDaBusca({
  termo,
  especialidade,
  opcoes,
}: {
  termo: string;
  especialidade: string;
  opcoes: OpcaoDeEspecialidade[];
}) {
  const router = useRouter();

  const ir = (formulario: HTMLFormElement) => {
    const valores = Object.fromEntries(new FormData(formulario)) as Record<string, string>;
    router.push(enderecoDaBusca(filtrosDaQuery(valores)));
  };

  return (
    <form
      action="/busca"
      method="get"
      role="search"
      aria-label="Buscar médicos"
      className={styles.filtros}
      onSubmit={(e) => {
        e.preventDefault();
        ir(e.currentTarget);
      }}
    >
      <div className={`${campo.campo} ${styles.campo}`}>
        <Icone nome="lupa" className={campo.lupa} />
        <label htmlFor="busca-termo" className="sr-only">
          Nome do médico ou especialidade
        </label>
        <input
          id="busca-termo"
          name="termo"
          type="search"
          defaultValue={termo}
          placeholder="Nome ou especialidade"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" className={`botao ${campo.buscar}`}>
          Buscar <Icone nome="seta" />
        </button>
      </div>

      <label className={styles.listaEsp}>
        <span className="sr-only">Especialidade</span>
        <select name="especialidade" defaultValue={especialidade} onChange={(e) => ir(e.currentTarget.form!)}>
          <option value="">Todas as especialidades</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <Icone nome="abaixo" className={styles.seta} />
      </label>

      <noscript>
        <button type="submit" className={`botao ${styles.aplicar}`}>
          Aplicar
        </button>
      </noscript>
    </form>
  );
}
```

`components/busca/FaixaDaBusca.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import { FormularioDaBusca } from "@/components/busca/FormularioDaBusca";
import styles from "@/components/busca/FaixaDaBusca.module.css";
import { enderecoDaBusca } from "@/lib/dados/urlFiltros";
import { opcoesDeEspecialidade } from "@/lib/encontre";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";

/*
  A faixa verde de ponta a ponta que abre a busca: o rótulo, o título, a
  linha de apoio (a mesma da busca da home), o formulário e, quando há uma
  especialidade escolhida, "Filtro: Cardiologia ×". O × é um link para a
  mesma busca sem a especialidade.

  O `id="encontre"` é o da busca da home: o menu e a barra do pé do
  celular procuram `#encontre`. `data-faixa` é a marca das faixas de ponta a
  ponta (app/(site)/encontre.module.css não a põe na coluna).
*/
export function FaixaDaBusca({
  termo,
  escolhida,
  especialidades,
}: {
  termo: string;
  escolhida: EspecialidadeComContagem | null;
  especialidades: EspecialidadeComContagem[];
}) {
  return (
    <section
      id="encontre"
      data-bloco="busca"
      data-faixa=""
      aria-labelledby="busca-titulo"
      className={`textura-verde ${styles.faixa}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${styles.sobre}`} data-coluna="">
          Encontre um médico
        </span>
        <h1 id="busca-titulo" className={styles.titulo}>
          Quem atende em Imperatriz
        </h1>
        <p className={styles.texto}>
          Todo médico aparece com o número de inscrição no CRM, para você
          conferir no portal do Conselho.
        </p>
      </div>

      <div>
        <FormularioDaBusca
          key={`${termo}|${escolhida?.slug ?? ""}`}
          termo={termo}
          especialidade={escolhida?.slug ?? ""}
          opcoes={opcoesDeEspecialidade(especialidades)}
        />
        {escolhida ? (
          <p className={styles.filtroAtivo}>
            <span>Filtro:</span>
            <Link
              href={enderecoDaBusca(termo ? { termo } : {})}
              className={styles.tira}
              aria-label={`Tirar o filtro de ${escolhida.nome}`}
            >
              {escolhida.nome} <Icone nome="fechar" />
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Os resultados e a página**

`components/busca/ResultadosDaBusca.module.css` (de `.cab-resultados`, `.contagem`, `.cab-resultados .texto`, `.vazio`, `.vazio h3`, `.vazio p`, e o @media de 700px):

```css
/*
  A contagem, a grade e o estado vazio da busca, transcritos do desenho
  aprovado (docs/desenho-aprovado/encontre/busca.html: `.cab-resultados`,
  `.contagem`, `.cab-resultados .texto`, `.vazio`, `.vazio h3`, `.vazio p`,
  e o @media de 700px). A grade é de GradeMedicos.module.css.
*/

.cab {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--gap);
  padding: 0 var(--m) 32px;
}

.contagem {
  font-size: 32px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.ordem {
  font-size: 14.5px;
  color: var(--color-ink-600);
}

.vazio {
  padding: 56px var(--m);
}

.vazio h3 {
  font-size: 26px;
}

.vazio p {
  margin: 10px 0 22px;
  color: var(--color-ink-600);
}

@media (max-width: 700px) {
  .cab {
    padding: 0 var(--m) 16px;
    flex-wrap: wrap;
    row-gap: 2px;
  }

  .contagem {
    font-size: 24px;
  }

  .ordem {
    font-size: 13.5px;
  }

  .vazio {
    padding: 32px var(--m);
  }
}
```

`components/busca/ResultadosDaBusca.tsx`:

```tsx
import Link from "next/link";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import styles from "@/components/busca/ResultadosDaBusca.module.css";
import { textoDaContagem } from "@/lib/encontre";
import type { EspecialidadeComContagem, Medico } from "@/lib/dados/tipos";

/* Os cartões da primeira fileira do computador: baixam a foto logo. */
const IMEDIATOS = 4;

/*
  A contagem ("24 médicos", "3 médicos em Cardiologia"), a frase que diz a
  ordem, e a grade; sem resultado, "Nenhum médico encontrado" e o botão que
  limpa a busca.
*/
export function ResultadosDaBusca({
  medicos,
  escolhida,
}: {
  medicos: Medico[];
  escolhida: EspecialidadeComContagem | null;
}) {
  return (
    <section data-bloco="resultados" aria-labelledby="contagem">
      <div className={styles.cab}>
        <h2 id="contagem" className={styles.contagem} data-coluna="">
          {textoDaContagem(medicos.length, escolhida?.nome ?? null)}
        </h2>
        <p className={styles.ordem}>Em ordem alfabética</p>
      </div>

      {medicos.length > 0 ? (
        <GradeMedicos medicos={medicos} imediatos={IMEDIATOS} />
      ) : (
        <div className={styles.vazio}>
          <h3>Nenhum médico encontrado</h3>
          <p>Confira a grafia do nome ou escolha outra especialidade.</p>
          <Link href="/busca" className="botao-linha">
            Limpar a busca
          </Link>
        </div>
      )}
    </section>
  );
}
```

`app/(site)/busca/page.tsx` (reescrita inteira; o comentário do `metadata` fica como está hoje):

```tsx
import type { Metadata } from "next";
import styles from "@/app/(site)/encontre.module.css";
import { FaixaDaBusca } from "@/components/busca/FaixaDaBusca";
import { ResultadosDaBusca } from "@/components/busca/ResultadosDaBusca";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { filtrosDaQuery } from "@/lib/dados/urlFiltros";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/*
  Busca livre. Fora do índice de propósito: cada termo digitado geraria um
  endereço novo e quase idêntico aos outros, e é exatamente esse tipo de
  página que faz o Google classificar um diretório como conteúdo raso.
  `follow` mantém os links de resultado rastreáveis.
*/
export const metadata: Metadata = {
  title: "Buscar médicos em Imperatriz - MA | AMI",
  robots: { index: false, follow: true },
};

/*
  A busca: a faixa verde com o campo e a lista de especialidades, e a
  contagem e a grade, em ordem alfabética. Sem a `Cabeceira` das outras
  páginas internas: a busca abre com a faixa verde.

  Da URL valem só `termo` e `especialidade`. Os outros filtros de antes
  (bairro, telemedicina, acessibilidade, associados, ordem) não chegam ao
  banco, e uma especialidade que não está na lista também não: a busca abre
  sem eles, sem erro.
*/
export default async function PaginaBusca({ searchParams }: Props) {
  const pedido = filtrosDaQuery(await searchParams);
  const especialidades = await especialidadesComContagem();
  const escolhida = especialidades.find((e) => e.slug === pedido.especialidade) ?? null;
  const termo = pedido.termo ?? "";

  const medicos = await buscarMedicos({
    ...(termo ? { termo } : {}),
    ...(escolhida ? { especialidade: escolhida.slug } : {}),
    ordem: "nome",
  });

  return (
    <div className={styles.pagina}>
      <FaixaDaBusca termo={termo} escolhida={escolhida} especialidades={especialidades} />
      <ResultadosDaBusca medicos={medicos} escolhida={escolhida} />
    </div>
  );
}
```

- [ ] **Step 8: O painel sai, e os comentários que o citam**

Apague `components/diretorio/PainelFiltros.tsx`. Depois:

- `testes/paleta.test.ts`, na exceção `"ink-300"` de `TEXTO_FORA_DO_TESTE`: troque o texto por `"separador aria-hidden (components/layout/Breadcrumb.tsx) — isento de AA por desenho, e testado à parte, para REPROVAR, logo abaixo"`.
- `components/layout/Cabeceira.tsx`, primeiro parágrafo do comentário: troque "Cabeceira das páginas internas: /medicos, /busca, cada especialidade e cada cruzamento de especialidade com bairro." por "Cabeceira das páginas internas que ainda não ganharam o desenho novo, como /medicos e cada especialidade. A busca e o perfil do médico não a usam: o cliente a recusou, e as duas abrem com o desenho delas."
- `grep -rn "PainelFiltros" app components lib testes` → nada.

- [ ] **Step 9: Rodar tudo, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.
Mutações: tirar o `e.preventDefault()`; pôr `onChange` no `<input>`; tirar o `<noscript>`; na página, passar `pedido.especialidade` direto ao banco (sem conferir a lista); trocar `IMEDIATOS` por 0; tirar `ordem: "nome"`; tirar o `data-faixa` da faixa (o bloco entra na coluna de 1192px: o teste de `data-faixa` fica vermelho). Cada uma deixa um teste vermelho.
Abra `/busca`, `/busca?especialidade=cardiologia` e `/busca?termo=zzzz` no servidor da porta 3000 (só leitura) a 1440 e 390px e compare com `busca-1440-parte-1.jpg`, `busca-1440-filtro.jpg` e `busca-390-parte-1.jpg`.

```bash
git add lib/dados/urlFiltros.ts testes/urlFiltros.test.ts components/busca "app/(site)/encontre.module.css" "app/(site)/busca/page.tsx" components/diretorio/PainelFiltros.tsx components/layout/Cabeceira.tsx testes/renderizar.ts testes/busca.test.ts testes/porta-da-busca.test.ts testes/paleta.test.ts
git commit -m "Busca nova: faixa verde com campo e lista de especialidades, contagem, grade de cartoes e estado vazio"
```

---

### Task 5: Só dois filtros, sempre em ordem alfabética, e o fim da página de bairro

**Files:**
- Modify: `lib/dados/tipos.ts` (`Filtros` com dois campos; sai `Ordem`)
- Modify: `lib/dados/urlFiltros.ts` (só `termo` e `especialidade`)
- Modify: `lib/dados/filtros.ts` (só os dois filtros; `emOrdemAlfabetica` no lugar de `ordenar`)
- Modify: `lib/dados/medicos.ts` (`buscarMedicos` sempre alfabética)
- Modify: `app/(site)/busca/page.tsx` (sai `ordem: "nome"`)
- Delete: `app/(site)/medicos/[especialidade]/[bairro]/page.tsx`, `components/diretorio/ListaMedicos.tsx`
- Modify: `next.config.ts` (redirecionamento permanente)
- Modify: `app/sitemap.ts` (sem cruzamentos)
- Modify: `lib/seo/metadados.ts` (saem `tituloFaceta` e `descricaoFaceta`)
- Modify: `testes/urlFiltros.test.ts`, `testes/filtros.test.ts`, `testes/busca.test.ts`, `testes/metadados.test.ts`
- Create: `testes/rota-de-bairro.test.ts`

**Interfaces:**
- Consumes: `porNome` (Task 2).
- Produces:

```ts
// lib/dados/tipos.ts
export type Filtros = { termo?: string; especialidade?: string };
// lib/dados/filtros.ts
export function aplicarFiltros(medicos: Medico[], filtros: Filtros): Medico[];
export const porNome: (a: Medico, b: Medico) => number;
export function emOrdemAlfabetica(medicos: Medico[]): Medico[];
// lib/dados/urlFiltros.ts (mesmas assinaturas, só dois campos)
export function filtrosDaQuery(sp: Record<string, string | string[] | undefined>): Filtros;
export function queryDosFiltros(f: Filtros): string;
export function enderecoDaBusca(f: Filtros): string;
// next.config.ts
redirects(): [{ source: "/medicos/:especialidade/:bairro", destination: "/medicos/:especialidade", permanent: true }]
```

- [ ] **Step 1: Os testes**

`testes/urlFiltros.test.ts` — substitua o arquivo inteiro por:

```ts
import { describe, expect, it } from "vitest";
import { enderecoDaBusca, filtrosDaQuery, queryDosFiltros } from "@/lib/dados/urlFiltros";

describe("filtrosDaQuery", () => {
  it("lê o termo e a especialidade", () => {
    expect(filtrosDaQuery({ termo: "cardio", especialidade: "cardiologia" })).toEqual({
      termo: "cardio",
      especialidade: "cardiologia",
    });
  });

  it("ignora os parâmetros de antes: bairro, telemedicina, acessibilidade, associados e ordem", () => {
    expect(
      filtrosDaQuery({
        termo: "cardio",
        bairro: "centro",
        telemedicina: "1",
        acessibilidade: ["acesso_cadeirante", "elevador"],
        associados: "1",
        ordem: "nome",
      }),
    ).toEqual({ termo: "cardio" });
  });

  it("devolve objeto vazio quando não há query, e tira espaço sobrando", () => {
    expect(filtrosDaQuery({})).toEqual({});
    expect(filtrosDaQuery({ termo: "  ana  ", especialidade: " " })).toEqual({ termo: "ana" });
  });

  it("parâmetro repetido: vale o primeiro", () => {
    expect(filtrosDaQuery({ especialidade: ["pediatria", "cardiologia"] })).toEqual({
      especialidade: "pediatria",
    });
  });
});

describe("queryDosFiltros e enderecoDaBusca", () => {
  it("ordem fixa: termo, depois especialidade; o vazio não suja a URL", () => {
    expect(queryDosFiltros({ especialidade: "cardiologia", termo: "ana" })).toBe(
      "?termo=ana&especialidade=cardiologia",
    );
    expect(queryDosFiltros({})).toBe("");
  });

  it("o endereço da busca", () => {
    expect(enderecoDaBusca({ termo: "ana" })).toBe("/busca?termo=ana");
    expect(enderecoDaBusca({})).toBe("/busca");
  });

  it("faz o caminho de ida e volta", () => {
    const original = { termo: "josé", especialidade: "pediatria" };
    const sp = Object.fromEntries(new URLSearchParams(queryDosFiltros(original).slice(1)));
    expect(filtrosDaQuery(sp)).toEqual(original);
  });
});
```

`testes/filtros.test.ts`:

- troque o import por `import { aplicarFiltros, emOrdemAlfabetica } from "@/lib/dados/filtros";`;
- apague os `it` "filtra por bairro", "filtra por telemedicina", "filtra por acessibilidade", "não retorna médico com acessibilidades em locais diferentes", "retorna médico com múltiplas acessibilidades no mesmo local" e "filtra somente associados";
- troque o `it("combina filtros com E, não com OU", …)` por:

```ts
  it("combina termo e especialidade com E, não com OU", () => {
    const r = aplicarFiltros(todos, { termo: "jose", especialidade: "pediatria" });
    expect(r).toHaveLength(0);
  });

  it("os campos de antes, se chegarem, não filtram nada", () => {
    const antigos = { bairro: "centro", telemedicina: true, somenteAssociados: true } as never;
    expect(aplicarFiltros(todos, antigos)).toHaveLength(2);
  });
```

- troque o `describe("ordenar", …)` inteiro por:

```ts
describe("emOrdemAlfabetica", () => {
  it("em ordem alfabética que respeita acento", () => {
    const angela = medico({ nome: "Ângela Prado", slug: "angela-prado" });
    const r = emOrdemAlfabetica([josé, angela, ana]);
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra", "Ângela Prado", "José Andrade"]);
  });

  it("não altera a lista recebida", () => {
    const lista = [josé, ana];
    emOrdemAlfabetica(lista);
    expect(lista.map((m) => m.nome)).toEqual(["José Andrade", "Ana Bezerra"]);
  });
});
```

`testes/busca.test.ts`: troque as duas expectativas de chamada por `toEqual({ termo: "Mayara", especialidade: "cardiologia" })` e `toEqual({})`, e o nome do `it` para "pede ao banco só o termo e a especialidade; o resto do endereço antigo é ignorado".

`testes/metadados.test.ts`: tire `descricaoFaceta` e `tituloFaceta` do import e apague os blocos `describe("tituloFaceta", …)` e `describe("descricaoFaceta", …)` inteiros.

`testes/rota-de-bairro.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { Medico } from "@/lib/dados/tipos";

/*
  As páginas de especialidade por bairro saíram do site. O endereço antigo
  leva, com redirecionamento permanente, à página da especialidade
  (next.config.ts), e o sitemap deixou de convidar o robô para eles.
*/

function medico(id: number, especialidade: string, bairro: string): Medico {
  return {
    id,
    slug: `m${id}`,
    nome: `Médico ${id}`,
    crm: String(id),
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [{ nome: especialidade, slug: especialidade, rqe: null, principal: true }],
    locais: [
      {
        id,
        logradouro: "Rua A",
        numero: "1",
        bairro: { id: 1, nome: bairro, slug: bairro },
        telefone: null,
        whatsapp: null,
        estacionamento: false,
        acessibilidade: [],
      },
    ],
  };
}

vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => [1, 2, 3, 4].map((i) => medico(i, "cardiologia", "centro")),
}));
vi.mock("@/lib/sanity/consultas", () => ({
  caminhosDePaginasPublicadas: async () => [],
  slugsDeNoticias: async () => [],
}));

describe("o endereço antigo de especialidade por bairro", () => {
  it("vai para a página da especialidade, com redirecionamento permanente", async () => {
    const { default: config } = await import("@/next.config");
    expect(await config.redirects!()).toEqual([
      {
        source: "/medicos/:especialidade/:bairro",
        destination: "/medicos/:especialidade",
        permanent: true,
      },
    ]);
  });

  it("a página de cruzamento não existe mais", async () => {
    const { existsSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const caminho = fileURLToPath(new URL("../app/(site)/medicos/[especialidade]/[bairro]/page.tsx", import.meta.url));
    expect(existsSync(caminho)).toBe(false);
  });
});

describe("o sitemap", () => {
  it("lista a especialidade e o perfil, e nenhum endereço de especialidade por bairro", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/medicos/cardiologia"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/medico/m1"))).toBe(true);
    expect(urls.filter((u) => /\/medicos\/[^/]+\/[^/]+$/.test(u))).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/urlFiltros.test.ts testes/filtros.test.ts testes/rota-de-bairro.test.ts testes/busca.test.ts`
Expected: FAIL (os parâmetros antigos ainda são lidos; `emOrdemAlfabetica` não existe; não há redirecionamento; o sitemap lista `/medicos/cardiologia/centro`).

- [ ] **Step 3: O tipo e a URL**

`lib/dados/tipos.ts`: apague o tipo `Ordem` (e o comentário dele) e troque `Filtros` por:

```ts
/*
  Os dois filtros do site: o texto digitado (nome do médico ou
  especialidade) e a especialidade escolhida na lista. Bairro, telemedicina,
  acessibilidade e associados saíram do site em 03/10/2026; os dados
  continuam no banco e no painel.
*/
export type Filtros = {
  termo?: string;
  /** slug da especialidade */
  especialidade?: string;
};
```

(`RecursoAcessibilidade` e `ROTULO_ACESSIBILIDADE` ficam: o domínio e o painel usam.)

`lib/dados/urlFiltros.ts`: o import vira `import type { Filtros } from "@/lib/dados/tipos";`; apague `RECURSOS` e `ORDENS`; `filtrosDaQuery` fica só com os blocos de `termo` e `especialidade`; `queryDosFiltros` fica só com as duas linhas `p.set`. Reescreva o comentário de `queryDosFiltros` para:

```ts
/**
 * Serializa os filtros numa querystring, em ordem fixa (termo, depois
 * especialidade): o mesmo filtro com dois endereços é conteúdo duplicado.
 * Toda URL da busca passa por aqui (`enderecoDaBusca`).
 */
```

e acrescente ao comentário do topo: "Os parâmetros de antes (`bairro`, `telemedicina`, `acessibilidade`, `associados`, `ordem`) não são lidos: um endereço antigo abre a busca sem eles."

- [ ] **Step 4: Os filtros e a ordem**

`lib/dados/filtros.ts` (CRLF, BOM): o import de tipos vira `import type { Filtros, Medico } from "@/lib/dados/tipos";`; `aplicarFiltros` fica:

```ts
export function aplicarFiltros(medicos: Medico[], filtros: Filtros): Medico[] {
  const termo = filtros.termo ? normalizar(filtros.termo) : "";

  return medicos.filter((m) => {
    if (termo && !casaNoNome(m, termo) && !casaNaEspecialidade(m, termo)) {
      return false;
    }

    if (
      filtros.especialidade &&
      !m.especialidades.some((e) => e.slug === filtros.especialidade)
    ) {
      return false;
    }

    return true;
  });
}
```

e a função `ordenar` (com o comentário dela) é trocada por:

```ts
/**
 * A ordem do site: sempre alfabética, e a busca diz isso na tela ("Em ordem
 * alfabética"). Nenhum critério de destaque, qualidade, completude ou
 * antiguidade, e nenhum destaque pago nem selo comparativo neste site.
 */
export function emOrdemAlfabetica(medicos: Medico[]): Medico[] {
  return [...medicos].sort(porNome);
}
```

`lib/dados/medicos.ts`: `import { aplicarFiltros, emOrdemAlfabetica } from "@/lib/dados/filtros";` e

```ts
/**
 * Busca com filtros, em ordem alfabética.
 *
 * A publicação é filtrada no banco — e a RLS garante isso de novo, mesmo que
 * alguém remova aquela linha. O restante é filtrado em memória por
 * `aplicarFiltros`, que é puro e testado. Com a ordem de 500 registros a
 * diferença de desempenho é irrelevante, e a lógica fica testável sem banco.
 */
export async function buscarMedicos(filtros: Filtros = {}): Promise<Medico[]> {
  return emOrdemAlfabetica(aplicarFiltros(await todosVisiveis(), filtros));
}
```

Na seleção (`SELECAO`) e em `paraDominio` nada muda: `telemedicina`, `associado_ami` e a acessibilidade continuam lidos, porque o JSON-LD do perfil usa `telemedicina` (decisão D3) e o tipo `Medico` é do domínio.

`app/(site)/busca/page.tsx`: tire a linha `ordem: "nome",` da chamada a `buscarMedicos`.

- [ ] **Step 5: A página de bairro vira redirecionamento**

Apague `app/(site)/medicos/[especialidade]/[bairro]/page.tsx` e `components/diretorio/ListaMedicos.tsx` (a página de bairro era a última a usá-lo). Em `next.config.ts`, dentro de `nextConfig`, depois de `transpilePackages`:

```ts
  /*
    As páginas de especialidade por bairro (/medicos/<especialidade>/<bairro>)
    saíram do site junto com os bairros, em 03/10/2026. Quem chega pelo
    endereço antigo, de um link guardado ou do Google, vai para a página da
    especialidade, com redirecionamento permanente (308), para o buscador
    trocar o endereço guardado.
  */
  async redirects() {
    return [
      {
        source: "/medicos/:especialidade/:bairro",
        destination: "/medicos/:especialidade",
        permanent: true,
      },
    ];
  },
```

Confira em `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md` que a forma é essa nesta versão.

- [ ] **Step 6: O sitemap e os títulos de cruzamento**

`app/sitemap.ts`: tire o import de `facetaEhIndexavel`; troque o comentário e o laço dos conjuntos por:

```ts
  /* Profissionais distintos por especialidade. Conjuntos, não contadores. */
  const porEspecialidade = new Map<string, Set<number>>();

  for (const m of todos) {
    for (const e of m.especialidades) {
      if (!porEspecialidade.has(e.slug)) porEspecialidade.set(e.slug, new Set());
      porEspecialidade.get(e.slug)!.add(m.id);
    }
  }
```

apague o bloco `const cruzamentos …` e o comentário dele, e tire `...cruzamentos,` do `return`. No comentário de cima da função, troque "A versão anterior chamava bairrosComContagem dentro do laço de especialidades, e cada chamada varre a tabela inteira: dezesseis idas ao banco para montar um arquivo." por "Uma versão antiga chamava a camada de dados dentro do laço de especialidades, e cada chamada varria a tabela inteira."

`lib/seo/metadados.ts`: apague `tituloFaceta` e `descricaoFaceta` (com os comentários). Rode `npx tsc --noEmit`; o que ficar sem uso no arquivo (uma função interna usada só por elas) também sai.

`grep -rn "\[bairro\]\|ListaMedicos\|tituloFaceta\|descricaoFaceta\|ordenar(\|\bOrdem\b" app components lib testes` → nada, a não ser `ordenarDiretoria`/`ordenarEspecialidades` (outras coisas).

- [ ] **Step 7: Rodar tudo, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. No relatório do build, a rota `/medicos/[especialidade]/[bairro]` sumiu.
Mutações: em `filtrosDaQuery`, voltar a ler `bairro`; em `buscarMedicos`, tirar `emOrdemAlfabetica`; `permanent: false`; voltar o `...cruzamentos`. Cada uma deixa um teste vermelho.
Produção: `npx next start -p 3300` e `curl -sI http://localhost:3300/medicos/cardiologia/centro` → `308` com `location: /medicos/cardiologia`. Derrube o 3300.

```bash
git add lib/dados/tipos.ts lib/dados/urlFiltros.ts lib/dados/filtros.ts lib/dados/medicos.ts "app/(site)/busca/page.tsx" "app/(site)/medicos/[especialidade]/[bairro]/page.tsx" components/diretorio/ListaMedicos.tsx next.config.ts app/sitemap.ts lib/seo/metadados.ts testes/urlFiltros.test.ts testes/filtros.test.ts testes/busca.test.ts testes/metadados.test.ts testes/rota-de-bairro.test.ts
git commit -m "So termo e especialidade, sempre em ordem alfabetica; pagina de bairro vira redirecionamento e sai do sitemap"
```

---

### Task 6: Bairros fora do resto do site

E, junto, a telemedicina, a acessibilidade e os associados fora do texto de abertura das páginas de especialidade.

**Files:**
- Modify: `components/home/NumerosDaAmi.tsx`, `components/home/NumerosDaAmi.module.css`
- Rename + Modify: `components/home/BairrosEParceiros.tsx` → `components/home/Parceiros.tsx`; `BairrosEParceiros.module.css` → `Parceiros.module.css` (`git mv`)
- Modify: `components/home/EmpresasParceiras.tsx` (comentário), `lib/molduras.ts` (comentário)
- Modify: `app/(site)/page.tsx`, `app/(site)/inicio.module.css` (comentário)
- Modify: `components/layout/Rodape.tsx`, `components/layout/Rodape.module.css` (comentário), `components/layout/Cabeceira.tsx` (comentário)
- Modify: `app/(site)/medicos/page.tsx`, `app/(site)/medicos/[especialidade]/page.tsx`
- Modify: `lib/dados/especialidades.ts` (sai `bairrosComContagem`)
- Delete: `components/diretorio/LadrilhosBairros.tsx`, `components/diretorio/LadrilhosBairros.module.css`
- Modify: `lib/dados/facetas.ts`
- Modify: `app/globals.css` (dois comentários)
- Modify: `testes/numeros-e-busca.test.ts`, `testes/home.test.ts`, `testes/home-renderizada.test.ts`, `testes/molduras.test.ts`, `testes/noticias-da-home.test.ts`, `testes/rodape.test.ts`, `testes/facetas.test.ts`, `testes/porta-da-busca.test.ts`
- Create: `testes/sem-bairros.test.ts`

**Interfaces:**
- Consumes: `htmlDe` (Task 4), `GradeMedicos` (Task 3).
- Produces:

```ts
export function NumerosDaAmi(props: { anos: number; medicos: number; especialidades: number }): JSX.Element;
export function Parceiros(props: { parceiros: boolean }): JSX.Element | null; // <section id="parceiros" data-bloco="parceiros" data-faixa="">
// lib/dados/facetas.ts
export type ResumoFaceta = { especialidade: string; total: number; totalLocais: number; comMaisDeUmEndereco: number };
export function paragrafoDeAbertura(r: ResumoFaceta): string;
export function resumirFaceta(medicos: Medico[], especialidade: string): ResumoFaceta;
```

(`facetaEhIndexavel` e `MINIMO_PARA_INDEXAR` saem: depois da Task 5 e deste corte, ninguém os usa.)

- [ ] **Step 1: O teste de que os bairros saíram**

`testes/sem-bairros.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { Medico } from "@/lib/dados/tipos";
import { fonte } from "@/testes/apoio";
import { htmlDe } from "@/testes/renderizar";

/*
  Bairro saiu do site (spec, item 1.7). Continua só como parte do endereço do
  consultório, no perfil. Aqui, as duas páginas de diretório renderizadas de
  verdade, com dublês no lugar do banco: nenhuma lista de bairros, nenhum
  link para busca por bairro ou para especialidade por bairro; e o texto de
  abertura da especialidade sem bairro, telemedicina, acessibilidade nem
  associado.
*/

vi.mock("next/navigation", () => ({
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
  telemedicina: true,
  associadoAmi: true,
  especialidades: [{ nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true }],
  locais: [
    {
      id: 1,
      logradouro: "Rua Exemplo",
      numero: "1",
      bairro: { id: 1, nome: "Centro", slug: "centro" },
      telefone: "(99) 3000-0000",
      whatsapp: null,
      estacionamento: true,
      acessibilidade: ["acesso_cadeirante"],
    },
  ],
};

vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => [MEDICO] }));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [{ nome: "Cardiologia", slug: "cardiologia", total: 1 }],
  especialidadePorSlug: async () => ({ nome: "Cardiologia", slug: "cardiologia", oQueFaz: null, quandoProcurar: null }),
}));

const { default: PaginaMedicos } = await import("@/app/(site)/medicos/page");
const { default: PaginaEspecialidade } = await import("@/app/(site)/medicos/[especialidade]/page");

const MEDICOS = await htmlDe(await PaginaMedicos());
const ESPECIALIDADE = await htmlDe(
  await PaginaEspecialidade({
    params: Promise.resolve({ especialidade: "cardiologia" }),
    searchParams: Promise.resolve({}),
  }),
);

/* O texto que aparece, sem as tags e sem o JSON-LD (que não é tela). */
const tela = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");

describe("nenhum bairro nas páginas de diretório", () => {
  for (const [nome, html] of [
    ["/medicos", MEDICOS],
    ["/medicos/cardiologia", ESPECIALIDADE],
  ] as const) {
    it(`${nome}: nem lista, nem link de bairro`, () => {
      expect(html).not.toContain("por-bairro");
      expect(html).not.toContain("/busca?bairro");
      expect(html).not.toMatch(/href="\/medicos\/cardiologia\/[^"]+"/);
      expect(tela(html)).not.toMatch(/bairro/i);
    });
  }

  it("/medicos ainda tem o índice de especialidades (a página não quebrou)", () => {
    expect(MEDICOS).toContain('href="/medicos/cardiologia"');
  });
});

describe("o texto de abertura da especialidade", () => {
  it("sem telemedicina, acessibilidade nem associado", () => {
    for (const fora of ["telemedicina", "cadeirante", "acessibilidade", "associad", "Centro"]) {
      expect(tela(ESPECIALIDADE).toLowerCase(), fora).not.toContain(fora.toLowerCase());
    }
  });
});

describe("a camada de dados", () => {
  it("não conta mais bairros", () => {
    expect(fonte("../lib/dados/especialidades.ts")).not.toContain("bairrosComContagem");
  });
});
```

Atenção: a palavra "Centro" pode aparecer no cartão? Não: o cartão não mostra bairro (Task 3). Se `tela(ESPECIALIDADE)` tiver "Centro" por outro motivo (o texto institucional da página), investigue antes de mudar o teste.

- [ ] **Step 2: Os testes que travavam os bairros**

`testes/numeros-e-busca.test.ts`, no `describe("os numeros", …)` e no `describe("o CSS dos numeros", …)`:

- todo `createElement(NumerosDaAmi, { …, bairros: n })` perde o `bairros` (três lugares);
- "saem com o valor final": `for (const n of ["51", "24", "14"])`;
- "com os rotulos aprovados": `["anos de AMI", "médicos no diretório", "especialidades"]`;
- "cada numero com seu rotulo": tire `["8", "bairros atendidos"]`;
- "os quatro botoes…" vira "os tres botoes, com seus destinos, nesta ordem", sem `["Ver bairros", "/medicos#por-bairro"]`;
- "os icones…": `(["selo", "estetoscopio", "batimento"] as const)`;
- "o ano de fundacao vem de lib/ami.ts; os bairros nao sao escritos a mao" vira "o ano de fundacao vem de lib/ami.ts, e nenhum bairro aparece", com o corpo:

```ts
    expect(html).toContain(`Em atividade desde ${AMI.fundadaEm}, reunindo`);
    expect(html).not.toMatch(/bairro/i);
```

- "no singular": `toEqual(["anos de AMI", "médico no diretório", "especialidade"])`;
- CSS: "no computador, quatro colunas…" vira "três colunas" com `repeat\(3, 1fr\)`; troque "no tablet, dois por linha" por:

```ts
  it("no tablet, continuam tres por linha, com o fio entre eles", () => {
    expect(bloco(css, "@media (max-width: 980px)")).not.toMatch(/grid-template-columns/);
    expect(bloco(css, "@media (max-width: 980px)")).not.toMatch(/border-left:\s*0/);
  });
```

e acrescente ao "no celular…" (renomeado "no celular, tres cartoezinhos brancos, o terceiro na largura toda"):

```ts
    expect(regra(cel, ".numero:nth-child(3)")).toMatch(/grid-column:\s*1 \/ -1/);
```

`testes/home.test.ts`: em `ORDEM`, `"<BairrosEParceiros"` vira `"<Parceiros"`; no último `it`, a linha vira `expect(HOME).toContain("<Parceiros parceiros={molduras.parceiros}");`.

`testes/home-renderizada.test.ts`:

- apague `const CENTRO = …`, o campo `bairros` de `dados`, a linha `bairrosComContagem: async () => dados.bairros,` do dublê, o campo `bairros?` de `conteudo` e a linha `dados.bairros = conteudo.bairros ?? [CENTRO];`;
- `SEMPRE` perde `'data-bloco="bairros"'`;
- no primeiro `it`, troque as três últimas marcas por `'id="parceiros"', 'data-bloco="parceiros"', ">Logotipo a entrar</li>"`;
- no `it` do banner real: `html.indexOf('id="parceiros"')` no lugar de `html.indexOf('id="bairros"')`;
- em "a busca, Seja associado e bairros levam data-faixa, e só eles" (renomeie para "…e parceiros…"): `"bairros"` vira `"parceiros"` nas duas listas;
- na lista de `comRevelar`: `"bairros"` vira `"parceiros"`;
- troque os dois últimos `it` do arquivo por:

```ts
  it("na demonstração, a página termina na faixa dos parceiros", async () => {
    const html = await renderizarHome("true");
    expect(blocos(html).at(-1)).toEqual({ nome: "parceiros", faixa: true });
    expect(html.trimEnd().endsWith("</section></div>")).toBe(true);
  });

  it("fora da demonstração e sem notícia, termina em Seja associado, que é faixa", async () => {
    const html = await renderizarHome("false");
    expect(html).not.toContain('data-bloco="parceiros"');
    expect(blocos(html).at(-1)).toEqual({ nome: "associe", faixa: true });
  });

  it("fora da demonstração e com notícia, termina nas notícias, que não são faixa", async () => {
    const html = await renderizarHome("false", { noticias: [NOTICIA] });
    expect(blocos(html).at(-1)).toEqual({ nome: "noticias", faixa: false });
  });

  it("nenhum bairro na home, nos dois modos", async () => {
    for (const chave of ["true", "false"]) {
      expect(await renderizarHome(chave), chave).not.toMatch(/bairro/i);
    }
  });
```

`testes/molduras.test.ts`: o import vira `import { Parceiros } from "@/components/home/Parceiros";`; nos dois `createElement(BairrosEParceiros, { bairros: […], parceiros: X })` troque por `createElement(Parceiros, { parceiros: X })` (no `describe("a parte de empresas parceiras")`, `X` é `true`; em `home()`, é `m.parceiros`); no comentário de `home()`, "(dentro da faixa dos bairros)" sai.

`testes/noticias-da-home.test.ts`:

- imports: saem `LadrilhosBairros`, `estilosBairros`; `BairrosEParceiros` vira `import { Parceiros } from "@/components/home/Parceiros";` e `estilosFaixa` vem de `@/components/home/Parceiros.module.css`;
- o comentário do topo: "As notícias, os bairros e os parceiros da home" vira "As notícias e os parceiros da home";
- apague `const BAIRROS = …` e o `describe("os ladrilhos de bairro", …)`;
- troque o `describe("a faixa dos bairros e dos parceiros", …)` inteiro por:

```ts
describe("a faixa dos parceiros", () => {
  const com = renderToString(createElement(Parceiros, { parceiros: true }));

  it("é o bloco parceiros, faixa de ponta a ponta, nomeado pelo título, rótulo na coluna", () => {
    const secao = /^<section [^>]*>/.exec(com)?.[0] ?? "";
    expect(secao).toBe(
      `<section id="parceiros" data-bloco="parceiros" data-faixa="" aria-labelledby="parceiros-titulo" class="revelar ${estilosFaixa.faixa}">`,
    );
    expect(com).toMatch(/<span class="rotulo-secao" data-coluna="">Empresas parceiras da AMI<\/span>/);
    expect(com).toMatch(/<h2 [^>]*id="parceiros-titulo"[^>]*>Quem caminha com a AMI<\/h2>/);
  });

  it("seis 'Logotipo a entrar' depois do título", () => {
    const titulo = com.indexOf(">Quem caminha com a AMI</h2>");
    const espacos = [...com.matchAll(/<li class="([^"]+)">([^<]*)<\/li>/g)].map((m) => [m[1], m[2]]);
    expect(espacos).toEqual(Array(6).fill([estilosParceiros.logoVazio, "Logotipo a entrar"]));
    expect(com.indexOf(`<ul class="${estilosParceiros.parceiros}">`)).toBeGreaterThan(titulo);
  });

  it("não escreve nome de empresa nenhuma: o texto inteiro", () => {
    expect(visivel(com)).toEqual([
      "Empresas parceiras da AMI",
      "Quem caminha com a AMI",
      ...Array<string>(6).fill("Logotipo a entrar"),
    ]);
  });

  it("sem parceiros, a faixa não existe", () => {
    expect(renderToString(createElement(Parceiros, { parceiros: false }))).toBe("");
  });

  it("nenhum bairro", () => {
    expect(com).not.toMatch(/bairro/i);
  });
});
```

- no fim: `const CSS_BAIRROS = …` sai; `CSS_FAIXA` lê `../components/home/Parceiros.module.css`; o `describe("o CSS dos bairros e dos parceiros")` vira `describe("o CSS dos parceiros")`: no primeiro `it`, apague as duas linhas de `.separa`; apague os `it` "bairros em quatro colunas…" e "a nota tem uma linha só dela…"; no "nenhum hex", a lista vira `[CSS_NOTICIAS, CSS_FAIXA, CSS_PARCEIROS]`.

`testes/rodape.test.ts`: na lista de "os links das colunas", apague `["Bairros", "/busca"],`; em "as listas longas…", `expect(links(rodape)).toHaveLength(7 + AMI.telefones.length + 1 + 3);` e o comentário "8 nas colunas" vira "7 nas colunas".

`testes/facetas.test.ts` — substitua o arquivo inteiro por:

```ts
import { describe, expect, it } from "vitest";
import { paragrafoDeAbertura, resumirFaceta, type ResumoFaceta } from "@/lib/dados/facetas";
import type { Medico } from "@/lib/dados/tipos";

const base: ResumoFaceta = {
  especialidade: "Cardiologia",
  total: 7,
  totalLocais: 9,
  comMaisDeUmEndereco: 2,
};

describe("paragrafoDeAbertura", () => {
  it("traz os números reais, não redondos", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("7 cardiologistas");
    expect(p).toContain("9 endereços");
  });

  it("muda de conteúdo quando os dados mudam — não é molde com palavra trocada", () => {
    const outro = paragrafoDeAbertura({ ...base, especialidade: "Pediatria", total: 3, comMaisDeUmEndereco: 0 });
    expect(outro).not.toBe(paragrafoDeAbertura(base));
    expect(outro).toContain("Cada um atende em um endereço só");
  });

  it("não fala de bairro, telemedicina, acessibilidade nem associado", () => {
    /* Os quatro saíram do site em 03/10/2026 (spec de Encontre um médico,
       itens 1.2, 1.7 e 1.8). */
    for (const resumo of [base, { ...base, total: 1, totalLocais: 1, comMaisDeUmEndereco: 0 }]) {
      const p = paragrafoDeAbertura(resumo).toLowerCase();
      for (const fora of ["bairro", "telemedicina", "cadeirante", "acessibilidade", "associad"]) {
        expect(p, fora).not.toContain(fora);
      }
    }
  });

  it("concorda o singular, reescrevendo a frase", () => {
    const p = paragrafoDeAbertura({ ...base, total: 1, totalLocais: 1, comMaisDeUmEndereco: 0 });
    expect(p).toContain("1 cardiologista ");
    expect(p).not.toContain("1 cardiologistas");
    expect(p).toContain("um único endereço de atendimento");
    expect(p).toContain("O atendimento acontece em um endereço só");
  });

  it("no singular, nenhuma frase usa partitivo plural", () => {
    const p = paragrafoDeAbertura({ ...base, total: 1, totalLocais: 2, comMaisDeUmEndereco: 1 });
    for (const partitivo of ["Desses,", "deles", "Entre eles", "Cada um"]) {
      expect(p).not.toContain(partitivo);
    }
    expect(p).toContain("O atendimento acontece em mais de um endereço");
  });

  it("no plural, mantém os partitivos e concorda", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("Entre eles, 2 atendem em mais de um endereço");
    expect(paragrafoDeAbertura({ ...base, comMaisDeUmEndereco: 1 })).toContain("1 atende em mais");
  });

  it("termina com o CRM, como exige a Resolução CFM 2.336/2023", () => {
    expect(paragrafoDeAbertura(base)).toMatch(/Conselho Regional de Medicina, como exige a Resolução CFM 2\.336\/2023\.$/);
  });

  /* Começar frase com algarismo é uma das marcas mais visíveis de texto
     gerado, e em português corrido não se faz. */
  it("nenhuma frase começa com algarismo", () => {
    for (const resumo of [base, { ...base, total: 1, totalLocais: 1, comMaisDeUmEndereco: 0 }]) {
      for (const f of paragrafoDeAbertura(resumo).split(/(?<=\.)\s+/)) {
        expect(f.trimStart()).not.toMatch(/^\d/);
      }
    }
  });
});

describe("resumirFaceta", () => {
  const local = (id: number) => ({
    id,
    logradouro: "Rua A",
    numero: "1",
    bairro: { id: 1, nome: "Centro", slug: "centro" },
    telefone: null,
    whatsapp: null,
    estacionamento: false,
    acessibilidade: [],
  });
  const medico = (id: number, locais: number[]): Medico => ({
    id,
    slug: `m${id}`,
    nome: `M ${id}`,
    crm: "1",
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [],
    locais: locais.map(local),
  });

  it("conta profissionais, endereços distintos e quem tem mais de um", () => {
    /* O consultório 2 é compartilhado: conta uma vez. */
    const r = resumirFaceta([medico(1, [1, 2]), medico(2, [2]), medico(3, [3])], "Cardiologia");
    expect(r).toEqual({ especialidade: "Cardiologia", total: 3, totalLocais: 3, comMaisDeUmEndereco: 1 });
  });
});
```

`testes/porta-da-busca.test.ts`: no dublê de `@/lib/dados/especialidades`, apague a linha `bairrosComContagem: …`.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run`
Expected: FAIL nos arquivos acima (as fontes ainda têm bairros, quatro números, `BairrosEParceiros`, o parágrafo longo).

- [ ] **Step 4: Os números**

`components/home/NumerosDaAmi.tsx`: o comentário do topo, "os das especialidades e dos bairros, que no desenho nomeavam especialidades e bairros," vira "o das especialidades, que no desenho nomeava especialidades,"; acrescente ao fim do comentário: "São três: o quarto, bairros atendidos, saiu do site junto com os bairros (03/10/2026)."; a prop `bairros` sai da desestruturação e do tipo; o quarto item (`icone: "mapa"`) sai da lista.

`components/home/NumerosDaAmi.module.css`:

- `.numeros`: `grid-template-columns: repeat(3, 1fr);`
- troque o bloco `@media (max-width: 980px)` inteiro por:

```css
/* Tablet: continuam três por linha, com o fio entre eles; só a margem
   interna encolhe. */
@media (max-width: 980px) {
  .numero,
  .numero:first-child,
  .numero:last-child {
    padding: 32px var(--m);
  }
}
```

- no bloco `@media (max-width: 700px)`: o comentário vira "Celular: três cartõezinhos brancos, sem texto de apoio e sem botão; dois na primeira linha e o terceiro na largura toda (três lado a lado não cabem "especialidades" a 375px)."; apague a regra `.numero:nth-child(n + 3) { border-top: 0; }`; acrescente depois da regra dos cartões (com `:nth-child(3)`, e não `:last-child`, que já começa uma linha do grupo de seletores dos cartões e confundiria a leitura do CSS nos testes):

```css
  .numero:nth-child(3) {
    grid-column: 1 / -1;
  }
```

- no comentário do topo do arquivo, "quatro colunas" → "três colunas" se aparecer, e "e os @media de 980 e 700px" fica.

- [ ] **Step 5: Os parceiros**

```bash
git mv components/home/BairrosEParceiros.tsx components/home/Parceiros.tsx
git mv components/home/BairrosEParceiros.module.css components/home/Parceiros.module.css
```

`components/home/Parceiros.tsx` (conteúdo inteiro):

```tsx
import { EmpresasParceiras } from "@/components/home/EmpresasParceiras";
import styles from "@/components/home/Parceiros.module.css";

/*
  "Quem caminha com a AMI": a faixa branca de ponta a ponta que fecha a home
  (docs/desenho-aprovado/home-aprovada.html, `#bairros`, só a parte dos
  parceiros: os bairros saíram do site em 03/10/2026).

  A margem lateral é `--borda-faixa` (app/globals.css), a mesma da busca
  verde, de "Seja associado" e do rodapé. Não há margem embaixo: a faixa
  leva `data-faixa`, e o rodapé emenda nela quando ela fecha a página
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.

  `parceiros` vem de `moldurasDaHome` (lib/molduras.ts): só no modo
  demonstração, porque hoje a parte inteira é provisória. Sem ela, a faixa
  não existe.
*/
export function Parceiros({ parceiros }: { parceiros: boolean }) {
  if (!parceiros) return null;

  return (
    <section
      id="parceiros"
      data-bloco="parceiros"
      data-faixa=""
      aria-labelledby="parceiros-titulo"
      className={`revelar ${styles.faixa}`}
    >
      <div className={styles.cabSecao}>
        <span className="rotulo-secao" data-coluna="">
          Empresas parceiras da AMI
        </span>
        <h2 id="parceiros-titulo" className={styles.titulo}>
          Quem caminha com a AMI
        </h2>
      </div>
      <EmpresasParceiras />
    </section>
  );
}
```

`components/home/Parceiros.module.css`: apague a regra `.separa` e a de dentro do `@media (max-width: 980px)`; no comentário do topo, "A faixa branca dos bairros e dos parceiros" vira "A faixa branca dos parceiros", e "`.separa`, " e "A grade dos bairros é de components/diretorio/LadrilhosBairros.module.css; a" saem (fica "A grade dos parceiros é de components/home/EmpresasParceiras.module.css.").

`components/home/EmpresasParceiras.tsx`: "O título e o rótulo da parte são de `BairrosEParceiros`, que monta esta grade dentro da faixa branca." vira "O título e o rótulo são de `Parceiros`, que monta esta grade na faixa branca."
`lib/molduras.ts`: `/** A parte "Empresas parceiras da AMI" da faixa dos bairros. */` vira `/** A faixa "Empresas parceiras da AMI", no fim da home. */`.

- [ ] **Step 6: A home**

`app/(site)/page.tsx`:

- import: `import { Parceiros } from "@/components/home/Parceiros";` no lugar de `BairrosEParceiros`; `import { especialidadesComContagem } from "@/lib/dados/especialidades";` (sem `bairrosComContagem`);
- `generateMetadata`: `` `Imperatriz - MA. Busque por nome ou especialidade.` `` no lugar de `` `Imperatriz - MA. Filtre por especialidade e bairro.` ``;
- em `Home`: `const [especialidades, total, banners, noticias] = await Promise.all([especialidadesComContagem(), buscarMedicos().then((m) => m.length), bannersAtivos(), listarNoticias(1)]);`;
- `<NumerosDaAmi anos={anosDeAmi(new Date())} medicos={total} especialidades={especialidades.length} />`;
- `<Parceiros parceiros={molduras.parceiros} />` no lugar de `<BairrosEParceiros …/>`;
- comentário da função: "notícias, bairros e parceiros" → "notícias e parceiros"; "(a busca, "Seja associado", bairros, as três com `data-faixa`)" → "(a busca, "Seja associado" e os parceiros, as três com `data-faixa`)".

`app/(site)/inicio.module.css`, comentário do topo: "os bairros sem bairro" → "os parceiros fora da demonstração".

- [ ] **Step 7: O rodapé e a Cabeceira**

`components/layout/Rodape.tsx`: apague `<Link href="/busca">Bairros</Link>`; troque o parágrafo do comentário "As listas de todas as especialidades e de todos os bairros saíram daqui, … onde os bairros são pílulas." por:

```
  A lista de todas as especialidades saiu daqui, como no desenho aprovado: o
  rodapé ficaria uma parede de texto. "Especialidades" leva ao índice
  `/medicos`. Os bairros saíram do site em 03/10/2026, e com eles o link
  "Bairros".
```

`components/layout/Rodape.module.css`, no comentário da regra do `:has`: "(a busca verde, "Seja associado" e bairros e parceiros, na home)" → "(a busca verde, "Seja associado" e os parceiros, na home)"; "(a home fora da demonstração e sem bairro no banco, em que `BairrosEParceiros` devolve `null`)" → "(a home fora da demonstração, em que `Parceiros` devolve `null`)".

`components/layout/Cabeceira.tsx`, segundo parágrafo do comentário: "(a busca verde, "Seja associado", bairros e parceiros)" → "(a busca verde, "Seja associado", os parceiros)".

- [ ] **Step 8: `/medicos` e a especialidade**

`app/(site)/medicos/page.tsx`: tire o import de `LadrilhosBairros` e `bairrosComContagem`; `const [especialidades, total] = await Promise.all([especialidadesComContagem(), buscarMedicos().then((m) => m.length)]);`; apague a `<section aria-labelledby="titulo-por-bairro" id="por-bairro" …>` inteira; na seção "Por especialidade", `className="revelar pb-4 pt-12"` vira `className="revelar pb-20 pt-12"`.

`app/(site)/medicos/[especialidade]/page.tsx`:

- imports: saem `LadrilhosBairros`, `bairrosComContagem`, `MINIMO_PARA_INDEXAR` e `facetaEhIndexavel` (de `facetas` ficam `paragrafoDeAbertura` e `resumirFaceta`);
- `const [todosDaEspecialidade, relacionadas] = await Promise.all([buscarMedicos({ especialidade }), especialidadesComContagem()]);`;
- na seção `links-internos`: apague `<h3>{esp.nome} por bairro</h3>` e o `<div className="mt-5"><LadrilhosBairros … /></div>` inteiro; `<h3 className="mt-10">Outras especialidades</h3>` vira `<h3>Outras especialidades</h3>`;
- o `generateMetadata` fica como está (decisão D4).

- [ ] **Step 9: A camada de dados e o texto de abertura**

`lib/dados/especialidades.ts` (BOM): apague `bairrosComContagem` com o comentário dela. Apague `components/diretorio/LadrilhosBairros.tsx` e `components/diretorio/LadrilhosBairros.module.css`.

`lib/dados/facetas.ts` (conteúdo inteiro):

```ts
import { comoProfissional } from "@/lib/dados/sinonimos";
import type { Medico } from "@/lib/dados/tipos";

export type ResumoFaceta = {
  especialidade: string;
  /** Profissionais distintos. */
  total: number;
  /** Endereços distintos, que é sempre >= total quando alguém tem dois. */
  totalLocais: number;
  /** Quantos atendem em mais de um endereço. */
  comMaisDeUmEndereco: number;
};

/**
 * Parágrafo de abertura da página de especialidade.
 *
 * Gerado a partir dos dados reais: quantos profissionais, em quantos
 * endereços, e quantos atendem em mais de um. Nunca um texto-modelo com a
 * palavra trocada — é exatamente isso que o Google classifica como conteúdo
 * raso.
 *
 * Bairro, telemedicina, acessibilidade e associados não entram: saíram do
 * site em 03/10/2026.
 *
 * Nenhuma frase começa com algarismo: em texto corrido em português isso não
 * se faz, e é um dos sinais mais visíveis de texto gerado.
 */
export function paragrafoDeAbertura(r: ResumoFaceta): string {
  const [sing, plur] = comoProfissional(r.especialidade);
  const nomeProf = r.total === 1 ? sing : plur;

  /* Com um profissional só, todo partitivo plural — "deles", "entre eles",
     "cada um" — passa a se referir a um grupo de uma pessoa, o que soa
     errado. Por isso o singular reescreve a frase inteira em vez de trocar
     a palavra. */
  const umSo = r.total === 1;

  const frases: string[] = [];

  frases.push(
    `A Associação Médica de Imperatriz reúne ${r.total} ${nomeProf} ` +
      `em Imperatriz, no Maranhão, ` +
      (r.totalLocais === 1
        ? `com um único endereço de atendimento.`
        : `somando ${r.totalLocais} endereços de atendimento.`),
  );

  if (r.comMaisDeUmEndereco > 0) {
    frases.push(
      umSo
        ? `O atendimento acontece em mais de um endereço, o que costuma ` +
            `ampliar as opções de local de atendimento.`
        : `Entre eles, ${r.comMaisDeUmEndereco} ` +
            `${r.comMaisDeUmEndereco === 1 ? "atende" : "atendem"} em mais de ` +
            `um endereço, o que costuma ampliar as opções de local de atendimento.`,
    );
  } else {
    frases.push(
      umSo
        ? `O atendimento acontece em um endereço só, sem alternativa de local.`
        : `Cada um atende em um endereço só, sem alternativa de local.`,
    );
  }

  /* Fecho comum a toda página de especialidade. Sem "abaixo": o cartão da
     grade mostra o CRM e o "Ligar", e o endereço e o telefone estão no
     perfil, a um toque. */
  frases.push(
    `Cada perfil traz endereço, telefone e o número de registro no ` +
      `Conselho Regional de Medicina, como exige a Resolução CFM 2.336/2023.`,
  );

  return frases.join(" ");
}

/** Monta o resumo a partir da lista da especialidade. */
export function resumirFaceta(medicos: Medico[], especialidade: string): ResumoFaceta {
  /* Conjunto, não contador: o mesmo endereço compartilhado por dois médicos
     conta como um endereço. */
  const locais = new Set<number>();
  for (const m of medicos) {
    for (const l of m.locais) locais.add(l.id);
  }

  return {
    especialidade,
    total: medicos.length,
    totalLocais: locais.size,
    comMaisDeUmEndereco: medicos.filter((m) => m.locais.length > 1).length,
  };
}
```

O fecho perdeu o "abaixo" de propósito: o texto antigo ("Cada perfil abaixo traz endereço, telefone…") descrevia a linha de resultado de antes, que mostrava bairro e telefone; o cartão novo não mostra.

`app/globals.css` (comentários): no comentário de `--color-ami-green-800`, apague "do nome do bairro (components/diretorio/LadrilhosBairros.module.css),"; no comentário de `main [id]`, "(`#encontre`, `#por-bairro`, `#sua-ami`)" vira "(`#encontre`, `#sua-ami`)".

- [ ] **Step 10: A varredura**

`grep -rn -i "bairro" app components lib --include=*.ts --include=*.tsx --include=*.css`. O que pode sobrar, e só isto:
- o tipo `Bairro`, `LocalAtendimento.bairro` e a seleção em `lib/dados/` (domínio);
- `lib/encontre.ts` (`enderecoDoLocal`: o bairro no endereço);
- `lib/seo/` (`descricaoEspecialidade`, `descricaoMedico`, `noBairro`: metadados, decisão D4) e `lib/seo/jsonld.ts` não usa bairro;
- `app/(site)/medicos/[especialidade]/page.tsx` e `app/(site)/medico/[slug]/page.tsx` no `generateMetadata` (decisão D4);
- `app/(site)/medico/[slug]/page.tsx` no corpo (até a Task 7, que o reescreve: aí só no endereço e no título do consultório);
- o rodapé (`AMI.endereco.bairro`: o endereço da AMI);
- `next.config.ts` (o redirecionamento);
- `lib/painel/`, `app/painel/`, `components/painel/`, `lib/importador/` (o painel e o importador continuam editando bairro);
- comentários que dizem que os bairros saíram.
Qualquer outra ocorrência é defeito desta tarefa.

- [ ] **Step 11: Rodar tudo, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.
Mutações: devolver o quarto número; devolver `<Link href="/busca">Bairros</Link>`; devolver a frase de telemedicina ao parágrafo; tirar o `grid-column: 1 / -1`; tirar `data-faixa` dos parceiros. Cada uma deixa um teste vermelho.
Abra `/`, `/medicos` e uma especialidade no servidor da porta 3000 (só leitura), a 1440, 768 e 390px: os números em três colunas no computador e no tablet, e dois mais um no celular, sem nada vazando.

```bash
git add components/home/NumerosDaAmi.tsx components/home/NumerosDaAmi.module.css components/home/Parceiros.tsx components/home/Parceiros.module.css components/home/BairrosEParceiros.tsx components/home/BairrosEParceiros.module.css components/home/EmpresasParceiras.tsx lib/molduras.ts "app/(site)/page.tsx" "app/(site)/inicio.module.css" components/layout/Rodape.tsx components/layout/Rodape.module.css components/layout/Cabeceira.tsx "app/(site)/medicos/page.tsx" "app/(site)/medicos/[especialidade]/page.tsx" lib/dados/especialidades.ts components/diretorio/LadrilhosBairros.tsx components/diretorio/LadrilhosBairros.module.css lib/dados/facetas.ts app/globals.css testes/numeros-e-busca.test.ts testes/home.test.ts testes/home-renderizada.test.ts testes/molduras.test.ts testes/noticias-da-home.test.ts testes/rodape.test.ts testes/facetas.test.ts testes/porta-da-busca.test.ts testes/sem-bairros.test.ts
git commit -m "Bairros fora do site: home com tres numeros e so parceiros, rodape, diretorio e texto de abertura"
```

---

### Task 7: A página do médico

**Files:**
- Create: `components/perfil/TopoDoPerfil.tsx`, `components/perfil/OndeAtende.tsx`, `components/perfil/Perfil.module.css`
- Modify: `app/(site)/medico/[slug]/page.tsx` (reescrita)
- Modify: `app/globals.css` (`.botao-contorno`)
- Delete: `components/diretorio/LinhaMedico.tsx`, `components/base/Chip.tsx`
- Modify: `components/editorial/LinhaNoticia.tsx`, `lib/dados/medicos.ts` (comentários que citam `LinhaMedico`)
- Modify: `testes/telefone.test.ts`, `testes/base-visual.test.ts`, `testes/paleta.test.ts` (comentário)
- Create: `testes/perfil.test.ts`

**Interfaces:**
- Consumes: `FotoDoMedico`, `GradeMedicos` (Task 3); `especialidadePrincipal`, `consultorioPrincipal`, `enderecoDoLocal`, `linkDoMapa`, `linkDoWhatsapp`, `outrosMedicos`, `paragrafosDaBio` (Task 2); `htmlDe` (Task 4); `.pagina` de `app/(site)/encontre.module.css` (Task 4); ícones `telefone`, `whatsapp`, `comoChegar`, `voltar`, `seta`.
- Produces:

```ts
// components/perfil/TopoDoPerfil.tsx
export const SIZES_DO_PERFIL: string;
export function TopoDoPerfil(props: { medico: Medico }): JSX.Element; // <section data-bloco="perfil">
// components/perfil/OndeAtende.tsx
export function OndeAtende(props: { locais: LocalAtendimento[] }): JSX.Element; // <section id="onde-atende" data-bloco="onde-atende">
// app/globals.css
.botao-contorno // pílula branca de 48px com borda, para WhatsApp e Como chegar
```

- O `div` dos botões do topo tem a classe `acoes` de `Perfil.module.css` (a Task 8 acrescenta `data-acoes-do-medico` nele).

- [ ] **Step 1: Os testes do perfil**

`testes/perfil.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import estilos from "@/components/perfil/Perfil.module.css";
import { SIZES_DO_PERFIL } from "@/components/perfil/TopoDoPerfil";
import type { LocalAtendimento, Medico } from "@/lib/dados/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  O perfil de verdade, renderizado: app/(site)/medico/[slug]/page.tsx com a
  camada de dados trocada por um dublê.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NAO_ENCONTRADO");
  },
  usePathname: () => "/medico/aline-peixoto",
  useRouter: () => ({ push: () => {} }),
}));

const dados = vi.hoisted(() => ({ todos: [] as Medico[] }));
vi.mock("@/lib/dados/medicos", () => ({
  medicoPorSlug: async (slug: string) => dados.todos.find((m) => m.slug === slug) ?? null,
  buscarMedicos: async () => dados.todos,
  slugsDeMedicos: async () => dados.todos.map((m) => m.slug),
}));

const { default: PaginaPerfil } = await import("@/app/(site)/medico/[slug]/page");

function local(id: number, bairro: string, logradouro: string, numero: string, telefone: string | null): LocalAtendimento {
  return {
    id,
    logradouro,
    numero,
    bairro: { id, nome: bairro, slug: bairro.toLowerCase() },
    telefone,
    whatsapp: telefone,
    estacionamento: true,
    acessibilidade: ["acesso_cadeirante"],
  };
}

const ALINE: Medico = {
  id: 1,
  slug: "aline-peixoto",
  nome: "Aline Peixoto",
  crm: "11918",
  crmUf: "MA",
  foto: null,
  bio: "Aline Peixoto é médica, com registro de especialista em Neurologia.\n\nAs consultas são marcadas por telefone.",
  telemedicina: true,
  associadoAmi: true,
  especialidades: [{ nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true }],
  locais: [
    local(1, "Nova Imperatriz", "Rua Projetada 114", "198", "(99) 3018-9994"),
    local(2, "Juçara", "Rua Projetada 117", "219", "(99) 3023-0707"),
  ],
};

const CRISTINA: Medico = {
  ...ALINE,
  id: 2,
  slug: "cristina-bezerra",
  nome: "Cristina Bezerra",
  bio: null,
  locais: [local(3, "Centro", "Rua A", "1", "(99) 3027-1420")],
};

const BRUNO: Medico = {
  ...CRISTINA,
  id: 3,
  slug: "bruno-cavalcante",
  nome: "Bruno Cavalcante",
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true },
    { nome: "Neurologia", slug: "neurologia", rqe: null, principal: false },
  ],
};

async function perfil(medico: Medico = ALINE, outros: Medico[] = [CRISTINA, BRUNO]) {
  dados.todos = [medico, ...outros];
  return htmlDe(await PaginaPerfil({ params: Promise.resolve({ slug: medico.slug }) }));
}

/* O texto da tela, sem o JSON-LD e sem as tags; todo espaço (o sem quebra
   também) vira um espaço só. */
const tela = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const trecho = (html: string, marca: string) => {
  const ini = html.indexOf(marca);
  expect(ini, `falta ${marca}`).toBeGreaterThan(-1);
  return html.slice(ini);
};

describe("o topo do perfil", () => {
  it("um h1 com o nome, e nada da Cabeceira nem do breadcrumb", async () => {
    const html = await perfil();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`<h1 id="perfil-nome" class="${estilos.nome}">Aline Peixoto</h1>`));
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
  });

  it("o rótulo é o link de volta para a busca", async () => {
    const html = await perfil();
    expect(html).toMatch(/<a [^>]*href="\/busca"[^>]*>.*?Encontre um médico<\/a>/);
  });

  it("MÉDICO · CRM e a especialidade com RQE", async () => {
    const t = tela(await perfil());
    expect(t).toContain("MÉDICO · CRM/MA 11918");
    expect(t).toContain("Neurologia RQE 12222");
    expect(await perfil()).toContain("RQE 12222");
  });

  it("Ligar e WhatsApp do consultório principal", async () => {
    const topo = trecho(await perfil(), 'data-bloco="perfil"');
    const acoes = topo.slice(topo.indexOf(`class="${estilos.acoes}"`), topo.indexOf("</div>", topo.indexOf(`class="${estilos.acoes}"`)));
    expect(acoes).toMatch(/<a class="botao" href="tel:\+559930189994" aria-label="Ligar para Aline Peixoto, \(99\) 3018-9994">/);
    expect(acoes).toMatch(/<a class="botao-contorno" href="https:\/\/wa\.me\/559930189994" aria-label="WhatsApp de Aline Peixoto">/);
  });

  it("a linha do consultório: bairro, telefone e 'ver os N endereços' para #onde-atende", async () => {
    const html = await perfil();
    const linha = trecho(html, `class="${estilos.linhaDoConsultorio}"`);
    expect(tela(linha.slice(0, linha.indexOf("</p>")))).toContain(
      "Consultório em Nova Imperatriz · (99) 3018-9994 · ver os 2 endereços",
    );
    expect(linha).toContain('<a href="#onde-atende">');
  });

  it("um consultório só: sem 'ver os endereços'", async () => {
    const html = await perfil({ ...ALINE, locais: [ALINE.locais[0]] });
    expect(html).not.toContain("ver os");
  });

  it("consultório principal sem telefone: só o WhatsApp no topo, e a linha sem número", async () => {
    const semTel = { ...ALINE.locais[0], telefone: null };
    const html = await perfil({ ...ALINE, locais: [semTel] });
    const topo = trecho(html, 'data-bloco="perfil"');
    expect(topo.slice(0, topo.indexOf("</section>"))).not.toContain("tel:");
    expect(topo).toContain("https://wa.me/559930189994");
    expect(tela(html)).toContain("Consultório em Nova Imperatriz");
  });

  it("sem consultório: sem botões no topo e sem a linha", async () => {
    const html = await perfil({ ...ALINE, locais: [] });
    expect(html).not.toContain(`class="${estilos.acoes}"`);
    expect(html).not.toContain(`class="${estilos.linhaDoConsultorio}"`);
  });

  it("sem foto, as iniciais; com foto, o retrato com prioridade e o sizes do desenho", async () => {
    expect(await perfil()).toMatch(/>AP<\/span>/);
    const html = await perfil({ ...ALINE, foto: "https://exemplo.test/aline.jpg" });
    const img = /<img [^>]*>/.exec(trecho(html, 'data-bloco="perfil"'))![0];
    expect(img).toContain('alt="Retrato de Aline Peixoto"');
    expect(img).toContain('fetchpriority="high"');
    expect(img).toContain(`sizes="${SIZES_DO_PERFIL}"`);
  });
});

describe("onde atende", () => {
  it("um cartão por consultório: bairro, endereço, telefone e os três botões", async () => {
    const html = await perfil();
    const secao = trecho(html, 'id="onde-atende"');
    expect(secao.match(/<article /g)).toHaveLength(2);
    expect(tela(secao)).toContain("Nova Imperatriz Rua Projetada 114, 198 Nova Imperatriz, Imperatriz – MA (99) 3018-9994");
    expect(secao).toContain('aria-label="Ligar para o consultório de Nova Imperatriz"');
    expect(secao).toContain('aria-label="WhatsApp do consultório de Juçara"');
    expect(secao).toContain(
      'href="https://www.google.com/maps/search/?api=1&amp;query=Rua%20Projetada%20114%2C%20198%2C%20Nova%20Imperatriz%2C%20Imperatriz%20%E2%80%93%20MA"',
    );
    expect(secao).toContain('aria-label="Como chegar ao consultório de Juçara (abre o mapa)"');
  });

  it("consultório sem WhatsApp e sem telefone: só o Como chegar", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: null, whatsapp: null }] });
    const secao = trecho(html, 'id="onde-atende"');
    expect(secao).not.toContain("Ligar para o consultório");
    expect(secao).not.toContain("WhatsApp do consultório");
    expect(secao).toContain("Como chegar ao consultório");
  });
});

describe("sobre, outros médicos e a nota", () => {
  it("Sobre: um parágrafo por bloco da biografia", async () => {
    const secao = trecho(await perfil(), 'data-bloco="sobre"');
    expect(secao.slice(0, secao.indexOf("</section>")).match(/<p>/g)).toHaveLength(2);
  });

  it("biografia vazia: sem Sobre", async () => {
    expect(await perfil({ ...ALINE, bio: null })).not.toContain('data-bloco="sobre"');
    expect(await perfil({ ...ALINE, bio: "  " })).not.toContain('data-bloco="sobre"');
  });

  it("outros médicos da mesma especialidade principal, com o link para todos", async () => {
    const html = await perfil();
    const secao = trecho(html, 'data-bloco="outros"');
    expect(secao).toContain(">Outros médicos de Neurologia</h2>");
    expect(secao).toMatch(/<a class="botao-linha" href="\/medicos\/neurologia">Ver todos de Neurologia/);
    expect(secao).toContain('href="/medico/cristina-bezerra"');
    expect(secao).not.toContain('href="/medico/bruno-cavalcante"');
  });

  it("sem outros médicos: sem a seção", async () => {
    expect(await perfil(ALINE, [BRUNO])).not.toContain('data-bloco="outros"');
  });

  it("a nota final", async () => {
    expect(tela(await perfil())).toContain(
      "As informações desta página são fornecidas pelo profissional e revisadas pela Associação Médica de Imperatriz. Conteúdo informativo; não substitui a consulta médica.",
    );
  });

  it("os blocos, nesta ordem", async () => {
    const blocos = [...(await perfil()).matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);
    expect(blocos).toEqual(["perfil", "onde-atende", "sobre", "outros", "nota"]);
  });
});

describe("o que fica e o que saiu", () => {
  it("o JSON-LD do médico e da trilha continuam", async () => {
    const html = await perfil();
    expect(html).toContain('"@type":"Physician"');
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  it("nada de selo, telemedicina, acessibilidade ou estacionamento na tela", async () => {
    const t = tela(await perfil()).toLowerCase();
    for (const fora of ["associado ami", "telemedicina", "cadeirante", "estacionamento", "acessibilidade"]) {
      expect(t, fora).not.toContain(fora);
    }
  });

  it("slug que não existe: 404", async () => {
    dados.todos = [ALINE];
    await expect(PaginaPerfil({ params: Promise.resolve({ slug: "ninguem" }) })).rejects.toThrow("NAO_ENCONTRADO");
  });
});

describe("o CSS do perfil", () => {
  const css = semNotas(fonte("../components/perfil/Perfil.module.css"));
  const global = semNotas(fonte("../app/globals.css"));

  it("foto de 460px ao lado do texto; .85fr no tablet; em cima, na largura toda, no celular", () => {
    expect(regra(base(css), ".topo")).toMatch(/grid-template-columns: minmax\(0, 460px\) minmax\(0, 1fr\)/);
    expect(regra(base(css), ".topo")).toMatch(/gap: 64px/);
    expect(regra(base(css), ".foto")).toMatch(/aspect-ratio: 4 \/ 5/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".topo")).toMatch(/minmax\(0, 0?\.85fr\) minmax\(0, 1fr\)/);
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".topo")).toMatch(/grid-template-columns: 1fr/);
    expect(regra(cel, ".topo")).toMatch(/padding: 0/);
    expect(regra(cel, ".texto")).toMatch(/padding: 0 var\(--m\)/);
  });

  it("consultórios dois por linha, um abaixo de 1180px; no celular, Ligar na largura toda e os outros dois lado a lado", () => {
    expect(regra(base(css), ".consultorios")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".consultorios")).toMatch(/grid-template-columns: 1fr/);
    expect(regra(base(css), ".acoesDoConsultorio")).toMatch(/margin-top: auto/);
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".acoesDoConsultorio")).toMatch(/grid-template-columns: 1fr 1fr/);
    expect(regra(cel, ".acoesDoConsultorio > :global(.botao)")).toMatch(/grid-column: 1 \/ -1/);
  });

  it("os botões do topo meio a meio no celular, e um só na largura toda", () => {
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".acoes")).toMatch(/grid-template-columns: 1fr 1fr/);
    expect(regra(cel, ".acoes > a:only-child")).toMatch(/grid-column: 1 \/ -1/);
  });

  it("a nota tem um fio fino em cima, e a leitura uma medida de 40em", () => {
    expect(regra(base(css), ".notaFinal")).toMatch(/border-top: 1px solid var\(--color-line-strong\)/);
    expect(regra(base(css), ".leitura")).toMatch(/max-width: calc\(40em \+ 2 \* var\(--m\)\)/);
  });

  it(".botao-contorno: pílula branca de 48px, borda que escurece no mouse, sem verde claro", () => {
    expect(regra(global, ".botao-contorno")).toMatch(/height: 48px/);
    expect(regra(global, ".botao-contorno:hover")).toMatch(/border-color: #B9BFC8/);
    expect(regra(global, ".botao-contorno:hover")).not.toMatch(/lima|green/);
  });
});
```

`regra(global, ".botao-contorno")` acha a regra porque em `app/globals.css` ela começa a linha depois do recuo (a função aceita espaço antes do seletor).

E `testes/base-visual.test.ts`, no `it("existem as pecas que as secoes usam")`, acrescente `".botao-contorno"` à lista. `testes/telefone.test.ts`, na lista de "a varredura enxerga…": troque `"components/diretorio/LinhaMedico.tsx",` por `"components/diretorio/CartaoMedico.tsx",` e acrescente `"components/perfil/OndeAtende.tsx",`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/perfil.test.ts testes/base-visual.test.ts testes/telefone.test.ts`
Expected: FAIL.

- [ ] **Step 3: O botão de contorno**

Em `app/globals.css`, `@layer components`, logo depois das regras do `.botao-linha` (de `.botao-contorno`, `.botao-contorno:hover`, `.botao-contorno i` do desenho):

```css
  /* Botão de contorno: pílula branca de 48px, na altura do `.botao`, para
     WhatsApp e Como chegar ao lado do "Ligar" (o `.botao-linha` tem 38px).
     No mouse, a borda escurece e o botão sobe 1px; não fica verde. #B9BFC8
     é a borda escura do desenho e só existe aqui. */
  .botao-contorno {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 48px;
    padding: 0 24px;
    border: 1px solid var(--color-line-strong);
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-ami-green-800);
    font-family: var(--font-corpo);
    font-size: 14.5px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    transition:
      border-color 250ms var(--ease-resposta),
      box-shadow 250ms var(--ease-resposta),
      transform 250ms var(--ease-resposta);
  }

  .botao-contorno:hover {
    border-color: #B9BFC8;
    box-shadow: 0 6px 16px rgba(12, 14, 18, 0.08);
    transform: translateY(-1px);
  }

  .botao-contorno svg {
    width: 18px;
    height: 18px;
    flex: none;
  }
```

- [ ] **Step 4: O CSS do perfil**

`components/perfil/Perfil.module.css`:

```css
/*
  O perfil do médico, transcrito do desenho aprovado
  (docs/desenho-aprovado/encontre/perfil.html: `.perfil-topo`,
  `.perfil-foto`, `.volta`, `.perfil-texto h1`, `.perfil-crm`,
  `.perfil-esp`, `.perfil-acoes`, `.perfil-consultorio`, `.perfil h2`,
  `.cab-secao` da home na versão `.aberta`, `.consultorios`, `.consultorio`,
  `.consultorio-acoes`, `.leitura`, `.nota-final`, e os @media de 1180, 980
  e 700px). A foto e as iniciais são de
  components/diretorio/FotoDoMedico.module.css; aqui só o espaço dela.

  A coluna e o espaço entre os blocos são de app/(site)/encontre.module.css.
  O texto de cada bloco começa a `--m` da borda do bloco, na mesma linha do
  logotipo e do rodapé; os cartões dos consultórios vão de borda a borda da
  coluna, como o painel do cabeçalho.
*/

.topo {
  display: grid;
  grid-template-columns: minmax(0, 460px) minmax(0, 1fr);
  gap: 64px;
  align-items: center;
  padding: 0 var(--m);
}

.foto {
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-painel);
  box-shadow: var(--shadow-erguido);
  --tamanho-iniciais: 160px;
}

.texto {
  min-width: 0;
}

.volta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.volta svg {
  width: 15px;
  height: 15px;
  transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.volta:hover svg {
  transform: translateX(-3px);
}

.nome {
  margin-top: 14px;
  font-size: clamp(44px, 5vw, 68px);
  line-height: 1;
  max-width: 12ch;
}

.crm {
  margin-top: 20px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-400);
}

.esp {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-ink-900);
}

.rqe {
  white-space: nowrap;
  font-weight: 500;
  font-size: 16px;
  color: var(--color-ink-400);
  margin-left: 6px;
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.linhaDoConsultorio {
  margin-top: 18px;
  font-size: 14.5px;
  color: var(--color-ink-600);
}

.linhaDoConsultorio a {
  color: var(--color-ami-green-600);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Os títulos de seção do perfil: 36px, menores que os 42px da home. */
.titulo {
  font-size: clamp(28px, 2.6vw, 36px);
}

.cabSecao {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--gap);
  padding: 0 var(--m) 32px;
}

.consultorios {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap);
}

.consultorio {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-painel);
  box-shadow: var(--shadow-erguido);
  padding: 36px var(--m) 40px;
}

.consultorio h3 {
  font-size: 26px;
  line-height: 1.1;
}

.consultorio address {
  font-style: normal;
  margin-top: 12px;
  color: var(--color-ink-600);
}

.tel {
  margin-top: 10px;
  font-weight: 600;
  color: var(--color-ink-900);
}

/* Os botões no pé do cartão: os dos dois consultórios na mesma altura. */
.acoesDoConsultorio {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding-top: 28px;
}

.leitura {
  padding: 0 var(--m);
  max-width: calc(40em + 2 * var(--m));
}

.leitura p {
  font-size: 17.5px;
  line-height: 1.7;
  color: var(--color-ink-600);
}

.leitura h2 + p {
  margin-top: 18px;
}

.leitura p + p {
  margin-top: 16px;
}

.notaFinal {
  margin: 0 var(--m);
  padding-top: 24px;
  border-top: 1px solid var(--color-line-strong);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-ink-400);
  max-width: 62em;
}

@media (max-width: 1180px) {
  .consultorios {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .topo {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
    gap: 36px;
  }

  .cabSecao {
    padding-bottom: 24px;
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 700px) {
  .topo {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 0;
  }

  .foto {
    border-radius: 20px;
    --tamanho-iniciais: 120px;
  }

  .texto {
    padding: 0 var(--m);
  }

  .nome {
    font-size: 38px;
  }

  .crm {
    margin-top: 14px;
    font-size: 11.5px;
  }

  .esp {
    font-size: 17px;
  }

  .rqe {
    font-size: 14.5px;
  }

  .acoes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 22px;
  }

  .acoes > a {
    width: 100%;
    padding: 0 12px;
  }

  .acoes > a:only-child {
    grid-column: 1 / -1;
  }

  .linhaDoConsultorio {
    margin-top: 14px;
    font-size: 14px;
  }

  .titulo {
    font-size: 26px;
  }

  .cabSecao {
    padding-bottom: 20px;
    gap: 14px;
  }

  .consultorios {
    gap: 10px;
  }

  .consultorio {
    border-radius: 16px;
    padding: 22px var(--m) 20px;
  }

  .consultorio h3 {
    font-size: 22px;
  }

  .consultorio address {
    margin-top: 8px;
    font-size: 15px;
  }

  .acoesDoConsultorio {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding-top: 20px;
  }

  .acoesDoConsultorio > :global(.botao) {
    grid-column: 1 / -1;
  }

  .acoesDoConsultorio > a {
    width: 100%;
    height: 46px;
    padding: 0 10px;
    font-size: 14px;
    gap: 8px;
  }

  .leitura p {
    font-size: 16px;
  }

  .notaFinal {
    font-size: 12.5px;
  }
}
```

`.acoes > a:only-child` (um botão só no topo, na largura toda) e o fio da nota em `line-strong` são as únicas regras que não estão no desenho: a primeira cobre o caso que o desenho não mostra (só "Ligar" ou só "WhatsApp"); a segunda é a tradução de `#D9DDE3`.

- [ ] **Step 5: O topo e "Onde atende"**

`components/perfil/TopoDoPerfil.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import styles from "@/components/perfil/Perfil.module.css";
import { hrefTelefone } from "@/lib/ami";
import { consultorioPrincipal, especialidadePrincipal, linkDoWhatsapp } from "@/lib/encontre";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import type { Medico } from "@/lib/dados/tipos";

/*
  A largura desenhada do retrato, pelas réguas de Perfil.module.css e da
  caixa de 1240px: 460px no computador; no tablet, a coluna de .85fr ao lado
  de 1fr, com 36px entre elas e `--m` de 28px dos dois lados; no celular, a
  largura da caixa (24px de folga ao todo).
*/
export const SIZES_DO_PERFIL =
  "(max-width: 700px) calc(100vw - 24px), (max-width: 980px) calc((100vw - 140px) * 0.46), 460px";

/*
  O topo do perfil: o retrato (ou as iniciais) ao lado do nome, do
  "MÉDICO · CRM", da especialidade principal com RQE e dos botões do
  consultório principal, "Ligar" e "WhatsApp". Acima do nome, no lugar do
  rótulo, o link de volta para a busca; abaixo dos botões, a linha que diz
  de qual consultório eles são, com o número para quem está no computador,
  e o atalho para os outros endereços quando há mais de um.

  Sem breadcrumb visível: o cliente aprovou o desenho sem ele. O
  BreadcrumbList do JSON-LD continua na página.
*/
export function TopoDoPerfil({ medico }: { medico: Medico }) {
  const principal = especialidadePrincipal(medico);
  const consultorio = consultorioPrincipal(medico);
  const telefone = consultorio?.telefone ?? null;
  const whatsapp = consultorio?.whatsapp ?? null;
  const enderecos = medico.locais.length;

  return (
    <section data-bloco="perfil" aria-labelledby="perfil-nome" className={styles.topo}>
      <FotoDoMedico
        nome={medico.nome}
        foto={medico.foto}
        alt={`Retrato de ${medico.nome}`}
        sizes={SIZES_DO_PERFIL}
        carga="primeira"
        className={styles.foto}
      />

      <div className={styles.texto}>
        <Link href="/busca" className={`rotulo-secao ${styles.volta}`}>
          <Icone nome="voltar" /> Encontre um médico
        </Link>
        <h1 id="perfil-nome" className={styles.nome}>
          {medico.nome}
        </h1>
        <p className={styles.crm}>{identificacaoMedica(medico.crm, medico.crmUf)}</p>
        {principal ? (
          <p className={styles.esp}>
            {principal.nome}
            {principal.rqe ? (
              <>
                {" "}
                <span className={styles.rqe}>RQE&nbsp;{principal.rqe}</span>
              </>
            ) : null}
          </p>
        ) : null}

        {telefone || whatsapp ? (
          <div className={styles.acoes}>
            {telefone ? (
              <a
                className="botao"
                href={hrefTelefone(telefone)}
                aria-label={`Ligar para ${medico.nome}, ${formatarTelefone(telefone)}`}
              >
                <Icone nome="telefone" /> Ligar
              </a>
            ) : null}
            {whatsapp ? (
              <a className="botao-contorno" href={linkDoWhatsapp(whatsapp)} aria-label={`WhatsApp de ${medico.nome}`}>
                <Icone nome="whatsapp" /> WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}

        {consultorio ? (
          <p className={styles.linhaDoConsultorio}>
            {`Consultório em ${consultorio.bairro.nome}`}
            {telefone ? (
              <>
                {" · "}
                <span className="numero-tabular">{formatarTelefone(telefone)}</span>
              </>
            ) : null}
            {enderecos > 1 ? (
              <>
                {" · "}
                <a href="#onde-atende">{`ver os ${enderecos} endereços`}</a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
```

O teste "Ligar e WhatsApp" espera `<a class="botao" href=… aria-label=…>`: num `<a>` comum (não o `Link` do Next), o React imprime os atributos na ordem do JSX, e é essa a ordem acima. Não reordene as props.

`components/perfil/OndeAtende.tsx`:

```tsx
import { Icone } from "@/components/base/Icone";
import styles from "@/components/perfil/Perfil.module.css";
import { hrefTelefone } from "@/lib/ami";
import { enderecoDoLocal, linkDoMapa, linkDoWhatsapp } from "@/lib/encontre";
import { formatarTelefone } from "@/lib/formato";
import type { LocalAtendimento } from "@/lib/dados/tipos";

/*
  "Onde atende": um cartão por consultório, com o bairro como título, o
  endereço completo, o telefone e os botões "Ligar", "WhatsApp" e "Como
  chegar". Sem telefone, sem "Ligar"; sem WhatsApp, sem o botão dele; "Como
  chegar" sai sempre, porque todo consultório tem endereço.

  O `id="onde-atende"` é o destino do "ver os N endereços" do topo.
*/
export function OndeAtende({ locais }: { locais: LocalAtendimento[] }) {
  return (
    <section id="onde-atende" data-bloco="onde-atende" aria-labelledby="onde-atende-titulo" className="revelar">
      <div className={styles.cabSecao}>
        <h2 id="onde-atende-titulo" className={styles.titulo} data-coluna="">
          Onde atende
        </h2>
      </div>
      <div className={styles.consultorios}>
        {locais.map((l) => {
          const [linha1, linha2] = enderecoDoLocal(l);
          const bairro = l.bairro.nome;
          return (
            <article key={l.id} className={styles.consultorio}>
              <h3>{bairro}</h3>
              <address>
                {linha1}
                <br />
                {linha2}
              </address>
              {l.telefone ? <p className={`numero-tabular ${styles.tel}`}>{formatarTelefone(l.telefone)}</p> : null}
              <div className={styles.acoesDoConsultorio}>
                {l.telefone ? (
                  <a className="botao" href={hrefTelefone(l.telefone)} aria-label={`Ligar para o consultório de ${bairro}`}>
                    <Icone nome="telefone" /> Ligar
                  </a>
                ) : null}
                {l.whatsapp ? (
                  <a className="botao-contorno" href={linkDoWhatsapp(l.whatsapp)} aria-label={`WhatsApp do consultório de ${bairro}`}>
                    <Icone nome="whatsapp" /> WhatsApp
                  </a>
                ) : null}
                <a className="botao-contorno" href={linkDoMapa(l)} aria-label={`Como chegar ao consultório de ${bairro} (abre o mapa)`}>
                  <Icone nome="comoChegar" /> Como chegar
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: A página**

`app/(site)/medico/[slug]/page.tsx` (reescrita inteira):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import paginas from "@/app/(site)/encontre.module.css";
import { Icone } from "@/components/base/Icone";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import { OndeAtende } from "@/components/perfil/OndeAtende";
import styles from "@/components/perfil/Perfil.module.css";
import { TopoDoPerfil } from "@/components/perfil/TopoDoPerfil";
import { JsonLd } from "@/components/seo/JsonLd";
import { buscarMedicos, medicoPorSlug, slugsDeMedicos } from "@/lib/dados/medicos";
import { especialidadePrincipal, outrosMedicos, paragrafosDaBio } from "@/lib/encontre";
import { breadcrumbList, physician } from "@/lib/seo/jsonld";
import { descricaoMedico, tituloMedico } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeMedicos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) return {};

  const principal = especialidadePrincipal(m);
  const bairros = [...new Set(m.locais.map((l) => l.bairro.nome))];

  return {
    title: tituloMedico(m.nome, principal?.nome ?? null),
    description: descricaoMedico(m.nome, principal?.nome ?? null, bairros),
    alternates: { canonical: `/medico/${slug}` },
  };
}

/*
  O perfil do médico: o topo (retrato, nome, CRM, especialidade e os botões
  do consultório principal), "Onde atende", "Sobre", "Outros médicos de
  {especialidade}" e a nota final. Sem a `Cabeceira` das outras páginas
  internas e sem breadcrumb visível, como no desenho aprovado.

  "Sobre" só sai com biografia; "Outros médicos", só com algum (até quatro,
  da mesma especialidade principal, em ordem alfabética: `outrosMedicos`,
  lib/encontre.ts).

  O JSON-LD do médico e da trilha continuam como eram.
*/
export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) notFound();

  const principal = especialidadePrincipal(m);
  const outros = outrosMedicos(m, await buscarMedicos());
  const bio = m.bio ? paragrafosDaBio(m.bio) : [];

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    ...(principal ? [{ nome: principal.nome, caminho: `/medicos/${principal.slug}` }] : []),
    { nome: m.nome, caminho: `/medico/${m.slug}` },
  ];

  return (
    <div className={paginas.pagina}>
      <JsonLd dados={physician(m, SITE)} />
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <TopoDoPerfil medico={m} />

      {m.locais.length > 0 ? <OndeAtende locais={m.locais} /> : null}

      {bio.length > 0 ? (
        <section data-bloco="sobre" aria-labelledby="sobre-titulo" className="revelar">
          <div className={styles.leitura}>
            <h2 id="sobre-titulo" className={styles.titulo} data-coluna="">
              Sobre
            </h2>
            {bio.map((paragrafo, i) => (
              <p key={i}>{paragrafo}</p>
            ))}
          </div>
        </section>
      ) : null}

      {principal && outros.length > 0 ? (
        <section data-bloco="outros" aria-labelledby="outros-titulo" className="revelar">
          <div className={styles.cabSecao}>
            <h2 id="outros-titulo" className={styles.titulo} data-coluna="">
              {`Outros médicos de ${principal.nome}`}
            </h2>
            <Link href={`/medicos/${principal.slug}`} className="botao-linha">
              {`Ver todos de ${principal.nome}`} <Icone nome="seta" />
            </Link>
          </div>
          <GradeMedicos medicos={outros} />
        </section>
      ) : null}

      <div data-bloco="nota">
        <p className={styles.notaFinal} data-coluna="">
          As informações desta página são fornecidas pelo profissional e
          revisadas pela Associação Médica de Imperatriz. Conteúdo informativo;
          não substitui a consulta médica.
        </p>
      </div>
    </div>
  );
}
```

O texto da nota está quebrado em linhas no JSX: o React junta com espaço. Confira que o teste "a nota final" passa (`tela()` normaliza espaços).

- [ ] **Step 7: O que sai, e os comentários que citam**

Apague `components/diretorio/LinhaMedico.tsx` e `components/base/Chip.tsx`. Depois:

- `components/editorial/LinhaNoticia.tsx`, comentário do topo: "Linha com miniatura à esquerda, e não grade de cartões: é a mesma gramática de `LinhaMedico`, e o site inteiro fica coerente. Grade de cartões também obrigaria toda matéria a ter capa, e a AMI vai publicar comunicado curto sem imagem." vira "Linha com miniatura à esquerda, e não grade de cartões: grade obrigaria toda matéria a ter capa, e a AMI vai publicar comunicado curto sem imagem."; e o comentário do `<li>`: "`min-w-0`: ver o comentário equivalente em LinhaMedico. Item de grade não encolhe abaixo do conteúdo sem isto, …" vira "`min-w-0`: item de grade nasce com `min-width: auto` e não encolhe abaixo do conteúdo sem isto, …".
- `lib/dados/medicos.ts`, nos dois comentários: "`locais[0]` — que `LinhaMedico`, `jsonld.ts` e a página de perfil usam para decidir bairro, telefone e endereço do JSON-LD —" vira "`locais[0]` — o consultório principal do perfil (`consultorioPrincipal`, lib/encontre.ts) e o endereço do JSON-LD (`jsonld.ts`) —"; e "`LinhaMedico`, `jsonld.ts` e a página de perfil tomam `locais[0]` como "o" consultório do médico" vira "o perfil e `jsonld.ts` tomam `locais[0]` como o consultório principal".
- `testes/paleta.test.ts`, comentário: "(por exemplo em components/diretorio/LinhaMedico.tsx)" vira "(por exemplo em components/painel/BlocoEspecialidades.tsx)".
- `grep -rn "LinhaMedico\|ListaMedicos\|\bChip\b\|PainelFiltros\|LadrilhosBairros\|BairrosEParceiros" app components lib testes scripts` → nada.

- [ ] **Step 8: Rodar tudo, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. Se `testes/paleta.test.ts` reclamar de uma exceção de token que ficou sem uso (os componentes apagados levavam `bg-ami-green-600 text-white`), confira se o token ainda é usado em outro lugar (`components/painel/`) antes de mexer na lista.
Mutações: tirar o filtro `bio.length > 0`; trocar `outrosMedicos` por `buscarMedicos({ especialidade })`; pôr `<Breadcrumb>` de volta; tirar o `(abre o mapa)`; tirar `carga="primeira"`; tirar o `.acoes > a:only-child`. Cada uma deixa um teste vermelho.
Abra `/medico/aline-peixoto` (ou o slug com dois consultórios do banco de teste) no servidor da porta 3000 a 1440 e 390px e compare com `perfil-1440-parte-1.jpg`, `perfil-1440-parte-2.jpg`, `perfil-390-parte-1.jpg` e `perfil-390-parte-2.jpg`.

```bash
git add components/perfil "app/(site)/medico/[slug]/page.tsx" app/globals.css components/diretorio/LinhaMedico.tsx components/base/Chip.tsx components/editorial/LinhaNoticia.tsx lib/dados/medicos.ts testes/telefone.test.ts testes/base-visual.test.ts testes/paleta.test.ts testes/perfil.test.ts
git commit -m "Perfil do medico: retrato e botoes do consultorio principal, onde atende, sobre, outros medicos e a nota"
```

---

### Task 8: A barra do pé na busca e no perfil (celular)

**Files:**
- Modify: `lib/barra-do-pe.ts`
- Modify: `components/layout/BarraDoPe.tsx`, `components/layout/BarraDoPe.module.css`
- Create: `components/perfil/BarraDoMedico.tsx`
- Modify: `components/busca/FaixaDaBusca.tsx` (`data-abertura`)
- Modify: `components/perfil/TopoDoPerfil.tsx` (`data-acoes-do-medico`)
- Modify: `app/(site)/medico/[slug]/page.tsx` (a barra do médico)
- Modify: `testes/rodape.test.ts`, `testes/busca.test.ts`, `testes/perfil.test.ts`
- Create: `testes/barra-do-medico.test.ts`

**Interfaces:**
- Consumes: `consultorioPrincipal`, `linkDoWhatsapp` (Task 2); `hrefTelefone`; as classes `barra`, `visivel`, `buscar`, `ligar` de `BarraDoPe.module.css`.
- Produces:

```ts
// lib/barra-do-pe.ts
export function destinoDaBusca(caminho: string): "#encontre" | "/busca"; // "#encontre" em "/" e em "/busca"
export function acoesSairamPorCima(intersecta: boolean, topo: number): boolean;
// components/perfil/BarraDoMedico.tsx ("use client")
export function BarraDoMedico(props: { nome: string; telefone: string; whatsapp: string | null }): JSX.Element;
// marcas
[data-abertura]          // o bloco que abre a página, cuja saída por cima mostra a barra (a faixa da busca)
[data-acoes-do-medico]   // os botões do topo do perfil
[data-barra-do-medico]   // a barra do perfil; com ela na página, a barra padrão não aparece
```

- [ ] **Step 1: Os testes**

`testes/barra-do-medico.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarraDoMedico } from "@/components/perfil/BarraDoMedico";
import estilos from "@/components/layout/BarraDoPe.module.css";
import { acoesSairamPorCima, destinoDaBusca } from "@/lib/barra-do-pe";
import { fonte, semComentarios } from "@/testes/apoio";
import { bloco, regra, semNotas } from "@/testes/css";

/*
  A barra do pé do perfil, no celular: "Ligar" e "WhatsApp" do consultório
  principal, quando os botões do topo saem da tela por cima. O desenho é o
  da barra padrão (BarraDoPe.module.css); o observador só roda no navegador,
  e por isso a ligação se lê do código.
*/

const CODIGO = semComentarios(fonte("../components/perfil/BarraDoMedico.tsx"));
const CSS = semNotas(fonte("../components/layout/BarraDoPe.module.css"));

describe("a barra do médico", () => {
  const html = renderToString(
    createElement(BarraDoMedico, { nome: "Aline Peixoto", telefone: "(99) 3018-9994", whatsapp: "(99) 3018-9994" }),
  );

  it("é um nav com nome, marcado, e começa escondida", () => {
    const abre = /^<nav [^>]*>/.exec(html)![0];
    expect(abre).toContain('aria-label="Contato de Aline Peixoto"');
    expect(abre).toContain('data-barra-do-medico=""');
    expect(abre).toContain(estilos.barra);
    expect(abre).toContain(estilos.doMedico);
    expect(abre).not.toContain(estilos.visivel);
  });

  it("Ligar em verde e WhatsApp em branco, do consultório principal", () => {
    expect(html).toMatch(
      new RegExp(`<a href="tel:\\+559930189994" class="botao ${estilos.buscar}" aria-label="Ligar para Aline Peixoto">`),
    );
    expect(html).toMatch(
      new RegExp(`<a href="https://wa.me/559930189994" class="${estilos.ligar}" aria-label="WhatsApp de Aline Peixoto">`),
    );
  });

  it("sem WhatsApp, só o Ligar", () => {
    const so = renderToString(createElement(BarraDoMedico, { nome: "A", telefone: "(99) 3018-9994", whatsapp: null }));
    expect(so).not.toContain("wa.me");
    expect(so).toContain("tel:+559930189994");
  });
});

describe("quando ela aparece", () => {
  it("quando os botões do topo saem por cima, e só aí", () => {
    expect(acoesSairamPorCima(false, -10)).toBe(true);
    expect(acoesSairamPorCima(true, -10)).toBe(false);
    expect(acoesSairamPorCima(false, 900)).toBe(false);
    expect(acoesSairamPorCima(true, 300)).toBe(false);
  });

  it("o observador olha os botões do topo e passa o que leu à decisão", () => {
    expect(CODIGO).toContain('document.querySelector("[data-acoes-do-medico]")');
    expect(CODIGO).toContain("acoesSairamPorCima(entrada.isIntersecting, entrada.boundingClientRect.top)");
    expect(CODIGO).toMatch(/threshold: 0\b/);
    expect(CODIGO).toContain("observador.disconnect()");
  });
});

describe("as duas barras", () => {
  it("na busca, Encontrar médico leva à faixa da própria página", () => {
    expect(destinoDaBusca("/busca")).toBe("#encontre");
    expect(destinoDaBusca("/")).toBe("#encontre");
    expect(destinoDaBusca("/medico/aline-peixoto")).toBe("/busca");
  });

  it("no celular, Ligar e WhatsApp meio a meio, e a barra padrão some quando a do médico existe", () => {
    const cel = bloco(CSS, "@media (max-width: 700px)");
    expect(regra(cel, ".doMedico .ligar")).toMatch(/flex: 1/);
    expect(regra(cel, ":global(body:has([data-barra-do-medico])) .barra:not([data-barra-do-medico])")).toMatch(
      /display: none/,
    );
  });
});
```

`testes/rodape.test.ts`:

- em "leva a busca da home na home e a /busca fora dela": `expect(destinoDaBusca("/busca")).toBe("#encontre");` (no lugar de `"/busca"`), e o nome vira "leva à busca da própria página na home e em /busca, e a /busca fora delas";
- em "aceita a ausencia do carrossel e do bloco de busca":

```ts
    expect(BARRA).toContain(`'[data-bloco="carrossel"], [data-abertura]'`);
    expect(BARRA).toMatch(/abertura \? abertura\.getBoundingClientRect\(\)\.bottom : null/);
```

`testes/busca.test.ts`, no primeiro `it`, a expressão da `<section>` passa a ter `data-abertura=""` logo depois de `data-faixa=""`.

`testes/perfil.test.ts`, acrescente:

```ts
describe("a barra do pé do perfil", () => {
  it("com telefone no consultório principal: a barra do médico, e os botões do topo marcados", async () => {
    const html = await perfil();
    expect(html).toContain('data-barra-do-medico=""');
    expect(html).toMatch(new RegExp(`<div class="${estilos.acoes}" data-acoes-do-medico="">`));
  });

  it("sem telefone no consultório principal: sem a barra do médico (volta a padrão)", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: null }] });
    expect(html).not.toContain("data-barra-do-medico");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/barra-do-medico.test.ts testes/rodape.test.ts testes/busca.test.ts testes/perfil.test.ts`
Expected: FAIL.

- [ ] **Step 3: A decisão**

`lib/barra-do-pe.ts`:

- no comentário do topo, troque o parágrafo "“Passou do topo” tem dois critérios, conforme haja carrossel na página: …" por:

```
  "Passou do topo" tem dois critérios, conforme a página tenha um bloco de
  abertura (o carrossel da home, a faixa verde da busca, `data-abertura`):
  - com ele: o fundo dele saiu da tela, isto é, passou acima do topo da
    janela (`fundoDaAbertura < 0`);
  - sem ele (as outras páginas): a rolagem passou de `ROLAGEM_SEM_CARROSSEL`
    pixels.
```

- `passouDoTopo(fundoDoCarrossel, …)` vira `passouDoTopo(fundoDaAbertura: number | null, rolagem: number)` com o mesmo corpo (troque o nome nas duas linhas e no comentário `/** … */`, que passa a dizer "`fundoDaAbertura` é o `bottom` de `getBoundingClientRect()` do bloco de abertura, ou `null` se a página não tem um.");
- `destinoDaBusca`:

```ts
/** Para onde "Encontrar médico" leva: à busca da própria página, na home e em /busca; senão à página de busca. */
export function destinoDaBusca(caminho: string): "#encontre" | "/busca" {
  return caminho === "/" || caminho === "/busca" ? "#encontre" : "/busca";
}
```

- no fim:

```ts
/**
 * A barra do perfil aparece quando os botões do topo saíram da tela por
 * cima: fora dela (`intersecta` falso) e acima (`topo` < 0). Botões ainda
 * abaixo da tela não contam.
 */
export function acoesSairamPorCima(intersecta: boolean, topo: number): boolean {
  return !intersecta && topo < 0;
}
```

- [ ] **Step 4: A barra padrão e o CSS**

`components/layout/BarraDoPe.tsx`: troque `const carrossel = document.querySelector('[data-bloco="carrossel"]');` por

```ts
    /* O bloco que abre a página: o carrossel da home ou a faixa verde da
       busca (`data-abertura`). */
    const abertura = document.querySelector('[data-bloco="carrossel"], [data-abertura]');
```

e, em `atualizar`, `carrossel ? carrossel.getBoundingClientRect().bottom : null` por `abertura ? abertura.getBoundingClientRect().bottom : null`. No comentário do topo, "onde está o fundo do carrossel (`[data-bloco="carrossel"]`)" vira "onde está o fundo do bloco de abertura (o carrossel, `[data-bloco="carrossel"]`, ou a faixa da busca, `[data-abertura]`)"; e "Na home o botão leva ao bloco de busca da própria página" vira "Na home e na busca o botão leva ao bloco de busca da própria página".

`components/layout/BarraDoPe.module.css`, dentro do `@media (max-width: 700px)`, no fim:

```css
  /* A barra do perfil (components/perfil/BarraDoMedico.tsx), com o desenho
     desta: "Ligar" verde e "WhatsApp" branco, meio a meio, como no desenho
     (`.barra-medico .ba-ligar`). */
  .doMedico .ligar {
    flex: 1;
  }

  /* Com a barra do perfil na página, a padrão não aparece: as duas ficariam
     no mesmo lugar, uma por cima da outra. */
  :global(body:has([data-barra-do-medico])) .barra:not([data-barra-do-medico]) {
    display: none;
  }
```

- [ ] **Step 5: A barra do médico e as marcas**

`components/perfil/BarraDoMedico.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/layout/BarraDoPe.module.css";
import { hrefTelefone } from "@/lib/ami";
import { acoesSairamPorCima } from "@/lib/barra-do-pe";
import { linkDoWhatsapp } from "@/lib/encontre";

/*
  A barra do pé do perfil, só no celular (a regra de largura é a da barra
  padrão, BarraDoPe.module.css): "Ligar" e "WhatsApp" do consultório
  principal. Aparece quando os botões do topo (`[data-acoes-do-medico]`)
  saem da tela por cima (`acoesSairamPorCima`, lib/barra-do-pe.ts).

  Quem a põe na página é o perfil, e só quando o consultório principal tem
  telefone; sem ele, fica a barra padrão. Com esta na página, a padrão não
  aparece (a regra com `:has`, em BarraDoPe.module.css).
*/
export function BarraDoMedico({
  nome,
  telefone,
  whatsapp,
}: {
  nome: string;
  telefone: string;
  whatsapp: string | null;
}) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const acoes = document.querySelector("[data-acoes-do-medico]");
    if (!acoes) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        const entrada = entradas[0];
        setVisivel(acoesSairamPorCima(entrada.isIntersecting, entrada.boundingClientRect.top));
      },
      { threshold: 0 },
    );
    observador.observe(acoes);
    return () => observador.disconnect();
  }, []);

  return (
    <nav
      aria-label={`Contato de ${nome}`}
      data-barra-do-medico=""
      className={`${styles.barra} ${styles.doMedico} ${visivel ? styles.visivel : ""}`}
    >
      <a href={hrefTelefone(telefone)} className={`botao ${styles.buscar}`} aria-label={`Ligar para ${nome}`}>
        <Icone nome="telefone" tamanho={18} /> Ligar
      </a>
      {whatsapp ? (
        <a href={linkDoWhatsapp(whatsapp)} className={styles.ligar} aria-label={`WhatsApp de ${nome}`}>
          <Icone nome="whatsapp" tamanho={18} /> WhatsApp
        </a>
      ) : null}
    </nav>
  );
}
```

`components/busca/FaixaDaBusca.tsx`: acrescente `data-abertura=""` logo depois de `data-faixa=""`, e ao comentário: "`data-abertura` diz à barra do pé do celular que ela aparece quando esta faixa sai da tela (components/layout/BarraDoPe.tsx)."

`components/perfil/TopoDoPerfil.tsx`: `<div className={styles.acoes}>` vira `<div className={styles.acoes} data-acoes-do-medico="">`, e ao comentário: "`data-acoes-do-medico` marca os botões do topo: a barra do pé do perfil aparece quando eles saem da tela (components/perfil/BarraDoMedico.tsx)."

`app/(site)/medico/[slug]/page.tsx`: importe `BarraDoMedico` de `@/components/perfil/BarraDoMedico` e `consultorioPrincipal` de `@/lib/encontre`; depois de `const bio = …`, `const consultorio = consultorioPrincipal(m);`; e, logo antes do `</div>` final:

```tsx
      {/* No celular: "Ligar" e "WhatsApp" do consultório principal, quando os
          botões do topo saem da tela. Sem telefone ali, fica a barra padrão
          do site. */}
      {consultorio?.telefone ? (
        <BarraDoMedico nome={m.nome} telefone={consultorio.telefone} whatsapp={consultorio.whatsapp} />
      ) : null}
```

- [ ] **Step 6: Rodar tudo, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.
Mutações: `acoesSairamPorCima` sem o `topo < 0`; tirar a regra do `:has`; voltar `destinoDaBusca("/busca")` para `"/busca"`; mostrar a barra do médico sem conferir o telefone. Cada uma deixa um teste vermelho.
No navegador (3300, emulando 390px): na busca, a barra aparece quando a faixa verde sai por cima e "Encontrar médico" leva de volta à faixa com o cursor no campo; no perfil, a barra "Ligar / WhatsApp" aparece quando os botões do topo saem por cima, e a padrão nunca aparece; compare com `perfil-390-barra.jpg`.

```bash
git add lib/barra-do-pe.ts components/layout/BarraDoPe.tsx components/layout/BarraDoPe.module.css components/perfil/BarraDoMedico.tsx components/busca/FaixaDaBusca.tsx components/perfil/TopoDoPerfil.tsx "app/(site)/medico/[slug]/page.tsx" testes/barra-do-medico.test.ts testes/rodape.test.ts testes/busca.test.ts testes/perfil.test.ts
git commit -m "Barra do pe: na busca volta a faixa verde; no perfil, Ligar e WhatsApp do consultorio principal"
```

---

### Task 9: A conferência

**Files:**
- Modify: `scripts/auditoria-visual.js`
- Modify: `vitest.config.ts` (só o comentário)
- Modify: `docs/estado-do-projeto.md`

- [ ] **Step 1: A auditoria nas páginas novas**

Em `scripts/auditoria-visual.js`:

(a) Comentário do topo: "Só na home (onde há `data-bloco`):" vira "Nas páginas com `data-bloco` (a home, a busca e o perfil):"; acrescente à lista dessas: "- os "Ligar" dos cartões de médico de uma mesma fileira na mesma altura (`data-ligar`, o botão ou o espaço dele);" e "- acima de 700px, o texto na mesma linha vertical do logotipo;"; e troque o item da barra do pé por: "- a barra do pé: nunca acima de 700px; até 700px, aparece se e só se o bloco de abertura (o carrossel ou a faixa da busca, `[data-abertura]`) saiu por cima (ou a rolagem passou de 600px, sem bloco de abertura) e a busca não está na tela; no perfil com telefone, a barra padrão nunca aparece e a do médico aparece se e só se os botões do topo saíram por cima."

(b) Na conferência 8, depois de `info.colunaDoLogo = …`:

```js
    if (W > 700 && Math.abs(info.colunaDoLogo - Math.round(col[0])) > 1)
      problemas.push(
        `texto fora da linha do logotipo: logotipo ${info.colunaDoLogo}, texto ${col[0]}`,
      );
```

(c) Logo depois do fim do `if (home) { … }` (antes da conferência 10, o menu), acrescente:

```js
  /* 13. Os "Ligar" de cada fileira de cartões de médico na mesma altura:
     o botão, ou o espaço dele de quem não tem telefone. */
  const fileiras = new Map();
  for (const e of document.querySelectorAll("[data-ligar]")) {
    if (R(e).height === 0) continue;
    const topoDoCartao = Math.round(topoAbs(e.closest("li")));
    if (!fileiras.has(topoDoCartao)) fileiras.set(topoDoCartao, []);
    fileiras.get(topoDoCartao).push(Math.round(topoAbs(e) * 10) / 10);
  }
  for (const [topo, ys] of fileiras) {
    if (Math.max(...ys) - Math.min(...ys) > 0.5)
      problemas.push(`"Ligar" desalinhado na fileira de ${topo}px: ${ys.join("/")}`);
  }
  info.fileirasDeCartoes = fileiras.size;
```

(d) Troque a conferência 11 (a barra do pé) inteira, de `/* 11. A barra do pé. */` até o `await rolar(0);` que vem depois do `info.barraDoPe = vistos.join(" ");` e do fecho do `else`, por:

```js
  /* 11. A barra do pé, e a do perfil. */
  const barra = document.querySelector('nav[aria-label="Atalhos"]');
  const barraMedico = document.querySelector("[data-barra-do-medico]");
  const acoesDoMedico = document.querySelector("[data-acoes-do-medico]");
  const abertura = document.querySelector('[data-bloco="carrossel"], [data-abertura]');
  const busca = document.getElementById("encontre");
  const aparece = (b) =>
    getComputedStyle(b).display !== "none" && temClasse(b, "visivel") && R(b).top < H;
  if (!barra) {
    info.barraDoPe = "sem barra (painel)";
  } else if (W > 700) {
    for (const y of [0, fim / 2, fim]) {
      await rolar(y, 600);
      for (const b of [barra, barraMedico].filter(Boolean))
        if (getComputedStyle(b).display !== "none")
          problemas.push(`barra do pé acima de 700px (rolagem ${Math.round(y)})`);
    }
    info.barraDoPe = "nunca";
  } else if (barraMedico) {
    const vistos = [];
    for (const y of [0, topoAbs(acoesDoMedico) + R(acoesDoMedico).height + 10, fim / 2, fim]) {
      await rolar(y, 700);
      if (getComputedStyle(barra).display !== "none")
        problemas.push(`barra padrão junto da barra do médico a ${Math.round(scrollY)}px`);
      const esperado = R(acoesDoMedico).bottom < 0;
      const viu = aparece(barraMedico);
      vistos.push(`${Math.round(scrollY)}:${viu ? "sim" : "não"}`);
      if (viu !== esperado)
        problemas.push(
          `barra do médico ${viu ? "aparece" : "não aparece"} a ${Math.round(scrollY)}px (botões do topo saíram: ${esperado})`,
        );
    }
    info.barraDoPe = "médico " + vistos.join(" ");
  } else {
    const pontos = [0];
    if (abertura) pontos.push(topoAbs(abertura) + R(abertura).height + 10);
    if (busca && busca !== abertura) pontos.push(topoAbs(busca) + R(busca).height + 10);
    pontos.push(fim / 2, fim);
    const vistos = [];
    for (const y of pontos) {
      await rolar(y, 700);
      const passou = abertura ? R(abertura).bottom < 0 : scrollY > 600;
      let fracao = 0;
      if (busca) {
        const rb = R(busca);
        fracao = Math.max(0, Math.min(rb.bottom, H) - Math.max(rb.top, 0)) / rb.height;
      }
      const viu = aparece(barra);
      vistos.push(`${Math.round(scrollY)}:${viu ? "sim" : "não"}`);
      if (fracao > 0 && fracao < 0.25) continue; /* na beira do limiar do observador */
      const esperado = passou && fracao === 0;
      if (viu !== esperado)
        problemas.push(
          `barra do pé ${viu ? "aparece" : "não aparece"} a ${Math.round(scrollY)}px (abertura saiu: ${passou}, busca na tela: ${Math.round(fracao * 100)}%)`,
        );
    }
    info.barraDoPe = vistos.join(" ");
  }
  await rolar(0);
```

Se a conferência (b) acusar a home também (o logotipo e o texto da home fora da mesma linha acima de 700px), isso já existia na fatia A: registre no estado do projeto e não corrija aqui.

- [ ] **Step 2: O comentário do Vitest**

Em `vitest.config.ts`, no fim do comentário, antes de `*/`, acrescente: "`testes/cartao-medico.test.ts` renderiza o cartão, a foto e a grade de médicos; `testes/busca.test.ts`, `testes/perfil.test.ts` e `testes/sem-bairros.test.ts` renderizam `/busca`, o perfil, `/medicos` e uma especialidade com `renderToPipeableStream` (`htmlDe`, testes/renderizar.ts) e as fontes de dados trocadas por dublês; `testes/barra-do-medico.test.ts`, a barra do pé do perfil."

- [ ] **Step 3: Produção com a chave de hoje**

`npm run build` e `npx next start -p 3300`. Rode a auditoria (cole `scripts/auditoria-visual.js` no console ou use a ferramenta de navegador, esperando a promessa; a página recém-aberta, sem rolar) em cada página e largura:

- páginas: `/busca`, `/busca?especialidade=<uma com 3 ou mais>`, `/busca?termo=zzzz` (vazio), `/medico/<slug com dois consultórios>`, `/medico/<slug sem biografia>` (se houver), `/`, `/medicos`, `/medicos/<especialidade>`, `/associacao`, `/contato`, `/noticias`;
- larguras: 375, 390, 430, 768, 1024, 1280, 1440, 1920.

Abra cada página por endereço (não pelo menu) antes de cada rodada: a conferência 12 navega e termina noutra página. **Expected: `problemas: []` em todas.** Os números a guardar para o estado do projeto: `espacosEntreBlocos`, `colunaTexto`, `colunaDoLogo`, `fileirasDeCartoes`, `aberturas`. Corrija o que aparecer na tarefa de origem (commit de correção com o nome dela).

- [ ] **Step 4: Contraste medido na faixa da busca**

No navegador, a 1440, 768, 430 e 320px, ache o ponto mais claro do fundo atrás da linha de apoio, de "Filtro:" e da pílula do filtro (o método da fatia A: a luz parada no ponto mais claro do caminho dela, o grão médio), e meça `#cfd8c9` e o branco sobre ele. Expected: ≥ 4,5:1. Se algum ficar abaixo, suba a cor em `FaixaDaBusca.module.css` e o ponto de referência em `testes/busca.test.ts`, como a fatia A fez (Ruling 24).

- [ ] **Step 5: Fotos comparadas com o desenho**

Fotos da página inteira, com o método de `.superpowers/captura/` (Chrome sem janela; para 390px, um `iframe` de 390px): `/busca` a 1440 e 390, `/busca?especialidade=cardiologia` a 1440, o perfil de dois consultórios a 1440 e 390, e uma tela do perfil a 390 rolado até a barra aparecer. Compare, seção por seção, com `docs/desenho-aprovado/encontre/busca-1440-parte-1..4.jpg`, `busca-1440-filtro.jpg`, `busca-390-parte-1..3.jpg`, `perfil-1440-parte-1..2.jpg`, `perfil-390-parte-1..2.jpg` e `perfil-390-barra.jpg`. O desenho tem fotos do Unsplash e o site tem as iniciais de quem não mandou foto: isso não é diferença. Qualquer outra diferença (medida, cor, ordem, alinhamento, texto) é defeito: corrija na tarefa de origem.

- [ ] **Step 6: A trava**

`NEXT_PUBLIC_DADOS_DEMONSTRACAO=false npm run build`, `npx next start -p 3300`, e rode a auditoria em `/busca`, no perfil de dois consultórios e em `/`, a 1440 e 390px. Expected: `problemas: []`; as iniciais no lugar das fotos continuam (não são moldura); nenhum "a entrar"; a home sem parceiros termina em "Seja associado" (ou nas notícias, se houver). Depois refaça o build com a chave de hoje.

- [ ] **Step 7: O redirecionamento e as varreduras**

- `curl -sI http://localhost:3300/medicos/cardiologia/centro` → `308`, `location: /medicos/cardiologia`.
- `curl -s http://localhost:3300/sitemap.xml` → nenhum `/medicos/<a>/<b>`.
- No HTML de `/busca`, do perfil, de `/`, `/medicos` e de uma especialidade (`curl -s`), sem o `<script type="application/ld+json">`: nenhuma ocorrência de "Associado AMI", "telemedicina", "cadeirante", "acessibilidade", "/busca?bairro" ou "Escolha o seu bairro".

Derrube o 3300 pelo PID.

- [ ] **Step 8: O estado do projeto**

Em `docs/estado-do-projeto.md`, depois da seção "Reforma visual — fatia A (a base e a home)", acrescente "### Encontre um médico — fatia B, grupo 1 (a busca e o perfil)", com:

- o que mudou no site: a busca e o perfil novos, sem a cabeceira cinza; só associados (o selo e o filtro saíram); só dois filtros, sempre em ordem alfabética; bairros, telemedicina e acessibilidade fora do site (continuam no painel); a home com três números e só parceiros; o fim das páginas de especialidade por bairro, com redirecionamento permanente; nenhuma página abre rolada (a causa: o Next 16 e a rolagem suave, `data-scroll-behavior`);
- o que a AMI precisa saber: todo médico terá foto, e enquanto não houver, o site mostra as iniciais; o envio de foto pelo painel é a próxima fatia e depende do armazenamento de arquivos do Supabase; "MÉDICO" para todos até a AMI decidir sobre "MÉDICA";
- os números medidos no Step 3 (cole a saída: espaços entre blocos, coluna do texto e do logotipo, fileiras de cartões alinhadas, aberturas em 0) e os contrastes do Step 4;
- as dúvidas que ficaram em aberto (a lista do fim deste plano, com o que a AMI ou o cliente decidiram, se já decidiram).

Números medidos, não lembrados: cada número que entrar ali saiu de uma rodada desta tarefa.

- [ ] **Step 9: Rodar tudo e commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

```bash
git add scripts/auditoria-visual.js vitest.config.ts docs/estado-do-projeto.md
git commit -m "Conferencia da busca e do perfil: auditoria nas 8 larguras com e sem demonstracao, fotos e estado do projeto"
```

---

## Autorrevisão do plano

**1. Cobertura da spec**

| Spec | Onde |
|---|---|
| 1.1 Cabeceira sai da busca e do perfil | Tasks 4 e 7 (testes "sem a Cabeceira nem a trilha") |
| 1.2 Só associados; sai filtro, selo, `associados` | Tasks 3 (cartão), 4 (busca ignora), 5 (URL), 6 (parágrafo), 7 (perfil e `Chip` apagado) |
| 1.3 Cartão só com foto, nome, CRM, especialidade/RQE, Ligar | Task 3 (teste do texto visível inteiro) |
| 1.4 Forma do cartão: retrato 4/3/2 por linha; deitado no celular, 116/112px | Task 3 (CSS e `SIZES_DO_CARTAO`) |
| 1.5 Iniciais em Bricolage lima sobre verde com textura e brilho, nos dois modos | Tasks 3 e 9 (trava) |
| 1.6 Filtros: só termo e especialidade; ordem alfabética, dita na página | Tasks 4 e 5 |
| 1.7 Bairros fora: home, rodapé, cruzamentos, listas, sitemap | Tasks 5 (rota, sitemap) e 6 (home, rodapé, listas) |
| 1.8 Telemedicina e acessibilidade fora do site | Tasks 3, 6 (parágrafo), 7 (perfil) |
| 1.9 Perfil: topo, onde atende, sobre, outros, nota | Task 7 |
| 2. Busca por formulário, não ao digitar | Task 4 ("trocar a lista já busca; digitar no campo, não") |
| 2. Especialidade pela lista + `noscript` "Aplicar" | Task 4 |
| 2. "Filtro: X ×" com link sem `especialidade`; contagem "N médicos em X" | Task 4 |
| 2. Lista com contagem, sem especialidade vazia | Tasks 2 (`opcoesDeEspecialidade`) e 4 |
| 2. Parâmetros antigos ignorados, sem erro | Tasks 4 e 5 |
| 2. Nenhum resultado: mensagem e "Limpar a busca" | Task 4 |
| 2. Cartão inteiro clicável; Ligar por cima | Task 3 |
| 2. Sem telefone: sem Ligar, espaço mantido | Tasks 3 e 9 (auditoria) |
| 2. Outros médicos: até 4, mesma principal, sem o próprio, alfabética; 0 = sem seção; "Ver todos de X" para `/medicos/[especialidade]` | Tasks 2 e 7 |
| 2. Consultório sem WhatsApp/telefone; Como chegar sempre | Task 7 |
| 2. Links do mapa e do WhatsApp | Task 2 |
| 2. Barra do pé no perfil e na busca | Task 8 |
| 2. "MÉDICO" para todos | Tasks 3 e 7 (`identificacaoMedica`) |
| 2. Biografia vazia: sem Sobre | Tasks 2 (`paragrafosDaBio`) e 7 |
| 2. "← ENCONTRE UM MÉDICO" no lugar do rótulo; breadcrumb sai | Task 7 |
| 2. Linha "Consultório em … · … · ver os N endereços" | Task 7 |
| 2. Fotos: `sizes` pela largura desenhada; nada `lazy` acima da dobra | Tasks 3, 4 (`IMEDIATOS`) e 7 (`carga="primeira"`) |
| 3. Nenhuma página abre rolada, em todas as internas, com teste de código e medida | Tasks 1 e 9 |
| 4. Fora do escopo (envio de foto, outros grupos, painel) | Não tocados; Global Constraints |
| 5. Ruling 11, auditoria nas 8 larguras com as duas chaves, fotos, contraste | Tasks 3 a 9 e 9 |

**2. Placeholders:** nenhum "TBD"/"implementar depois"; todo passo de código traz o código. Os únicos valores que o plano não traz são os que só existem depois de medir: os números do Step 8 da Task 9 (saem da rodada do Step 3) e o ponto de contraste do Step 4, se a medida na busca desmentir a da home.

Achados da autorrevisão, já corrigidos no texto: o teste do "Filtro: X ×" tinha uma expressão frouxa (agora confere `Filtro:Cardiologia` e os três atributos do link); a conferência do `onChange` da lista usava `[^>]*`, que para no `>` do `=>` (agora é por posição); a regra do terceiro número no celular era `:last-child`, que colide com o grupo de seletores dos cartões na leitura do CSS (agora `:nth-child(3)`); `tela()` do perfil juntava palavras de tags vizinhas (agora troca tag por espaço); o fecho do parágrafo de abertura dizia "Cada perfil abaixo traz endereço, telefone", que o cartão novo não mostra.

**3. Consistência de nomes:** `FotoDoMedico`/`CargaDaFoto` (3 → 7), `CartaoMedico`/`SIZES_DO_CARTAO`/`GradeMedicos` com `imediatos` (3 → 4, 7), `htmlDe` (4 → 6, 7), `.pagina` de `app/(site)/encontre.module.css` (4 → 7), `enderecoDaBusca` (4 → 5), `porNome` (2 → 5), `emOrdemAlfabetica` (5), `especialidadePrincipal`/`consultorioPrincipal`/`telefoneDoCartao`/`linkDoWhatsapp`/`linkDoMapa`/`enderecoDoLocal`/`outrosMedicos`/`opcoesDeEspecialidade`/`textoDaContagem`/`paragrafosDaBio` (2 → 3, 4, 7, 8), `acoesSairamPorCima`/`destinoDaBusca` (8), ícones `whatsapp`/`comoChegar`/`voltar`/`abaixo` (2 → 4, 7, 8), classes `acoes`/`linhaDoConsultorio`/`titulo`/`cabSecao`/`leitura`/`notaFinal`/`consultorios`/`consultorio`/`acoesDoConsultorio` (7 → 8), marcas `data-ligar` (3 → 9), `data-abertura` e `data-acoes-do-medico` e `data-barra-do-medico` (8 → 9).

### Pares de tarefas que tocam o mesmo arquivo

Para o executor conferir conflitos: a tarefa de número maior parte do estado que a menor deixou.

| Arquivo | Tarefas | O que cada uma faz |
|---|---|---|
| `scripts/auditoria-visual.js` | 1, 9 | 1: conferência 12 (abre no topo) no fim; 9: logotipo, "Ligar" por fileira, barras (11 reescrita) |
| `lib/dados/filtros.ts` | 2, 5 | 2: `export` em `porNome`; 5: só dois filtros e `emOrdemAlfabetica` |
| `app/(site)/medicos/[especialidade]/page.tsx` | 3, 6 | 3: grade no lugar do painel e da lista; 6: sai o bloco "por bairro" e `bairrosComContagem` |
| `testes/porta-da-busca.test.ts` | 3, 4, 6 | 3: caso da especialidade; 4: caso da busca, painel sai; 6: sai `bairrosComContagem` do dublê |
| `lib/dados/urlFiltros.ts`, `testes/urlFiltros.test.ts` | 4, 5 | 4: acrescenta `especialidade` e `enderecoDaBusca`; 5: tira o resto (o teste é reescrito inteiro) |
| `app/(site)/busca/page.tsx` | 4, 5 | 4: reescrita com `ordem: "nome"`; 5: tira `ordem` |
| `testes/busca.test.ts` | 4, 5, 8 | 4: criado; 5: chamadas sem `ordem`; 8: `data-abertura` na faixa |
| `components/busca/FaixaDaBusca.tsx` | 4, 8 | 4: criada; 8: `data-abertura` |
| `components/layout/Cabeceira.tsx` (comentário) | 4, 6 | 4: primeiro parágrafo; 6: "bairros e parceiros" no segundo |
| `lib/dados/medicos.ts` | 5, 7 | 5: `buscarMedicos` alfabética; 7: comentários sem `LinhaMedico` |
| `app/globals.css` | 6, 7 | 6: dois comentários; 7: `.botao-contorno` |
| `testes/paleta.test.ts` | 4, 7 | 4: texto da exceção `ink-300`; 7: comentário de `text-white` |
| `testes/rodape.test.ts` | 6, 8 | 6: link "Bairros" sai; 8: destino da busca e `abertura` |
| `components/perfil/TopoDoPerfil.tsx` | 7, 8 | 7: criado; 8: `data-acoes-do-medico` |
| `app/(site)/medico/[slug]/page.tsx` | 7, 8 | 7: reescrita; 8: `BarraDoMedico` |
| `testes/perfil.test.ts` | 7, 8 | 7: criado; 8: `describe` da barra |

## Decisões deste plano que a spec não fixava

Registrar no diário ao executar.

- **D1. A causa da rolagem é o Next 16 com `scroll-behavior: smooth`, não a `Cabeceira`.** Medido: o atributo `data-scroll-behavior="smooth"` sozinho zera os 10 casos; tirar o `-mt-32` sozinho deixa 84px. A `Cabeceira` fica como está nas páginas que a usam.
- **D2. Ordem das tarefas:** busca nova antes dos filtros reduzidos (o `PainelFiltros` era a interface da busca e dependia dos campos que saem); a rota de bairro sai junto com os filtros (ela também dependia deles).
- **D3. O JSON-LD do perfil fica como está,** inclusive `availableService: Telemedicina` e o `BreadcrumbList` sem breadcrumb visível, porque o pedido foi "manter o JSON-LD que já existe". Ver a dúvida 1.
- **D4. Os metadados ficam:** as descrições do perfil e da especialidade continuam citando o bairro (é o endereço, e não aparece na tela). A da home deixa de dizer "Filtre por especialidade e bairro", que ficou falso.
- **D5. "Outros médicos" = mesma especialidade PRINCIPAL dos dois.** Quem tem a especialidade só como secundária não entra.
- **D6. O link "Ver todos de X" fica no cabeçalho da seção, à direita do título** (onde o desenho o põe), e leva a `/medicos/[especialidade]` (a spec), não a `/busca?especialidade=` (o desenho).
- **D7. O "Ligar" do cartão usa o primeiro consultório com telefone;** o do topo do perfil e a barra do pé usam o consultório principal (o primeiro).
- **D8. A especialidade inexistente na URL é ignorada** (sem filtro e sem "Filtro:"), como os parâmetros antigos.
- **D9. A contagem não diz o termo digitado** ("3 médicos", não "3 médicos para cardio"): o termo já está no campo.
- **D10. O h1 da busca é sempre "Quem atende em Imperatriz"** (o do desenho); o antigo "Resultados para “termo”" sai.
- **D11. Os quatro primeiros cartões da busca baixam a foto sem espera;** no perfil, a foto do topo tem prioridade alta e os "outros" são preguiçosos.
- **D12. `sizes` vai na `<img>` da foto do médico mesmo sem `srcSet`** (a foto é um arquivo só); passa a escolher arquivo quando a fatia de envio de fotos gerar versões.
- **D13. Iniciais no perfil:** 160px no computador e 120px no celular (o desenho só mostra o perfil com foto).
- **D14. Os números da home viram três:** três colunas no computador e no tablet; no celular, dois na primeira linha e o terceiro na largura toda.
- **D15. O texto de abertura das especialidades encolhe** (perde bairro, telemedicina, acessibilidade e associados) e o teste de 90 a 200 palavras sai. Ver a dúvida 2.
- **D16. `WhatsApp` com 55 na frente não duplica o 55** (os 11 últimos dígitos, a regra de `formatarTelefone`).
- **D17. A biografia vira parágrafos por linha em branco.**
- **D18. A barra do pé na busca volta à faixa da própria página** (como na home), não recarrega `/busca`.
- **D19. A barra do médico: sem WhatsApp, só "Ligar"; com WhatsApp e sem telefone, a barra padrão** (a spec manda a padrão sem telefone).
- **D20. A lista da busca tem letra de 16px no celular** (o desenho tem 15px), pela mesma razão do campo da home (Safari do iPhone).
- **D21. O "MÉDICO · CRM" do cartão e do perfil sai na fonte do texto, com algarismos tabulares,** como no desenho, e não na Geist Mono.

## Dúvidas para o cliente

1. **`BreadcrumbList` sem breadcrumb na tela.** O próprio projeto diz (comentário de `components/layout/Breadcrumb.tsx`) que dado estruturado sem o correspondente visível é o que o Google trata como marcação enganosa. O perfil perde o breadcrumb visível e mantém o JSON-LD. Tirar o `BreadcrumbList` do perfil?
2. **O texto de abertura das especialidades fica curto** (cerca de 50 palavras, eram 90 a 200) sem bairro, telemedicina, acessibilidade e associados. Era o que segurava a página contra "conteúdo raso" no Google. Aceitar, ou escrever um texto fixo por especialidade (o "O que faz" e "Quando procurar" já existem no banco)?
3. **Números da home no celular:** dois mais um na largura toda é escolha minha. Três lado a lado não cabem "especialidades" a 375px. Aprovar ou pedir outra forma?
4. **"Outros médicos" só pela especialidade principal** (D5). Um cardiologista com pediatria secundária não aparece em "Outros médicos de Pediatria". É o que se quer?
5. **`availableService: Telemedicina` no JSON-LD** continua (D3), embora a telemedicina não apareça mais na tela. Tirar?
6. **Logotipo 4px à esquerda do texto no celular** (dúvida 4 do relatório do desenho, vinda da home): a auditoria só confere a linha acima de 700px. Acertar o cabeçalho nas duas páginas e na home?
