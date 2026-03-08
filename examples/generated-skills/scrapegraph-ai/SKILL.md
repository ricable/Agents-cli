---
name: Scrapegraph-ai
version: 0.0.0
description: "CLI tool: Scrapegraph-ai. Use this skill when working with Scrapegraph-ai-related tasks."
ingredients:
  - ScrapeGraphAI/Scrapegraph-ai
tags:
  - cli
---

# Scrapegraph-ai

CLI tool: Scrapegraph-ai

## Usage

```bash
# Show help
Scrapegraph-ai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Scrapegraph-ai -- --help --json

# Introspect command schema
agents-cli schema Scrapegraph-ai --json

# Dry-run before executing
agents-cli run Scrapegraph-ai -- <args> --dry-run
```
