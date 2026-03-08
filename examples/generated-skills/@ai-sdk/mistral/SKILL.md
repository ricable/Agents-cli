---
name: @ai-sdk/mistral
version: 3.0.24
description: "The **[Mistral provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Mistral chat API.. Use this skill when working with @ai-sdk/mistral-related tasks."
ingredients:
  - @ai-sdk/mistral
tags:
  - ai
  - cli
# homepage: https://ai-sdk.dev/docs
# license: Apache-2.0
---

# @ai-sdk/mistral

The **[Mistral provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Mistral chat API.

**Source**: https://ai-sdk.dev/docs

## Usage

```bash
# Show help
@ai-sdk/mistral --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/mistral -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/mistral --json

# Dry-run before executing
agents-cli run @ai-sdk/mistral -- <args> --dry-run
```
