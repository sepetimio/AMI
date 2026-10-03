# Encontre um médico: busca e perfil (fatia B, grupo 1)

**Data:** 03/10/2026. **Ramo:** `paginas-encontre`, criado a partir de `redesign-visual` (a fatia A, a home, que ainda não foi juntada à `main`).

**Desenho aprovado:** `docs/desenho-aprovado/encontre/busca.html` e `perfil.html`, com fotos em jpg na mesma pasta. O cliente aprovou com "gostei, pode aplicar igual está ali". O desenho manda: este documento registra as decisões que o desenho não mostra sozinho.

**Base:** a spec da reforma visual (`2026-10-03-redesign-visual-design.md`) continua valendo para tokens, fontes, botões, réguas, acessibilidade e a trava de demonstração.

## 1. O que o cliente decidiu

1. **A cabeceira das páginas internas sai.** É o topo cinza com o logotipo grande ao fundo (`components/layout/Cabeceira.tsx`), que ele recusou duas vezes. A busca abre com a faixa verde com textura. O perfil abre com a foto e o nome direto sobre o fundo.
2. **Só associados aparecem no site, e a planilha da AMI só terá associados.**
   - Saem do site: o filtro "Somente associados", o selo "Associado AMI" e o parâmetro `associados` da URL.
   - O dado `associadoAmi` continua no banco e no painel. O site deixa de lê-lo para exibir.
3. **Cartão do médico:** só foto, nome, a linha "MÉDICO · CRM/UF nnnnn", a especialidade principal com RQE (quando houver) e o botão "Ligar". Nada de bairro, selo, telemedicina ou acessibilidade.
4. **Forma do cartão (opção C):**
   - **No computador:** retrato, com a foto 4:5 no alto. São 4 por linha a partir de 1180px, 3 até 1179px e 2 até 980px.
   - **No celular (até 700px):** cartão deitado, um por linha, com a foto de 116px (112px a 375) cobrindo a lateral esquerda de cima a baixo.
5. **Todos os médicos terão foto.** Enquanto não houver foto, o espaço mostra as iniciais em Bricolage na cor lima, sobre o verde com textura e brilho. É o cartão "Diego Aragão" do desenho.
   - Esse estado não é uma moldura "a entrar": ele aparece também fora do modo demonstração, porque é o estado real de quem ainda não mandou foto.
   - O envio de foto pelo painel é uma fatia à parte e NÃO entra aqui. Ela precisa do armazenamento de arquivos do Supabase, que ainda não está configurado.
6. **Filtros da busca:** só a caixa "Nome ou especialidade" e a lista "Todas as especialidades".
   - Saem: bairro, telemedicina, acessibilidade, associados e ordenação.
   - A ordem é sempre alfabética, e a página diz isso ("Em ordem alfabética").
7. **Bairros saem do site.**
   - Na home:
     - sai o bloco "Escolha o seu bairro";
     - a faixa branca do fim fica só com "Quem caminha com a AMI" (os parceiros), que aparece só no modo demonstração;
     - a faixa de números fica com três: anos de AMI, médicos e especialidades. O quarto número, "bairros atendidos", e o botão "Ver bairros" saem.
   - Sai o link "Bairros" do rodapé.
   - Saem as páginas de especialidade por bairro (`/medicos/[especialidade]/[bairro]`). O endereço antigo leva, com redirecionamento permanente, à página da especialidade.
   - Saem a lista de bairros de `/medicos` e de `/medicos/[especialidade]`, e a entrada desses endereços no `sitemap`.
   - O bairro continua existindo como parte do ENDEREÇO do consultório no perfil, e como título do cartão de cada consultório.
8. **Telemedicina e acessibilidade deixam de aparecer no site.** Os dados continuam no banco e editáveis no painel.
9. **Perfil:**
   - **Topo:** foto 4:5 ao lado do nome, do CRM, da especialidade com RQE e dos botões do consultório principal: "Ligar" e "WhatsApp".
   - **"Onde atende":** um cartão por consultório, com o endereço completo e os botões Ligar, WhatsApp e Como chegar.
   - **"Sobre":** a biografia.
   - **"Outros médicos de {especialidade}":** os mesmos cartões da busca.
   - **Nota final:** "As informações desta página são fornecidas pelo profissional e revisadas pela Associação Médica de Imperatriz. Conteúdo informativo; não substitui a consulta médica."

## 2. Decisões que o desenho não fixa sozinho

| Situação | Decisão |
|---|---|
| Busca por texto | Vai por formulário (Enter ou "Buscar") para `/busca?termo=`, como a busca da home. **Não** filtra enquanto se digita: o desenho filtra no navegador porque é estático; no site, a busca é do servidor e fica no endereço. |
| Escolher especialidade | Ao mudar a lista, a página vai para `/busca?especialidade=<slug>` (somado ao `termo`, se houver). Sem JavaScript, um botão "Aplicar" dentro do `<noscript>` envia o formulário. |
| A especialidade escolhida | Aparece "Filtro: Cardiologia ×" na faixa. O × é um link para a mesma busca sem `especialidade`. A contagem passa a dizer "3 médicos em Cardiologia". |
| A lista mostra contagem | "Cardiologia (3)", vinda de `especialidadesComContagem`. Especialidade sem médico não aparece. |
| Endereços antigos com `bairro`, `telemedicina`, `acessibilidade`, `associados` ou `ordem` | São ignorados. A busca abre sem esses filtros, sem erro e sem redirecionamento. |
| Nenhum resultado | "Nenhum médico encontrado" e o botão "Limpar a busca", que leva a `/busca`. |
| Cartão inteiro clicável | O nome é o link do perfil, e um `::after` estica o alvo pelo cartão. O "Ligar" fica por cima (`z-index`) e liga. |
| Médico sem telefone em nenhum consultório | O cartão fica sem o botão "Ligar". Para os cartões continuarem alinhados, o espaço do botão é mantido. |
| "Outros médicos de X" | Até 4, da mesma especialidade principal, sem o próprio médico, em ordem alfabética. Com 0, a seção não aparece. Com 1 a 3, aparece com os que houver, como no desenho. Termina com o link "Ver todos de X" (`/medicos/[especialidade]`). |
| Consultório sem WhatsApp | O botão "WhatsApp" não aparece. Sem telefone, o "Ligar" não aparece. "Como chegar" aparece sempre que houver endereço. |
| "Como chegar" | Abre `https://www.google.com/maps/search/?api=1&query=<endereço completo, codificado>`. Não precisa de chave nem de serviço novo. |
| WhatsApp | `https://wa.me/55<número só com dígitos>`. |
| Barra do pé no perfil (celular) | Mostra "Ligar" (verde) e "WhatsApp" (branco) do consultório principal. Aparece quando os botões do topo saem da tela. Sem telefone no consultório principal, volta a barra padrão. |
| Barra do pé na busca (celular) | A barra padrão. Aparece quando a faixa verde sai da tela. |
| "MÉDICO · CRM" | Continua "MÉDICO" para todos, como hoje. A forma para médicas ("MÉDICA") depende de confirmação da AMI à luz da Resolução CFM. |
| Biografia vazia | A seção "Sobre" não aparece. |
| Rótulo acima do nome no perfil | O link "← ENCONTRE UM MÉDICO", que volta para `/busca`. O breadcrumb atual sai. |
| Linha abaixo dos botões do topo do perfil | "Consultório em {bairro} · {telefone} · ver os N endereços". O "ver os N endereços" só aparece com mais de um consultório e leva a `#onde-atende`. |
| Fotos | `medico.foto` (URL). Com foto, `<img>` com `sizes` coerente com a largura desenhada (lição da fatia A). Sem foto, as iniciais. Nenhuma imagem da lista é `lazy` acima da primeira dobra; as outras são `lazy`. |

## 3. Defeito que entra junto

**As páginas internas abrem roladas para baixo** ao chegar pelo menu. Medido em 03/10/2026:

| Página | Rolagem ao abrir |
|---|---|
| `/busca` | 456px |
| `/medicos` | 427px |
| `/associacao` | 392px |
| `/contato` | 282px |
| `/noticias` | 182px |

A home abre em 0. A causa está na `Cabeceira`, que usa `-mt-32` para entrar por baixo do cabeçalho preso, e no jeito como o Next posiciona a página nova ao trocar de rota.

A busca e o perfil deixam de usar a `Cabeceira`. As outras páginas continuam com ela até o desenho de cada grupo. Por isso a correção tem dois requisitos:

- vale para TODA página interna, e não só para as duas novas;
- tem um teste que mede `scrollY === 0` depois de navegar pelo menu (no navegador, na conferência), mais um teste de código que trava a causa.

## 4. Fora do escopo

- O envio de fotos pelo painel (fatia à parte, com armazenamento).
- O desenho dos outros grupos: Especialidades, A Associação, Notícias, Contato e textos legais. Neste grupo, essas páginas só perdem a lista de bairros e ganham a correção da rolagem.
- O painel. Ele continua editando associado, telemedicina e acessibilidade.

## 5. Como provar

- **Ruling 11 da fatia A:**
  - componente se testa por renderização;
  - lógica, por função pura (URL dos filtros, "outros médicos", links de mapa e WhatsApp, iniciais);
  - CSS e ligação com o navegador se travam pela leitura do texto.
- **Auditoria visual** (`scripts/auditoria-visual.js`, ampliada para `/busca` e `/medico/{slug}`) nas 8 larguras, com a chave verdadeira e com a falsa. Ela confere:
  - nada passa da borda;
  - os botões "Ligar" de cada fileira ficam na mesma altura;
  - o texto alinha com o logotipo;
  - o espaço entre blocos é igual;
  - há um único `h1`;
  - nenhuma página abre rolada.
- **Fotos das páginas construídas** comparadas com as do desenho aprovado, seção por seção.
- **Contraste do texto:** pelo menos 4,5:1.
