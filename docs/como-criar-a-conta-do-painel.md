# Como criar a primeira conta do painel

A primeira conta de admin do painel não pode ser criada pelo próprio painel,
porque não existe admin nenhum ainda para criá-la. Ela nasce no painel do
Supabase, à mão, uma vez só. Depois disso o painel em `/painel` cuida de si
mesmo — este documento não se repete.

---

## 1. O que este documento resolve

`/painel/entrar` pede e-mail e senha de uma conta que já existe e já tem
papel de admin. Não há tela de cadastro em lugar nenhum do site: ninguém se
cadastra sozinho. A primeira conta — e qualquer conta depois dela — é criada
no painel do Supabase e recebe o papel diretamente no banco, pelos passos
abaixo.

---

## 2. Rodar a migração

O painel só existe depois que a tabela `perfil_usuario` e as políticas de
escrita estiverem criadas no banco.

1. Entre em [supabase.com](https://supabase.com) e abra o projeto da AMI
2. No menu do projeto, clique em **SQL Editor**
3. Clique em **New query**
4. Cole o conteúdo de `supabase/migrations/0005_painel.sql`
5. Clique em **Run**

Se a migração já tiver rodado antes, o Postgres recusa recriar a tabela e
avisa isso — não é preciso rodar de novo.

---

## 3. Criar a conta

1. No menu do projeto, clique em **Authentication**
2. Clique em **Users**
3. Clique em **Add user**
4. Clique em **Create new user**
5. Preencha e-mail e senha
6. Marque **Auto Confirm User**

**Por que marcar essa opção:** o projeto não tem envio de e-mail configurado.
Sem essa marcação, a conta nasce esperando uma confirmação por e-mail que
nunca chega, e fica presa nesse estado — nenhum aviso de tela conta isso. O
sintoma aparece só depois, na tentativa de entrar: `/painel/entrar` responde
"E-mail ou senha não conferem", igual ao erro de senha errada, e é fácil
gastar um tempo desconfiando da senha antes de lembrar desta marcação.

---

## 4. Descobrir o id da conta

De volta ao **SQL Editor**, **New query**, rode:

```sql
select id, email from auth.users;
```

Copie o `id` (um uuid) da conta que acabou de ser criada.

---

## 5. Dar o papel de admin

Ainda no **SQL Editor**, cole o comando abaixo trocando `<o uuid>` pelo valor
copiado no passo anterior, e clique em **Run**:

```sql
insert into perfil_usuario (id, papel) values ('<o uuid>', 'admin');
```

Sem esta linha, a conta entra (o Supabase autentica normalmente) mas nenhuma
política do banco a reconhece: `exigirAdmin()` manda de volta para
`/painel/entrar`, num laço que parece um bug e não é.

---

## 6. Conferir as políticas

Este passo prova que as políticas de segurança do banco fazem o que a
migração diz que fazem, antes de confiar a primeira conta real a elas.

1. Abra `supabase/testes-rls.sql` neste repositório
2. No topo do arquivo, troque o uuid de exemplo pelo uuid da conta de admin
   (o mesmo do passo 4)
3. Cole o arquivo **inteiro** no **SQL Editor** — ele contém um `insert` que
   promove uma conta de teste a admin dentro de uma transação, e é o
   `rollback` do fim do arquivo que desfaz isso; rodar só um trecho selecionado
   deixaria esse admin de teste para trás
4. Clique em **Run**

Esperado: a mensagem `TODAS AS ASSERCOES PASSARAM`, sem exceção nenhuma. Uma
exceção interrompe o arquivo com o nome da asserção que falhou.

---

## 7. Entrar

```bash
npm run dev
```

Abra `/painel` no navegador e entre com o e-mail e a senha criados no passo 3.

---

## 8. A conferência que prova a corrente inteira

Os passos anteriores provam a migração e as políticas isoladamente. Este
passo prova que elas funcionam juntas, do jeito que a pessoa que usa o painel
vai realmente usar:

1. Na lista de `/painel`, ache um médico marcado **fora do ar**
2. Clique em **Pôr no ar** na linha dele
3. Abra o site numa janela anônima do navegador e visite o perfil desse
   médico — ele precisa aparecer
4. De volta ao painel, clique em **Tirar do ar** na mesma linha
5. Atualize a janela anônima — o perfil precisa sumir

**Por que essa conferência existe e as outras não bastam:** ela é a única
prova de que sessão, política do banco, gravação e invalidação de cache estão
encadeadas corretamente, na ordem certa, com a conta real. Nenhum teste
automático deste projeto chega até aqui — os testes automáticos rodam em
memória, sem banco, e sem servidor de verdade por trás da janela anônima.

**O que essa conferência NÃO prova:** pôr um médico no ar não levanta a trava
de indexação do site. Enquanto `NEXT_PUBLIC_DADOS_DEMONSTRACAO` for `true`,
`robots.txt` responde `disallow: /` para o site inteiro, trava que existe
porque o cadastro de demonstração tem CRM plausível e não pode vazar para o
Google. O médico posto no ar aparece para quem abre o endereço direto — como
a janela anônima acabou de mostrar — e continua invisível na busca. As duas
coisas parecem a mesma coisa na tela do painel: nada nela avisa que a trava
de indexação segue de pé. Publicar um médico não é publicar o site; quem
vira essa chave é um passo à parte, descrito em
[`docs/estado-do-projeto.md`](estado-do-projeto.md).

---

## 9. Se algo falhar

| Sintoma | O que costuma ser |
|---|---|
| "E-mail ou senha não conferem" logo depois de criar a conta | **Auto Confirm User** ficou desmarcado no passo 3. A conta existe, mas está presa esperando uma confirmação por e-mail que este projeto não envia |
| Entrar parece funcionar e a tela volta para `/painel/entrar` de novo | A conta não tem linha em `perfil_usuario` — faltou o passo 5, ou o uuid colado estava errado |
| Entrar funciona e a lista de médicos vem vazia | A migração `0005_painel.sql` não rodou, ou rodou num projeto Supabase diferente do que `.env.local` aponta |

---

Rótulo de botão muda com o tempo — o painel do Supabase é redesenhado de vez
em quando. O que não muda é o caminho de telas descrito acima; se um nome não
bater exatamente, siga o caminho mesmo assim.
