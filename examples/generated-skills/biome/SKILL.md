---
name: biome
version: 0.0.0
description: "A toolchain for web projects, aimed to provide functionalities to maintain them. Biome offers formatter and linter, usable via CLI and LSP.. Use this skill when working with biome-related tasks."
ingredients:
  - biomejs/biome
tags:
  - css
  - formatter
  - javascript
  - json
  - jsx
  - linter
  - static-code-analysis
  - typescript
  - web
  - cli
# homepage: https://biomejs.dev
# license: Apache-2.0
---

# biome

A toolchain for web projects, aimed to provide functionalities to maintain them. Biome offers formatter and linter, usable via CLI and LSP.

**Source**: https://biomejs.dev

## Usage

```bash
# Show help
biome --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run biome -- --help --json

# Introspect command schema
agents-cli schema biome --json

# Dry-run before executing
agents-cli run biome -- <args> --dry-run
```
