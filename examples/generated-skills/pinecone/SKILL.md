---
name: @pinecone-database/pinecone
version: 7.1.0
description: "CLI tool: @pinecone-database/pinecone. Use this skill when working with @pinecone-database/pinecone-related tasks."
ingredients:
  - @pinecone-database/pinecone
tags:
  - cli
---

# @pinecone-database/pinecone

CLI tool: @pinecone-database/pinecone

## Usage

```bash
# Show help
@pinecone-database/pinecone --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @pinecone-database/pinecone -- --help --json

# Introspect command schema
agents-cli schema @pinecone-database/pinecone --json

# Dry-run before executing
agents-cli run @pinecone-database/pinecone -- <args> --dry-run
```
