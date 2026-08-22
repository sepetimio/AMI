# Como remontar o ambiente

A máquina se perdeu, e agora? Este documento responde só a isso: de qual tela
de qual serviço vem cada variável, e o que fazer se a máquina foi
comprometida. "É só reconfigurar" é fácil de escrever e ruim de descobrir
sozinho às onze da noite.

---

## 1. O que não se perde

| Onde vive | O quê |
|---|---|
| GitHub, `sepetimio/AMI` | Todo o código |
| Supabase | O cadastro médico — profissionais, especialidades, endereços, bairros |
| Sanity | O conteúdo editorial — notícias, páginas institucionais, diretoria de texto |

**O único arquivo fora do versionamento é `.env.local`, e nada dentro dele é
insubstituível.** Toda variável que ele guarda vem de um painel ou é gerada de
novo em minutos — é o que a seção 3 mostra, uma por uma.

---

## 2. Remontar do zero

1. Clonar o repositório:
   ```bash
   git clone https://github.com/sepetimio/AMI.git
   ```
2. Instalar as dependências:
   ```bash
   npm install
   ```
3. Copiar o modelo de ambiente e preenchê-lo com os valores da seção 3:
   ```bash
   cp .env.local.exemplo .env.local
   ```

`.env.local.exemplo` já traz cada variável comentada, com a mesma explicação
que está aqui — os dois documentos não deveriam divergir, mas se divergirem, o
arquivo manda: é ele que o código lê.

---

## 3. De onde vem cada variável

### Supabase — o diretório médico

`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`:

1. Entre em [supabase.com](https://supabase.com) e abra o projeto da AMI
2. No menu do projeto, clique em **Project Settings**
3. Clique em **API Keys**
4. A URL do projeto está no topo da página; a chave `anon public` está listada
   ali mesmo

`SUPABASE_CHAVE_IMPORTADOR` — usada só pelos comandos `npm run importar` e
`npm run publicar`, nunca pelo site publicado:

1. Mesma tela do passo anterior — **Project Settings** → **API Keys**
2. Na seção de chaves secretas, clique em **New secret key** e dê à chave o
   nome `importador`
3. Cole o valor gerado em `SUPABASE_CHAVE_IMPORTADOR`, em `.env.local`

   **Não é a `service_role`.** A `service_role` é a chave-mestra do projeto e
   não tem revogação isolada — comprometida, ela obriga a trocar tudo. A
   chave `importador` é dedicada: comprometida, revoga-se só ela, e nada mais
   no site é afetado

   Deixar essa variável em branco também é aceitável: sem ela, os comandos
   perguntam a chave na hora, sem ecoar o que for digitado e sem gravar nada
   em disco

### Sanity — o conteúdo editorial

`NEXT_PUBLIC_SANITY_PROJECT_ID` e `NEXT_PUBLIC_SANITY_DATASET`:

1. Entre em [sanity.io/manage](https://www.sanity.io/manage) e abra o projeto
   da AMI
2. O **Project ID** está no topo da página do projeto
3. O dataset é `production`, a menos que outro tenha sido criado

`SANITY_WEBHOOK_SECRET` — o segredo que a rota `/api/revalidar` exige para
aceitar um aviso de publicação do Studio:

1. Em [sanity.io/manage](https://www.sanity.io/manage), abra o projeto
2. Clique em **API**
3. Clique em **Webhooks**
4. Abra o webhook que aponta para o site e olhe o campo **Secret**

   Se o painel não deixar ler o valor de volta — o Sanity costuma esconder
   segredo já salvo — invente uma frase longa nova e cole a mesma frase nos
   dois lugares: aqui em `.env.local` e no campo **Secret** do webhook. Os
   dois precisam bater; qual dos dois foi definido primeiro não importa

### Valores fixos

`NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_DADOS_DEMONSTRACAO` não vêm de painel
nenhum — são valores fixos, explicados linha a linha em
`.env.local.exemplo`. Resumo: a URL pública do site, e a trava que mantém o
`robots.txt` bloqueando o Google enquanto o cadastro publicado for o de
demonstração.

Rótulo de botão muda com o tempo — o painel do Supabase e o do Sanity são
redesenhados de vez em quando. O que não muda é o caminho de telas descrito
acima; se um nome não bater exatamente, siga o caminho mesmo assim.

---

## 4. Se a máquina foi comprometida

Só a chave `SUPABASE_CHAVE_IMPORTADOR` é capaz de escrever no banco. Tudo o
mais em `.env.local` é chave pública ou segredo de webhook — vazamento deles
não abre caminho de gravação nenhum. Revogar a chave do importador é o único
passo que importa:

1. Entre em [supabase.com](https://supabase.com), abra o projeto da AMI
2. Clique em **Project Settings**
3. Clique em **API Keys**
4. Ache a chave chamada `importador` na lista de chaves secretas e apague-a

**O site não pisca.** Ele nunca usou essa chave — lê o banco com a chave
pública, que continua intacta. Quem para de funcionar é só o comando
`npm run importar`/`npm run publicar`, até uma chave nova ser criada e colada
em `.env.local`.

Se o `SANITY_WEBHOOK_SECRET` também tiver vazado, o pior caso é alguém
disparar uma revalidação de cache fora de hora — não é gravação de dado.
Trocar o valor nos dois lugares (seção 3) resolve.

---

## 5. Não guarde cópia da chave

`SUPABASE_CHAVE_IMPORTADOR` não precisa de backup em lugar nenhum. Se
`.env.local` sumir junto com a máquina, o procedimento é revogar a chave
antiga (seção 4) e criar outra — dois minutos de painel.

**Guardar uma cópia dela paga risco de vazamento para economizar esses dois
minutos.** Um segredo salvo em nota, planilha ou documento na nuvem é um
segredo que pode ser lido por quem não deveria, e o custo de um vazamento
desses é maior do que o custo de recriar a chave toda vez que a máquina for
remontada.

Se ainda assim for útil ter a chave à mão entre uma remontagem e outra, o
lugar é um gerenciador de senhas — nunca um documento na nuvem, nunca uma
nota, nunca um arquivo dentro do repositório.
