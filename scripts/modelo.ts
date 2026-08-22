import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { TITULOS } from "@/lib/importador/colunas";
import { NOMES_DE_COLUNA, type Celula } from "@/lib/importador/tipos";

/*
  ATENÇÃO às duas APIs. Medidas em 22/08/2026, e as duas mudaram em relação
  ao que a maioria dos exemplos mostra:

  - write-excel-file 4.x: `writeExcelFile(dados, { filePath })` RESOLVE SEM
    ERRO E NÃO CRIA ARQUIVO NENHUM. O certo é `.toFile(caminho)`
  - read-excel-file 9.x: o export padrão devolve `[{ sheet, data }]`, não as
    linhas. `readSheet` devolve as linhas
*/

/** Lê a primeira aba. Linhas vazias no fim já vêm descartadas. */
export async function lerPlanilha(caminho: string): Promise<Celula[][]> {
  return (await readSheet(caminho)) as Celula[][];
}

/*
  Uma linha de exemplo, com dados obviamente fictícios.

  Não é enfeite: sem ela, "logradouro" e "complemento" são adivinhação, e a
  primeira planilha volta com o número da casa dentro do logradouro. O teste
  garante que este exemplo passa pela própria validação do importador — um
  modelo que o importador rejeita seria a pior instrução possível.
*/
const EXEMPLO: Record<(typeof NOMES_DE_COLUNA)[number], string> = {
  nome: "Maria Exemplo da Silva",
  crm: "1234",
  uf_do_crm: "MA",
  especialidade: "Cardiologia",
  rqe: "5678",
  telemedicina: "não",
  logradouro: "Rua Exemplo",
  numero: "100",
  complemento: "Sala 302",
  bairro: "Centro",
  cep: "65900-000",
  telefone: "(99) 3524-0000",
  whatsapp: "(99) 98800-0000",
};

export async function gerarModelo(caminho: string): Promise<void> {
  const cabecalho = NOMES_DE_COLUNA.map((c) => ({
    value: TITULOS[c],
    fontWeight: "bold" as const,
  }));

  const exemplo = NOMES_DE_COLUNA.map((c) => ({ value: EXEMPLO[c] }));

  await writeXlsxFile([cabecalho, exemplo], {
    columns: NOMES_DE_COLUNA.map(() => ({ width: 22 })),
  }).toFile(caminho);
}
