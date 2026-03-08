---
name: @ai-sdk/groq
version: 3.0.29
description: "The **[Groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the Groq chat and completion APIs, transcription support, and browser search tool.. Use this skill whenever the user works with @ai-sdk/groq or tasks related to the **[groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the groq chat and completion apis, transcription support, and browser search tool — even if they don't mention "@ai-sdk/groq" by name."
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

## Overview

@ai-sdk/groq provides the **[groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the groq chat and completion apis, transcription support, and browser search tool. Agents benefit from @ai-sdk/groq because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/groq

# Or install directly via npm
npm install -g @ai-sdk/groq
```

## Usage

```bash
# Show help and available options
@ai-sdk/groq --help

# Check version
@ai-sdk/groq --version
```

Refer to the project documentation for detailed usage:
- https://ai-sdk.dev/docs

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/groq

# 2. Verify installation
agents-cli run @ai-sdk/groq -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/groq --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/groq output with jq for structured processing
agents-cli run @ai-sdk/groq -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/groq -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/groq -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/groq --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/groq -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/groq --json
```

## When to Use This Tool

Use `@ai-sdk/groq` when:
- Your task involves the **[groq provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** for the [ai sdk](https://ai-sdk.dev/docs) contains language model support for the groq chat and completion apis, transcription support, and browser search tool
- A task requires @ai-sdk/groq-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/groq provides
