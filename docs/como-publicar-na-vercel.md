# Como publicar o site na Vercel

A Vercel é o serviço que põe o site no ar. Depois deste guia, cada vez que o
código novo for enviado para a branch `main` no GitHub, o site se publica
sozinho.

Antes de começar, tenha à mão: a conta do GitHub onde está o repositório
`site-ami`, o painel do Supabase e o painel do Sanity
([sanity.io/manage](https://www.sanity.io/manage)). Os valores das chaves vêm
deles; este guia não traz nenhum.

---

## 1. Criar a conta

1. Entre em [vercel.com](https://vercel.com) e clique em **Sign Up**
2. Escolha o plano **Hobby**
3. Clique em **Continue with GitHub** e autorize

**Ponto para a AMI decidir:** o plano Hobby é para uso pessoal e não
comercial. A AMI deve conferir, nos termos da própria Vercel, se o uso do
site da associação cabe nele ou se o plano **Pro** é o caso. Este guia não
decide isso, e não cita preço, porque preço muda.

---

## 2. Importar o repositório

1. No painel da Vercel, clique em **Add New…**
2. Clique em **Project**
3. Ache `site-ami` na lista e clique em **Import**

Se o repositório não aparecer, a Vercel não tem acesso a ele: use o link para
ajustar as permissões do GitHub e libere o `site-ami`.

---

## 3. As variáveis

Na tela de importar, abra **Environment Variables**. Os nomes e o que cada um
é estão em [`.env.local.exemplo`](../.env.local.exemplo). Para cada uma,
escreva o nome, cole o valor e clique em **Add**.

**O que vai:**

| Nome | De onde vem |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, **Settings**, **API** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase, **Settings**, **API**: a chave **anon public** |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Topo da página do projeto em sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | `production`, a menos que outro tenha sido criado |
| `SANITY_WEBHOOK_SECRET` | Uma frase longa inventada; a mesma vai no passo 7 |
| `NEXT_PUBLIC_SITE_URL` | O domínio final, com `https://` e sem barra no fim. Até o domínio existir, o endereço `.vercel.app` |
| `NEXT_PUBLIC_DADOS_DEMONSTRACAO` | `true` |

O `true` da última deixa a trava de indexação ligada: o `robots.txt` pede
que o Google não indexe nada, porque o cadastro ainda é de demonstração. Só
vira `false` no passo 9.

**O que NUNCA vai para a Vercel:**

- **`SUPABASE_CHAVE_IMPORTADOR`**. Serve só para o comando `npm run importar`,
  na máquina de quem carrega os médicos
- **A chave `service_role` do Supabase**. Nunca, em lugar nenhum. É a
  chave-mestra do projeto e o site não precisa dela

Se alguma dessas duas aparecer na lista de variáveis da Vercel, apague.

---

## 4. Publicar

1. Clique em **Deploy**
2. Espere a construção terminar. Se falhar, a Vercel mostra o registro em
   vermelho: guarde a mensagem
3. Quando terminar, a tela mostra o endereço terminado em `.vercel.app`.
   Também fica na página do projeto, em **Domains**. Se
   `NEXT_PUBLIC_SITE_URL` ainda estiver vazia, o site usa esse endereço
   sozinho

Se você preencheu `NEXT_PUBLIC_SITE_URL` com um endereço `.vercel.app` que só
soube depois, volte em **Settings**, **Environment Variables**, corrija, e
clique em **Redeploy**.

---

## 5. O domínio

Quem comprou o domínio faz esta parte, porque só essa pessoa entra no lugar
onde ele foi comprado.

1. No projeto, clique em **Settings**
2. No menu lateral, clique em **Domains**
3. Clique em **Add Existing** e escreva o domínio
4. A Vercel mostra os registros de DNS que precisam existir: normalmente um
   registro **A** para o domínio sem `www`, e um **CNAME** para o `www`
5. Quem comprou o domínio entra no painel de onde ele foi comprado e cria
   esses registros, **copiando os valores que a Vercel mostrou**. Cada projeto
   tem os seus
6. Espere. Pode levar de minutos a horas. A Vercel mostra o estado ao lado do
   domínio

Se o domínio já tiver registros de e-mail, **não os apague**. Mude só os do
site.

Depois que o domínio funcionar, volte em **Settings**, **Environment
Variables**, troque `NEXT_PUBLIC_SITE_URL` para o domínio final e clique em
**Redeploy**.

---

## 6. Sanity: deixar o Studio abrir no novo endereço

O Studio mora no próprio site, em `/studio`. O Sanity só deixa abrir de
endereços que ele conhece.

1. Entre em [sanity.io/manage](https://www.sanity.io/manage) e abra o projeto
   da AMI
2. Clique em **API**
3. Em **CORS origins**, clique em **Add CORS origin**
4. Escreva o endereço do site, com `https://` e sem barra no fim
5. Marque **Allow credentials**
6. Salve

Faça uma vez para o domínio final e, se for usar, outra para o endereço
`.vercel.app`.

---

## 7. Sanity: o aviso de publicação

Sem este passo, uma notícia publicada só aparece no site depois de até uma
hora. Com ele, aparece na hora.

1. Em sanity.io/manage, abra o projeto, clique em **API** e em **Webhooks**
2. Abra o webhook que já existe, ou crie um novo
3. Confira cada campo:
   - **URL:** `https://` + o domínio do site + `/api/revalidar`. Exemplo de
     forma: `https://dominio-da-ami/api/revalidar`
   - **HTTP method:** `POST`
   - **Trigger on:** marque criar, atualizar e apagar (**Create**, **Update**
     e **Delete**)
   - **Filter:** vazio, ou uma lista com os tipos `"banner"`, `"noticia"`,
     `"autor"`, `"empresaParceira"`, `"textoDeEspecialidade"` e
     `"paginaInstitucional"`. Um tipo que ficar de fora não avisa o site
   - **Projection:** vazio. Assim o Sanity manda o documento inteiro. Se
     alguém preencher, tem que sair pelo menos `_type` e `slug`, por exemplo
     `{_type, slug}`
   - **Secret:** a mesma frase de `SANITY_WEBHOOK_SECRET` na Vercel. As duas
     têm que ser **idênticas**
4. Salve

**O que o site confere ao receber o aviso** (o arquivo é
[`app/api/revalidar/route.ts`](../app/api/revalidar/route.ts)):

- O pedido tem que ser `POST`.
- Tem que trazer a assinatura que o Sanity calcula com o segredo. O site
  confere. Assinatura que não bate recebe **401**.
- O corpo tem que ter `_type`. Sem ele, **400**. O `slug` é lido para saber
  qual notícia ou página invalidar.
- Se `SANITY_WEBHOOK_SECRET` não existir na Vercel, o site responde **500** de
  propósito. Um endereço de invalidação sem segredo seria aberto a qualquer
  um.

Se mudar o segredo, mude nos dois lugares e clique em **Redeploy** na Vercel,
porque a variável só vale depois de uma nova publicação.

---

## 8. Conferir

1. A página inicial abre
2. `/painel/entrar` entra com a conta do painel (ver
   [`como-criar-a-conta-do-painel.md`](como-criar-a-conta-do-painel.md))
3. `/studio` abre e deixa entrar
4. No Studio, publique uma notícia de teste. Ela aparece em `/noticias` logo
   depois. Se esperar uma hora para aparecer, o webhook do passo 7 não está
   funcionando
5. Apague ou despublique a notícia de teste

---

## 9. A trava de indexação

Enquanto o cadastro for o de demonstração, `NEXT_PUBLIC_DADOS_DEMONSTRACAO`
fica `true`. Quando o cadastro real estiver carregado (ver
[`estado-do-projeto.md`](estado-do-projeto.md)):

1. Na Vercel, clique em **Settings** e em **Environment Variables**
2. Troque `NEXT_PUBLIC_DADOS_DEMONSTRACAO` para `false`
3. Clique em **Redeploy**

O **Redeploy** é obrigatório: a variável entra na hora da construção do
site. Só trocar o valor não muda nada no ar.

---

## 10. Depois

Cada `git push` na branch `main` publica sozinho. Em outras branches, a
Vercel cria um endereço de teste, sem mexer no site oficial.

---

O nome de um botão nas telas da Vercel e do Sanity pode já ter mudado quando
você ler isto. Se um nome não bater com o que você vê, confie na sequência de
telas e no que cada clique deveria fazer.
