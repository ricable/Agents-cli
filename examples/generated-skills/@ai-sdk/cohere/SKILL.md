---
name: @ai-sdk/cohere
version: 3.0.25
description: "The **[Cohere provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Cohere API.. Use this skill when working with @ai-sdk/cohere-related tasks."
ingredients:
  - @ai-sdk/cohere
tags:
  - ai
  - cli
# homepage: https://ai-sdk.dev/docs
# license: Apache-2.0
---

# @ai-sdk/cohere

The **[Cohere provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Cohere API.

**Source**: https://ai-sdk.dev/docs

## Usage

```bash
# Show help
@ai-sdk/cohere --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/cohere -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/cohere --json

# Dry-run before executing
agents-cli run @ai-sdk/cohere -- <args> --dry-run
```
