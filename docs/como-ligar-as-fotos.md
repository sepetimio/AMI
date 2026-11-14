# Como ligar as fotos dos médicos

O painel já sabe escolher, recortar e enviar a foto de um médico. Falta uma
coisa só: ligar o armazenamento de arquivos no Supabase. Isso se faz uma vez,
colando um arquivo no **SQL Editor**.

Até lá, o botão de enviar mostra: "O armazenamento de fotos ainda não foi
ligado no Supabase. Veja docs/como-ligar-as-fotos.md." Nada se perde e nada
quebra.

---

## O que este passo faz

- Cria um espaço de arquivos chamado `fotos-medicos`, aberto para leitura:
  qualquer visitante vê a foto, como já vê o nome e o CRM.
- Aceita arquivos de até 1 MB, só em WebP ou JPEG.
- Dá permissão de **enviar** foto só para quem é admin do painel.
- Não dá permissão de apagar nem de trocar arquivo. Trocar a foto grava um
  arquivo novo. **Remover foto** só tira a foto do perfil do médico; o
  arquivo antigo fica guardado. É de propósito: nada se apaga por engano.

---

## Os passos

1. Entre em [supabase.com](https://supabase.com) e abra o projeto da AMI
2. No menu da esquerda, clique em **SQL Editor**
3. Clique em **New query**
4. Abra o arquivo [`supabase/migrations/0007_fotos.sql`](../supabase/migrations/0007_fotos.sql),
   copie o conteúdo **inteiro** e cole na consulta
5. Clique em **Run**
6. Clique em **Storage**, no menu da esquerda. Confira que existe o espaço
   `fotos-medicos`, com a etiqueta **Public**
7. No painel do site, abra um médico, clique em **Escolher foto** e envie uma
   imagem. Depois abra o perfil dele no site e confira a foto

No passo 7, a foto pode levar até uma hora para aparecer no perfil público,
por causa do cache do site. Se o site for publicado de novo, aparece na hora.

---

## Rodar duas vezes não faz mal

O arquivo foi escrito para isso. Se o espaço já existe, ele não é recriado. A
permissão é apagada e criada de novo, igual. Pode rodar sem medo.

---

## Se aparecer "must be owner of table objects"

Quer dizer que a conta usada não tem poder para criar a permissão no
armazenamento.

1. **Anote a mensagem inteira**, do jeito que aparece na tela
2. **Não tente outra coisa.** Não troque de conta, não mude configuração, não
   rode outros comandos
3. Mande a mensagem para quem cuida do site

---

O nome de um botão nesta tela do Supabase pode já ter mudado quando você ler
isto. Se um nome não bater com o que você vê, confie na sequência de telas.
