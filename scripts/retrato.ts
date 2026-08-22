import type { SupabaseClient } from "@supabase/supabase-js";
import type { Retrato } from "@/lib/importador/tipos";

/*
  O retrato do banco: uma leitura só, entregue inteira ao plano.

  É por isso que a chave precisa ser privilegiada mesmo para conferir. Tudo
  que o importador cria entra despublicado, e a chave pública só enxerga
  `publicado = true`. Lendo com ela, a segunda rodada não veria ninguém que a
  primeira criou: relataria as mesmas 500 criações e bateria em violação de
  chave única.

  São poucos milhares de linhas para 500 médicos. Uma consulta por tabela é
  mais simples de ler e de conferir do que junções aninhadas, e o custo em
  segundos não importa numa operação que roda uma dúzia de vezes na vida.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

async function tudo(cliente: SupabaseClient, tabela: string, colunas: string) {
  const { data, error } = await cliente.from(tabela).select(colunas);
  if (error) throw new Error(`Falha ao ler ${tabela}: ${error.message}`);
  return (data ?? []) as any[];
}

export async function lerRetrato(cliente: SupabaseClient): Promise<Retrato> {
  const [profissionais, especialidades, bairros, locais, atendimentos, vinculos] =
    await Promise.all([
      tudo(cliente, "profissional",
        "id, slug, nome, crm, crm_uf, telemedicina, associado_ami, publicado"),
      tudo(cliente, "especialidade", "id, nome, slug"),
      tudo(cliente, "bairro", "id, nome, slug"),
      tudo(cliente, "local",
        "id, logradouro, numero, complemento, bairro_id, cep, telefone, whatsapp"),
      tudo(cliente, "atendimento", "profissional_id, local_id"),
      tudo(cliente, "profissional_especialidade",
        "profissional_id, especialidade_id, rqe"),
    ]);

  const donoDoLocal = new Map<number, number>(
    atendimentos.map((a) => [a.local_id, a.profissional_id]),
  );

  return {
    profissionais: profissionais.map((p) => ({
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      crm: p.crm,
      crmUf: p.crm_uf,
      telemedicina: p.telemedicina,
      associadoAmi: p.associado_ami,
      publicado: p.publicado,
    })),
    especialidades: especialidades.map((e) => ({ id: e.id, nome: e.nome, slug: e.slug })),
    bairros: bairros.map((b) => ({ id: b.id, nome: b.nome, slug: b.slug })),
    /* Local sem atendimento é órfão — sobra de gravação interrompida. Fica
       de fora do retrato para não casar com endereço da planilha e virar
       "atualização" de algo que não pertence a ninguém. */
    locais: locais
      .filter((l) => donoDoLocal.has(l.id))
      .map((l) => ({
        id: l.id,
        profissionalId: donoDoLocal.get(l.id)!,
        logradouro: l.logradouro,
        numero: l.numero,
        complemento: l.complemento,
        bairroId: l.bairro_id,
        cep: l.cep,
        telefone: l.telefone,
        whatsapp: l.whatsapp,
      })),
    vinculosEspecialidade: vinculos.map((v) => ({
      profissionalId: v.profissional_id,
      especialidadeId: v.especialidade_id,
      rqe: v.rqe,
    })),
  };
}
