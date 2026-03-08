---
name: firecrawl
version: 0.0.0
description: "CLI tool: firecrawl. Use this skill when working with firecrawl-related tasks."
ingredients:
  - mendableai/firecrawl
tags:
  - cli
---

# firecrawl

CLI tool: firecrawl

## Usage

```bash
# Show help
firecrawl --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run firecrawl -- --help --json

# Introspect command schema
agents-cli schema firecrawl --json

# Dry-run before executing
agents-cli run firecrawl -- <args> --dry-run
```
