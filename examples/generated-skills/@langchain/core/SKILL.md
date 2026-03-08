---
name: @langchain/core
version: 1.1.31
description: "CLI tool: @langchain/core. Use this skill whenever the user works with @langchain/core or tasks related to cli tool: @langchain/core — even if they don't mention "@langchain/core" by name."
ingredients:
  - @langchain/core
tags:
  - cli
---

# @langchain/core

CLI tool: @langchain/core

## Overview

@langchain/core provides cli tool: @langchain/core. Agents benefit from @langchain/core because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @langchain/core

# Or install directly via npm
npm install -g @langchain/core
```

## Usage

```bash
# Show help and available options
@langchain/core --help

# Check version
@langchain/core --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@langchain/core

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @langchain/core

# 2. Verify installation
agents-cli run @langchain/core -- --version

# 3. Explore capabilities
agents-cli schema @langchain/core --json
```

### Piping with other tools

```bash
# Chain @langchain/core output with jq for structured processing
agents-cli run @langchain/core -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @langchain/core -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @langchain/core -- --help --json

# Introspect full command schema
agents-cli schema @langchain/core --json

# Dry-run before executing (safe exploration)
agents-cli run @langchain/core -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @langchain/core --json
```

## When to Use This Tool

Use `@langchain/core` when:
- Your task involves cli tool: @langchain/core
- A task requires @langchain/core-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @langchain/core provides
