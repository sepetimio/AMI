import { cache } from "react";
import { clienteServidor } from "@/lib/dados/cliente";

export type Diretor = {
  id: number;
  nome: string;
  cargo: string;
  ordem: number;
  /* Preenchidos só quando o diretor tem perfil publicado no diretório. */
  slugDoPerfil: string | null;
  /* Colunas próprias da linha de diretoria, nunca do perfil ligado. Ver a
     seleção abaixo. */
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
  O CRM vem sempre das colunas próprias da linha, e o embed do perfil traz
  só o que é ilustração: foto e slug para o link.

  Houve aqui uma ordem de preferência, que tentava o CRM do perfil ligado
  antes do da linha. Ela caiu junto com a restrição antiga do banco
  (0004_diretoria_crm.sql): o perfil não é fonte confiável de inscrição
  porque a RLS esconde do visitante anônimo todo profissional não publicado,
  e a mesma consulta que devolve o perfil para um diretor devolve nulo para
  outro sem nada na tela distinguir os dois casos. Agora que o banco exige
  `crm`/`crm_uf` na própria linha de todo diretor médico publicado, uma fonte
  só é ao mesmo tempo mais simples e a única que o visitante sempre enxerga.
*/
const SELECAO = `
  id, nome, cargo, ordem, crm, crm_uf, medico,
  profissional:profissional_id ( slug, foto )
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
    return {
      id: d.id,
      nome: d.nome,
      cargo: d.cargo,
      ordem: d.ordem,
      slugDoPerfil: p?.slug ?? null,
      crm: d.crm,
      crmUf: d.crm_uf,
      medico: d.medico,
      foto: p?.foto ?? null,
    };
  });

  return ordenarDiretoria(lista);
});
