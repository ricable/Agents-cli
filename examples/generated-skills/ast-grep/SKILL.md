---
name: ast-grep
version: 0.0.0
description: "⚡A CLI tool for code structural search, lint and rewriting. Written in Rust. Use this skill when working with ast-grep-related tasks."
ingredients:
  - ast-grep/ast-grep
tags:
  - ast
  - babel
  - codemod
  - codereview
  - command-line
  - command-line-tool
  - grep
  - linter
  - refactoring
  - rust
  - search
  - static-analysis
  - structural-search
  - tree-sitter
  - typescript
  - cli
# homepage: https://ast-grep.github.io/
# license: MIT
---

# ast-grep

⚡A CLI tool for code structural search, lint and rewriting. Written in Rust

**Source**: https://ast-grep.github.io/

## Usage

```bash
# Show help
ast-grep --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ast-grep -- --help --json

# Introspect command schema
agents-cli schema ast-grep --json

# Dry-run before executing
agents-cli run ast-grep -- <args> --dry-run
```
