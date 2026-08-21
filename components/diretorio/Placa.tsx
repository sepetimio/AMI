/* Nome de uma palavra só devolvia a mesma letra duas vezes ("JJ"). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/*
  Retrato do profissional, ou a placa de iniciais quando não há retrato.

  Existe separado porque a linha de resultado e o perfil precisam da mesma
  coisa em dois tamanhos, e duas cópias divergiriam na primeira alteração.

  Sem foto, iniciais em placa verde. Nunca avatar ilustrado, nunca o ícone de
  bonequinho cinza: com quinhentos profissionais sem retrato, quinhentos
  bonequinhos idênticos é a definição de lista genérica.

  O brilho interno no topo é o que separa uma placa de um retângulo pintado.
  Sugere espessura e uma luz vindo de cima, o mesmo princípio das sombras
  tingidas de verde declaradas em globals.css.
*/
export function Placa({
  nome,
  foto,
  tamanho,
}: {
  nome: string;
  foto?: string | null;
  /** Lado do quadrado, em pixels. */
  tamanho: number;
}) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={`Retrato de ${nome}`}
        width={tamanho}
        height={tamanho}
        style={{ width: tamanho, height: tamanho }}
        className="shrink-0 rounded-bloco object-cover shadow-apoio"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: tamanho,
        height: tamanho,
        /* Proporcional ao lado: as iniciais ocupam sempre a mesma fração da
           placa, em vez de nadar dentro dela no tamanho grande. */
        fontSize: Math.round(tamanho * 0.34),
      }}
      className="flex shrink-0 items-center justify-center rounded-bloco bg-ami-green-800 font-titulo font-bold text-ami-mint-400 shadow-[inset_0_1px_0_rgba(165,220,175,0.22)] [font-stretch:84%]"
    >
      {iniciais(nome)}
    </span>
  );
}
