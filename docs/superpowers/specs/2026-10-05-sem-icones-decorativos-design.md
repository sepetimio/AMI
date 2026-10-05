# Sem ícones decorativos

**Data:** 05/10/2026. **Ramo:** `sem-icones-decorativos`, criado a partir da `main` (`178bd3c`).

**Aprovação:** o cliente aprovou o desenho no chat, em 05/10/2026. Antes de juntar à `main`, ele recebe as fotos de antes e depois de cada página e aprova.

## 1. A regra

O cliente pediu: "remover todos os ícones criados no site, estilo a bandeirinha da missão, o olho da visão, os ícones criados para especialidades também, tudo isso remete a uma estrutura de IA que queremos remover do site".

A regra vale para o site inteiro e para todo desenho futuro.

1. **Ícone só aparece em dois lugares.**
   - **Ao lado do texto de um botão ou link:** telefone, WhatsApp, "Como chegar", celular e as setas →, ↗ e ←.
   - **Nos controles da tela:** menu e fechar o menu, a lupa do campo de busca, as setas e o pausar do carrossel, a setinha que abre lista e o × que limpa o filtro.
2. **Fora disso, nenhum ícone.** Nada de ladrilho com ícone em cartão, faixa, número, especialidade ou valor. Nada de ícone de vidro ao lado do título.
3. **Nada entra no lugar do ícone:** nem número, nem letra, nem fio, nem desenho. A hierarquia vem do texto, do espaço e da foto.

## 2. Onde muda

1. **Faixas verdes do topo** (`FaixaCurta`): sai o ladrilho de vidro com o ícone de 84px, à direita.
   - As páginas afetadas: Notícias, Contato, Diretoria, Especialidades, os textos legais, Seja associado e a faixa de cada especialidade, com o `.selo`.
   - A prop `icone` deixa de existir.
   - O texto fica no mesmo lugar (x=172 a 1440), e a largura máxima dele não muda.
2. **A faixa de A Associação:** sai o `.vidro` dos três números. Ficam o número grande e o rótulo.
3. **A faixa da notícia aberta:** sai o `.vidro` do estetoscópio na assinatura. Ficam o nome, o "MÉDICO · CRM" e a data.
4. **A faixa da Diretoria:** sai o calendário da pílula "Gestão".
5. **Os números da home** (`NumerosDaAmi`): sai o ladrilho. Ficam o número e o rótulo.
6. **Missão, visão e valores** (`PrincipiosDaAmi`, na home e em A Associação): sai o ladrilho. Ficam o título e o texto.
7. **O índice de especialidades** (`GradeDeEspecialidades`): sai o ladrilho das 14. O cartão fica com o nome, o número de médicos e a seta →.
   - `iconeDaEspecialidade` e os ícones que só ela usava saem do código.
8. **Os blocos de texto de A Associação:**
   - "Quem somos": sai o ladrilho de "Como chegar"; o botão com o alfinete fica;
   - "Saiba mais": sai o ladrilho de cada atalho;
   - "Fale com a AMI": sai o ladrilho do título; os botões ficam com os ícones deles.
9. **O contato:**
   - "Canais": sai o ladrilho de cada cartão;
   - "Sede": sai o ladrilho de "Como chegar", do horário e do fecho.
   - Os botões ficam com os ícones deles.
10. **O autor no fim da notícia** (`AutorDaNoticia`): sai o ladrilho do estetoscópio. "Por {autor}" e "Ver perfil" ficam.
11. **As páginas de texto** (`FaixaDoTexto`):
    - "Atualizado em" perde o relógio;
    - o quadro de aviso perde o "i" e fica com o título e o texto.

Os botões de dentro desses blocos ("Ligar", "Como chegar", "Abrir o Instagram", "Ver perfil", com as setas) não mudam.

## 3. O que não pode acontecer

- **Buraco ou desalinho onde o ícone estava.** Valem as regras de sempre:
  - texto em x=172 a 1440;
  - irmãos alinhados;
  - o mesmo `--ritmo` entre os blocos;
  - nada passando da borda a 375 e a 390.

  O espaço que o ladrilho ocupava se fecha. Quando o fechamento deixar um cartão desequilibrado (por exemplo, muito baixo ao lado dos irmãos), resolva com o espaço do próprio cartão, nunca com um enfeite novo.
- **Mudança fora do que a seção 2 lista.** Fotos, cores, textos e botões ficam como estão.
- **Moldura "a entrar" perdida.** As molduras continuam as mesmas, com as duas chaves.

## 4. O código

- **Saem:**
  - `LadrilhoIcone` e a variante `duotone` do `Icone`;
  - o campo `icone` dos dados que só serviam ao ladrilho (`lib/associacao.ts`, `lib/paginaDeContato.ts`, `iconeDaPagina` em `lib/paginaDeTexto.ts`, `iconeDaEspecialidade` em `lib/especialidades.ts`);
  - os ícones do `IconeServidor` que ficarem sem uso;
  - o CSS dos ladrilhos e do vidro.
- **Os testes** que conferiam ícone passam a conferir a ausência dele, ou são apagados quando só existiam para o ícone.
- **Um teste trava a regra:**
  - os mapas de ícone só têm os nomes permitidos (a lista da seção 1);
  - nenhum arquivo de `components/` ou `app/` usa `LadrilhoIcone` ou `duotone`;
  - prove por mutação.
- **Os desenhos aprovados** em `docs/desenho-aprovado/` ficam como estão: são o registro histórico. Esta spec manda sobre eles no que diz respeito aos ícones.

## 5. Como provar

- Os testes, a checagem de tipos e o build, verdes.
- A auditoria das 13 páginas públicas e de um perfil de médico, nas 8 larguras, com as duas chaves: alinhamento, ritmo, nada cortado e nenhuma moldura fora da demonstração.
- Uma varredura no HTML de produção: nenhum `svg` de ícone fora de botão, link ou controle. O logotipo e o símbolo da marca na notícia sem capa não são ícones e ficam.
- As fotos de antes (na `main`) e de depois, a 1440 e a 390, de cada página, para o cliente aprovar.
