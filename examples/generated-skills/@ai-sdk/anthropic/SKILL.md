---
name: @ai-sdk/anthropic
version: 3.0.58
description: "CLI tool: @ai-sdk/anthropic. Use this skill whenever the user works with @ai-sdk/anthropic or tasks related to cli tool: @ai-sdk/anthropic — even if they don't mention "@ai-sdk/anthropic" by name."
ingredients:
  - @ai-sdk/anthropic
tags:
  - cli
---

# @ai-sdk/anthropic

CLI tool: @ai-sdk/anthropic

## Overview

@ai-sdk/anthropic provides cli tool: @ai-sdk/anthropic. Agents benefit from @ai-sdk/anthropic because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/anthropic

# Or install directly via npm
npm install -g @ai-sdk/anthropic
```

## Usage

```bash
# Show help and available options
@ai-sdk/anthropic --help

# Check version
@ai-sdk/anthropic --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@ai-sdk/anthropic

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/anthropic

# 2. Verify installation
agents-cli run @ai-sdk/anthropic -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/anthropic --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/anthropic output with jq for structured processing
agents-cli run @ai-sdk/anthropic -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/anthropic -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/anthropic -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/anthropic --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/anthropic -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/anthropic --json
```

## When to Use This Tool

Use `@ai-sdk/anthropic` when:
- Your task involves cli tool: @ai-sdk/anthropic
- A task requires @ai-sdk/anthropic-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/anthropic provides
