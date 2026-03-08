---
name: @ai-sdk/google
version: 3.0.43
description: "CLI tool: @ai-sdk/google. Use this skill whenever the user works with @ai-sdk/google or tasks related to cli tool: @ai-sdk/google — even if they don't mention "@ai-sdk/google" by name."
ingredients:
  - @ai-sdk/google
tags:
  - cli
---

# @ai-sdk/google

CLI tool: @ai-sdk/google

## Overview

@ai-sdk/google provides cli tool: @ai-sdk/google. Agents benefit from @ai-sdk/google because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @ai-sdk/google

# Or install directly via npm
npm install -g @ai-sdk/google
```

## Usage

```bash
# Show help and available options
@ai-sdk/google --help

# Check version
@ai-sdk/google --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@ai-sdk/google

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @ai-sdk/google

# 2. Verify installation
agents-cli run @ai-sdk/google -- --version

# 3. Explore capabilities
agents-cli schema @ai-sdk/google --json
```

### Piping with other tools

```bash
# Chain @ai-sdk/google output with jq for structured processing
agents-cli run @ai-sdk/google -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @ai-sdk/google -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @ai-sdk/google -- --help --json

# Introspect full command schema
agents-cli schema @ai-sdk/google --json

# Dry-run before executing (safe exploration)
agents-cli run @ai-sdk/google -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @ai-sdk/google --json
```

## When to Use This Tool

Use `@ai-sdk/google` when:
- Your task involves cli tool: @ai-sdk/google
- A task requires @ai-sdk/google-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @ai-sdk/google provides
