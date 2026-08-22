import { resolverBairro, resolverEspecialidade } from "@/lib/importador/catalogo";
import { chave, maisParecido, paraSlug } from "@/lib/importador/texto";
import type {
  Aviso,
  BairroNovo,
  EnderecoLido,
  EnderecoPlanejado,
  ErroDeLinha,
  MedicoAtualizado,
  MedicoDaPlanilha,
  MedicoNovo,
  Mudanca,
  Plano,
  Retrato,
  VinculoPlanejado,
} from "@/lib/importador/tipos";

export type ContextoDoPlano = {
  arquivo: string;
  linhasLidas: number;
  colunasIgnoradas: string[];
  erros: ErroDeLinha[];
  avisos: Aviso[];
};

/*
  O plano é a única fonte da verdade do importador: a conferência imprime o
  que está aqui, e a gravação executa o que está aqui. Não há caminho em que
  os dois divirjam, e é o que torna verdadeira a promessa de que o relatório
  descreve o que vai acontecer.

  Função pura: recebe o retrato do banco como argumento em vez de consultá-lo.
*/

/** Igualdade de campo de texto, tolerante a acento, caixa e espaço. */
function igual(a: string | null, b: string | null): boolean {
  return chave(a ?? "") === chave(b ?? "");
}

function anotarMudanca(
  mudancas: Mudanca[],
  campo: string,
  de: string | null,
  para: string | null,
): void {
  /* Célula vazia nunca apaga: "não tenho essa informação", não "apague". */
  if (para === null || para === "") return;
  if (igual(de, para)) return;
  mudancas.push({ campo, de: de ?? "", para });
}

/** Chave de comparação de endereço: logradouro, número e bairro. */
function chaveDeEndereco(
  logradouro: string,
  numero: string | null,
  bairro: string,
): string {
  return [chave(logradouro), chave(numero ?? ""), chave(bairro)].join("|");
}

export function montarPlano(
  medicos: MedicoDaPlanilha[],
  retrato: Retrato,
  contexto: ContextoDoPlano,
): Plano {
  const avisos: Aviso[] = [...contexto.avisos];
  const criar: MedicoNovo[] = [];
  const atualizar: MedicoAtualizado[] = [];

  const bairroPorId = new Map(retrato.bairros.map((b) => [b.id, b]));

  /* --- Bairros novos, acumulados enquanto os endereços são planejados --- */
  const novosPorSlug = new Map<string, { nome: string; medicos: Set<string> }>();

  function planejarEndereco(e: EnderecoLido, crmChave: string): EnderecoPlanejado {
    const r = resolverBairro(e.bairro, retrato.bairros);

    if (r.tipo === "novo") {
      const ja = novosPorSlug.get(r.slug);
      if (ja) ja.medicos.add(crmChave);
      else novosPorSlug.set(r.slug, { nome: r.nome, medicos: new Set([crmChave]) });
    }

    return {
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: r.tipo === "existente" ? { tipo: "existente", id: r.id } : { tipo: "novo", slug: r.slug },
      cep: e.cep,
      telefone: e.telefone,
      whatsapp: e.whatsapp,
    };
  }

  /* --- Especialidades: resolve e acumula as pendências --- */
  function planejarEspecialidades(m: MedicoDaPlanilha): VinculoPlanejado[] {
    const vinculos: VinculoPlanejado[] = [];

    for (const e of m.especialidades) {
      const r = resolverEspecialidade(e.texto, retrato.especialidades);

      if (r.tipo === "achada") {
        vinculos.push({
          especialidadeId: r.id,
          rqe: e.rqe,
          /* A primeira vira principal. Sem isso, o site escolhe por
             `especialidades[0]`, cuja ordem o PostgREST não promete — o que
             faria o mesmo perfil mostrar especialidades diferentes entre
             renderizações. */
          principal: vinculos.length === 0,
        });
        continue;
      }

      avisos.push(
        r.tipo === "desconhecida"
          ? { tipo: "especialidade-desconhecida", linha: e.linha, texto: e.texto }
          : { tipo: "especialidade-fora-do-catalogo", linha: e.linha, texto: r.nome },
      );

      /* O RQE mora em `profissional_especialidade`. Sem o laço ele não tem
         onde ser gravado, e some. Relatar é o mínimo. */
      if (e.rqe) avisos.push({ tipo: "rqe-perdido", linha: e.linha, rqe: e.rqe });
    }

    return vinculos;
  }

  /* --- Slugs: atribuídos uma vez, para sempre --- */
  const slugsOcupados = new Set(retrato.profissionais.map((p) => p.slug));

  function slugLivre(nome: string): string {
    const base = paraSlug(nome) || "medico";
    if (!slugsOcupados.has(base)) {
      slugsOcupados.add(base);
      return base;
    }
    for (let n = 2; ; n++) {
      const tentativa = `${base}-${n}`;
      if (!slugsOcupados.has(tentativa)) {
        slugsOcupados.add(tentativa);
        return tentativa;
      }
    }
  }

  /* --- O laço principal --- */

  const porChaveNatural = new Map(
    retrato.profissionais.map((p) => [`${p.crm}|${p.crmUf}`, p]),
  );
  const vistos = new Set<string>();

  for (const m of medicos) {
    const k = `${m.crm}|${m.crmUf}`;
    vistos.add(k);

    const existente = porChaveNatural.get(k);
    const especialidades = planejarEspecialidades(m);
    const enderecos = m.enderecos.map((e) => planejarEndereco(e, k));

    if (!existente) {
      criar.push({
        crm: m.crm,
        crmUf: m.crmUf,
        nome: m.nome,
        slug: slugLivre(m.nome),
        telemedicina: m.telemedicina ?? false,
        especialidades,
        enderecos,
        linhas: m.linhas,
      });
      continue;
    }

    /* --- Campos do médico --- */
    const mudancas: Mudanca[] = [];

    anotarMudanca(mudancas, "nome", existente.nome, m.nome);
    if (mudancas.some((x) => x.campo === "nome")) {
      avisos.push({
        tipo: "nome-mudou",
        linha: m.linhas[0],
        de: existente.nome,
        para: m.nome,
        slug: existente.slug,
      });
    }

    if (m.telemedicina !== null && m.telemedicina !== existente.telemedicina) {
      mudancas.push({
        campo: "telemedicina",
        de: existente.telemedicina ? "sim" : "não",
        para: m.telemedicina ? "sim" : "não",
      });
    }

    /* A planilha É a lista de associados. Quem está nela é associado. */
    if (!existente.associadoAmi) {
      mudancas.push({ campo: "associado_ami", de: "não", para: "sim" });
    }

    /* --- Especialidades que ainda não existem no laço --- */
    const jaLigadas = new Set(
      retrato.vinculosEspecialidade
        .filter((v) => v.profissionalId === existente.id)
        .map((v) => v.especialidadeId),
    );
    const especialidadesNovas = especialidades.filter(
      (v) => !jaLigadas.has(v.especialidadeId),
    );

    /* --- Endereços --- */
    const doBanco = retrato.locais.filter((l) => l.profissionalId === existente.id);
    const porChaveDeEndereco = new Map(
      doBanco.map((l) => [
        chaveDeEndereco(l.logradouro, l.numero, bairroPorId.get(l.bairroId)?.nome ?? ""),
        l,
      ]),
    );

    const enderecosNovos: EnderecoPlanejado[] = [];
    const enderecosAtualizados: { id: number; mudancas: Mudanca[] }[] = [];
    const casados = new Set<number>();

    m.enderecos.forEach((lido, i) => {
      const casa = porChaveDeEndereco.get(
        chaveDeEndereco(lido.logradouro, lido.numero, lido.bairro),
      );

      if (!casa) {
        enderecosNovos.push(enderecos[i]);
        return;
      }

      casados.add(casa.id);

      const mud: Mudanca[] = [];
      anotarMudanca(mud, "complemento", casa.complemento, lido.complemento);
      anotarMudanca(mud, "cep", casa.cep, lido.cep);
      anotarMudanca(mud, "telefone", casa.telefone, lido.telefone);
      anotarMudanca(mud, "whatsapp", casa.whatsapp, lido.whatsapp);

      if (mud.length) enderecosAtualizados.push({ id: casa.id, mudancas: mud });
    });

    atualizar.push({
      id: existente.id,
      crm: m.crm,
      crmUf: m.crmUf,
      nome: m.nome,
      mudancas,
      especialidadesNovas,
      enderecosNovos,
      enderecosAtualizados,
      enderecosSoNoBanco: doBanco.filter((l) => !casados.has(l.id)).length,
      linhas: m.linhas,
    });
  }

  /* --- Bairros novos, com o aviso de parecido --- */
  const nomesConhecidos = [
    ...retrato.bairros.map((b) => b.nome),
    ...[...novosPorSlug.values()].map((n) => n.nome),
  ];

  const bairrosNovos: BairroNovo[] = [...novosPorSlug.entries()].map(
    ([slug, { nome, medicos: quantos }]) => ({
      nome,
      slug,
      medicos: quantos.size,
      parecidoCom: maisParecido(
        nome,
        nomesConhecidos.filter((n) => chave(n) !== chave(nome)),
      ),
    }),
  );

  /* --- Ausentes: contados, nunca tocados --- */
  const ausentes = retrato.profissionais
    .filter((p) => !vistos.has(`${p.crm}|${p.crmUf}`))
    .map((p) => ({ crm: p.crm, crmUf: p.crmUf, nome: p.nome }));

  return {
    arquivo: contexto.arquivo,
    linhasLidas: contexto.linhasLidas,
    medicosDistintos: medicos.length,
    colunasIgnoradas: contexto.colunasIgnoradas,
    bairrosNovos,
    criar,
    atualizar,
    erros: contexto.erros,
    avisos,
    ausentes,
  };
}
