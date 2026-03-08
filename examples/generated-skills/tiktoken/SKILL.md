---
name: tiktoken
version: 0.0.0
description: "CLI tool: tiktoken. Use this skill whenever the user works with tiktoken or tasks related to cli tool: tiktoken — even if they don't mention "tiktoken" by name."
ingredients:
  - openai/tiktoken
tags:
  - cli
---

# tiktoken

CLI tool: tiktoken

## Overview

tiktoken provides cli tool: tiktoken. Agents benefit from tiktoken because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add openai/tiktoken

# Or clone from GitHub
git clone https://github.com/openai/tiktoken.git
```

## Usage

```bash
# Show help and available options
tiktoken --help

# Check version
tiktoken --version
```

Refer to the project documentation for detailed usage:
- https://github.com/openai/tiktoken

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add openai/tiktoken

# 2. Verify installation
agents-cli run tiktoken -- --version

# 3. Explore capabilities
agents-cli schema tiktoken --json
```

### Piping with other tools

```bash
# Chain tiktoken output with jq for structured processing
agents-cli run tiktoken -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tiktoken -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tiktoken -- --help --json

# Introspect full command schema
agents-cli schema tiktoken --json

# Dry-run before executing (safe exploration)
agents-cli run tiktoken -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tiktoken --json
```

## When to Use This Tool

Use `tiktoken` when:
- Your task involves cli tool: tiktoken
- A task requires tiktoken-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tiktoken provides
