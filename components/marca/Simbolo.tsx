/* Só o símbolo, sem letreiro. Decorativo aqui, então alt vazio e
   aria-hidden: quem usa leitor de tela não ganha nada ouvindo "chevron". */
export function Simbolo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/marca/ami-simbolo.svg"
      alt=""
      aria-hidden="true"
      width={529}
      height={292}
      className={className}
    />
  );
}
