---
name: OpenSearch
version: 0.0.0
description: "CLI tool: OpenSearch. Use this skill when working with OpenSearch-related tasks."
ingredients:
  - opensearch-project/OpenSearch
tags:
  - cli
---

# OpenSearch

CLI tool: OpenSearch

## Usage

```bash
# Show help
OpenSearch --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run OpenSearch -- --help --json

# Introspect command schema
agents-cli schema OpenSearch --json

# Dry-run before executing
agents-cli run OpenSearch -- <args> --dry-run
```
