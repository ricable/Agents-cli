---
name: delta
version: 0.0.0
description: "A syntax-highlighting pager for git, diff, grep, and blame output. Use this skill when working with delta-related tasks."
ingredients:
  - dandavison/delta
tags:
  - color-themes
  - delta
  - diff
  - git
  - git-delta
  - pager
  - rust
  - syntax-highlighter
  - cli
# homepage: https://dandavison.github.io/delta/
# license: MIT
---

# delta

A syntax-highlighting pager for git, diff, grep, and blame output

**Source**: https://dandavison.github.io/delta/

## Usage

```bash
# Show help
delta --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run delta -- --help --json

# Introspect command schema
agents-cli schema delta --json

# Dry-run before executing
agents-cli run delta -- <args> --dry-run
```
