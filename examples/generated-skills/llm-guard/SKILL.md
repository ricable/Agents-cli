---
name: llm-guard
version: 0.0.0
description: "CLI tool: llm-guard. Use this skill whenever the user works with llm-guard or tasks related to cli tool: llm-guard — even if they don't mention "llm-guard" by name."
ingredients:
  - protectai/llm-guard
tags:
  - cli
---

# llm-guard

CLI tool: llm-guard

## Overview

llm-guard provides cli tool: llm-guard. Agents benefit from llm-guard because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add protectai/llm-guard

# Or clone from GitHub
git clone https://github.com/protectai/llm-guard.git
```

## Usage

```bash
# Show help and available options
llm-guard --help

# Check version
llm-guard --version
```

Refer to the project documentation for detailed usage:
- https://github.com/protectai/llm-guard

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add protectai/llm-guard

# 2. Verify installation
agents-cli run llm-guard -- --version

# 3. Explore capabilities
agents-cli schema llm-guard --json
```

### Piping with other tools

```bash
# Chain llm-guard output with jq for structured processing
agents-cli run llm-guard -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llm-guard -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llm-guard -- --help --json

# Introspect full command schema
agents-cli schema llm-guard --json

# Dry-run before executing (safe exploration)
agents-cli run llm-guard -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llm-guard --json
```

## When to Use This Tool

Use `llm-guard` when:
- Your task involves cli tool: llm-guard
- A task requires llm-guard-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llm-guard provides
