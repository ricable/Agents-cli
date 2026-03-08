---
name: griptape
version: 0.0.0
description: "CLI tool: griptape. Use this skill whenever the user works with griptape or tasks related to cli tool: griptape — even if they don't mention "griptape" by name."
ingredients:
  - griptape-ai/griptape
tags:
  - cli
---

# griptape

CLI tool: griptape

## Overview

griptape provides cli tool: griptape. Agents benefit from griptape because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add griptape-ai/griptape

# Or clone from GitHub
git clone https://github.com/griptape-ai/griptape.git
```

## Usage

```bash
# Show help and available options
griptape --help

# Check version
griptape --version
```

Refer to the project documentation for detailed usage:
- https://github.com/griptape-ai/griptape

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add griptape-ai/griptape

# 2. Verify installation
agents-cli run griptape -- --version

# 3. Explore capabilities
agents-cli schema griptape --json
```

### Piping with other tools

```bash
# Chain griptape output with jq for structured processing
agents-cli run griptape -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run griptape -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run griptape -- --help --json

# Introspect full command schema
agents-cli schema griptape --json

# Dry-run before executing (safe exploration)
agents-cli run griptape -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe griptape --json
```

## When to Use This Tool

Use `griptape` when:
- Your task involves cli tool: griptape
- A task requires griptape-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what griptape provides
