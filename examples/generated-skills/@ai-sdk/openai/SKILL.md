---
name: @ai-sdk/openai
version: 3.0.41
description: "CLI tool: @ai-sdk/openai. Use this skill whenever the user works with @ai-sdk/openai or tasks related to cli tool: @ai-sdk/openai — even if they don't mention "@ai-sdk/openai" by name."
ingredients:
  - @ai-sdk/openai
tags:
  - cli
---

# @ai-sdk/openai

CLI tool: @ai-sdk/openai

## Overview

@ai-sdk/openai provides cli tool: @ai-sdk/openai. Agents benefit from @ai-sdk/openai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/openai

# Or install directly via npm
npm install -g @ai-sdk/openai
```

## Usage

```bash
# Show help and available options
@ai-sdk/openai --help

# Check version
@ai-sdk/openai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@ai-sdk/openai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/openai

# 2. Verify installation
agents-cli run @ai-sdk/openai -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/openai --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/openai output with jq for structured processing
agents-cli run @ai-sdk/openai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/openai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/openai -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/openai --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/openai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/openai --json
```

## When to Use This Tool

Use `@ai-sdk/openai` when:
- Your task involves cli tool: @ai-sdk/openai
- A task requires @ai-sdk/openai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/openai provides
