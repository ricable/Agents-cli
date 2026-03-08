---
name: @anthropic-ai/sdk
version: 0.78.0
description: "The official TypeScript library for the Anthropic API. Use this skill when the user needs @anthropic-ai/sdk (commands: migrate), even if they don't mention "@anthropic-ai/sdk" explicitly."
ingredients:
  - @anthropic-ai/sdk
tags:
  - cli
# license: MIT
---

# @anthropic-ai/sdk

The official TypeScript library for the Anthropic API

## Overview

@anthropic-ai/sdk provides the official typescript library for the anthropic api. Agents benefit from @anthropic-ai/sdk because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @anthropic-ai/sdk

# Or install directly via npm
npm install -g @anthropic-ai/sdk
```

## Commands

@anthropic-ai/sdk exposes 1 command:

### `@anthropic-ai/sdk migrate`

Run migrations to update your code using @anthropic-ai/sdk@0.41 to be compatible with @anthropic-ai/sdk@0.50

```bash
@anthropic-ai/sdk migrate
```

## Usage

```bash
# Show help
@anthropic-ai/sdk --help

# Run migrations to update your code using @anthropic-ai/sdk@0.41 to be compatible with @anthropic-ai/sdk@0.50
@anthropic-ai/sdk migrate

```

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @anthropic-ai/sdk

# 2. Verify installation
agents-cli run @anthropic-ai/sdk -- --version

# 3. Explore capabilities
agents-cli schema @anthropic-ai/sdk --json
```

### Piping with other tools

```bash
# Chain @anthropic-ai/sdk output with jq for structured processing
agents-cli run @anthropic-ai/sdk -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @anthropic-ai/sdk -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @anthropic-ai/sdk -- --help --json

# Introspect full command schema
agents-cli schema @anthropic-ai/sdk --json

# Dry-run before executing (safe exploration)
agents-cli run @anthropic-ai/sdk -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @anthropic-ai/sdk --json
```

## When to Use This Tool

Use `@anthropic-ai/sdk` when:
- Your task involves the official typescript library for the anthropic api
- A task requires @anthropic-ai/sdk-specific functionality
- You need any of: migrate

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @anthropic-ai/sdk provides
