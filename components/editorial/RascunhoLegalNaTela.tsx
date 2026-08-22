import { Cabeceira } from "@/components/layout/Cabeceira";
import { dataPorExtenso } from "@/lib/formato";
import type { RascunhoLegal } from "@/lib/rascunhosLegais";
import type { ItemTrilha } from "@/components/layout/Breadcrumb";

/*
  Rascunho de texto legal na tela, enquanto a versão revisada não existe.

  Existe porque a alternativa era pior. Sem ele, três endereços linkados do
  rodapé de toda página davam 404 até o jurídico entregar, e num site que
  lida com saúde a ausência de política de privacidade e de termos de uso é
  falha mais visível do que um rascunho assinalado.

  O aviso no alto não é decoração nem excesso de cautela. Política de
  privacidade é declaração à pessoa sobre como o dado dela é tratado, e
  declaração errada cria exposição para a AMI. Quem lê precisa saber, antes
  do primeiro parágrafo, que aquele texto ainda não foi revisado por
  advogado.

  Assim que a AMI publicar o documento correspondente no Studio, o conteúdo
  de lá entra no lugar deste e o aviso some junto: a página decide qual dos
  dois renderizar, e o revisado sempre vence.
*/
export function RascunhoLegalNaTela({
  rascunho,
  trilha,
}: {
  rascunho: RascunhoLegal;
  trilha: ItemTrilha[];
}) {
  return (
    <>
      <Cabeceira trilha={trilha} titulo={rascunho.titulo}>
        {rascunho.resumo}
      </Cabeceira>

      <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-8">
        {/*
          `role="note"` e não `alert`: alerta interrompe quem usa leitor de
          tela, e isto é contexto para ler antes do texto, não emergência.
        */}
        <div
          role="note"
          className="mt-10 rounded-bloco border border-warn/30 bg-warn/5 p-5 md:p-6"
        >
          <p className="text-[17px] font-semibold text-ink-900">
            Este texto é um rascunho e ainda não foi revisado por advogado
          </p>
          <p className="coluna-leitura mt-2 text-[16px] text-ink-600">
            Ele foi redigido a partir do funcionamento real deste site, para
            servir de ponto de partida à revisão jurídica, e está publicado
            para que a página não fique vazia. Não use como peça definitiva.
          </p>
        </div>

        <p className="registro mt-8 border-b border-line pb-6 text-[15px] text-ink-400">
          Rascunho de {dataPorExtenso(rascunho.atualizadoEm)}
        </p>

        <div className="mt-2">
          {rascunho.secoes.map((s) => (
            <section key={s.titulo}>
              <h2 className="mt-12">{s.titulo}</h2>

              {s.paragrafos.map((p) => (
                <p
                  key={p}
                  className="coluna-leitura mt-5 text-[18px] text-ink-600"
                >
                  {p}
                </p>
              ))}

              {s.lista ? (
                <ul className="coluna-leitura mt-5 list-disc space-y-2 pl-6 text-[18px] text-ink-600">
                  {s.lista.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
