# Generated Skills — agents-cli

Generated on 2026-03-08. Each skill follows the skill-creator guidelines: trigger-aware descriptions, real executable examples, progressive disclosure, imperative form.

## Ingredient Skills (Individual CLIs)

These are standalone CLI tool skills — each wraps a single tool with deep knowledge of its commands, flags, patterns, and agent workflows.

| Skill | Version | Lines | Description |
|-------|---------|-------|-------------|
| [ripgrep](./ripgrep/SKILL.md) | 15.1.0 | 490 | Fast regex search across files (rg) |
| [fd](./fd/SKILL.md) | 10.3.0 | 352 | Fast file finder (modern find) |
| [jq](./jq/SKILL.md) | 1.8.1 | 353 | Command-line JSON processor |
| [fzf](./fzf/SKILL.md) | 0.70.0 | 499 | Interactive fuzzy finder |
| [bat](./bat/SKILL.md) | 0.26.1 | 500 | File viewer with syntax highlighting |
| [eza](./eza/SKILL.md) | 0.23.4 | 427 | Modern file lister (ls replacement) |
| [uv](./uv/SKILL.md) | 0.10.9 | 359 | Fast Python package manager |
| [gh](./gh/SKILL.md) | 2.54.0 | 746 | GitHub CLI |
| [just](./just/SKILL.md) | 1.46.0 | 347 | Command runner (make alternative) |
| [mise](./mise/SKILL.md) | 2026.2.21 | 328 | Dev tool version manager |
| [zoxide](./zoxide/SKILL.md) | 0.9.8 | 498 | Smart directory navigation |

## Workflow/Recipe Skills (Multi-Tool Combinations)

These combine multiple ingredient CLIs into complete workflows — step-by-step guides for common development tasks.

| Skill | Ingredients | Lines | Description |
|-------|-------------|-------|-------------|
| [code-search-workflow](./code-search-workflow/SKILL.md) | rg, fd, fzf, bat, jq | 496 | Search, explore, and understand codebases |
| [python-dev-workflow](./python-dev-workflow/SKILL.md) | uv, rg, fd, jq | 557 | Complete Python development workflow |
| [git-github-workflow](./git-github-workflow/SKILL.md) | git, gh | 759 | Git branching, PRs, issues, releases, CI |
| [devenv-setup-workflow](./devenv-setup-workflow/SKILL.md) | mise, just, uv, zoxide | 937 | Dev environment setup and management |
| [file-ops-workflow](./file-ops-workflow/SKILL.md) | fd, eza, bat, fzf, rg, jq | 531 | File finding, viewing, organizing, cleanup |
| [data-processing-workflow](./data-processing-workflow/SKILL.md) | jq, rg, fd | 587 | JSON processing, data transformation, ETL |

## How Ingredients and Recipes Work Together

```
┌─────────────────────────────────────────────────┐
│              RECIPE / WORKFLOW                   │
│  "code-search-workflow"                         │
│                                                  │
│  Uses INGREDIENTS:                               │
│    rg  → search file contents                    │
│    fd  → find files by name/type                 │
│    fzf → interactive selection                   │
│    bat → syntax-highlighted preview              │
│    jq  → parse structured search results         │
│                                                  │
│  Example workflow:                               │
│    fd -e ts | fzf --preview 'bat {}' | xargs rg  │
└─────────────────────────────────────────────────┘
```

An agent can use an **ingredient skill** to learn a single tool deeply, or a **workflow skill** to orchestrate multiple tools for a complete task.
