---
name: @lancedb/lancedb
version: 0.26.2
description: "LanceDB: A serverless, low-latency vector database for AI applications. Use this skill when working with @lancedb/lancedb-related tasks."
ingredients:
  - @lancedb/lancedb
tags:
  - database
  - lance
  - lancedb
  - search
  - vector
  - vector database
  - ann
  - cli
# homepage: https://github.com/lancedb/lancedb#readme
# license: Apache-2.0
---

# @lancedb/lancedb

LanceDB: A serverless, low-latency vector database for AI applications

**Source**: https://github.com/lancedb/lancedb#readme

## Usage

```bash
# Show help
@lancedb/lancedb --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @lancedb/lancedb -- --help --json

# Introspect command schema
agents-cli schema @lancedb/lancedb --json

# Dry-run before executing
agents-cli run @lancedb/lancedb -- <args> --dry-run
```
