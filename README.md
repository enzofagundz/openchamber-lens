# Lens

Painel de observação de sessão para o [OpenChamber](https://openchamber.dev). Mostra, ao vivo, quanto contexto já foi usado, quanto a sessão custou, quais subagentes estão trabalhando, o que cada turno fez e quais arquivos mudaram.

É uma adaptação do [csr-lens](https://github.com/cesarschutz/claude-code-kit/tree/main/plugins/csr-lens) do Claude Code para o modelo de extensões do OpenChamber: um painel lateral com quatro abas e uma faixa compacta no painel Work Status.

## O que mostra

| Aba | Conteúdo |
|---|---|
| Visão geral | contexto usado/limite, custo, tokens (entrada, saída, raciocínio, cache), modelo, duração, ferramentas, falhas e arquivos recentes |
| Agentes | conversa principal e todos os subagentes, aninhados por `parentID`, com modelo, status, custo, tokens e ferramentas |
| Turnos | agrupamento por pedido do usuário, com duração, custo, ferramentas, falhas e subagentes |
| Diffs | arquivos alterados pela sessão, com adições/remoções e patch expansível |

A extensão também adiciona a seção **Lens** ao painel Work Status: contexto, custo, agentes rodando, modelo e arquivos alterados.

## Requisitos

- OpenChamber `2.3.3` ou mais novo.
- App desktop ou um `openchamber serve` local.
- Instância remota ou protegida por senha **não é suportada** nesta versão.

## Instalar

1. Abra **Configurações → Extensões** no OpenChamber.
2. Adicione a pasta deste projeto.
3. Autorize o serviço local e a capacidade `sessions`.

O Lens lê o servidor local do OpenChamber em `127.0.0.1`. A porta vem de `settings.json` (`desktopLocalPort`) no desktop ou dos arquivos de instância do `openchamber serve`.

## O que o Lens lê

Somente `GET` no servidor local do OpenChamber:

- lista de sessões e sessões filhas;
- mensagens da sessão;
- diff da sessão;
- catálogo de modelos, para o limite de contexto;
- mapa de sessões ativas;
- fluxo SSE `/api/event`, para invalidar o cache.

O Lens **não escreve** em arquivos do projeto, **não guarda segredos**, **não executa comandos** e **não para nem altera agentes**. A única capacidade pedida é `sessions`, usada para abrir a sessão de um subagente quando você clica nele.

## Desenvolver

```bash
bun install
bun run build
bun run typecheck
bun test
```

Depois de alterar `panel/` ou `status/`, rode `bun run build` e recarregue o painel. O OpenChamber não compila TypeScript na instalação: os arquivos `panel/main.js`, `status/main.js` e `service/main.js` precisam existir no pacote.

Estrutura:

- `src/panel`: painel de quatro abas.
- `src/status`: faixa compacta do Work Status.
- `src/service`: serviço local, descoberta da porta, cliente da API e SSE.
- `src/shared`: tipos, derivação do snapshot, formatação e textos pt-BR.
- `tests`: testes do contrato do serviço e dos view-models.

## Limitações conhecidas

- Instância remota ou com senha: o serviço não autentica; o painel mostra um aviso explícito.
- O diff vem da sessão; não há diff por turno nem do working tree do git.
- Sem histórico persistido: ao reabrir, o Lens recarrega o estado atual.
- Sem parar agente, sem árvore de arquivos e sem inventário de plugins. Isso fica para uma próxima versão.

## Licença

MIT.
