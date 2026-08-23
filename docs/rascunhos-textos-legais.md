# Rascunhos dos textos legais, para revisão jurídica

> **Estes textos são rascunho e não são peça jurídica.**
> Foram redigidos a partir do funcionamento real do site, para servir de
> ponto de partida à revisão por advogado de direito médico, e estão
> publicados no site com aviso visível de que não foram revisados.

Gerado de `lib/rascunhosLegais.ts`, que é a mesma fonte que o site
renderiza. **Não edite este arquivo à mão**: a correção entra no módulo, e o
documento é gerado de novo com `npx tsx scripts/gerar-doc-legal.ts`.

---

## O que foi medido neste site, e sustenta os textos

Os fatos abaixo foram verificados, não presumidos. Se algum mudar, os textos
mudam junto.

| Fato | Como foi verificado |
|---|---|
| Nenhuma página pública grava cookie | Nenhum cabeçalho `Set-Cookie` em `/`, `/medicos` e `/noticias` |
| Não há ferramenta de análise nem rastreamento | Nenhuma dependência de análise, pixel ou telemetria no projeto |
| Não há script de terceiro | Nenhum `script` externo no HTML servido |
| Não há formulário que colete dado pessoal | A busca é `GET` e envia só termo e bairro |
| Nenhuma tela pergunta sintoma ou diagnóstico | Decisão de projeto, registrada na especificação |
| O único endereço externo é o link do Instagram | É link, não carregamento: nada é requisitado antes do clique |

---

## Pontos que dependem da AMI

Estão marcados `[PROVISÓRIO]` dentro do texto, no lugar em que aparecem.

1. **Encarregado pelo tratamento de dados.** O artigo 41 da Lei 13.709/2018
   exige que o controlador designe um, e o nome e o contato precisam entrar
   na política de privacidade.
2. **Prazo de guarda dos registros de acesso do servidor.** Depende da
   empresa que hospedar o site, e precisa ser confirmado antes da publicação.

---

## Política de privacidade

**Endereço no site:** `/politica-de-privacidade`

**Resumo**, que aparece abaixo do título e na busca do Google:

> Como a Associação Médica de Imperatriz trata dados pessoais neste site, o que é coletado, por quanto tempo e quais são os seus direitos.

**Rascunho de:** 2026-08-21


### Quem é o responsável

O controlador dos dados tratados neste site é a Associação Médica de Imperatriz, associação privada, inscrita no CNPJ sob o número 06.651.376/0001-42, com sede na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA, CEP 65900-330.

[PROVISÓRIO] A AMI precisa designar formalmente um encarregado pelo tratamento de dados pessoais, como exige o artigo 41 da Lei 13.709/2018, e o nome e o contato dele entram aqui.

### O que este site não faz

Este site é um diretório de consulta pública. Ele não pede cadastro, não tem formulário de contato e não recebe mensagem de visitante.

Ele não pergunta sintoma, não pergunta diagnóstico e não recebe nenhuma informação sobre a sua saúde. Dado de saúde é dado pessoal sensível na Lei Geral de Proteção de Dados, e a decisão de projeto foi não coletar nenhum.

Não há cookie, não há ferramenta de análise de audiência, não há pixel de rede social e não há publicidade.

### O que é coletado mesmo assim

Como em qualquer site, o servidor que entrega as páginas registra dados técnicos a cada acesso. São eles:

- o endereço de IP do seu aparelho
- a data e a hora do acesso
- o endereço da página pedida
- o tipo de navegador e de sistema operacional

### Para que esses dados são usados

Exclusivamente para entregar as páginas, manter o serviço no ar e investigar falha ou abuso. Não são usados para traçar perfil, não são cruzados com outra base e não são vendidos nem cedidos.

A base legal é o legítimo interesse, previsto no artigo 7º, inciso IX, da Lei 13.709/2018: sem esse registro técnico não é possível operar nem proteger o serviço.

[PROVISÓRIO] O prazo de guarda desses registros depende da empresa que hospeda o site e precisa ser confirmado antes da publicação.

### Quando o seu navegador fala com outro serviço

As imagens das notícias são entregues por um serviço de terceiro contratado pela AMI para guardar o conteúdo editorial. Ao abrir uma notícia com imagem, o seu navegador pede o arquivo diretamente a esse serviço, e por isso ele enxerga o seu endereço de IP. Nenhum cookie é gravado nessa operação.

O site tem um link para o perfil oficial da AMI numa rede social. É apenas um link: nada é requisitado àquela rede enquanto você não clicar.

### Os dados dos médicos publicados

O diretório publica dados profissionais dos médicos associados: nome, número de inscrição no Conselho Regional de Medicina, especialidade, registro de qualificação de especialista quando houver, endereço de atendimento e telefone do consultório.

São dados de exercício profissional, de natureza pública, e a publicação atende à finalidade institucional da associação de tornar seus associados localizáveis pela população. Nenhum dado pessoal de natureza privada do médico é publicado.

O médico que queira corrigir, completar ou retirar sua informação pode pedir à AMI a qualquer momento, pelos contatos ao fim deste texto.

### Os seus direitos

O artigo 18 da Lei 13.709/2018 garante a você, entre outros, o direito de:

- confirmar se existe tratamento de dados seus e acessá-los
- corrigir dado incompleto, inexato ou desatualizado
- pedir anonimização, bloqueio ou eliminação de dado desnecessário ou tratado em desacordo com a lei
- ser informado sobre com quem a AMI compartilhou seus dados
- revogar consentimento, quando o tratamento se basear nele

### Como exercer esses direitos, e como falar sobre dados

Pelo telefone (99) 3524-3716, ou presencialmente na sede, na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA.

### Alterações

Este texto pode mudar quando o site mudar. A data de atualização aparece no alto da página, e é ela que diz qual versão você está lendo.

---

## Termos de uso

**Endereço no site:** `/termos-de-uso`

**Resumo**, que aparece abaixo do título e na busca do Google:

> As condições de uso do site da Associação Médica de Imperatriz, o que ele é, o que não é, e os limites da responsabilidade da associação.

**Rascunho de:** 2026-08-21


### O que é este site

Este site é mantido pela Associação Médica de Imperatriz, associação privada, inscrita no CNPJ sob o número 06.651.376/0001-42, com sede na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA, CEP 65900-330.

É um diretório de consulta pública, criado para que a população de Imperatriz e da região encontre médicos que atendem na cidade, com endereço e telefone.

### O que este site não é

Não é serviço de saúde, não é plataforma de agendamento e não intermedeia consulta. A AMI não marca atendimento, não participa da relação entre médico e paciente e não responde por ela.

O conteúdo publicado aqui é informativo e não substitui consulta, diagnóstico ou tratamento por profissional habilitado. Nenhuma informação deste site deve ser usada para automedicação ou para adiar procura por atendimento.

Em emergência, procure serviço de urgência ou ligue para o SAMU, no 192.

### Sem classificação e sem destaque pago

O site não atribui nota, não faz ranking e não compara profissionais entre si. Não existe posição paga nem promoção de associado.

A ordem dos resultados é definida de forma verificável: correspondência do termo buscado no nome e na especialidade, com desempate alfabético. Sem termo digitado, a ordem é alfabética.

Essa vedação atende à Resolução CFM 2.336/2023 e é decisão permanente de projeto, não configuração.

### De onde vêm os dados, e como corrigir

As informações de cada profissional são fornecidas por ele e revisadas pela AMI. Ainda assim, dado desatualizado acontece: consultório muda de endereço, telefone muda.

Confirme por telefone antes de se deslocar.

Encontrou erro? Avise a AMI. Pelo telefone (99) 3524-3716, ou presencialmente na sede, na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA.

### Uso permitido

Você pode consultar, compartilhar link e imprimir para uso próprio.

Não é permitido extrair o conteúdo em massa por meio automatizado, reproduzir a base para montar outro diretório, nem usar os dados para envio de mensagem não solicitada aos profissionais listados.

### Propriedade

A marca, o nome e a identidade visual da Associação Médica de Imperatriz pertencem a ela. Os textos assinados pertencem a seus autores.

### Alterações

Estes termos podem mudar. A data de atualização aparece no alto da página, e continuar usando o site depois de uma alteração significa concordar com a versão vigente.

---

## Política de cookies

**Endereço no site:** `/politica-de-cookies`

**Resumo**, que aparece abaixo do título e na busca do Google:

> Quais cookies este site usa e para quê. A resposta curta é que as páginas públicas não usam nenhum, e este texto explica o porquê.

**Rascunho de:** 2026-08-21


### A resposta curta

As páginas públicas deste site não gravam cookie nenhum no seu navegador.

Não há cookie de análise de audiência, de publicidade, de rede social ou de preferência. Não existe banner de consentimento porque não existe nada a consentir.

### Por que não há

Porque o site não precisa. Ele é um diretório de consulta: não tem login para o visitante, não guarda carrinho, não personaliza conteúdo e não mede audiência com ferramenta de terceiro.

Foi decisão de projeto, e não descuido. Menos dado coletado é menos dado a proteger.

### A área administrativa é diferente

A AMI escreve as notícias e as páginas institucionais numa área restrita do site. Aquela área usa cookies de autenticação, necessários para manter a sessão de quem está editando.

Isso não alcança o visitante: são cookies da equipe da associação, no ato de administrar o conteúdo.

### O que acontece mesmo sem cookie

Cookie não é a única forma de um serviço enxergar você. Ao abrir uma notícia que tenha imagem, o seu navegador busca o arquivo no serviço que a AMI usa para guardar conteúdo editorial, e aquele serviço registra o endereço de IP de quem pediu, como qualquer servidor faz. Nenhum cookie é gravado.

O servidor que entrega este site também registra acessos. O que é registrado e por quê está descrito na política de privacidade.

### Se isso mudar

No dia em que o site passar a usar cookie, este texto muda antes, e a data de atualização no alto da página é o que sinaliza a mudança.

---

## Como publicar a versão revisada

O texto aprovado entra no Studio, em `/studio`, tipo **Página
institucional**, escolhendo o endereço correspondente no campo **Endereço**.
No instante em que for publicado, ele substitui o rascunho no site e o aviso
de não revisado some junto, sem ninguém precisar apagar nada.
