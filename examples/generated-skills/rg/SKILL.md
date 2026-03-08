---
name: ripgrep
version: 0.0.0
description: "ripgrep recursively searches directories for a regex pattern while respecting your gitignore. Use this skill when working with ripgrep-related tasks."
ingredients:
  - BurntSushi/ripgrep
tags:
  - cli
  - command-line
  - command-line-tool
  - gitignore
  - grep
  - recursively-search
  - regex
  - ripgrep
  - rust
  - search
# homepage: https://github.com/BurntSushi/ripgrep
# license: Unlicense
---

# ripgrep

ripgrep recursively searches directories for a regex pattern while respecting your gitignore

**Source**: https://github.com/BurntSushi/ripgrep

## Usage

```bash
# Show help
ripgrep --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ripgrep -- --help --json

# Introspect command schema
agents-cli schema ripgrep --json

# Dry-run before executing
agents-cli run ripgrep -- <args> --dry-run
```
