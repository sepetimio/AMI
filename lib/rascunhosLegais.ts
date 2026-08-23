import { AMI, enderecoEmLinha } from "@/lib/ami";

/*
  RASCUNHOS DOS TEXTOS LEGAIS

  Fonte única: o site renderiza daqui, e o documento entregue ao advogado em
  `docs/rascunhos-textos-legais.md` é gerado daqui pelo script
  `scripts/gerar-doc-legal.ts`. É assim de propósito. Um rascunho jurídico que
  diverge do que está publicado é pior do que não ter rascunho, porque a
  revisão passa a aprovar um texto e o visitante a ler outro.

  ISTO É RASCUNHO, NÃO PEÇA JURÍDICA. Escrito para o advogado de direito
  médico corrigir em vez de começar do zero, e assinalado como provisório na
  tela enquanto não for revisado.

  Os fatos técnicos abaixo foram MEDIDOS neste site, não presumidos:

    - nenhuma página pública devolve `Set-Cookie` (conferido em `/`,
      `/medicos` e `/noticias`)
    - não há dependência de análise, rastreamento ou pixel no projeto
    - não há script de terceiro no HTML servido
    - o único endereço externo na home é o link para o Instagram, que é link
      e não carregamento: nada é requisitado antes de a pessoa clicar

  Quando qualquer um desses fatos mudar, ESTE ARQUIVO MUDA JUNTO. É a razão
  de os três textos morarem em código e não direto no Studio: assim eles
  ficam ao lado da coisa que descrevem, e o descompasso aparece na revisão.
*/

export type SecaoLegal = {
  titulo: string;
  paragrafos: string[];
  lista?: string[];
};

export type RascunhoLegal = {
  slug: "politica-de-privacidade" | "termos-de-uso" | "politica-de-cookies";
  titulo: string;
  resumo: string;
  /** Data da redação do rascunho. Vira a data de revisão quando for revisado. */
  atualizadoEm: string;
  secoes: SecaoLegal[];
};

const DATA = "2026-08-21";

const identificacao = `${AMI.razaoSocial}, ${AMI.naturezaJuridica.toLowerCase()}, inscrita no CNPJ sob o número ${AMI.cnpj}, com sede na ${enderecoEmLinha()}, CEP ${AMI.endereco.cep}`;

const contato = `Pelo telefone ${AMI.telefones[0]}, ou presencialmente na sede, na ${enderecoEmLinha()}.`;

export const PRIVACIDADE: RascunhoLegal = {
  slug: "politica-de-privacidade",
  titulo: "Política de privacidade",
  resumo:
    "Como a Associação Médica de Imperatriz trata dados pessoais neste site, " +
    "o que é coletado, por quanto tempo e quais são os seus direitos.",
  atualizadoEm: DATA,
  secoes: [
    {
      titulo: "Quem é o responsável",
      paragrafos: [
        `O controlador dos dados tratados neste site é a ${identificacao}.`,
        "[PROVISÓRIO] A AMI precisa designar formalmente um encarregado pelo tratamento de dados pessoais, como exige o artigo 41 da Lei 13.709/2018, e o nome e o contato dele entram aqui.",
      ],
    },
    {
      titulo: "O que este site não faz",
      paragrafos: [
        "Este site é um diretório de consulta pública. Ele não pede cadastro, não tem formulário de contato e não recebe mensagem de visitante.",
        "Ele não pergunta sintoma, não pergunta diagnóstico e não recebe nenhuma informação sobre a sua saúde. Dado de saúde é dado pessoal sensível na Lei Geral de Proteção de Dados, e a decisão de projeto foi não coletar nenhum.",
        "Não há cookie, não há ferramenta de análise de audiência, não há pixel de rede social e não há publicidade.",
      ],
    },
    {
      titulo: "O que é coletado mesmo assim",
      paragrafos: [
        "Como em qualquer site, o servidor que entrega as páginas registra dados técnicos a cada acesso. São eles:",
      ],
      lista: [
        "o endereço de IP do seu aparelho",
        "a data e a hora do acesso",
        "o endereço da página pedida",
        "o tipo de navegador e de sistema operacional",
      ],
    },
    {
      titulo: "Para que esses dados são usados",
      paragrafos: [
        "Exclusivamente para entregar as páginas, manter o serviço no ar e investigar falha ou abuso. Não são usados para traçar perfil, não são cruzados com outra base e não são vendidos nem cedidos.",
        "A base legal é o legítimo interesse, previsto no artigo 7º, inciso IX, da Lei 13.709/2018: sem esse registro técnico não é possível operar nem proteger o serviço.",
        "[PROVISÓRIO] O prazo de guarda desses registros depende da empresa que hospeda o site e precisa ser confirmado antes da publicação.",
      ],
    },
    {
      titulo: "Quando o seu navegador fala com outro serviço",
      paragrafos: [
        "As imagens das notícias são entregues por um serviço de terceiro contratado pela AMI para guardar o conteúdo editorial. Ao abrir uma notícia com imagem, o seu navegador pede o arquivo diretamente a esse serviço, e por isso ele enxerga o seu endereço de IP. Nenhum cookie é gravado nessa operação.",
        "O site tem um link para o perfil oficial da AMI numa rede social. É apenas um link: nada é requisitado àquela rede enquanto você não clicar.",
      ],
    },
    {
      titulo: "Os dados dos médicos publicados",
      paragrafos: [
        "O diretório publica dados profissionais dos médicos associados: nome, número de inscrição no Conselho Regional de Medicina, especialidade, registro de qualificação de especialista quando houver, endereço de atendimento e telefone do consultório.",
        "São dados de exercício profissional, de natureza pública, e a publicação atende à finalidade institucional da associação de tornar seus associados localizáveis pela população. Nenhum dado pessoal de natureza privada do médico é publicado.",
        "O médico que queira corrigir, completar ou retirar sua informação pode pedir à AMI a qualquer momento, pelos contatos ao fim deste texto.",
      ],
    },
    {
      titulo: "Os seus direitos",
      paragrafos: [
        "O artigo 18 da Lei 13.709/2018 garante a você, entre outros, o direito de:",
      ],
      lista: [
        "confirmar se existe tratamento de dados seus e acessá-los",
        "corrigir dado incompleto, inexato ou desatualizado",
        "pedir anonimização, bloqueio ou eliminação de dado desnecessário ou tratado em desacordo com a lei",
        "ser informado sobre com quem a AMI compartilhou seus dados",
        "revogar consentimento, quando o tratamento se basear nele",
      ],
    },
    {
      titulo: "Como exercer esses direitos, e como falar sobre dados",
      paragrafos: [contato],
    },
    {
      titulo: "Alterações",
      paragrafos: [
        "Este texto pode mudar quando o site mudar. A data de atualização aparece no alto da página, e é ela que diz qual versão você está lendo.",
      ],
    },
  ],
};

export const TERMOS: RascunhoLegal = {
  slug: "termos-de-uso",
  titulo: "Termos de uso",
  resumo:
    "As condições de uso do site da Associação Médica de Imperatriz, o que " +
    "ele é, o que não é, e os limites da responsabilidade da associação.",
  atualizadoEm: DATA,
  secoes: [
    {
      titulo: "O que é este site",
      paragrafos: [
        `Este site é mantido pela ${identificacao}.`,
        "É um diretório de consulta pública, criado para que a população de Imperatriz e da região encontre médicos que atendem na cidade, com endereço e telefone.",
      ],
    },
    {
      titulo: "O que este site não é",
      paragrafos: [
        "Não é serviço de saúde, não é plataforma de agendamento e não intermedeia consulta. A AMI não marca atendimento, não participa da relação entre médico e paciente e não responde por ela.",
        "O conteúdo publicado aqui é informativo e não substitui consulta, diagnóstico ou tratamento por profissional habilitado. Nenhuma informação deste site deve ser usada para automedicação ou para adiar procura por atendimento.",
        "Em emergência, procure serviço de urgência ou ligue para o SAMU, no 192.",
      ],
    },
    {
      titulo: "Sem classificação e sem destaque pago",
      paragrafos: [
        "O site não atribui nota, não faz ranking e não compara profissionais entre si. Não existe posição paga nem promoção de associado.",
        "A ordem dos resultados é definida de forma verificável: correspondência do termo buscado no nome e na especialidade, com desempate alfabético. Sem termo digitado, a ordem é alfabética.",
        "Essa vedação atende à Resolução CFM 2.336/2023 e é decisão permanente de projeto, não configuração.",
      ],
    },
    {
      titulo: "De onde vêm os dados, e como corrigir",
      paragrafos: [
        "As informações de cada profissional são fornecidas por ele e revisadas pela AMI. Ainda assim, dado desatualizado acontece: consultório muda de endereço, telefone muda.",
        "Confirme por telefone antes de se deslocar.",
        `Encontrou erro? Avise a AMI. ${contato}`,
      ],
    },
    {
      titulo: "Uso permitido",
      paragrafos: [
        "Você pode consultar, compartilhar link e imprimir para uso próprio.",
        "Não é permitido extrair o conteúdo em massa por meio automatizado, reproduzir a base para montar outro diretório, nem usar os dados para envio de mensagem não solicitada aos profissionais listados.",
      ],
    },
    {
      titulo: "Propriedade",
      paragrafos: [
        "A marca, o nome e a identidade visual da Associação Médica de Imperatriz pertencem a ela. Os textos assinados pertencem a seus autores.",
      ],
    },
    {
      titulo: "Alterações",
      paragrafos: [
        "Estes termos podem mudar. A data de atualização aparece no alto da página, e continuar usando o site depois de uma alteração significa concordar com a versão vigente.",
      ],
    },
  ],
};

export const COOKIES: RascunhoLegal = {
  slug: "politica-de-cookies",
  titulo: "Política de cookies",
  resumo:
    "Quais cookies este site usa e para quê. A resposta curta é que as " +
    "páginas públicas não usam nenhum, e este texto explica o porquê.",
  atualizadoEm: DATA,
  secoes: [
    {
      titulo: "A resposta curta",
      paragrafos: [
        "As páginas públicas deste site não gravam cookie nenhum no seu navegador.",
        "Não há cookie de análise de audiência, de publicidade, de rede social ou de preferência. Não existe banner de consentimento porque não existe nada a consentir.",
      ],
    },
    {
      titulo: "Por que não há",
      paragrafos: [
        "Porque o site não precisa. Ele é um diretório de consulta: não tem login para o visitante, não guarda carrinho, não personaliza conteúdo e não mede audiência com ferramenta de terceiro.",
        "Foi decisão de projeto, e não descuido. Menos dado coletado é menos dado a proteger.",
      ],
    },
    {
      titulo: "A área administrativa é diferente",
      paragrafos: [
        "A AMI escreve as notícias e as páginas institucionais numa área restrita do site. Aquela área usa cookies de autenticação, necessários para manter a sessão de quem está editando.",
        "Isso não alcança o visitante: são cookies da equipe da associação, no ato de administrar o conteúdo.",
      ],
    },
    {
      titulo: "O que acontece mesmo sem cookie",
      paragrafos: [
        "Cookie não é a única forma de um serviço enxergar você. Ao abrir uma notícia que tenha imagem, o seu navegador busca o arquivo no serviço que a AMI usa para guardar conteúdo editorial, e aquele serviço registra o endereço de IP de quem pediu, como qualquer servidor faz. Nenhum cookie é gravado.",
        "O servidor que entrega este site também registra acessos. O que é registrado e por quê está descrito na política de privacidade.",
      ],
    },
    {
      titulo: "Se isso mudar",
      paragrafos: [
        "No dia em que o site passar a usar cookie, este texto muda antes, e a data de atualização no alto da página é o que sinaliza a mudança.",
      ],
    },
  ],
};

export const RASCUNHOS_LEGAIS = [PRIVACIDADE, TERMOS, COOKIES] as const;
