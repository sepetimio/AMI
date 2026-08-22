import type { Aviso, Plano } from "@/lib/importador/tipos";

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
  l.push(`  atualiza   ${String(plano.atualizar.length).padStart(6)} médicos`);
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
      "ENDEREÇOS SEM BAIRRO (não serão gravados)",
      plano.avisos
        .filter((a) => a.tipo === "endereco-sem-bairro")
        .map((a) => `  ${daLinha(a.linha)}  o banco exige bairro em todo endereço`),
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
