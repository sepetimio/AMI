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
     tesouraria. Guardado porque é o que isenta esse diretor da exigência de
     CRM da Resolução CFM 2.336/2023, Art. 4º, I. */
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

  O laço com `profissional_id` é opcional (ver comentário da migração
  0003_diretoria.sql), e um diretor sem perfil publicado precisa mesmo assim
  sair com CRM na tela, conforme a Resolução CFM 2.336/2023, Art. 4º, I. Por
  isso a tabela `diretoria` guarda `crm`/`crm_uf` próprios, usados só quando
  não há perfil ligado: o perfil, quando existe, é a fonte mais confiável,
  porque é o mesmo CRM verificado para publicar o profissional no diretório.
  Exportada para ser testável sem banco.
*/
export function resolverCrmDoDiretor(
  perfil: { crm: string | null; crmUf: string | null } | null,
  linha: { crm: string | null; crmUf: string | null },
): { crm: string | null; crmUf: string | null } {
  if (perfil?.crm && perfil?.crmUf) {
    return { crm: perfil.crm, crmUf: perfil.crmUf };
  }
  return { crm: linha.crm, crmUf: linha.crmUf };
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
      p ? { crm: p.crm, crmUf: p.crm_uf } : null,
      { crm: d.crm, crmUf: d.crm_uf },
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
