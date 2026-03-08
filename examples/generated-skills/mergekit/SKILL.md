---
name: mergekit
version: 0.0.0
description: "Tools for merging pretrained large language models.. Use this skill when working with mergekit-related tasks."
ingredients:
  - arcee-ai/mergekit
tags:
  - llama
  - llm
  - model-merging
  - cli
# homepage: https://github.com/arcee-ai/mergekit
# license: LGPL-3.0
---

# mergekit

Tools for merging pretrained large language models.

**Source**: https://github.com/arcee-ai/mergekit

## Usage

```bash
# Show help
mergekit --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mergekit -- --help --json

# Introspect command schema
agents-cli schema mergekit --json

# Dry-run before executing
agents-cli run mergekit -- <args> --dry-run
```
