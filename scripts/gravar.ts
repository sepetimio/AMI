import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnderecoPlanejado, Plano } from "@/lib/importador/tipos";

/*
  A gravação.

  NÃO EXISTE TRANSAÇÃO. O supabase-js fala por HTTP e o PostgREST não abre
  transação entre requisições. A resposta é ser REPETÍVEL: toda operação é
  por chave natural, então rodar de novo depois de uma interrupção completa o
  que faltou em vez de duplicar.

  E nada aqui publica ninguém. Os perfis entram com `publicado = false`, e a
  RLS esconde perfil, endereço, atendimento e horário de quem não está
  publicado — uma gravação interrompida é invisível para o visitante.

  Ordem: bairros primeiro, porque os endereços dependem deles.

  NENHUM `delete`, NENHUM comando de esvaziar tabela inteira.
  `testes/importador-gravar.test.ts` falha se alguém acrescentar um.
*/

export type ResumoDaGravacao = {
  bairrosCriados: number;
  medicosCriados: number;
  medicosAtualizados: number;
  enderecosCriados: number;
  enderecosAtualizados: number;
  vinculosCriados: number;
  rqesCorrigidos: number;
};

function erro(o: { error: { message: string } | null }, o_que: string): void {
  if (o.error) throw new Error(`${o_que}: ${o.error.message}`);
}

export async function gravar(
  cliente: SupabaseClient,
  plano: Plano,
): Promise<ResumoDaGravacao> {
  const resumo: ResumoDaGravacao = {
    bairrosCriados: 0,
    medicosCriados: 0,
    medicosAtualizados: 0,
    enderecosCriados: 0,
    enderecosAtualizados: 0,
    vinculosCriados: 0,
    rqesCorrigidos: 0,
  };

  /* --- 1. Bairros --- */
  const idDoBairroNovo = new Map<string, number>();

  if (plano.bairrosNovos.length) {
    const { data, error } = await cliente
      .from("bairro")
      .upsert(
        plano.bairrosNovos.map((b) => ({ nome: b.nome, slug: b.slug })),
        { onConflict: "slug" },
      )
      .select("id, slug");
    erro({ error }, "Falha ao criar bairros");

    for (const b of data ?? []) idDoBairroNovo.set(b.slug, b.id);
    /* Do que o banco confirmou, não do que o plano pediu: um `upsert` que
       devolvesse menos linhas do que enviou passaria por sucesso calado. */
    resumo.bairrosCriados = idDoBairroNovo.size;
  }

  function bairroId(e: EnderecoPlanejado): number {
    if (e.bairro.tipo === "existente") return e.bairro.id;
    const id = idDoBairroNovo.get(e.bairro.slug);
    if (id === undefined) {
      throw new Error(`Bairro "${e.bairro.slug}" não recebeu id ao ser criado.`);
    }
    return id;
  }

  /* --- 2. Médicos novos --- */
  const idPorChaveNatural = new Map<string, number>();

  if (plano.criar.length) {
    /*
      `insert` e não `upsert`, de propósito. Com o retrato completo, um médico
      aqui que já exista no banco quer dizer que alguma premissa quebrou — e a
      cláusula de conflito de um upsert mandaria `slug` e `publicado: false`
      junto, despublicando um perfil no ar e trocando a URL dele. Violação de
      unicidade barulhenta é infinitamente melhor do que isso.

      Continua repetível: uma rodada interrompida deixa os médicos gravados
      visíveis para o retrato da rodada seguinte, que os manda para
      `atualizar` em vez de `criar`.
    */
    const { data, error } = await cliente
      .from("profissional")
      .insert(
        plano.criar.map((m) => ({
          slug: m.slug,
          nome: m.nome,
          crm: m.crm,
          crm_uf: m.crmUf,
          telemedicina: m.telemedicina,
          associado_ami: true,
          /* Sempre. Publicar é o outro comando, com filtro próprio. */
          publicado: false,
        })),
      )
      .select("id, crm, crm_uf");
    erro({ error }, "Falha ao criar médicos");

    for (const p of data ?? []) idPorChaveNatural.set(`${p.crm}|${p.crm_uf}`, p.id);
    /* Do que o banco confirmou, não do que o plano pediu. */
    resumo.medicosCriados = idPorChaveNatural.size;
  }

  /* --- 3. Médicos existentes --- */
  for (const m of plano.atualizar) {
    if (!m.mudancas.length) continue;

    const campos: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    for (const mud of m.mudancas) {
      if (mud.campo === "nome") campos.nome = mud.para;
      else if (mud.campo === "telemedicina") campos.telemedicina = mud.para === "sim";
      else if (mud.campo === "associado_ami") campos.associado_ami = true;
      else {
        throw new Error(
          `Campo desconhecido "${mud.campo}" no médico ${m.crm}/${m.crmUf}.`,
        );
      }
    }

    const { error } = await cliente.from("profissional").update(campos).eq("id", m.id);
    erro({ error }, `Falha ao atualizar o médico ${m.crm}/${m.crmUf}`);
    resumo.medicosAtualizados++;
  }

  /* --- 4. Especialidades --- */
  const vinculos: { profissional_id: number; especialidade_id: number; rqe: string | null; principal: boolean }[] = [];

  for (const m of plano.criar) {
    const id = idPorChaveNatural.get(`${m.crm}|${m.crmUf}`);
    if (id === undefined) {
      throw new Error(
        `O banco não devolveu o id do médico ${m.crm}/${m.crmUf} depois de criá-lo.`,
      );
    }
    for (const v of m.especialidades) {
      vinculos.push({
        profissional_id: id,
        especialidade_id: v.especialidadeId,
        rqe: v.rqe,
        principal: v.principal,
      });
    }
  }

  for (const m of plano.atualizar) {
    for (const v of m.especialidadesNovas) {
      vinculos.push({
        profissional_id: m.id,
        especialidade_id: v.especialidadeId,
        rqe: v.rqe,
        /* Vem do plano. Ele já garante `false` aqui: médico que já existe
           decidiu sua principal numa rodada anterior, e o retrato não a
           carrega. O literal fixo que havia aqui fazia a gravação acertar
           enquanto o relatório mentia. */
        principal: v.principal,
      });
    }
  }

  if (vinculos.length) {
    const { error } = await cliente
      .from("profissional_especialidade")
      .upsert(vinculos, { onConflict: "profissional_id,especialidade_id" });
    erro({ error }, "Falha ao ligar especialidades");
    resumo.vinculosCriados = vinculos.length;
  }

  /*
    RQE que a planilha corrige numa especialidade JÁ ligada.

    `update` e não `upsert`, de propósito: o upsert precisaria mandar
    `principal` junto e sobrescreveria a principal que o médico já tem
    decidida. Aqui só o RQE muda.
  */
  for (const m of plano.atualizar) {
    for (const v of m.especialidadesAtualizadas) {
      const { error } = await cliente
        .from("profissional_especialidade")
        .update({ rqe: v.rqe })
        .eq("profissional_id", m.id)
        .eq("especialidade_id", v.especialidadeId);

      erro({ error }, `Falha ao corrigir o RQE do médico ${m.crm}/${m.crmUf}`);
      resumo.rqesCorrigidos++;
    }
  }

  /* --- 5. Endereços e atendimentos --- */

  async function criarEnderecos(
    profissionalId: number,
    enderecos: EnderecoPlanejado[],
  ): Promise<void> {
    if (!enderecos.length) return;

    const { data, error } = await cliente
      .from("local")
      .insert(
        enderecos.map((e) => ({
          logradouro: e.logradouro,
          numero: e.numero,
          complemento: e.complemento,
          bairro_id: bairroId(e),
          cep: e.cep,
          telefone: e.telefone,
          whatsapp: e.whatsapp,
        })),
      )
      .select("id");
    erro({ error }, "Falha ao criar endereços");

    const ids = (data ?? []).map((l) => l.id as number);
    if (ids.length !== enderecos.length) {
      throw new Error(
        `O banco confirmou ${ids.length} de ${enderecos.length} endereços do médico ` +
          `${profissionalId}. Os que entraram ficaram sem atendimento — confira antes de rodar de novo.`,
      );
    }
    resumo.enderecosCriados += ids.length;

    /*
      O atendimento entra imediatamente depois. Uma interrupção entre as duas
      deixa endereço órfão — invisível ao visitante, porque `local_publicado`
      exige médico ou estabelecimento publicado, e ignorado pelo retrato da
      rodada seguinte, que só considera local com atendimento.
    */
    const { error: erroAtendimento } = await cliente
      .from("atendimento")
      .upsert(
        ids.map((local_id) => ({ profissional_id: profissionalId, local_id })),
        { onConflict: "profissional_id,local_id" },
      );
    erro({ error: erroAtendimento }, "Falha ao ligar endereços ao médico");
  }

  for (const m of plano.criar) {
    const id = idPorChaveNatural.get(`${m.crm}|${m.crmUf}`);
    if (id === undefined) {
      throw new Error(
        `O banco não devolveu o id do médico ${m.crm}/${m.crmUf} depois de criá-lo.`,
      );
    }
    await criarEnderecos(id, m.enderecos);
  }

  for (const m of plano.atualizar) {
    await criarEnderecos(m.id, m.enderecosNovos);

    for (const e of m.enderecosAtualizados) {
      const campos: Record<string, unknown> = {};
      for (const mud of e.mudancas) campos[mud.campo] = mud.para;

      const { error } = await cliente.from("local").update(campos).eq("id", e.id);
      erro({ error }, `Falha ao atualizar o endereço ${e.id}`);
      resumo.enderecosAtualizados++;
    }
  }

  return resumo;
}
