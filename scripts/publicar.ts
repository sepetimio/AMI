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

const USO = `
Uso:
  npm run publicar -- --com-especialidade --com-local
  npm run publicar -- --com-especialidade --com-local --gravar
`.trim();

/* O PostgREST tem limite de tamanho de URL, e o filtro `in` vai na URL. */
const LOTE = 200;

async function principal(): Promise<void> {
  const argumentos = process.argv.slice(2);

  const filtros = {
    comEspecialidade: argumentos.includes("--com-especialidade"),
    comLocal: argumentos.includes("--com-local"),
  };
  const querGravar = argumentos.includes("--gravar");

  if (!argumentos.length) {
    console.error(USO);
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

  console.log("");
  console.log(
    "Lembre-se: o site continua invisível para o Google enquanto " +
      "NEXT_PUBLIC_DADOS_DEMONSTRACAO for true.",
  );
}

principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
