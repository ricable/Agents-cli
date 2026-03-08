---
name: llamafile
version: 0.0.0
description: "Distribute and run LLMs with a single file.. Use this skill when working with llamafile-related tasks."
ingredients:
  - Mozilla-Ocho/llamafile
tags:
  - cli
# homepage: https://mozilla-ai.github.io/llamafile/
# license: NOASSERTION
---

# llamafile

Distribute and run LLMs with a single file.

**Source**: https://mozilla-ai.github.io/llamafile/

## Usage

```bash
# Show help
llamafile --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llamafile -- --help --json

# Introspect command schema
agents-cli schema llamafile --json

# Dry-run before executing
agents-cli run llamafile -- <args> --dry-run
```
