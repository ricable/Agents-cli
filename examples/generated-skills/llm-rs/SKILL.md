---
name: llm
version: 0.0.0
description: "CLI tool: llm. Use this skill whenever the user works with llm or tasks related to cli tool: llm — even if they don't mention "llm" by name."
ingredients:
  - simonw/llm
tags:
  - cli
---

# llm

CLI tool: llm

## Overview

llm provides cli tool: llm. Agents benefit from llm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add simonw/llm

# Or clone from GitHub
git clone https://github.com/simonw/llm.git
```

## Usage

```bash
# Show help and available options
llm --help

# Check version
llm --version
```

Refer to the project documentation for detailed usage:
- https://github.com/simonw/llm

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add simonw/llm

# 2. Verify installation
agents-cli run llm -- --version

# 3. Explore capabilities
agents-cli schema llm --json
```

### Piping with other tools

```bash
# Chain llm output with jq for structured processing
agents-cli run llm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llm -- --help --json

# Introspect full command schema
agents-cli schema llm --json

# Dry-run before executing (safe exploration)
agents-cli run llm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llm --json
```

## When to Use This Tool

Use `llm` when:
- Your task involves cli tool: llm
- A task requires llm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llm provides
