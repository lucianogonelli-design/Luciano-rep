# Skills do Claude

Coleção de skills personalizadas para usar com o Claude (Claude Code e Claude.ai).

Cada skill fica em `skills/<nome-da-skill>/SKILL.md`, com frontmatter (`name` e `description`) seguido das instruções que o Claude passa a seguir quando a skill é acionada.

## Skills disponíveis

| Skill | Descrição |
| --- | --- |
| [`viral-scripts`](viral-scripts/SKILL.md) | Cria, reescreve e diagnostica roteiros de 15 a 90 segundos para Reels, Shorts e TikTok em português brasileiro, com foco em retenção, clareza e conversão. |

## Como instalar uma skill

### Claude Code (CLI)

Skills pessoais ficam em `~/.claude/skills/` e valem para todos os projetos. Para instalar a `viral-scripts`:

```bash
mkdir -p ~/.claude/skills
cp -r skills/viral-scripts ~/.claude/skills/
```

Para deixar a skill disponível só em um projeto, copie a pasta para `.claude/skills/` dentro do repositório onde quer usá-la.

Depois disso, o Claude reconhece a skill automaticamente e a aciona quando o pedido combinar com a `description`. Você também pode chamá-la explicitamente por `/viral-scripts`.

### Claude.ai

Nas configurações de Skills (Capabilities), envie a pasta da skill (`skills/viral-scripts/`) ou um arquivo `.zip` com o conteúdo dela.

## Estrutura

```
skills/
├── README.md
└── viral-scripts/
    └── SKILL.md
```
