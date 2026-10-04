import { comoProfissional } from "@/lib/dados/sinonimos";

/**
 * Parágrafo de abertura da página de especialidade, na faixa verde do topo.
 *
 * Duas frases, as da spec de Especialidades: quantos profissionais a AMI
 * reúne na especialidade, com o nome que o paciente usa ("cardiologistas",
 * de lib/dados/sinonimos.ts), e o registro no CRM de cada perfil. O número
 * sai dos dados; nunca é escrito à mão.
 *
 * Bairro, telemedicina, acessibilidade e associados não entram: saíram do
 * site em 03/10/2026.
 */
export function paragrafoDeAbertura(especialidade: string, total: number): string {
  const [singular, plural] = comoProfissional(especialidade);
  return (
    `A Associação Médica de Imperatriz reúne ${total} ${total === 1 ? singular : plural} ` +
    `em Imperatriz, no Maranhão. Cada perfil traz o número de registro no ` +
    `Conselho Regional de Medicina.`
  );
}
