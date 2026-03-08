---
name: jax
version: 0.0.0
description: "CLI tool: jax. Use this skill whenever the user works with jax or tasks related to cli tool: jax — even if they don't mention "jax" by name."
ingredients:
  - jax-ml/jax
tags:
  - cli
---

# jax

CLI tool: jax

## Overview

jax provides cli tool: jax. Agents benefit from jax because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add jax-ml/jax

# Or clone from GitHub
git clone https://github.com/jax-ml/jax.git
```

## Usage

```bash
# Show help and available options
jax --help

# Check version
jax --version
```

Refer to the project documentation for detailed usage:
- https://github.com/jax-ml/jax

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add jax-ml/jax

# 2. Verify installation
agents-cli run jax -- --version

# 3. Explore capabilities
agents-cli schema jax --json
```

### Piping with other tools

```bash
# Chain jax output with jq for structured processing
agents-cli run jax -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run jax -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run jax -- --help --json

# Introspect full command schema
agents-cli schema jax --json

# Dry-run before executing (safe exploration)
agents-cli run jax -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe jax --json
```

## When to Use This Tool

Use `jax` when:
- Your task involves cli tool: jax
- A task requires jax-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what jax provides
