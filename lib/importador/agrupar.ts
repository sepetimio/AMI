import { chave } from "@/lib/importador/texto";
import type {
  ErroDeLinha,
  LinhaLida,
  MedicoDaPlanilha,
} from "@/lib/importador/tipos";

/*
  CRM repetido é o mesmo médico com um segundo local — é como a AMI
  representa quem atende em dois consultórios sem formato aninhado.

  E o mesmo CRM com NOME DIFERENTE é erro, não segundo endereço. Quase sempre
  é CRM digitado errado, e gravar colaria um consultório no médico errado. A
  comparação ignora acento e caixa, porque "João Peçanha" e "joao pecanha"
  são a mesma pessoa digitada por duas pessoas.
*/
export function agrupar(linhas: LinhaLida[]): {
  medicos: MedicoDaPlanilha[];
  erros: ErroDeLinha[];
} {
  const porChave = new Map<string, MedicoDaPlanilha>();
  const primeiraLinhaDe = new Map<string, number>();
  const medicos: MedicoDaPlanilha[] = [];
  const erros: ErroDeLinha[] = [];

  for (const l of linhas) {
    const k = `${l.crm}|${l.crmUf}`;
    const existente = porChave.get(k);

    if (!existente) {
      const novo: MedicoDaPlanilha = {
        crm: l.crm,
        crmUf: l.crmUf,
        nome: l.nome,
        telemedicina: l.telemedicina,
        especialidades: l.especialidade
          ? [{ texto: l.especialidade, rqe: l.rqe, linha: l.linha }]
          : [],
        enderecos: l.endereco ? [l.endereco] : [],
        linhas: [l.linha],
      };
      porChave.set(k, novo);
      primeiraLinhaDe.set(k, l.linha);
      medicos.push(novo);
      continue;
    }

    if (chave(existente.nome) !== chave(l.nome)) {
      erros.push({
        linha: l.linha,
        motivo:
          `CRM ${l.crm} já apareceu na linha ${primeiraLinhaDe.get(k)} ` +
          `com outro nome ("${existente.nome}")`,
      });
      continue;
    }

    existente.linhas.push(l.linha);

    if (l.endereco) existente.enderecos.push(l.endereco);

    /* Primeira resposta preenchida vence. Célula vazia é "não sei". */
    if (existente.telemedicina === null) existente.telemedicina = l.telemedicina;

    if (l.especialidade) {
      const k2 = chave(l.especialidade);
      const jaTem = existente.especialidades.find((e) => chave(e.texto) === k2);
      if (!jaTem) {
        existente.especialidades.push({
          texto: l.especialidade,
          rqe: l.rqe,
          linha: l.linha,
        });
      } else if (!jaTem.rqe && l.rqe) {
        jaTem.rqe = l.rqe;
      }
    }
  }

  return { medicos, erros };
}
