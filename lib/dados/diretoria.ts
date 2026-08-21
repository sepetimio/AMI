import { cache } from "react";
import { clienteServidor } from "@/lib/dados/cliente";

export type Diretor = {
  id: number;
  nome: string;
  cargo: string;
  ordem: number;
  /* Preenchidos só quando o diretor tem perfil publicado no diretório. */
  slugDoPerfil: string | null;
  /* Já resolvidos entre as duas origens possíveis. Ver `resolverCrmDoDiretor`. */
  crm: string | null;
  crmUf: string | null;
  /* Falso só para o diretor que não é médico, por exemplo um contador na
     tesouraria.

     Onde ele de fato atua é no banco, na restrição
     `diretor_medico_tem_inscricao`: é `medico = false` que libera aquela
     linha da exigência de CRM próprio. Nenhum componente lê este campo, e
     `CartaoDiretor` decide só por `crm && crmUf`.

     Continua projetado assim mesmo, e por uma razão nomeável: sem ele, um
     `Diretor` sem CRM é ambíguo entre dois estados que o banco distingue,
     "não é médico, e por isso não tem inscrição" e "é médico e está sem
     inscrição, estado que a restrição deveria ter impedido". O segundo é
     defeito e o primeiro não, e quem for depurar a página, ou construir a
     tela de edição da Fase 4, precisa dos dois separados. Custa uma coluna
     numa linha que já vem do banco. */
  medico: boolean;
  foto: string | null;
};

/*
  Ordenação em memória e não no `order` do PostgREST.

  Não é preferência: a ordem precisa ser testável, e um `.order()` encadeado
  na consulta só é verificável com banco no ar. Com quatro a doze diretores,
  ordenar em memória não custa nada.
*/
export function ordenarDiretoria(lista: Diretor[]): Diretor[] {
  /* Cópia antes de ordenar: `sort` altera o array recebido, e o chamador pode
     estar segurando o resultado memoizado pelo `cache` do React. */
  return [...lista].sort(
    (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/*
  Qual CRM mostrar, entre as duas origens possíveis.

  A ordem é o inverso da que este arquivo teve até a revisão final, e a
  inversão é o ponto:

  1. **As colunas próprias de `diretoria` primeiro.** A restrição
     `diretor_medico_tem_inscricao`, na forma que a 0004 lhe deu, exige
     `crm` e `crm_uf` na própria linha de todo diretor médico publicado.
     Isso as torna a fonte autoritativa: é o único CRM que o banco garante
     existir e que o visitante anônimo sempre enxerga, porque não depende de
     nenhuma outra linha nem de nenhuma política de leitura.

  2. **O perfil ligado como reserva.** Quando o perfil existe e está
     publicado, `profissional.crm` e `profissional.crm_uf` são `not null` e
     vieram da mesma verificação que liberou aquele médico para o diretório:
     é dado real e correto, não um contorno. Serve para a linha escrita fora
     do alcance da restrição (um diretor despublicado que alguém resolva
     publicar em duas etapas, por exemplo) e para a janela de transição em
     que a 0004 ainda não preencheu as colunas.

  A reserva **não** enfraquece a garantia, e é aqui que estava o erro
  anterior: a garantia mora na restrição do banco, que continua exigindo as
  colunas próprias e não aceita mais o laço como prova. A reserva não decide
  quem pode ser publicado; ela só evita que a tela fique errada quando o dado
  certo existe e está ao alcance. O que a Resolução CFM 2.336/2023, Art. 4º,
  I proíbe é nome de médico sem inscrição na tela, e omitir um CRM que se
  tem em mãos é justamente produzir essa tela.

  Exportada para ser testável sem banco.
*/
export function resolverCrmDoDiretor(
  linha: { crm: string | null; crmUf: string | null },
  perfil: { crm: string | null; crmUf: string | null } | null,
): { crm: string | null; crmUf: string | null } {
  if (linha.crm && linha.crmUf) {
    return { crm: linha.crm, crmUf: linha.crmUf };
  }
  if (perfil?.crm && perfil?.crmUf) {
    return { crm: perfil.crm, crmUf: perfil.crmUf };
  }
  return { crm: null, crmUf: null };
}

const SELECAO = `
  id, nome, cargo, ordem, crm, crm_uf, medico,
  profissional:profissional_id ( slug, crm, crm_uf, foto )
`;

export const listarDiretoria = cache(async (): Promise<Diretor[]> => {
  const { data, error } = await clienteServidor()
    .from("diretoria")
    .select(SELECAO)
    .eq("publicado", true);

  if (error) throw new Error(`Falha ao buscar a diretoria: ${error.message}`);

  const lista = (data ?? []).map((d): Diretor => {
    /* PostgREST devolve o embed como objeto ou como array conforme a
       cardinalidade que ele infere da chave estrangeira. Normalizado aqui
       para o resto do arquivo não precisar saber disso. */
    const p = Array.isArray(d.profissional) ? d.profissional[0] : d.profissional;
    const { crm, crmUf } = resolverCrmDoDiretor(
      { crm: d.crm, crmUf: d.crm_uf },
      p ? { crm: p.crm, crmUf: p.crm_uf } : null,
    );
    return {
      id: d.id,
      nome: d.nome,
      cargo: d.cargo,
      ordem: d.ordem,
      slugDoPerfil: p?.slug ?? null,
      crm,
      crmUf,
      medico: d.medico,
      foto: p?.foto ?? null,
    };
  });

  return ordenarDiretoria(lista);
});
