"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/base/Icone";
import { deveFechar } from "@/lib/gaveta";
import styles from "@/components/layout/Cabecalho.module.css";

export const MENU: { rotulo: string; href: string }[] = [
  { rotulo: "Início", href: "/" },
  { rotulo: "A Associação", href: "/associacao" },
  { rotulo: "Encontre um médico", href: "/busca" },
  { rotulo: "Especialidades", href: "/medicos" },
  { rotulo: "Sua AMI", href: "/#sua-ami" },
  { rotulo: "Notícias", href: "/noticias" },
  { rotulo: "Contato", href: "/contato" },
];

/* Até esta largura (em px) o menu vira gaveta. O mesmo número está nas regras
   de `Cabecalho.module.css`; mude os dois juntos. */
const LARGURA_DA_GAVETA = 1180;

/*
  Qual item marca "página atual".

  "Início" só em `/` exato: por prefixo ele marcaria todas as páginas, já que
  todo caminho começa por `/`. Os outros casam por prefixo, com a barra como
  fronteira: `/medicos/cardiologia` marca "Especialidades", mas `/medico/ana`
  (a página de um médico) não. "Sua AMI" aponta para um trecho da home e
  nunca é "atual": o `href` dela tem `#`, e um caminho (`usePathname`) nunca
  tem, então nenhuma das duas comparações abaixo a alcança.
*/
export function ehAtual(caminho: string, href: string): boolean {
  if (href === "/") return caminho === "/";
  return caminho === href || caminho.startsWith(`${href}/`);
}

/*
  Folha cliente isolada: o caminho atual e o estado da gaveta só existem no
  navegador. O resto do cabeçalho continua no servidor.

  Acima de 1180px o menu é uma linha só. Abaixo, ele some e o botão abre uma
  gaveta com os mesmos sete links. A gaveta fecha com o X (o próprio botão),
  com Esc (devolvendo o foco ao botão), com clique fora e ao escolher um
  item. Se a janela crescer além de 1180px com a gaveta aberta, ela fecha:
  senão o botão sumiria com `aria-expanded="true"`.

  O item atual leva `aria-current="page"`, e o desenho o marca com o
  sublinhado que, nos outros itens, só aparece ao passar o mouse.

  `children` é o botão "Seja associado", vindo do servidor.
*/
export function MenuPrincipal({ children }: { children?: ReactNode }) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const gaveta = useRef<HTMLElement>(null);

  const fechar = () => setAberta(false);

  useEffect(() => {
    if (!aberta) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (deveFechar({ tipo: "tecla", tecla: e.key })) {
        setAberta(false);
        botao.current?.focus();
      }
    };
    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      const noBotao = botao.current?.contains(alvo) ?? false;
      const naGaveta = gaveta.current?.contains(alvo) ?? false;
      if (deveFechar({ tipo: "clique", noBotao, naGaveta })) setAberta(false);
    };
    const estreita = window.matchMedia(`(max-width: ${LARGURA_DA_GAVETA}px)`);
    const aoLargar = () => {
      if (deveFechar({ tipo: "largura", estreita: estreita.matches })) setAberta(false);
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("click", aoClicar);
    estreita.addEventListener("change", aoLargar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("click", aoClicar);
      estreita.removeEventListener("change", aoLargar);
    };
  }, [aberta]);

  return (
    <>
      <nav aria-label="Principal" className={styles.menu}>
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ehAtual(caminho, item.href) ? "page" : undefined}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>

      {children}

      <button
        ref={botao}
        type="button"
        className={styles.abre}
        aria-label={aberta ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberta}
        aria-controls="gaveta"
        onClick={() => setAberta((v) => !v)}
      >
        <Icone nome={aberta ? "fechar" : "menu"} />
      </button>

      <nav
        ref={gaveta}
        id="gaveta"
        aria-label="Menu"
        className={styles.gaveta}
        data-aberta={aberta}
      >
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ehAtual(caminho, item.href) ? "page" : undefined}
            onClick={fechar}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>
    </>
  );
}
