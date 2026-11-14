/* O endereço público do site, lido em um lugar só.
   Ordem: NEXT_PUBLIC_SITE_URL, o endereço de produção da Vercel, localhost. */

type Ambiente = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  [outra: string]: string | undefined;
};

const SEM_BARRA_NO_FIM = /\/+$/;
const TEM_ESQUEMA = /^https?:\/\//i;

export function enderecoDoSite(amb: Ambiente): string {
  const variavel = (amb.NEXT_PUBLIC_SITE_URL ?? "")
    .trim()
    .replace(SEM_BARRA_NO_FIM, "");
  if (variavel) return variavel;

  const vercel = (amb.VERCEL_PROJECT_PRODUCTION_URL ?? "")
    .trim()
    .replace(SEM_BARRA_NO_FIM, "");
  if (vercel) return TEM_ESQUEMA.test(vercel) ? vercel : `https://${vercel}`;

  return "http://localhost:3000";
}

export const URL_DO_SITE = enderecoDoSite(process.env);
