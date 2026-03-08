---
name: @ai-sdk/togetherai
version: 2.0.39
description: "The **[Together.ai provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the [Together.ai](https://together.ai) platform.. Use this skill when working with @ai-sdk/togetherai-related tasks."
ingredients:
  - @ai-sdk/togetherai
tags:
  - ai
  - cli
# homepage: https://ai-sdk.dev/docs
# license: Apache-2.0
---

# @ai-sdk/togetherai

The **[Together.ai provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the [Together.ai](https://together.ai) platform.

**Source**: https://ai-sdk.dev/docs

## Usage

```bash
# Show help
@ai-sdk/togetherai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/togetherai -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/togetherai --json

# Dry-run before executing
agents-cli run @ai-sdk/togetherai -- <args> --dry-run
```
