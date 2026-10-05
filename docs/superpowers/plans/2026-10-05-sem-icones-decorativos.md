# Sem ícones decorativos: plano de implementação

> **Para agentes:** use superpowers:subagent-driven-development. Os passos usam caixas (`- [ ]`).

**Objetivo:** tirar do site todo ícone que não esteja ao lado do texto de um botão ou link, nem num controle da tela, e travar a regra num teste.

**Arquitetura:** é uma remoção em quatro fatias.
1. As faixas do topo.
2. Os blocos da home, de A Associação e das páginas de texto.
3. As especialidades, o contato e o autor da notícia.
4. A limpeza do código morto, a trava e a auditoria.

Cada fatia tira o ícone, o CSS dele e o dado que só servia a ele. O espaço se fecha sem enfeite novo.

**Pilha:** Next.js 16.3.1 (App Router), React 19, CSS Modules, Phosphor (`@phosphor-icons/react`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-05-sem-icones-decorativos-design.md`. Leia antes de começar: a seção 1 é a regra, a seção 2 é a lista do que muda e a seção 3 é o que não pode acontecer.

## Restrições globais

Valem para toda tarefa.

### O que fica e o que sai

- **Os ícones que ficam no fim** (spec, seção 1):
  - **no mapa do cliente** (`components/base/Icone.tsx`, `mapaDoCliente`): `lupa`, `seta`, `anterior`, `proximo`, `pausar`, `retomar`, `menu`, `fechar`, `telefone`, `whatsapp`, `abaixo`;
  - **só no servidor** (`components/base/IconeServidor.tsx`): `setaDiagonal`, `comoChegar`, `voltar`, `celular`.

  Qualquer outro nome sai até a Tarefa 4.
- **Não mude** fotos, cores, textos, botões nem molduras "a entrar". Os botões continuam com os ícones deles: "Ligar", "WhatsApp", "Como chegar", o celular de "Fale com a AMI", as setas →, ↗ e ←.
- **O espaço do ícone se fecha.** Valem:
  - o texto em x=172 a 1440;
  - os irmãos alinhados;
  - o mesmo `--ritmo` entre os blocos;
  - nada passando da borda a 375 e a 390;
  - nenhum enfeite novo no lugar: nem número, nem letra, nem fio, nem desenho.

### Rotina e commits

- Rode em toda tarefa `npx vitest run`, `npx tsc --noEmit` e `npm run build`, e deixe tudo verde antes do commit.
- Texto que o usuário lê: português. Mensagens de commit: português **sem acento**, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Antes de usar API do Next,** leia o guia em `node_modules/next/dist/docs/`.

### Testes

- **Ruling 11:**
  - componente se testa por renderização (`renderToString`, ou `htmlDe` de `testes/renderizar.ts`);
  - lógica, por função pura;
  - ler o código como texto só vale para CSS e para a ligação com o navegador ou com os módulos.
- **Prove por mutação** toda asserção nova: quebre o código de propósito, veja o teste ficar vermelho, desfaça.
  - Desfazer = regravar o conteúdo original.
  - **Nunca** `git checkout -- <arquivo>` nem `git restore`.
- **Teste que existia só para conferir o ícone:** troque pela ausência do ícone, ou apague. Nunca o deixe passando à toa.

### Comentários

- **Nenhum comentário promete o que o código não faz.**
- Comentário que cita ladrilho, vidro, `.selo`, `duotone` ou ícone apagado é comentário falso: rode `grep` antes do commit.
- Nenhum comentário aponta para `.superpowers/` nem para "tarefa N".

### Fim de linha, BOM e `git add`

- **`core.autocrlf=true`, e o repositório mistura CRLF e LF.**
  - Confira com `file <arquivo>` antes de editar e mantenha o fim de linha que estiver lá.
  - Edite de forma cirúrgica (Edit).
  - Um arquivo listado sem mudança de conteúdo (`git diff --ignore-cr-at-eol -- <arquivo>` vazio) é diferença só de fim de linha: regrave-o com o fim de linha original.
- **BOM:** `lib/dados/*.ts` começam com BOM. Mantenha.
- **`git add` arquivo por arquivo**, nunca `-A`. Antes de cada commit, `git status --short` só pode listar arquivos da tarefa.
- **NÃO mexa em `docs/`.** Quem atualiza os documentos é o controlador.

### Servidor e subagentes

- **A porta 3000 é do cliente:** não derrube, não reinicie.
  - Para medir em produção: `npm run build` e `npx next start -p 3300`.
  - No fim, derrube pelo PID (`Get-NetTCPConnection -LocalPort 3300`).
  - Chave desligada: `NEXT_PUBLIC_DADOS_DEMONSTRACAO=false` só no ambiente do build e do start. Refaça o build com a chave padrão no fim.
- **Você não despacha subagentes.**

### Ferramentas e a regra de dois mapas

- **Ferramentas de medida e foto:** em `.superpowers/captura/` (`cdp.mjs`, `foto-do-site.mjs`) e em `scripts/auditoria-visual.js`.
- **Ícones em dois mapas** (até a Tarefa 4 mudar o conteúdo, a regra continua):
  - componente de servidor importa de `@/components/base/IconeServidor`;
  - componente de cliente importa só `Icone` de `@/components/base/Icone`;
  - `testes/icones.test.ts` trava.

---

### Task 1: As fotos de antes e as faixas do topo

**Arquivos:**
- Modificar:
  - `components/layout/FaixaCurta.tsx` e `components/layout/FaixaCurta.module.css`;
  - `components/editorial/PaginaDeTexto.tsx`;
  - as páginas `app/(site)/associacao/[pagina]/page.tsx`, `app/(site)/contato/page.tsx`, `app/(site)/noticias/page.tsx`, `app/(site)/politica-de-cookies/page.tsx`, `app/(site)/politica-de-privacidade/page.tsx` e `app/(site)/termos-de-uso/page.tsx`;
  - `components/associacao/FaixaDaDiretoria.tsx` (e o CSS da pílula, se tiver regra para o svg);
  - `components/especialidades/FaixaDaEspecialidade.tsx`;
  - `components/associacao/FaixaDaAssociacao.tsx` e `.module.css` (o `.vidro`);
  - `components/editorial/FaixaDaNoticia.tsx` e `components/editorial/NoticiaAberta.module.css` (o `.vidro`).
- Testes: os que conferem o ícone da faixa, como `testes/faixa-curta-e-indice.test.ts`, `testes/associacao-topo.test.ts`, `testes/diretoria-na-tela.test.ts`, `testes/pagina-de-especialidade.test.ts`, `testes/blocos-da-especialidade.test.ts`, `testes/noticia-aberta.test.ts`, `testes/paginas-de-texto.test.ts` e `testes/modelo-de-texto.test.ts`. Ache-os com `grep -n "selo\|vidro\|icone\|duotone" testes/`.

**Interfaces:**
- Produz: `FaixaCurta` e `PaginaDeTexto` **sem** a prop `icone`.
- `iconeDaPagina` (`lib/paginaDeTexto.ts`) continua existindo, porque `lib/associacao.ts` a usa nos atalhos de "Saiba mais". Quem a apaga é a Tarefa 2.
- `iconeDaEspecialidade` continua existindo, porque a grade a usa. Quem a apaga é a Tarefa 3.

- [ ] **Passo 1: As fotos de antes.** Antes de editar qualquer coisa:
  1. Faça `npm run build` e `npx next start -p 3300`, com a chave padrão.
  2. Fotografe, de página inteira, a 1440 e a 390:
     - `/`, `/busca`, um perfil `/medico/{slug}`, `/medicos`, `/medicos/cardiologia`;
     - `/associacao`, `/associacao/diretoria`, `/associacao/seja-associado`;
     - `/noticias`, `/contato`;
     - `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies`.
  3. Salve em `.superpowers/sdd/2026-10-05-sem-icones-decorativos/fotos/antes/{pagina}-{largura}.png`. Use nomes de arquivo sem barra, por exemplo `medicos-cardiologia-1440.png`.
  4. Anote no relatório o caminho e o hash do commit fotografado.
- [ ] **Passo 2: Os testes que falham primeiro.** Por renderização, cada faixa abaixo sai **sem** `svg` fora do link de volta:
  - a lista de notícias;
  - o contato;
  - a diretoria, também sem o svg da pílula;
  - uma página de texto;
  - uma especialidade;
  - A Associação, sem svg nos três números;
  - a notícia aberta, sem svg na assinatura.

  Uma forma que funciona: tire do HTML o trecho do link de volta (`class="…link-de-volta…"` até o `</a>`) e confira que o resto da `<section data-bloco="topo">` não tem `<svg`. Rode e veja falhar.
- [ ] **Passo 3: Tire o ícone de cada faixa.**
  1. Em `FaixaCurta`, apague a prop `icone`, o bloco `{icone ? …}` e o import de `NomeIcone`, se ficar sem uso.
  2. Atualize o comentário do topo. Hoje ele diz "À direita, o ícone da página num ladrilho de vidro" e "o ladrilho à direita".
  3. Apague `.selo` do `FaixaCurta.module.css` (linhas 43-80, mais ou menos) e qualquer regra que só existia para abrir lugar ao ladrilho, mantendo a largura máxima do texto.
  4. Em `PaginaDeTexto`, apague a prop `icone` e o repasse.
  5. Nas páginas, apague o `icone=…` e o import de `iconeDaPagina` que ficar sem uso.
  6. Na diretoria, apague o `<Icone nome="calendario" />` da pílula e a regra de svg do CSS dela, se houver. O texto fica "Gestão (período a entrar)".
  7. Na especialidade, apague `icone={iconeDaEspecialidade(slug)}` e o import.
  8. Em A Associação, apague o `<span className={styles.vidro}>…</span>` de cada número, o `.vidro` do CSS e o `key={n.icone}`, que passa a usar `n.rotulo`. O campo `icone` de `numerosDaAssociacao` sai: ajuste `lib/associacao.ts` (`NumeroDaAssociacao`) e `testes/associacao-funcoes.test.ts`.
  9. Na notícia aberta, apague o `.vidro` da assinatura e o CSS dele. A assinatura passa a começar pelo bloco do nome.
- [ ] **Passo 4: Atualize os testes antigos.**
  - O que conferia o ícone passa a conferir a ausência dele, ou é apagado se a ausência já está coberta pelo Passo 2.
  - Rode `npx vitest run`: tudo verde.
- [ ] **Passo 5: Prove por mutação** cada asserção do Passo 2. Por exemplo, devolva o `<Icone nome="calendario" />` e veja ficar vermelho.
- [ ] **Passo 6: Meça.** Em produção na 3300, com a chave padrão e com `false`, a 1440, 980, 768, 390 e 375:
  - o título e o texto de cada faixa continuam em x=172 a 1440;
  - a largura do texto não mudou (compare com o antes);
  - nada passa da borda;
  - a faixa de A Associação mantém os três números alinhados entre si.

  Anote os números no relatório.
- [ ] **Passo 7: Commit.** `npx tsc --noEmit` e `npm run build` verdes; `grep -rn "ladrilho de vidro\|\.selo\|vidro" components/layout components/editorial/FaixaDaNoticia.tsx components/associacao/FaixaDaAssociacao.tsx` sem comentário falso; `git add` arquivo por arquivo. Mensagem: `Sem icones nas faixas do topo: sai o ladrilho de vidro da FaixaCurta (noticias, contato, diretoria, especialidade, paginas de texto), o vidro dos numeros de A Associacao e da assinatura da noticia, e o calendario da pilula da gestao`.

---

### Task 2: Home, A Associação e as páginas de texto

**Arquivos:**
- Modificar:
  - da home: `components/home/NumerosDaAmi.tsx` e `.module.css`, `components/home/PrincipiosDaAmi.tsx`, `components/home/SejaAssociado.module.css` (a regra `.cartao > :global(.ladrilho-icone)`, por volta da linha 244);
  - de A Associação: `components/associacao/QuemSomos.tsx` e `.module.css`, `components/associacao/SaibaMais.tsx`, `components/associacao/SecoesDaAssociacao.module.css`, `components/associacao/FaleComAmi.tsx`;
  - das páginas de texto: `components/editorial/PaginaDeTexto.module.css` (`.chamada`) e `components/editorial/FaixaDoTexto.tsx`, mais o CSS dele;
  - dos dados: `lib/associacao.ts` (o `icone` dos atalhos) e `lib/paginaDeTexto.ts` (`iconeDaPagina`).
- Testes: `testes/numeros-e-busca.test.ts`, `testes/sua-ami-e-associe.test.ts`, `testes/associacao.test.ts`, `testes/seja-associado.test.ts`, `testes/associacao-funcoes.test.ts`, `testes/pecas-de-texto.test.ts`, `testes/aviso-do-rascunho.test.ts`, `testes/modelo-de-texto.test.ts` e o que mais o `grep` achar.

**Interfaces:**
- Consome: `FaixaCurta`/`PaginaDeTexto` sem `icone` (Tarefa 1).
- Produz: `iconeDaPagina` **apagada**; `AtalhoDaAssociacao` (ou o nome que estiver em `lib/associacao.ts:26`) **sem** o campo `icone`.

- [ ] **Passo 1: Os testes que falham primeiro**, por renderização:
  - **números da home:** nenhum `ladrilho-icone`, nenhum `svg`; o número e o rótulo continuam;
  - **missão, visão e valores**, na home e em A Associação: nenhum `ladrilho-icone`;
  - **Quem somos:** o bloco da sede sem `ladrilho-icone`; o botão "Como chegar" mantém o svg dele;
  - **Saiba mais:** nenhum `ladrilho-icone`; a seta do link continua;
  - **Fale com a AMI:** nenhum `ladrilho-icone`; os três botões mantêm os svgs;
  - **página de texto:** "Atualizado em" sem `svg`; o quadro de aviso sem `svg`.

  Rode e veja falhar.
- [ ] **Passo 2: Tire os ladrilhos e os ícones de enfeite**, e o CSS que só servia a eles:
  - nos números da home, inclusive o efeito de mouse que mexia no ladrilho, em `NumerosDaAmi.module.css:62`;
  - em missão, visão e valores: apague o mapa `ICONES` de `PrincipiosDaAmi.tsx`;
  - no ladrilho da sede, em Quem somos;
  - em Saiba mais;
  - em Fale com a AMI: o ladrilho do título, não os botões;
  - no relógio e no "i" da `FaixaDoTexto`.

  Ajuste o `gap`, a margem ou a grade que reservava o lugar do ladrilho, para o texto começar onde o bloco começa.
- [ ] **Passo 3: Apague os dados que sobraram:**
  - o campo `icone` dos atalhos em `lib/associacao.ts`;
  - `iconeDaPagina` em `lib/paginaDeTexto.ts`.

  Atualize os testes de função que os conferiam.
- [ ] **Passo 4: Cartão desequilibrado.** A 1440, 980, 768 e 390, compare a altura dos cartões irmãos (missão/visão/valores, os três atalhos de "Saiba mais", os números):
  - os irmãos têm de continuar com a mesma altura entre si;
  - o texto começa no alto do cartão, a 0px da borda interna de cima;
  - nada de espaço vazio onde o ladrilho estava.

  Se um cartão ficar estranho, conserte com o espaço interno dele (spec, seção 3), sem enfeite. Anote as alturas no relatório.
- [ ] **Passo 5: Atualize os testes antigos.** Depois, prove por mutação cada asserção nova.
- [ ] **Passo 6: Meça a home e A Associação** em produção, com as duas chaves:
  - o `--ritmo` entre os blocos não mudou: compare a distância entre as seções com o antes;
  - x=172;
  - nada passa da borda a 375 e a 390.
- [ ] **Passo 7: Commit.** `grep` dos comentários, os três comandos verdes, `git add` arquivo por arquivo. Mensagem: `Sem icones na home, em A Associacao e nas paginas de texto: saem os ladrilhos dos numeros, de missao visao e valores, de Quem somos, Saiba mais e Fale com a AMI, o relogio de Atualizado em e o i do aviso; iconeDaPagina sai`.

---

### Task 3: Especialidades, contato e o autor da notícia

**Arquivos:**
- Modificar:
  - das especialidades: `components/especialidades/GradeDeEspecialidades.tsx` e `.module.css`, `lib/especialidades.ts` (`iconeDaEspecialidade`);
  - do contato: `components/contato/CanaisDeContato.tsx`, `components/contato/SedeDaAmi.tsx`, `components/contato/Contato.module.css`, `lib/paginaDeContato.ts` (o campo `icone`);
  - do autor: `components/editorial/AutorDaNoticia.tsx` e a regra `.autorFim :global(.ladrilho-icone)` em `components/editorial/PaginaDeTexto.module.css`.
- Testes: `testes/indice-de-especialidades.test.ts`, `testes/especialidades.test.ts`, `testes/contato-funcoes.test.ts`, `testes/contato-na-tela.test.ts`, `testes/noticia-aberta.test.ts`, `testes/lista-de-noticias.test.ts` e o que mais o `grep` achar.

**Interfaces:**
- Consome: as Tarefas 1 e 2.
- Produz: `iconeDaEspecialidade` **apagada**; o canal de contato (`lib/paginaDeContato.ts:17`) **sem** `icone`.

- [ ] **Passo 1: Os testes que falham primeiro**, por renderização:
  - **grade de especialidades:** nenhum `ladrilho-icone`; cada cartão tem o nome, o número de médicos e a seta (um `svg`);
  - **contato:** os canais e a sede sem `ladrilho-icone`; os botões "Ligar" e "Abrir o Instagram" e o "Como chegar" mantêm o svg;
  - **autor no fim da notícia:** sem `ladrilho-icone`; "Ver perfil" mantém a seta.

  Rode e veja falhar.
- [ ] **Passo 2: Tire os ladrilhos e o CSS deles.** Apague:
  - `iconeDaEspecialidade` e os testes dela;
  - o campo `icone` dos canais.

  Ajuste o espaço que o ladrilho reservava.
- [ ] **Passo 3: A grade de especialidades.** Confira a 1440, 1180, 980, 768, 390 e 375:
  - os 14 cartões continuam do mesmo tamanho entre si, na mesma fileira;
  - o nome começa no alto do cartão;
  - o número de médicos e a seta não se descolam do nome;
  - no celular, a lista continua legível e nada passa da borda.

  Anote as alturas antes e depois.
- [ ] **Passo 4: O contato.** No tablet, os cartões de canal viram linhas: confira que a linha não ficou com um buraco à esquerda. A sede continua com o endereço ao lado da foto.
- [ ] **Passo 5: Atualize os testes antigos.** Depois, prove por mutação cada asserção nova.
- [ ] **Passo 6: Commit.** Mensagem: `Sem icones nas especialidades, no contato e no autor da noticia: saem os ladrilhos dos 14 cartoes, dos canais, da sede e do fecho do contato e do autor; iconeDaEspecialidade e o icone dos canais saem`.

---

### Task 4: Limpeza, trava da regra, auditoria e fotos de depois

**Arquivos:**
- Modificar:
  - `components/base/IconeServidor.tsx`: apague `LadrilhoIcone` e os ícones fora da lista final;
  - `components/base/Icone.tsx`: apague a prop `duotone` de `PropsDoIcone` e de `desenharIcone`;
  - `app/globals.css`: apague `.ladrilho-icone`, `.ladrilho-icone--pequeno` e o comentário das linhas 540 e seguintes que fala do degradê do ladrilho;
  - qualquer CSS que ainda cite `ladrilho-icone`, `vidro` ou `selo`.
- Testes: `testes/icones.test.ts`, que deixa de testar o ladrilho e o duotone e ganha a trava; `testes/base-visual.test.ts` e `testes/cabecalho.test.ts`, se citarem o ladrilho.

**Interfaces:**
- Consome: as Tarefas 1 a 3. Depois delas, `grep -rn "LadrilhoIcone\|duotone" app components lib` só pode achar `components/base/`.
- Produz: os mapas finais.
  - **Cliente:** `lupa`, `seta`, `anterior`, `proximo`, `pausar`, `retomar`, `menu`, `fechar`, `telefone`, `whatsapp`, `abaixo`.
  - **Só no servidor:** `setaDiagonal`, `comoChegar`, `voltar`, `celular`.

- [ ] **Passo 1: A trava que falha primeiro**, em `testes/icones.test.ts`:

```ts
const PERMITIDOS_NO_CLIENTE = ["lupa", "seta", "anterior", "proximo", "pausar", "retomar", "menu", "fechar", "telefone", "whatsapp", "abaixo"];
const PERMITIDOS_SO_NO_SERVIDOR = ["setaDiagonal", "comoChegar", "voltar", "celular"];

describe("a regra: icone so em botao, link ou controle", () => {
  it("o mapa do cliente tem so os nomes permitidos", () => {
    expect(Object.keys(mapaDoCliente).sort()).toEqual([...PERMITIDOS_NO_CLIENTE].sort());
  });
  it("o mapa de servidor tem so os permitidos", () => {
    // lê os nomes de `mapaDeTodos` em IconeServidor.tsx (ligação de módulo, Ruling 11)
    // e compara com PERMITIDOS_NO_CLIENTE + PERMITIDOS_SO_NO_SERVIDOR
  });
  it("nenhum arquivo de app/ ou components/ usa LadrilhoIcone, ladrilho-icone ou duotone", () => {
    // varre os .tsx, .ts e .css de app/ e components/, sem comentarios, e espera zero ocorrencias
  });
});
```

  Escreva os dois corpos que estão em comentário. Para os arquivos, aproveite a varredura que o arquivo já tem (as funções perto da linha 209). Rode e veja falhar.
- [ ] **Passo 2: Apague** `LadrilhoIcone`, os ícones fora da lista (com os imports do Phosphor), o `duotone` e o CSS global do ladrilho.
  - Apague também os testes de `icones.test.ts` que só existiam para o ladrilho e o duotone (as linhas 77, 162, 169 e 175, mais ou menos).
  - O teste "cada nome desenha o ícone Phosphor dele" (linha 82) passa a cobrir só os nomes que ficaram.
  - Atualize o comentário do topo de `Icone.tsx` e de `IconeServidor.tsx`: nada de "os dos ladrilhos" nem "os das especialidades".
- [ ] **Passo 3: Rode tudo.** Depois, prove por mutação as três asserções da trava:
  - ponha um nome a mais no mapa do cliente;
  - ponha um a mais no mapa do servidor;
  - ponha um `duotone` num componente qualquer.
- [ ] **Passo 4: O peso.** Depois do `npm run build`, anote o tamanho do JavaScript comum a todas as páginas (o arquivo compartilhado de `.next/static/chunks/`) e compare com o da `main`. Ele não pode crescer.
- [ ] **Passo 5: A varredura de svg.** Em produção, com as duas chaves, nas 13 páginas públicas e num perfil de médico: todo `<svg>` do HTML tem de estar dentro de `a`, `button`, `label` ou de um controle (`[role=button]`, `summary`).
  - As exceções que ficam: o logotipo (o svg da marca no topo e no rodapé) e o símbolo da marca na notícia sem capa.
  - Liste no relatório qualquer outro svg encontrado e o motivo.
- [ ] **Passo 6: A auditoria.** Com `scripts/auditoria-visual.js`, as 13 páginas e um perfil, nas 8 larguras (1920, 1440, 1180, 1024, 980, 768, 390 e 375), com a chave ligada e desligada:
  - alinhamento x=172;
  - irmãos alinhados;
  - o ritmo;
  - nada cortado;
  - nenhuma moldura fora da demonstração;
  - toda página abre no topo.

  Anote os números no relatório.
- [ ] **Passo 7: As fotos de depois.** As mesmas da Tarefa 1, Passo 1, com a chave padrão, em `.superpowers/sdd/2026-10-05-sem-icones-decorativos/fotos/depois/`, com os mesmos nomes. Para cada par, monte uma imagem lado a lado (antes à esquerda, depois à direita, a 1440 e a 390) em `.superpowers/sdd/2026-10-05-sem-icones-decorativos/fotos/comparar/{pagina}.png`.
- [ ] **Passo 8: Commit.** Derrube a 3300 pelo PID e refaça o build com a chave padrão. Mensagem: `Trava da regra sem icones decorativos: LadrilhoIcone, duotone e os icones sem uso saem; os mapas so tem os icones de botao, link e controle, e um teste trava`.
