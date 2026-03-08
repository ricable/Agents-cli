---
name: @openrouter/ai-sdk-provider
version: 2.2.5
description: "The [OpenRouter](https://openrouter.ai/) provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the OpenRouter chat and completion APIs.. Use this skill when working with @openrouter/ai-sdk-provider-related tasks."
ingredients:
  - @openrouter/ai-sdk-provider
tags:
  - ai
  - cli
# homepage: https://github.com/OpenRouterTeam/ai-sdk-provider
# license: Apache-2.0
---

# @openrouter/ai-sdk-provider

The [OpenRouter](https://openrouter.ai/) provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the OpenRouter chat and completion APIs.

**Source**: https://github.com/OpenRouterTeam/ai-sdk-provider

## Usage

```bash
# Show help
@openrouter/ai-sdk-provider --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @openrouter/ai-sdk-provider -- --help --json

# Introspect command schema
agents-cli schema @openrouter/ai-sdk-provider --json

# Dry-run before executing
agents-cli run @openrouter/ai-sdk-provider -- <args> --dry-run
```
