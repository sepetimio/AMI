import { lerCabecalho } from "@/lib/importador/colunas";
import { agrupar } from "@/lib/importador/agrupar";
import { ehErro, ehLinhaVazia, lerLinha } from "@/lib/importador/linha";
import { montarPlano } from "@/lib/importador/plano";
import { planoEstaLimpo, relatorio } from "@/lib/importador/relatorio";
import type { Aviso, ErroDeLinha, LinhaLida } from "@/lib/importador/tipos";
import { clientePrivilegiado } from "@/scripts/credencial";
import { gerarModelo, lerPlanilha } from "@/scripts/modelo";
import { lerRetrato } from "@/scripts/retrato";
import { gravar } from "@/scripts/gravar";
import { basename } from "node:path";

/*
  O comando.

  A conferência é o padrão e não grava nada. Gravar exige a palavra
  `--gravar` escrita à mão: o caminho fácil é o inofensivo.

  Uso:
    npm run importar -- --modelo
    npm run importar -- associados.xlsx
    npm run importar -- associados.xlsx --gravar
*/

const USO = `
Uso:
  npm run importar -- --modelo [destino.xlsx]   gera o modelo (padrão: modelo-associados.xlsx)
  npm run importar -- <arquivo.xlsx>            confere, sem gravar nada
  npm run importar -- <arquivo.xlsx> --gravar   grava
`.trim();

const CONHECIDOS = new Set(["--modelo", "--gravar"]);

async function principal(): Promise<void> {
  const argumentos = process.argv.slice(2);

  /*
    Argumento desconhecido é erro, não é ignorado — mesma forma do `publicar`.

    Isto pega erro de digitação (`--modeloo` vira argumento solto e some sem
    aviso). Não protege a planilha preenchida: em `associados.xlsx --modelo`
    os dois argumentos são conhecidos, `desconhecidos` fica vazio, e o
    arquivo da AMI chega normalmente como destino do modelo. Quem recusa
    sobrescrever é `gerarModelo`, e por isso a guarda mora lá — cobre
    qualquer chamador, não só esta forma de argumento.
  */
  const desconhecidos = argumentos.filter((a) => a.startsWith("--") && !CONHECIDOS.has(a));
  if (desconhecidos.length) {
    console.error(`Não conheço ${desconhecidos.join(", ")}.\n`);
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  const querGravar = argumentos.includes("--gravar");
  const soltos = argumentos.filter((a) => !a.startsWith("--"));

  if (argumentos.includes("--modelo")) {
    const destino = soltos[0] ?? "modelo-associados.xlsx";
    await gerarModelo(destino);
    console.log(`Modelo escrito em ${destino}`);
    return;
  }

  const arquivo = soltos[0];
  if (!arquivo) {
    console.error(USO);
    process.exitCode = 1;
    return;
  }

  /* --- Ler e validar --- */
  const linhas = await lerPlanilha(arquivo);
  if (!linhas.length) throw new Error(`${arquivo} está vazio.`);

  const cabecalho = lerCabecalho(linhas[0]);

  for (const obrigatoria of ["nome", "crm"] as const) {
    if (cabecalho.indices[obrigatoria] === undefined) {
      throw new Error(
        `O arquivo não tem a coluna "${obrigatoria}". ` +
          "Rode `npm run importar -- --modelo` para ver o formato esperado.",
      );
    }
  }

  const lidas: LinhaLida[] = [];
  const erros: ErroDeLinha[] = [];
  const avisos: Aviso[] = [];
  let linhasLidas = 0;

  linhas.slice(1).forEach((celulas, i) => {
    if (ehLinhaVazia(celulas)) return;

    /* +2: o cabeçalho é a linha 1, e o índice começa em zero. É o número que
       a AMI vê ao abrir a planilha. */
    const numero = i + 2;
    linhasLidas++;

    const r = lerLinha(celulas, cabecalho, numero);
    if (ehErro(r)) erros.push(r);
    else {
      lidas.push(r);
      avisos.push(...r.avisos);
    }
  });

  const { medicos, erros: errosDeAgrupamento } = agrupar(lidas);

  /* --- Retrato e plano --- */
  const cliente = await clientePrivilegiado();
  const retrato = await lerRetrato(cliente);

  const plano = montarPlano(medicos, retrato, {
    arquivo: basename(arquivo),
    linhasLidas,
    colunasIgnoradas: cabecalho.ignoradas,
    erros: [...erros, ...errosDeAgrupamento].sort((a, b) => a.linha - b.linha),
    avisos,
  });

  console.log(relatorio(plano));

  if (!querGravar) {
    console.log("");
    console.log(
      planoEstaLimpo(plano)
        ? "Nada foi gravado. Para gravar: acrescente --gravar ao comando."
        : "Nada foi gravado. Corrija a planilha e rode de novo — conferir não custa nada.",
    );
    return;
  }

  /* --- Gravar --- */
  console.log("");
  console.log("Gravando…");

  const resumo = await gravar(cliente, plano);

  console.log("");
  console.log(`  bairros criados          ${resumo.bairrosCriados}`);
  console.log(`  médicos criados          ${resumo.medicosCriados}`);
  /*
    `resumo.medicosAtualizados` conta só quem teve UPDATE na tabela
    `profissional` (nome, telemedicina, associado_ami) — não todo médico com
    QUALQUER alteração, que é o que a conferência mostra em "com alteração".
    Endereço e especialidade têm linha própria logo abaixo; o rótulo precisa
    dizer isso, ou o número aqui parece contradizer o da conferência.
  */
  console.log(`  perfis com dado próprio mudado ${resumo.medicosAtualizados}`);
  console.log(`  endereços criados        ${resumo.enderecosCriados}`);
  console.log(`  endereços atualizados    ${resumo.enderecosAtualizados}`);
  console.log(`  especialidades ligadas   ${resumo.vinculosCriados}`);
  console.log(`  RQE corrigidos           ${resumo.rqesCorrigidos}`);
  console.log("");
  console.log(
    "Ninguém foi publicado. Para colocar no ar: npm run publicar -- --com-especialidade --com-local",
  );
}

principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
