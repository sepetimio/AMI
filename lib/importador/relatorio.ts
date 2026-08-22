import type { Aviso, Plano } from "@/lib/importador/tipos";

const QUANTOS_DETALHAR = 20;

/*
  O relatório da conferência.

  Duas regras que valem mais do que a aparência:

  1. Todo erro cita o NÚMERO DA LINHA do arquivo. É o que a AMI enxerga ao
     abrir a planilha, e é a diferença entre "conserte alguma coisa" e
     "conserte a linha 214"
  2. Seção sem conteúdo não é impressa. Relatório com dez cabeçalhos vazios
     ensina quem lê a passar os olhos, e aí o aviso que importa passa junto
*/

const LARGURA = 22;

function pontilhado(rotulo: string): string {
  const sobra = Math.max(1, LARGURA - rotulo.length);
  return `${rotulo} ${".".repeat(sobra)}`;
}

function secao(titulo: string, linhas: string[]): string[] {
  if (!linhas.length) return [];
  return ["", titulo, ...linhas];
}

function daLinha(n: number): string {
  return `linha ${String(n).padStart(3, " ")}`;
}

/** Avisos que exigem decisão de alguém antes de gravar. */
function ehPendencia(a: Aviso): boolean {
  return a.tipo !== "nome-mudou";
}

/** Um médico de `atualizar` que a gravação não tocaria não é uma atualização. */
function temAlteracao(m: Plano["atualizar"][number]): boolean {
  return (
    m.mudancas.length > 0 ||
    m.especialidadesNovas.length > 0 ||
    m.especialidadesAtualizadas.length > 0 ||
    m.enderecosNovos.length > 0 ||
    m.enderecosAtualizados.length > 0
  );
}

export function planoEstaLimpo(plano: Plano): boolean {
  return plano.erros.length === 0 && !plano.avisos.some(ehPendencia);
}

export function relatorio(plano: Plano): string {
  const l: string[] = [];

  l.push(`CONFERÊNCIA — ${plano.arquivo}`);
  l.push(
    `${plano.linhasLidas} linhas lidas · ${plano.medicosDistintos} médicos distintos`,
  );
  l.push("");
  l.push(`  cria       ${String(plano.criar.length).padStart(6)} médicos`);

  const comAlteracao = plano.atualizar.filter(temAlteracao);
  l.push(
    `  atualiza   ${String(plano.atualizar.length).padStart(6)} médicos` +
      ` (${comAlteracao.length} com alteração)`,
  );

  l.push(`  rejeita    ${String(plano.erros.length).padStart(6)} linhas`);

  if (plano.colunasIgnoradas.length) {
    l.push(
      `  ignora     ${String(plano.colunasIgnoradas.length).padStart(6)} ` +
        `${plano.colunasIgnoradas.length === 1 ? "coluna" : "colunas"} do arquivo: ` +
        plano.colunasIgnoradas.join(", "),
    );
  }

  l.push(
    ...secao(
      "BAIRROS NOVOS (serão criados)",
      plano.bairrosNovos.map((b) => {
        const base = `  ${pontilhado(b.nome)} ${b.medicos} ${b.medicos === 1 ? "médico" : "médicos"}`;
        return b.parecidoCom ? `${base}    (!) parecido com "${b.parecidoCom}"` : base;
      }),
    ),
  );

  /*
    O que a gravação muda em quem já está no banco, campo a campo. Sem isto a
    conferência dizia "atualiza 498 médicos" sem dizer o quê — e a partir da
    segunda rodada TODO médico cai em `atualizar`, mesmo quando a gravação não
    tocaria em nada nele. Truncado como o `publicar` trunca `FICAM DE FORA`,
    porque numa rodada real isso pode ter centenas de linhas.
  */
  l.push(
    ...secao("O QUE MUDA EM QUEM JÁ ESTÁ NO BANCO", [
      ...comAlteracao.slice(0, QUANTOS_DETALHAR).flatMap((m) => [
        `  CRM/${m.crmUf} ${m.crm}  ${m.nome}`,
        ...m.mudancas.map((c) => `      ${c.campo.padEnd(14)} ${c.de || "(vazio)"} → ${c.para}`),
        ...(m.especialidadesNovas.length
          ? [`      ${"especialidade".padEnd(14)} ganha ${m.especialidadesNovas.length}`]
          : []),
        ...(m.especialidadesAtualizadas.length
          ? [`      ${"RQE".padEnd(14)} corrigido em ${m.especialidadesAtualizadas.length}`]
          : []),
        ...(m.enderecosNovos.length
          ? [`      ${"endereço".padEnd(14)} ganha ${m.enderecosNovos.length}`]
          : []),
        ...m.enderecosAtualizados.flatMap((e) =>
          e.mudancas.map((c) => `      endereço ${e.id}: ${c.campo} ${c.de || "(vazio)"} → ${c.para}`),
        ),
      ]),
      ...(comAlteracao.length > QUANTOS_DETALHAR
        ? (() => {
            const resto = comAlteracao.length - QUANTOS_DETALHAR;
            return [`  … e mais ${resto} ${resto === 1 ? "médico" : "médicos"} com alteração`];
          })()
        : []),
    ]),
  );

  /* Endereço que o banco tem e a planilha não trouxe. É relatado, nunca
     apagado — a promessa central da seção 6 da spec. */
  const enderecosSoNoBanco = plano.atualizar.reduce((t, m) => t + m.enderecosSoNoBanco, 0);
  l.push(
    ...secao(
      "ENDEREÇOS NO BANCO E FORA DESTE ARQUIVO",
      [
        `  ${enderecosSoNoBanco} ${enderecosSoNoBanco === 1 ? "endereço" : "endereços"}. ` +
          "Nada será feito com eles.",
      ].filter(() => enderecosSoNoBanco > 0),
    ),
  );

  /* Endereço órfão: sobra de gravação interrompida, sem médico ligado. Fica
     fora do retrato de propósito (`scripts/retrato.ts`), e é contado aqui só
     para a rodada seguinte relatar que ele existe, em vez de ficar calada e
     deixar a próxima gravação inserir um segundo endereço igual. */
  l.push(
    ...secao(
      "ENDEREÇOS SOLTOS NO BANCO",
      [
        `  ${plano.enderecosOrfaos} ${plano.enderecosOrfaos === 1 ? "endereço" : "endereços"} ` +
          "sem médico ligado, de alguma gravação interrompida.",
        `  ${plano.enderecosOrfaos === 1 ? "Não aparece" : "Não aparecem"} no site e nada será feito com eles.`,
      ].filter(() => plano.enderecosOrfaos > 0),
    ),
  );

  /* Especialidades: agrupadas por texto, para que 6 médicos com o mesmo
     problema virem uma linha e não seis. */
  const porTexto = new Map<string, { linhas: number[]; fora: boolean }>();
  for (const a of plano.avisos) {
    if (a.tipo !== "especialidade-desconhecida" && a.tipo !== "especialidade-fora-do-catalogo") {
      continue;
    }
    const ja = porTexto.get(a.texto);
    const fora = a.tipo === "especialidade-fora-do-catalogo";
    if (ja) ja.linhas.push(a.linha);
    else porTexto.set(a.texto, { linhas: [a.linha], fora });
  }

  const rqePerdidos = plano.avisos.filter((a) => a.tipo === "rqe-perdido");

  l.push(
    ...secao("ESPECIALIDADES NÃO RESOLVIDAS", [
      ...[...porTexto.entries()].map(([texto, { linhas, fora }]) => {
        const quantos = `${linhas.length} ${linhas.length === 1 ? "médico" : "médicos"}`;
        const nota = fora ? "conhecida, fora do catálogo do banco" : "não reconhecida";
        return `  ${pontilhado(`"${texto}"`)} ${quantos}    ${nota}`;
      }),
      ...(rqePerdidos.length
        ? [
            `  ${rqePerdidos.length} ${rqePerdidos.length === 1 ? "tinha" : "destes tinham"} ` +
              `RQE, que não será gravado (${rqePerdidos
                .map((a) => (a.tipo === "rqe-perdido" ? a.linha : 0))
                .join(", ")})`,
          ]
        : []),
    ]),
  );

  l.push(
    ...secao(
      "CAMPOS DESCARTADOS (o médico entra sem eles)",
      plano.avisos
        .filter((a) => a.tipo === "campo-descartado")
        .map((a) =>
          a.tipo === "campo-descartado"
            ? `  ${daLinha(a.linha)}  ${a.campo} ${a.motivo}`
            : "",
        ),
    ),
  );

  l.push(
    ...secao(
      "RQE CORRIGIDO EM ESPECIALIDADE JÁ CADASTRADA",
      plano.atualizar
        .filter((m) => m.especialidadesAtualizadas.length)
        .map((m) => `  CRM/${m.crmUf} ${m.crm}  ${m.nome}`),
    ),
  );

  l.push(
    ...secao(
      "ENDEREÇOS INCOMPLETOS (não serão gravados)",
      plano.avisos
        .filter((a) => a.tipo === "endereco-incompleto")
        .map((a) =>
          a.tipo === "endereco-incompleto"
            ? `  ${daLinha(a.linha)}  falta ${a.falta === "bairro" ? "o bairro" : "o logradouro"}`
            : "",
        ),
    ),
  );

  l.push(
    ...secao(
      "NOMES QUE MUDARAM (o endereço do perfil continua o mesmo)",
      plano.avisos
        .filter((a) => a.tipo === "nome-mudou")
        .map((a) =>
          a.tipo === "nome-mudou"
            ? `  ${daLinha(a.linha)}  "${a.de}" → "${a.para}", perfil segue em /medico/${a.slug}`
            : "",
        ),
    ),
  );

  l.push(
    ...secao("NO BANCO E FORA DESTE ARQUIVO", [
      `  ${plano.ausentes.length} ${plano.ausentes.length === 1 ? "médico" : "médicos"}. ` +
        "Nada será feito com eles.",
    ].filter(() => plano.ausentes.length > 0)),
  );

  l.push(
    ...secao(
      "LINHAS REJEITADAS",
      plano.erros.map((e) => `  ${daLinha(e.linha)}  ${e.motivo}`),
    ),
  );

  return l.join("\n");
}
