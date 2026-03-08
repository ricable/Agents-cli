---
name: @ai-sdk/groq
version: 3.0.29
description: "The **[Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Groq chat and completion APIs, transcription support, and browser search tool.. Use this skill when working with @ai-sdk/groq-related tasks."
ingredients:
  - @ai-sdk/groq
tags:
  - ai
  - cli
# homepage: https://ai-sdk.dev/docs
# license: Apache-2.0
---

# @ai-sdk/groq

The **[Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Groq chat and completion APIs, transcription support, and browser search tool.

**Source**: https://ai-sdk.dev/docs

## Usage

```bash
# Show help
@ai-sdk/groq --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @ai-sdk/groq -- --help --json

# Introspect command schema
agents-cli schema @ai-sdk/groq --json

# Dry-run before executing
agents-cli run @ai-sdk/groq -- <args> --dry-run
```
