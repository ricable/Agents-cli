---
name: @ai-sdk/cohere
version: 3.0.25
description: "The **[Cohere provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Cohere API.. Use this skill whenever the user works with @ai-sdk/cohere or tasks related to the **[cohere provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the cohere api — even if they don't mention "@ai-sdk/cohere" by name."
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

## Overview

@ai-sdk/cohere provides the **[cohere provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the cohere api. Agents benefit from @ai-sdk/cohere because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/cohere

# Or install directly via npm
npm install -g @ai-sdk/cohere
```

## Usage

```bash
# Show help and available options
@ai-sdk/cohere --help

# Check version
@ai-sdk/cohere --version
```

Refer to the project documentation for detailed usage:
- https://ai-sdk.dev/docs

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/cohere

# 2. Verify installation
agents-cli run @ai-sdk/cohere -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/cohere --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/cohere output with jq for structured processing
agents-cli run @ai-sdk/cohere -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/cohere -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/cohere -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/cohere --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/cohere -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/cohere --json
```

## When to Use This Tool

Use `@ai-sdk/cohere` when:
- Your task involves the **[cohere provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the cohere api
- A task requires @ai-sdk/cohere-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/cohere provides
