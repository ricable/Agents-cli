---
name: @ai-sdk/mistral
version: 3.0.24
description: "The **[Mistral provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Mistral chat API.. Use this skill whenever the user works with @ai-sdk/mistral or tasks related to the **[mistral provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the mistral chat api — even if they don't mention "@ai-sdk/mistral" by name."
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

## Overview

@ai-sdk/mistral provides the **[mistral provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the mistral chat api. Agents benefit from @ai-sdk/mistral because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/mistral

# Or install directly via npm
npm install -g @ai-sdk/mistral
```

## Usage

```bash
# Show help and available options
@ai-sdk/mistral --help

# Check version
@ai-sdk/mistral --version
```

Refer to the project documentation for detailed usage:
- https://ai-sdk.dev/docs

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/mistral

# 2. Verify installation
agents-cli run @ai-sdk/mistral -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/mistral --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/mistral output with jq for structured processing
agents-cli run @ai-sdk/mistral -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/mistral -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/mistral -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/mistral --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/mistral -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/mistral --json
```

## When to Use This Tool

Use `@ai-sdk/mistral` when:
- Your task involves the **[mistral provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the mistral chat api
- A task requires @ai-sdk/mistral-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/mistral provides
