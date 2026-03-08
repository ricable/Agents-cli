---
name: @google/generative-ai
version: 0.24.1
description: "Google AI JavaScript SDK. Use this skill when working with @google/generative-ai-related tasks."
ingredients:
  - @google/generative-ai
tags:
  - cli
# homepage: https://github.com/google/generative-ai-js#readme
# license: Apache-2.0
---

# @google/generative-ai

Google AI JavaScript SDK

**Source**: https://github.com/google/generative-ai-js#readme

## Usage

```bash
# Show help
@google/generative-ai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @google/generative-ai -- --help --json

# Introspect command schema
agents-cli schema @google/generative-ai --json

# Dry-run before executing
agents-cli run @google/generative-ai -- <args> --dry-run
```
