import { selecionarParaPublicar } from "@/lib/importador/publicacao";
import { clientePrivilegiado } from "@/scripts/credencial";
import { lerRetrato } from "@/scripts/retrato";

/*
  Publicação em lote.

  Mesma forma do importador: conferência por padrão, `--gravar` para valer.

  Este comando é o único do projeto que muda `publicado` de falso para
  verdadeiro. O importador nunca publica ninguém — 500 perfis vazios no ar de
  uma vez fazem o Google classificar o site como conteúdo raso, e recuperar
  leva meses.

  Não existe caminho de volta aqui: despublicar não é operação deste comando,
  e o importador não remove nem despublica ninguém.
*/

const CONHECIDOS = new Set([
  "--com-especialidade",
  "--com-local",
  "--sem-filtro",
  "--gravar",
]);

const USO = `
Uso:
  npm run publicar -- --com-especialidade --com-local
  npm run publicar -- --com-especialidade --com-local --gravar

  --com-especialidade   só publica quem tem especialidade
  --com-local           só publica quem tem ao menos um endereço
  --sem-filtro          publica todo mundo, sem exigir nada além do CRM
  --gravar              publica de verdade; sem ele, só confere
`.trim();

/* O PostgREST tem limite de tamanho de URL, e o filtro `in` vai na URL. */
const LOTE = 200;

async function principal(): Promise<void> {
  const argumentos = process.argv.slice(2);

  if (!argumentos.length) {
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  /*
    Argumento desconhecido é erro, não é ignorado.

    Sem isto, `--com-especialidad` digitado errado vira `false` em silêncio: o
    operador acha que filtrou, não filtrou, e o comando publica gente que ele
    não queria publicar. Num comando sem volta, palpite não serve.
  */
  const desconhecidos = argumentos.filter((a) => !CONHECIDOS.has(a));
  if (desconhecidos.length) {
    console.error(`Não conheço ${desconhecidos.join(", ")}.\n`);
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  const filtros = {
    comEspecialidade: argumentos.includes("--com-especialidade"),
    comLocal: argumentos.includes("--com-local"),
  };
  const semFiltro = argumentos.includes("--sem-filtro");
  const querGravar = argumentos.includes("--gravar");

  /*
    Publicar sem filtro nenhum precisa ser dito com todas as letras.

    É a operação de maior consequência do projeto inteiro — perfil sem
    especialidade não aparece em faceta nenhuma, e perfil sem endereço não
    responde à pergunta que traz a pessoa ao site. Fazer isso por esquecer de
    digitar dois flags é diferente de fazer por decisão.
  */
  if (!filtros.comEspecialidade && !filtros.comLocal && !semFiltro) {
    console.error(
      "Nenhum filtro escolhido. Isso publicaria todo médico com CRM, mesmo sem\n" +
        "especialidade e sem endereço. Se é o que você quer, diga com todas as\n" +
        "letras acrescentando --sem-filtro. Se não é, use --com-especialidade e\n" +
        "--com-local.\n",
    );
    process.exitCode = 1;
    return;
  }

  const cliente = await clientePrivilegiado();
  const retrato = await lerRetrato(cliente);
  const selecao = selecionarParaPublicar(retrato, filtros);

  const jaNoAr = retrato.profissionais.filter((p) => p.publicado).length;

  console.log("PUBLICAÇÃO EM LOTE");
  console.log("");
  console.log(`  já no ar        ${jaNoAr}`);
  console.log(`  vai publicar    ${selecao.publicar.length}`);
  console.log(`  fica de fora    ${selecao.barrados.length}`);

  if (semFiltro && !filtros.comEspecialidade && !filtros.comLocal) {
    console.log("");
    console.log("  SEM FILTRO: entra todo médico com CRM, inclusive sem especialidade e sem endereço.");
  }

  if (selecao.barrados.length) {
    console.log("");
    console.log("FICAM DE FORA");
    for (const b of selecao.barrados.slice(0, 20)) {
      console.log(`  CRM/${b.candidato.crmUf} ${b.candidato.crm}  ${b.candidato.nome} — ${b.motivo}`);
    }
    if (selecao.barrados.length > 20) {
      console.log(`  … e mais ${selecao.barrados.length - 20}`);
    }
  }

  console.log("");
  console.log(
    "Lembre-se: o site continua invisível para o Google enquanto " +
      "NEXT_PUBLIC_DADOS_DEMONSTRACAO for true.",
  );

  if (!querGravar) {
    console.log("");
    console.log("Nada foi publicado. Para publicar: acrescente --gravar ao comando.");
    return;
  }

  if (!selecao.publicar.length) {
    console.log("");
    console.log("Ninguém a publicar.");
    return;
  }

  for (let i = 0; i < selecao.publicar.length; i += LOTE) {
    const ids = selecao.publicar.slice(i, i + LOTE).map((c) => c.id);
    const { error } = await cliente
      .from("profissional")
      .update({ publicado: true, atualizado_em: new Date().toISOString() })
      .in("id", ids);

    if (error) throw new Error(`Falha ao publicar: ${error.message}`);
    console.log(`  publicados ${Math.min(i + LOTE, selecao.publicar.length)} de ${selecao.publicar.length}`);
  }
}

principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
