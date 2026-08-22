# Painel da agência, fatia 1 — desenho

Data: 22/08/2026
Situação: aprovado seção a seção, aguardando revisão do documento
Especificação de origem: [seção 8 do desenho da Fase 1](2026-08-19-site-ami-diretorio-design.md)

## 1. O que esta fatia cobre

Entrar no painel e **editar um médico**: autenticação, políticas de escrita no banco, lista
de médicos e o formulário dos campos do próprio médico, mais pôr e tirar do ar um a um.

O painel inteiro não cabe num documento só. São dez seções na especificação de origem, mais
autenticação e mais políticas. A divisão:

| Fatia | O que entrega |
|---|---|
| **1 (esta)** | Entrar, listar, publicar e despublicar, e editar os campos do médico |
| 2 | Estabelecimentos, locais e horários, especialidades, diretoria, comunicados, anuidades |
| 3 | Fila de revisões e o "Atualizar meus dados" no rodapé do perfil |

Cada uma com sua especificação, seu plano e sua execução.

**Fora desta fatia:** área do associado (Fase 2), envio de foto, e a pré-visualização lado a
lado — que só passa a valer quando a edição cobrir endereço e horário.

## 2. Duas armadilhas medidas antes de o desenho existir

Este projeto roda um Next.js cujo `AGENTS.md` avisa: as APIs podem diferir do que está no
treinamento de qualquer assistente. As duas descobertas abaixo foram **medidas**, e as duas
batem exatamente em cima de autenticação.

**`middleware.js` foi renomeado para `proxy.js`.** A documentação do Next instalado
(`03-file-conventions/middleware.md`) marca o nome antigo como descontinuado. Todo tutorial
de autenticação com Supabase na internet diz `middleware.ts` — e um `middleware.ts` no Next
16 é só um arquivo que ninguém chama. Falha em silêncio.

**`setAll` recebe um segundo argumento.** Em `@supabase/ssr@0.12.4`, a assinatura é
`setAll(cookies, headers)`, e o tipo documenta por quê:

> Respostas que gravam cookie de autenticação não podem ser cacheadas por CDN ou proxy
> reverso, senão o token de sessão de um usuário é servido a outro.

São cabeçalhos de "não guarde isto" que precisam ir na resposta junto dos cookies. Omitir não
dá erro nenhum — só cria a chance de a sessão de uma pessoa vazar para outra.

Medido também: o mesmo cliente expõe `signInWithPassword` e `signInWithOtp`. A senha de agora
e o link por e-mail da Fase 2 saem da mesma montagem, sem retrabalho.

## 3. Decisões tomadas, e por quê

| Decisão | Motivo |
|---|---|
| Entrada por e-mail e senha, não por link no e-mail | O motivo que a especificação de origem deu para o link — "500 pessoas que entram três vezes por ano" — é sobre a área do associado. O painel tem três contas. E link por e-mail exige contratar e configurar envio: o embutido do Supabase é limitado a poucos por hora e não serve para produção |
| Ninguém se cadastra sozinho | As contas nascem no painel do Supabase, por quem tem acesso a ele |
| Conta sem linha em `perfil_usuario` não é ninguém | Entra e não vê nada, porque política nenhuma a reconhece. É a trava contra uma conta criada por caminho não previsto |
| A sessão do usuário é quem escreve, não uma chave privilegiada | É o que a especificação de origem já fixou: permissões como políticas no banco, não como regra de tela. E a Fase 2 põe 500 médicos editando o próprio cadastro — com a permissão na tela, "cada um só mexe no seu" vira um `if` repetido quinhentas vezes |
| Nenhuma chave privilegiada no site publicado | A do importador continua só na máquina do desenvolvedor. O painel não ganha nenhuma |
| A conferência de permissão fica em cada página, nunca no layout | O guia do Next 16 manda: layout não roda de novo a cada navegação, e proteger no layout deixa buraco entre telas |
| `getUser()`, nunca `getSession()` | O segundo lê o cookie e acredita nele; o primeiro confere com o servidor de autenticação. Para três pessoas, a ida a mais na rede não custa nada |
| O `proxy` só vale para `/painel` | O site público é gerado estaticamente com revalidação de uma hora, e cookie de sessão em resposta cacheável é o caminho mais curto para servir a sessão de uma pessoa a outra |
| Nenhuma política de remoção, em tabela nenhuma | Com a segurança ligada e sem política de `delete`, o Postgres recusa remoção de qualquer pessoa por qualquer caminho. Despublicar é `publicado = false`, e o dado fica |
| O `slug` do perfil aparece e não edita | Mesma regra que o importador respeita: URL indexada pelo Google não muda |
| Sem biblioteca de validação nova | O projeto não tem nenhuma, e esta fatia tem três regras |

## 4. Modelo de dados

Uma tabela nova, pequena de propósito.

```sql
create table perfil_usuario (
  id              uuid primary key references auth.users (id) on delete cascade,
  papel           text not null check (papel in ('admin', 'associado')),
  profissional_id bigint references profissional (id) on delete set null,
  criado_em       timestamptz not null default now(),
  -- Associado é sempre associado de alguém. Admin não precisa ser médico.
  check (papel <> 'associado' or profissional_id is not null)
);
```

É a ponte entre a conta e o papel. O papel `associado` entra agora embora só a Fase 2 o use:
custa uma palavra hoje e evita migração depois.

**As linhas nascem por SQL**, coladas no editor do Supabase, como o resto da instalação deste
projeto. **Não existe política de escrita nesta tabela, nem para admin.** Quem pode dar papel
de admin é quem tem acesso ao banco, e é só isso. Painel de gerenciar usuários é tela a mais
para três pessoas; se um dia forem trinta, aí vale.

## 5. O caminho da sessão

Passam a existir três clientes, e a separação é o ponto:

| Cliente | Chave | Onde |
|---|---|---|
| `lib/dados/cliente.ts` | pública, anônima | o site público. **Não é tocado** |
| `lib/painel/servidor.ts` | pública + sessão do usuário | dentro de `/painel` |
| `proxy.ts` | pública + sessão | renova o cookie a cada requisição de `/painel` |

Nenhum deles usa chave privilegiada. Quem dá poder de escrita ao painel é a identidade da
pessoa logada.

**`lib/painel/sessao.ts` é a camada que decide.** `exigirAdmin()` busca o usuário com
`getUser()`, lê `perfil_usuario`, e desvia para a tela de entrar quando não for admin. Toda
página do painel a chama; nenhuma confia no layout.

O `proxy` faz só o desvio otimista — sem cookie, vai para `/painel/entrar` — e renova a
sessão. É o que o guia do Next manda: ele roda em toda rota, inclusive nas pré-carregadas, e
por isso não pode consultar banco.

O caminho inverso — logado e na tela de entrar, de volta para `/painel` — não existe, de
propósito. Ele formava um laço com o desvio de `exigirAdmin()`: uma conta sem linha em
`perfil_usuario` ia para a tela de entrar, o `proxy` a mandava de volta para `/painel`, e
`exigirAdmin()` recomeçava o ciclo, sem escapatória pelo aplicativo.

## 6. As políticas

Uma migração nova, `0005_painel.sql`, com três partes.

**A função que responde quem está pedindo:**

```sql
create function eh_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp
  as $$ select exists (
    select 1 from perfil_usuario where id = auth.uid() and papel = 'admin') $$;
```

`security definer` é obrigatório pelo mesmo motivo que já obrigou em `local_publicado`
(`0002_rls.sql`): sem ele, a política que consulta `perfil_usuario` dispara a política de
`perfil_usuario`, e recursa. `pg_temp` entra no fim do caminho de busca pelo mesmo motivo nas
duas funções: sem ele listado, o Postgres procura o esquema temporário da sessão antes de
tudo para nome de relação, e uma tabela temporária homônima sombrearia a real dentro de uma
função que roda como dona. `local_publicado` nasceu em `0002_rls.sql` sem essa proteção; a
migração desta fatia a corrige com um `create or replace function`, porque migração já
aplicada não se edita.

**Admin passa a enxergar o que não está publicado.** A política existente diz
`using (publicado = true)`; entra uma segunda, `using (eh_admin())`. Políticas somam, então
nada afrouxa para o visitante. Vale para `profissional` e para as sete tabelas que dependem
dele — `profissional_especialidade`, `formacao`, `estabelecimento`, `local`,
`local_acessibilidade`, `atendimento`, `horario` — porque a lista precisa mostrar
especialidade e bairro de quem ainda não está no ar.

**Admin passa a poder gravar em `profissional`**, com `insert` e `update`. Só nesta tabela
nesta fatia.

**E nenhuma política de `delete`, em lugar nenhum.** É a mesma regra que o importador tem
como teste, aqui garantida pelo Postgres em vez de por disciplina.

`perfil_usuario` também recebe segurança de linha, com uma política só: cada conta lê a
própria linha.

## 7. As telas

`/painel` fica fora do layout do site, como `/studio` já fica.

```
proxy.ts                          desvio otimista, só em /painel
lib/painel/servidor.ts            cliente com a sessão
lib/painel/sessao.ts              exigirAdmin()
lib/painel/medico.ts              validação pura e "o que falta"
app/painel/entrar/page.tsx        entrar
app/painel/page.tsx               lista
app/painel/medico/[id]/page.tsx   edição
```

**Entrar.** E-mail e senha, com erro genérico — "e-mail ou senha não conferem", nunca dizendo
qual dos dois. A forma que o Next 16 pede para trazer erro à tela foi medida em
`02-guides/forms.md`: `useActionState`, com a ação recebendo `(estadoAnterior, formData)` e
devolvendo `pending` junto.

**Sair.** Um botão na casca do painel, que chama `signOut()` e limpa os cookies. Sem ele, a
única forma de encerrar a sessão é esperar ela expirar — e num computador compartilhado da
sede da AMI isso não é aceitável. A duração da sessão fica no padrão do Supabase; mexer nela
é decisão para quando houver mais de três contas.

**O painel não é indexável, e isso tem duas trancas.** `app/robots.ts` já lista `/painel/` em
`disallow` desde antes desta fatia existir, com o comentário dizendo que é "a segunda tranca".
A primeira ainda não existe: o layout do painel precisa declarar `robots: { index: false }`
no `metadata`, como o Studio já faz pelo próprio next-sanity. Entra nesta fatia.

**Lista.** Busca por nome ou CRM, cinquenta por página. Colunas: nome, CRM, especialidade
principal, bairros, e **no ar ou não** — que é o ponto da tela, porque é a única superfície
onde o médico despublicado existe. Um botão por linha para pôr ou tirar do ar.

**Edição.** Nome, CRM, UF, telemedicina, situação, biografia e data de verificação. O
endereço do perfil aparece e não edita, com a razão escrita ao lado. Foto fica de fora: envio
de arquivo é armazenamento, e armazenamento tem políticas próprias.

Um medidor pequeno do que falta — sem especialidade, sem endereço, sem biografia. Só
informação, sem botão.

**A validação reaproveita `UFS` de `lib/importador/tipos.ts`.** É um `import` de um módulo
puro, na direção permitida. O nome do lugar destoa, e é o preço de não refatorar por uma
constante; se um terceiro consumidor aparecer, ela muda de casa.

### O detalhe que quase passou

O site público não descobre sozinho que alguém entrou no ar: as páginas revalidam de hora em
hora. Publicar um médico e não vê-lo por sessenta minutos leva à conclusão de que o botão não
funcionou.

Medido em `04-functions/revalidatePath.md`, inclusive a forma com grupo de rota:

```ts
revalidatePath("/(site)", "layout")
```

Toda página sob o layout do site é invalidada na próxima visita. É pesado e é o certo:
publicar um médico mexe na home, no índice, na página da especialidade, na do bairro e no
perfil — e listar as cinco à mão é lista para ficar desatualizada.

`app/sitemap.ts` fica na raiz de `app/`, fora do grupo `(site)` — medido, não suposto — e por
isso a invalidação acima não o alcança. Entra uma segunda chamada,
`revalidatePath("/sitemap.xml")`, só para ele. Isso acontece algumas vezes por dia, não por
segundo.

### O que "publicar" não faz

Pôr um médico no ar **não levanta a trava de indexação**. Enquanto
`NEXT_PUBLIC_DADOS_DEMONSTRACAO` for `true`, o `robots.txt` responde `disallow: /` e o site
inteiro segue invisível para o Google — o médico aparece para quem abre o endereço, e não
aparece na busca. Quem levanta a trava é a variável de ambiente, e ela é o último passo antes
do lançamento, depois do cadastro real carregado.

A distinção importa porque as duas coisas parecem a mesma na tela, e alguém vai concluir que
publicou o site quando publicou um perfil.

## 8. Como isto é verificado

Três camadas, e cada uma alcança uma coisa diferente.

**Testes automáticos, em `testes/`.** Só a parte pura: validação dos campos e o cálculo do
que falta. É pouco, e é o que dá para testar sem banco.

**`supabase/testes-rls.sql`.** É o que mais importa, porque política de banco é a parte mais
fácil de errar e o erro é silencioso. Um arquivo colado no editor do Supabase que finge ser
cada tipo de usuário, uma asserção por linha:

- visitante anônimo continua não vendo médico despublicado
- admin vê
- visitante não grava
- admin grava
- **ninguém apaga**, nem o admin
- conta sem linha em `perfil_usuario` entra e não vê nada
- conta sem linha em `perfil_usuario` não grava
- ninguém se promove a admin

**Conferência à mão, uma vez, escrita no plano.** Entrar, achar um médico despublicado, pôr
no ar, abrir o site numa janela anônima e ver que apareceu; tirar, e ver que sumiu. É o que
prova a corrente inteira — sessão, política, gravação e invalidação — e nenhuma das duas
camadas acima prova sozinha.

## 9. Pendências e riscos

- **Política de banco não tem teste automático neste projeto.** Os testes rodam em memória,
  sem banco. `supabase/testes-rls.sql` é a resposta, e ele depende de alguém rodá-lo
- **A primeira conta de admin precisa ser criada à mão** no painel do Supabase, e a linha de
  `perfil_usuario` colada no editor SQL. O plano traz os passos numerados
- **`revalidatePath("/(site)", "layout")` invalida o site inteiro a cada publicação.** Aceito
  para algumas vezes por dia; se o painel virar uso intenso, vira invalidação por etiqueta
- **Envio de foto e a pré-visualização lado a lado ficam para a fatia 2**
