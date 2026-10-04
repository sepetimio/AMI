# Especialidades: índice e página de cada especialidade (fatia B, grupo 2)

**Data:** 03/10/2026. **Ramo:** continua em `paginas-encontre`. O cliente pediu que nada vá para a `main` antes de todos os grupos ficarem prontos.

**Aprovação:** o cliente escolheu o conteúdo:
- índice visual;
- na página de cada especialidade, "Sobre a especialidade" e o parágrafo de abertura, sem "Outras especialidades".

Depois disso ele saiu e autorizou seguir pelas recomendações ("pode seguir para o desenvolvimento do design das páginas restantes seguindo as diretrizes recomendadas"). O desenho foi aprovado pelo controlador contra as diretrizes já aprovadas (a home e o grupo "Encontre um médico"). **Toda decisão marcada [sem o cliente] fica para ele revisar na volta.**

**Desenho aprovado:** `docs/desenho-aprovado/especialidades/especialidades.html` e `especialidade.html`, com as fotos jpg na mesma pasta. Com `?sem-sobre` no endereço, `especialidade.html` mostra a página sem o bloco "Sobre". O desenho é a autoridade de todo valor visual.

**Base:** as specs `2026-10-03-redesign-visual-design.md` e `2026-10-03-encontre-um-medico-design.md` continuam valendo.

## 1. Índice (`/medicos`, item "Especialidades" do menu)

1. **Faixa verde** com textura, igual à da busca.
   - Rótulo "ESPECIALIDADES" e h1 "Especialidades em Imperatriz".
   - Linha de apoio: "{N} médicos associados, cada um com o número de registro no CRM. Escolha a área para ver quem atende."
   - O campo de busca "Nome ou especialidade", que envia para `/busca?termo=`.
   - Sem a `Cabeceira` e sem breadcrumb visível.
2. **Cabeçalho da grade:** "{N} especialidades" e, à direita, "Em ordem alfabética". No celular, "De A a Z".
3. **Grade de cartões**, um por especialidade que tenha médico, **em ordem alfabética** [sem o cliente: hoje o site ordena por quantidade de médicos].
   - Cada cartão tem: o ladrilho com o ícone, o nome, "N médicos" (ou "1 médico") e a seta num círculo.
   - O cartão inteiro é clicável e leva a `/medicos/{slug}`.
   - Ao passar o mouse: borda mais escura, sombra neutra e 1px de subida.
   - Todos os cartões com a mesma altura; o nome e a contagem na mesma linha em cada fileira.
   - Colunas: 4 a partir de 1180px, 3 até 1179px, 2 até 980px e 2 no celular, com cartões compactos.
   - Nome longo com hífen opcional para quebrar bem ("Otorrino­laringologia").
4. **Ícones por especialidade** (Phosphor duotone) [sem o cliente]:

   | Especialidade | Ícone |
   |---|---|
   | Cardiologia | Heartbeat |
   | Clínica Médica | Stethoscope |
   | Dermatologia | HandPalm |
   | Endocrinologia | DropHalf |
   | Gastroenterologia | ForkKnife |
   | Ginecologia e Obstetrícia | GenderFemale |
   | Neurologia | Brain |
   | Oftalmologia | Eye |
   | Ortopedia e Traumatologia | Bone |
   | Otorrinolaringologia | Ear |
   | Pediatria | Baby |
   | Psiquiatria | ChatsCircle |
   | Reumatologia | Hand |
   | Urologia | Drop |

   - A ligação é pelo `slug`.
   - Especialidade sem ícone na tabela, inclusive uma nova cadastrada pela AMI, usa Stethoscope.
5. **Metadados:** mantêm o título e a descrição de hoje, sem citar bairro.

## 2. Página de cada especialidade (`/medicos/[especialidade]`)

1. **Faixa verde** com textura.
   - No lugar do rótulo, o link "← ESPECIALIDADES", que leva a `/medicos`.
   - h1 "{Especialidade} em Imperatriz".
   - Parágrafo de abertura curto, gerado a partir dos dados: "A Associação Médica de Imperatriz reúne {N} {profissionais} em Imperatriz, no Maranhão. Cada perfil traz o número de registro no Conselho Regional de Medicina."
   - À direita, o ícone da especialidade num ladrilho de vidro de 168px, que some no celular.
   - Sem campo de busca, sem `Cabeceira` e sem breadcrumb visível.
2. **Contagem** "{N} médicos" e "Em ordem alfabética", seguida da grade de cartões de médico **igual à da busca** (`GradeMedicos`/`CartaoMedico`).
3. **O cartão mostra a especialidade DA PÁGINA**, com o RQE dela, quando o médico a tem [sem o cliente].
   - Exemplo: na página de Ortopedia, Aline Peixoto (principal Neurologia, secundária Ortopedia) aparece como "Ortopedia e Traumatologia" e o RQE dessa especialidade.
   - Na busca e em "Outros médicos" do perfil, o cartão continua mostrando a especialidade principal.
4. **"Sobre a {especialidade}"** fica numa faixa branca de ponta a ponta, que encosta no rodapé.
   - Duas colunas, "O que faz" e "Quando procurar"; uma coluna no celular.
   - Embaixo vêm a linha "Revisado por {nome} · {CRM/UF nnnnn} · revisão em {mês de ano}" e "Conteúdo informativo; não substitui a consulta médica."
5. **Fonte dos textos do "Sobre"** [sem o cliente]: um tipo novo no Sanity, **"Texto de especialidade"**, no mesmo painel de conteúdo dos banners, notícias e empresas parceiras. Campos:
   - `especialidade` (o slug, obrigatório e único);
   - `oQueFaz` (obrigatório);
   - `quandoProcurar` (obrigatório);
   - `revisorNome` (obrigatório);
   - `revisorCrm` (obrigatório, "CRM/MA 12345");
   - `revisadoEm` (data, obrigatória).

   Motivos:
   - é texto editorial escrito e revisado por médico;
   - o Sanity já é onde a AMI escreve;
   - assim não se mexe no banco do diretório na ausência do cliente.

   As colunas `o_que_faz` e `quando_procurar` do Supabase deixam de ser lidas pelo site. Elas continuam no banco, e o cliente decide se saem.
6. **Trava:**
   - com o texto completo no Sanity, o bloco aparece nos dois modos;
   - sem texto, aparece só no modo demonstração, com a moldura "Texto da AMI a entrar" no lugar dos dois parágrafos e sem a linha do revisor;
   - fora da demonstração e sem texto, o bloco não aparece, e a grade termina a `--ritmo` do rodapé, como mostra a foto "sem-sobre".
   - Nenhum texto provisório "[PROVISÓRIO]" pode aparecer no site.
7. **Sem "Outras especialidades"** no fim.
8. **Metadados e JSON-LD:**
   - o título, a descrição (que hoje cita bairro por endereço, decisão D4 do grupo 1) e o canonical ficam;
   - a página continua pré-renderizada (`generateStaticParams` e `revalidate`), sem `searchParams`.

## 3. Fora do escopo
- Escrever os textos "Sobre" de verdade: isso é conteúdo da AMI, com revisor médico.
- Apagar as colunas do Supabase.
- O envio de foto dos médicos.

## 4. Como provar
Vale o mesmo do grupo 1:
- **Ruling 11:**
  - componente por renderização;
  - lógica por função pura (ícone por slug, especialidade mostrada no cartão, trava do "Sobre", parágrafo de abertura, data "mês de ano");
  - CSS e a ligação com o navegador lidos como texto.
- **Auditoria** nas 8 larguras, com as duas chaves. Ela confere:
  - alinhamento x=172;
  - os cartões da mesma fileira com a mesma altura, e o nome e a contagem alinhados;
  - os "Ligar" alinhados;
  - o mesmo ritmo entre os blocos;
  - que a página abre no topo.
- **Fotos** comparadas com o desenho.
- **Contraste** de pelo menos 4,5:1.
- **GROQ** com `groq-js`.
