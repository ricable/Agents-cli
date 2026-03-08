---
name: meilisearch
version: 0.0.0
description: "CLI tool: meilisearch. Use this skill when working with meilisearch-related tasks."
ingredients:
  - meilisearch/meilisearch
tags:
  - cli
---

# meilisearch

CLI tool: meilisearch

## Usage

```bash
# Show help
meilisearch --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run meilisearch -- --help --json

# Introspect command schema
agents-cli schema meilisearch --json

# Dry-run before executing
agents-cli run meilisearch -- <args> --dry-run
```
