---
name: neo4j-graphrag-python
version: 0.0.0
description: "CLI tool: neo4j-graphrag-python. Use this skill when working with neo4j-graphrag-python-related tasks."
ingredients:
  - neo4j/neo4j-graphrag-python
tags:
  - cli
---

# neo4j-graphrag-python

CLI tool: neo4j-graphrag-python

## Usage

```bash
# Show help
neo4j-graphrag-python --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run neo4j-graphrag-python -- --help --json

# Introspect command schema
agents-cli schema neo4j-graphrag-python --json

# Dry-run before executing
agents-cli run neo4j-graphrag-python -- <args> --dry-run
```
