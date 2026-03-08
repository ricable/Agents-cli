---
name: @openrouter/ai-sdk-provider
version: 2.2.5
description: "The [OpenRouter](https://openrouter.ai/) provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the OpenRouter chat and completion APIs.. Use this skill whenever the user works with @openrouter/ai-sdk-provider or tasks related to the [openrouter](https://openrouter.ai/) provider for the [vercel ai sdk](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the openrouter chat and completion apis — even if they don't mention "@openrouter/ai-sdk-provider" by name."
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

## Overview

@openrouter/ai-sdk-provider provides the [openrouter](https://openrouter.ai/) provider for the [vercel ai sdk](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the openrouter chat and completion apis. Agents benefit from @openrouter/ai-sdk-provider because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @openrouter/ai-sdk-provider

# Or install directly via npm
npm install -g @openrouter/ai-sdk-provider
```

## Usage

```bash
# Show help and available options
@openrouter/ai-sdk-provider --help

# Check version
@openrouter/ai-sdk-provider --version
```

Refer to the project documentation for detailed usage:
- https://github.com/OpenRouterTeam/ai-sdk-provider

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @openrouter/ai-sdk-provider

# 2. Verify installation
agents-cli run @openrouter/ai-sdk-provider -- --version

# 3. Explore capabilities
agents-cli schema @openrouter/ai-sdk-provider --json
```

### Piping with other tools

```bash
# Chain @openrouter/ai-sdk-provider output with jq for structured processing
agents-cli run @openrouter/ai-sdk-provider -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @openrouter/ai-sdk-provider -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @openrouter/ai-sdk-provider -- --help --json

# Introspect full command schema
agents-cli schema @openrouter/ai-sdk-provider --json

# Dry-run before executing (safe exploration)
agents-cli run @openrouter/ai-sdk-provider -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @openrouter/ai-sdk-provider --json
```

## When to Use This Tool

Use `@openrouter/ai-sdk-provider` when:
- Your task involves the [openrouter](https://openrouter.ai/) provider for the [vercel ai sdk](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the openrouter chat and completion apis
- A task requires @openrouter/ai-sdk-provider-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @openrouter/ai-sdk-provider provides
