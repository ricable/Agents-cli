---
name: tree
version: 0.0.0
description: "Tree for Unix/LInux. Use this skill when working with tree-related tasks."
ingredients:
  - Old-Man-Programmer/tree
tags:
  - cli
# homepage: https://github.com/Old-Man-Programmer/tree
# license: GPL-2.0
---

# tree

Tree for Unix/LInux

**Source**: https://github.com/Old-Man-Programmer/tree

## Usage

```bash
# Show help
tree --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tree -- --help --json

# Introspect command schema
agents-cli schema tree --json

# Dry-run before executing
agents-cli run tree -- <args> --dry-run
```
