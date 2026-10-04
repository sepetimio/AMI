import type { NomeIcone } from "@/components/base/IconeServidor";
import { AMI, hrefTelefone } from "@/lib/ami";

/*
  Os canais da página de contato (/contato), em funções puras
  (testes/contato-funcoes.test.ts): o telefone fixo da sede, o celular e o
  Instagram, nessa ordem, com os dados de lib/ami.ts, a fonte única que o
  rodapé e o dado estruturado da home também leem.

  Sem e-mail e sem WhatsApp: lib/ami.ts não tem e-mail, e nenhum dos dois
  números está confirmado como WhatsApp. Quando a AMI informar, o canal
  entra aqui.
*/

export type Canal = {
  chave: "fixo" | "celular" | "instagram";
  icone: NomeIcone;
  /** O rótulo pequeno, em caixa alta pelo CSS. */
  rotulo: string;
  /** O número, ou o perfil do Instagram. */
  dado: string;
  /** O dado é longo (o perfil): letra menor, e pode quebrar. */
  longo: boolean;
  /** A linha de apoio, que some no celular. */
  nota: string;
  /**
   * O botão: "ligar" é o verde, com o telefone; "abrir" é o de contorno,
   * com a seta. `rotulo` é o nome do link para o leitor de tela.
   */
  acao: { tipo: "ligar" | "abrir"; href: string; texto: string; rotulo: string };
};

/** O perfil do Instagram, do endereço: "@associacaomedicadeimperatriz". */
export function perfilDoInstagram(endereco: string): string {
  const [perfil] = new URL(endereco).pathname.split("/").filter(Boolean);
  return `@${perfil}`;
}

export function canaisDeContato(): Canal[] {
  const [fixo, celular] = AMI.telefones;
  return [
    {
      chave: "fixo",
      icone: "telefone",
      rotulo: "Telefone da sede",
      dado: fixo,
      longo: false,
      nota: "Linha fixa, na sede da AMI.",
      acao: { tipo: "ligar", href: hrefTelefone(fixo), texto: "Ligar", rotulo: `Ligar para a sede da AMI, ${fixo}` },
    },
    {
      chave: "celular",
      icone: "celular",
      rotulo: "Celular",
      dado: celular,
      longo: false,
      nota: "Linha de celular da AMI.",
      acao: {
        tipo: "ligar",
        href: hrefTelefone(celular),
        texto: "Ligar",
        rotulo: `Ligar para o celular da AMI, ${celular}`,
      },
    },
    {
      chave: "instagram",
      icone: "instagram",
      rotulo: "Instagram",
      dado: perfilDoInstagram(AMI.redes.instagram),
      longo: true,
      nota: "O perfil da associação.",
      acao: {
        tipo: "abrir",
        href: AMI.redes.instagram,
        texto: "Abrir o Instagram",
        rotulo: "Abrir o Instagram da AMI",
      },
    },
  ];
}
