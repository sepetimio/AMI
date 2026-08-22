import { chave } from "@/lib/importador/texto";
import {
  UFS,
  type Aviso,
  type Cabecalho,
  type Celula,
  type EnderecoLido,
  type ErroDeLinha,
  type LinhaLida,
  type NomeDeColuna,
  type Uf,
} from "@/lib/importador/tipos";

/*
  Uma linha da planilha vira ou um médico ou um erro.

  Três níveis de problema, e só o primeiro descarta a linha:

  1. IDENTIDADE quebrada — nome, CRM ou UF. Sem isso não há a quem atribuir
     o resto, e adivinhar cola um consultório no médico errado
  2. CAMPO que não normaliza — telefone, whatsapp, CEP. O médico entra sem
     ele. Gravar um telefone que não é telefone é pior do que não ter
  3. ESPECIALIDADE não resolvida — decidida na tarefa 5, contra o catálogo
*/

/** Converte a célula em texto aparado, com espaço do meio colapsado. */
function texto(c: Celula): string {
  if (c === null || c === undefined) return "";
  if (c instanceof Date) return c.toISOString().slice(0, 10);
  return String(c).replace(/\s+/g, " ").trim();
}

function valor(celulas: Celula[], cab: Cabecalho, coluna: NomeDeColuna): string {
  const i = cab.indices[coluna];
  return i === undefined ? "" : texto(celulas[i]);
}

export function ehLinhaVazia(celulas: Celula[]): boolean {
  return celulas.every((c) => texto(c) === "");
}

export function ehErro(r: LinhaLida | ErroDeLinha): r is ErroDeLinha {
  return "motivo" in r;
}

const SIM = new Set(["sim", "s", "x", "true", "1", "verdadeiro"]);
const NAO = new Set(["nao", "n", "false", "0", "falso"]);

function lerBooleano(bruto: string): boolean | null {
  if (!bruto) return null;
  const k = chave(bruto);
  if (SIM.has(k)) return true;
  if (NAO.has(k)) return false;
  return null;
}

/** Só dígitos, ou nulo com aviso se a contagem não bater. */
function digitos(
  bruto: string,
  campo: NomeDeColuna,
  linha: number,
  aceitos: number[],
  avisos: Aviso[],
): string | null {
  if (!bruto) return null;

  const so = bruto.replace(/\D/g, "");
  if (aceitos.includes(so.length)) return so;

  avisos.push({
    tipo: "campo-descartado",
    campo,
    linha,
    motivo: `"${bruto}" tem ${so.length} ${so.length === 1 ? "dígito" : "dígitos"}`,
  });
  return null;
}

export function lerLinha(
  celulas: Celula[],
  cab: Cabecalho,
  linha: number,
): LinhaLida | ErroDeLinha {
  const avisos: Aviso[] = [];

  /* --- Nível 1: identidade --- */

  const nome = valor(celulas, cab, "nome");
  if (!nome) return { linha, motivo: "sem nome" };

  const crmBruto = valor(celulas, cab, "crm");
  if (!crmBruto) return { linha, motivo: "CRM vazio" };

  /*
    Só os dígitos, e o texto cru preserva zero à esquerda quando a célula é
    texto. Célula numérica perde o zero antes de o código ver — é o Excel que
    perde, não nós, e não há como recuperar.
  */
  const crm = crmBruto.replace(/\D/g, "");
  if (!crm) return { linha, motivo: `CRM "${crmBruto}" não tem dígito nenhum` };

  const ufBruta = valor(celulas, cab, "uf_do_crm");
  const crmUf = (ufBruta ? ufBruta.toUpperCase() : "MA") as Uf;
  if (!(UFS as readonly string[]).includes(crmUf)) {
    return { linha, motivo: `UF do CRM "${ufBruta}" não existe` };
  }

  /* --- Nível 2: campos --- */

  const especialidade = valor(celulas, cab, "especialidade") || null;
  const rqe = valor(celulas, cab, "rqe") || null;
  const telemedicina = lerBooleano(valor(celulas, cab, "telemedicina"));

  const logradouro = valor(celulas, cab, "logradouro");
  const bairro = valor(celulas, cab, "bairro");

  let endereco: EnderecoLido | null = null;

  if (logradouro && !bairro) {
    /* `local.bairro_id` é `not null` no banco: endereço sem bairro não tem
       como ser gravado, e inventar um bairro seria fabricar dado. */
    avisos.push({ tipo: "endereco-sem-bairro", linha });
  } else if (logradouro && bairro) {
    endereco = {
      linha,
      logradouro,
      numero: valor(celulas, cab, "numero") || null,
      complemento: valor(celulas, cab, "complemento") || null,
      bairro,
      cep: digitos(valor(celulas, cab, "cep"), "cep", linha, [8], avisos),
      telefone: digitos(
        valor(celulas, cab, "telefone"), "telefone", linha, [10, 11], avisos,
      ),
      whatsapp: digitos(
        valor(celulas, cab, "whatsapp"), "whatsapp", linha, [10, 11], avisos,
      ),
    };
  }

  return { linha, nome, crm, crmUf, especialidade, rqe, telemedicina, endereco, avisos };
}
