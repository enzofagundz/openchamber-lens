# Lens

Painel de observação de sessão para o [OpenChamber](https://openchamber.dev). Mostra, ao vivo, quanto contexto já foi usado, quanto a sessão custou, quais subagentes estão trabalhando, o que cada turno fez e quais arquivos mudaram.

É uma adaptação do [csr-lens](https://github.com/cesarschutz/claude-code-kit/tree/main/plugins/csr-lens) do Claude Code para o modelo de extensões do OpenChamber: um painel lateral com seis abas e uma faixa compacta no painel Work Status.

## O que mostra

| Aba | Conteúdo |
|---|---|
| Visão geral | contexto usado/limite, custo, tokens (entrada, saída, raciocínio, cache), modelo, duração, ferramentas, falhas, arquivos recentes e histórico |
| Agentes | conversa principal e todos os subagentes, aninhados por `parentID`, com modelo, status, custo, tokens e ferramentas; para subagentes rodando, botão **Parar** |
| Turnos | agrupamento por pedido do usuário, com duração, custo, ferramentas, falhas e subagentes |
| Diffs | arquivos alterados pela sessão, por turno ou pelo working tree do Git, com adições/remoções e patch expansível |
| Árvore | diretórios e arquivos do projeto, com expansão sob demanda e marcação de arquivos tocados |
| Inventário | agentes, comandos, skills, MCP e plugins instalados, com filtro |

A extensão também adiciona a seção **Lens** ao painel Work Status: contexto, custo, agentes rodando, modelo e arquivos alterados. Clique na faixa para abrir o painel. O comando `/lens` também abre o painel.

## Requisitos

- OpenChamber `2.3.3` ou mais novo.
- App desktop ou um `openchamber serve`.
- Instância com senha: o serviço usa o token local do desktop ou a senha do arquivo de instância do `serve`. Não há URL remota arbitrária; a extensão roda no host do OpenChamber.

## Instalar

1. Abra **Configurações → Extensões** no OpenChamber.
2. Adicione a pasta deste projeto.
3. Autorize o serviço local e a capacidade `sessions`.

O Lens lê o servidor local do OpenChamber em `127.0.0.1`. A porta vem de `settings.json` (`desktopLocalPort`) no desktop ou dos arquivos de instância do `openchamber serve`.

## O que o Lens lê

`GET` no servidor local do OpenChamber:

- lista de sessões e sessões filhas;
- mensagens da sessão;
- diff da sessão, do turno e do working tree do Git;
- catálogo de modelos, para o limite de contexto;
- mapa de sessões ativas;
- fluxo SSE `/api/event`, para invalidar o cache.

A única ação de escrita é `POST /interrupt`, para pedir a parada de um subagente. O Lens **não escreve** em arquivos do projeto, **não guarda segredos** e **não executa comandos**. A única capacidade pedida é `sessions`, usada para abrir a sessão de um subagente quando você clica nele.

O histórico é local, em `{dataDir}/lens-history/<sessionId>.jsonl`, com retenção de 30 dias e limite de 2.000 pontos. Ele guarda só números (custo, contexto, turnos, arquivos), nunca prompts ou conteúdo de arquivos. A cotação USD/BRL é manual e fica no `host.storage`.

## Desenvolver

```bash
bun install
bun run build
bun run typecheck
bun test
```

Depois de alterar `panel/` ou `status/`, rode `bun run build` e recarregue o painel. O OpenChamber não compila TypeScript na instalação: os arquivos `panel/main.js`, `status/main.js` e `service/main.js` precisam existir no pacote.

Smoke visual (opcional, com o OpenChamber rodando):

```bash
bun add -d @playwright/test
bun run visual:smoke
```

O smoke abre a sessão atual, verifica 320/480/880px em claro e escuro, mede overflow e confere a faixa do Work Status. Sem app ou sem Playwright, ele encerra com `skipped` em vez de falhar.

Estrutura:

- `src/panel`: painel de seis abas.
- `src/status`: faixa compacta do Work Status.
- `src/service`: serviço local, descoberta da porta, auth local, cliente da API, SSE e histórico.
- `src/shared`: tipos, derivação do snapshot, formatação e textos pt-BR.
- `tests`: testes do contrato do serviço, auth e view-models.

## Limitações conhecidas

- A extensão roda no host do OpenChamber; uma URL remota arbitrária não é configurável.
- O stop interrompe apenas subagentes da sessão atual, com confirmação; o agente principal nunca é interrompido pelo Lens.
- O diff por turno é melhor esforço: `edit`/`patch` trazem patch; `write` aparece como “diff indisponível”.
- O histórico é local e por sessão; não há comparação entre projetos.
- Mobile e VS Code não carregam extensões do OpenChamber.

## Licença

MIT.
