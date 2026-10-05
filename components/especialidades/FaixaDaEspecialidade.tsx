import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { nomeComQuebras } from "@/lib/especialidades";

/*
  A faixa verde de ponta a ponta que abre a página de cada especialidade: a
  faixa curta (components/layout/FaixaCurta.tsx), a mesma da diretoria e
  das páginas de texto.
  - No lugar do rótulo, o link de volta ao índice ("← ESPECIALIDADES", como
    o "← ENCONTRE UM MÉDICO" do perfil).
  - O título e o parágrafo de abertura, gerado dos dados
    (`paragrafoDeAbertura`, lib/dados/facetas.ts). O título leva o hífen
    opcional dos nomes longos (`nomeComQuebras`), como o cartão do índice:
    sem ele, a 320px, "Otorrinolaringologia" quebra deixando uma letra só
    na linha de baixo.

  O "Encontrar médico" da barra do pé, que aparece quando esta faixa sai da
  tela, leva a `/busca`.
*/
export function FaixaDaEspecialidade({
  nome,
  paragrafo,
}: {
  nome: string;
  paragrafo: string;
}) {
  return (
    <FaixaCurta
      volta={{ href: "/medicos", rotulo: "Especialidades" }}
      titulo={`${nomeComQuebras(nome)} em Imperatriz`}
      texto={paragrafo}
    />
  );
}
