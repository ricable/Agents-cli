---
name: lm-evaluation-harness
version: 0.0.0
description: "CLI tool: lm-evaluation-harness. Use this skill whenever the user works with lm-evaluation-harness or tasks related to cli tool: lm-evaluation-harness — even if they don't mention "lm-evaluation-harness" by name."
ingredients:
  - EleutherAI/lm-evaluation-harness
tags:
  - cli
---

# lm-evaluation-harness

CLI tool: lm-evaluation-harness

## Overview

lm-evaluation-harness provides cli tool: lm-evaluation-harness. Agents benefit from lm-evaluation-harness because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add EleutherAI/lm-evaluation-harness

# Or clone from GitHub
git clone https://github.com/EleutherAI/lm-evaluation-harness.git
```

## Usage

```bash
# Show help and available options
lm-evaluation-harness --help

# Check version
lm-evaluation-harness --version
```

Refer to the project documentation for detailed usage:
- https://github.com/EleutherAI/lm-evaluation-harness

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add EleutherAI/lm-evaluation-harness

# 2. Verify installation
agents-cli run lm-evaluation-harness -- --version

# 3. Explore capabilities
agents-cli schema lm-evaluation-harness --json
```

### Piping with other tools

```bash
# Chain lm-evaluation-harness output with jq for structured processing
agents-cli run lm-evaluation-harness -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run lm-evaluation-harness -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run lm-evaluation-harness -- --help --json

# Introspect full command schema
agents-cli schema lm-evaluation-harness --json

# Dry-run before executing (safe exploration)
agents-cli run lm-evaluation-harness -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe lm-evaluation-harness --json
```

## When to Use This Tool

Use `lm-evaluation-harness` when:
- Your task involves cli tool: lm-evaluation-harness
- A task requires lm-evaluation-harness-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what lm-evaluation-harness provides
