---
name: llmware
version: 0.0.0
description: "CLI tool: llmware. Use this skill whenever the user works with llmware or tasks related to cli tool: llmware — even if they don't mention "llmware" by name."
ingredients:
  - llmware-ai/llmware
tags:
  - cli
---

# llmware

CLI tool: llmware

## Overview

llmware provides cli tool: llmware. Agents benefit from llmware because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add llmware-ai/llmware

# Or clone from GitHub
git clone https://github.com/llmware-ai/llmware.git
```

## Usage

```bash
# Show help and available options
llmware --help

# Check version
llmware --version
```

Refer to the project documentation for detailed usage:
- https://github.com/llmware-ai/llmware

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add llmware-ai/llmware

# 2. Verify installation
agents-cli run llmware -- --version

# 3. Explore capabilities
agents-cli schema llmware --json
```

### Piping with other tools

```bash
# Chain llmware output with jq for structured processing
agents-cli run llmware -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llmware -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llmware -- --help --json

# Introspect full command schema
agents-cli schema llmware --json

# Dry-run before executing (safe exploration)
agents-cli run llmware -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llmware --json
```

## When to Use This Tool

Use `llmware` when:
- Your task involves cli tool: llmware
- A task requires llmware-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llmware provides
