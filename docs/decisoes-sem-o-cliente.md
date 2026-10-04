# Decisões tomadas sem o cliente

Em 03/10/2026 o cliente autorizou seguir sozinho com o desenho e a construção das páginas restantes, pelas opções recomendadas, enquanto estivesse fora. Esta lista junta tudo o que foi decidido nesse período, para ele revisar na volta. Cada decisão aponta para o documento onde ela está escrita com detalhes e para as fotos.

Para mudar qualquer item, basta dizer qual. Nada disso foi para a `main` nem para o GitHub.

## Grupo 2: Especialidades

Detalhes em `docs/superpowers/specs/2026-10-03-especialidades-design.md`. Desenho e fotos em `docs/desenho-aprovado/especialidades/`.

1. **Ordem do índice:** alfabética. Antes era por quantidade de médicos.
2. **Ícone de cada especialidade:** a tabela está na spec, seção 1.4. Especialidade nova sem ícone recebe o estetoscópio.
3. **Cartão do médico na página da especialidade:** mostra a especialidade daquela página, com o RQE dela. Exemplo: na página de Ortopedia, a Dra. Aline aparece como ortopedista, e não como neurologista.
4. **Textos "Sobre a especialidade":** passam a ser cadastrados no Sanity (tipo novo "Texto de especialidade", com o revisor médico e a data), e não no banco do diretório.
5. **Linha de apoio do índice:** "{N} médicos associados, cada um com o número de registro no CRM. Escolha a área para ver quem atende."
6. **Ícone grande:** fica na faixa verde da página de cada especialidade, e some no celular.
7. **Rodapé:** o texto ficou com as cores que o site já usa (branco a 92% e a 70%), mais legíveis que as do desenho antigo.
8. **Formato do texto "Sobre":** cada um dos dois textos ("O que faz" e "Quando procurar") aceita parágrafos e lista com marcadores, sem negrito nem link, como no desenho. Um texto só aparece com os seis campos preenchidos.
9. **Sem texto cadastrado:** no modo demonstração, o bloco "Sobre" aparece com "Texto da AMI a entrar." no lugar dos dois textos, sem a linha do revisor, e mantém a frase "Conteúdo informativo; não substitui a consulta médica."; fora da demonstração, o bloco não aparece.
10. **Barra do pé no índice:** no celular, o botão "Encontrar médico" do índice leva ao campo de busca da própria faixa, como na home e na busca. Na página de cada especialidade, que não tem campo, leva à busca.
11. **Nomes longos no cartão:** os seis nomes do desenho quebram com hífen no ponto escolhido ("Otorrino-laringologia"). Uma especialidade nova de nome muito longo quebra onde couber.
12. **Título do "Sobre":** "Sobre a cardiologia", com o nome em minúsculas, quando o nome da especialidade termina em "a", como as 14 de hoje. Uma especialidade nova de nome que não termina em "a" fica com "Sobre a especialidade", para não sair "Sobre a" antes de um nome masculino.

## Grupo 3: A Associação

Detalhes em `docs/superpowers/specs/2026-10-03-associacao-design.md`. Desenho e fotos em `docs/desenho-aprovado/associacao/`.

1. **Página "A Associação":** a ordem dos blocos e o título "Desde 1975 com os médicos de Imperatriz".
2. **Diretoria:** a presidente vem em primeiro, sem cartão maior. O botão se chama "Ver a diretoria".
3. **Mandato da diretoria:** o banco já tem as colunas de início e fim do mandato, vazias. Por enquanto o site não as lê, e o mandato aparece só no modo demonstração, como moldura. Preenchidas, viram "Gestão 2025–2027" numa etapa à parte.
4. **"Saiba mais":** um atalho só aparece se a página existir. "Benefícios" ficou de fora.
5. **Modelo das páginas de texto:** faixa verde, corpo branco em coluna de leitura e o índice "Nesta página". Ele serve também para os textos legais. Cada página tem seu ícone; a lista está na spec.
6. **Seja associado:** o botão de WhatsApp fica de fora até a AMI confirmar o número. Os dados da entidade passam a aparecer em lista, e não mais em frase corrida.
7. **Números 01/02/03 de Missão, visão e valores:** ficam no cinza escuro legível que a home já usa.
8. **Aviso de "página provisória":** passou de âmbar para cinza neutro.

## Grupos 4 e 5: Notícias e Contato

Detalhes em `docs/superpowers/specs/2026-10-03-noticias-contato-design.md`. Desenho e fotos em `docs/desenho-aprovado/noticias-contato/`.

1. **Lista de notícias:** a mais recente aparece em destaque, larga, e as outras em cartões, 3 por linha. A última fileira incompleta fica alinhada à esquerda.
2. **Sem paginação:** a lista mostra até 20 notícias, como já era. "Mais antigas" entra quando a AMI passar de 20.
3. **Capa da notícia:** formato 16:9, recortado pelo ponto de interesse marcado no Studio. Antes, a foto saía na proporção original.
4. **Assinatura do autor:** aparece na faixa do topo e no fim do texto, com o botão "Ver perfil".
5. **Contato:** três cartões (telefone da sede, celular e Instagram), sem e-mail, sem WhatsApp, sem formulário e sem mapa embutido. O horário de atendimento aparece como moldura até a AMI informar.
6. **Frases de apoio novas:** "Comunicados, eventos e notas da associação…" e "Pelo telefone, pelo Instagram ou na sede…".

## Decisões que valem para várias páginas

1. **"Como chegar":** abre o mapa na mesma aba em todo o site, como já fazia no perfil do médico.
2. **"Outras notícias" com 1 ou 2:** ocupam a largura toda, sem coluna vazia, com a mesma regra da home.
3. **Textos legais:** um item que a AMI ainda precisa preencher, como o encarregado de dados na política de privacidade, aparece marcado "a entrar" mesmo fora do modo demonstração. Um texto legal não pode esconder em silêncio um item obrigatório.
4. **Dois consultórios do mesmo médico no mesmo bairro:** os títulos ganham "(1)" e "(2)", e os botões dizem o endereço, para quem usa leitor de tela.
5. **Velocidade:** os ícones que aparecem só em algumas páginas passam a ser carregados só nelas. O código comum a todas as páginas caiu de 28 KB para 10 KB.
