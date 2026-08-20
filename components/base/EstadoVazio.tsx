/*
  Todo container de lista tem estado vazio desenhado. Lista em branco sem
  explicação é um dos sinais mais visíveis de protótipo inacabado — e aqui
  também é um beco sem saída para o usuário.
*/
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-bloco border border-line bg-surface px-6 py-12 text-center">
      <h2 className="text-[21px] font-semibold">{titulo}</h2>
      <p className="coluna-leitura mx-auto mt-2 text-ink-600">{descricao}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}
