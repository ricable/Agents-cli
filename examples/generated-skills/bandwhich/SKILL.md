---
name: bandwhich
version: 0.0.0
description: "CLI tool: bandwhich. Use this skill when working with bandwhich-related tasks."
ingredients:
  - imsnif/bandwhich
tags:
  - cli
---

# bandwhich

CLI tool: bandwhich

## Usage

```bash
# Show help
bandwhich --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bandwhich -- --help --json

# Introspect command schema
agents-cli schema bandwhich --json

# Dry-run before executing
agents-cli run bandwhich -- <args> --dry-run
```
