import { chave } from "@/lib/importador/texto";
import {
  NOMES_DE_COLUNA,
  type Cabecalho,
  type Celula,
  type NomeDeColuna,
} from "@/lib/importador/tipos";

/*
  As 13 colunas.

  O título é o que sai no modelo e o que a AMI enxerga. O reconhecimento é
  frouxo de propósito — casa por forma normalizada, com o sublinhado valendo
  espaço — porque a planilha vai voltar editada por várias pessoas e "UF do
  CRM" digitado à mão não pode reprovar o arquivo inteiro.
*/
export const TITULOS: Record<NomeDeColuna, string> = {
  nome: "nome",
  crm: "crm",
  uf_do_crm: "uf_do_crm",
  especialidade: "especialidade",
  rqe: "rqe",
  telemedicina: "telemedicina",
  logradouro: "logradouro",
  numero: "numero",
  complemento: "complemento",
  bairro: "bairro",
  cep: "cep",
  telefone: "telefone",
  whatsapp: "whatsapp",
};

/** Chave de comparação: sublinhado e hífen contam como espaço. */
function chaveDeTitulo(s: string): string {
  return chave(s.replace(/[_-]+/g, " "));
}

const POR_CHAVE = new Map<string, NomeDeColuna>(
  NOMES_DE_COLUNA.map((c) => [chaveDeTitulo(TITULOS[c]), c]),
);

export function lerCabecalho(primeiraLinha: Celula[]): Cabecalho {
  const indices: Partial<Record<NomeDeColuna, number>> = {};
  const ignoradas: string[] = [];

  primeiraLinha.forEach((celula, i) => {
    const bruto = celula === null ? "" : String(celula);
    if (!bruto.trim()) return;

    const reconhecida = POR_CHAVE.get(chaveDeTitulo(bruto));

    if (!reconhecida) {
      ignoradas.push(bruto.trim());
      return;
    }

    /* A primeira ocorrência vence: coluna repetida é engano de quem editou,
       e a segunda costuma estar vazia. */
    if (indices[reconhecida] === undefined) indices[reconhecida] = i;
  });

  return { indices, ignoradas };
}
