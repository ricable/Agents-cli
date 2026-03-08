---
name: @ai-sdk/togetherai
version: 2.0.39
description: "The **[Together.ai provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the [Together.ai](https://together.ai) platform.. Use this skill whenever the user works with @ai-sdk/togetherai or tasks related to the **[together.ai provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the [together.ai](https://together.ai) platform — even if they don't mention "@ai-sdk/togetherai" by name."
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

## Overview

@ai-sdk/togetherai provides the **[together.ai provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the [together.ai](https://together.ai) platform. Agents benefit from @ai-sdk/togetherai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/togetherai

# Or install directly via npm
npm install -g @ai-sdk/togetherai
```

## Usage

```bash
# Show help and available options
@ai-sdk/togetherai --help

# Check version
@ai-sdk/togetherai --version
```

Refer to the project documentation for detailed usage:
- https://ai-sdk.dev/docs

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/togetherai

# 2. Verify installation
agents-cli run @ai-sdk/togetherai -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/togetherai --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/togetherai output with jq for structured processing
agents-cli run @ai-sdk/togetherai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/togetherai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/togetherai -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/togetherai --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/togetherai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/togetherai --json
```

## When to Use This Tool

Use `@ai-sdk/togetherai` when:
- Your task involves the **[together.ai provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the [together.ai](https://together.ai) platform
- A task requires @ai-sdk/togetherai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/togetherai provides
