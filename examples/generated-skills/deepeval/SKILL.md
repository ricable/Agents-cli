---
name: deepeval
version: 0.0.0
description: "CLI tool: deepeval. Use this skill whenever the user works with deepeval or tasks related to cli tool: deepeval — even if they don't mention "deepeval" by name."
ingredients:
  - confident-ai/deepeval
tags:
  - cli
---

# deepeval

CLI tool: deepeval

## Overview

deepeval provides cli tool: deepeval. Agents benefit from deepeval because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add confident-ai/deepeval

# Or clone from GitHub
git clone https://github.com/confident-ai/deepeval.git
```

## Usage

```bash
# Show help and available options
deepeval --help

# Check version
deepeval --version
```

Refer to the project documentation for detailed usage:
- https://github.com/confident-ai/deepeval

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add confident-ai/deepeval

# 2. Verify installation
agents-cli run deepeval -- --version

# 3. Explore capabilities
agents-cli schema deepeval --json
```

### Piping with other tools

```bash
# Chain deepeval output with jq for structured processing
agents-cli run deepeval -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run deepeval -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run deepeval -- --help --json

# Introspect full command schema
agents-cli schema deepeval --json

# Dry-run before executing (safe exploration)
agents-cli run deepeval -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe deepeval --json
```

## When to Use This Tool

Use `deepeval` when:
- Your task involves cli tool: deepeval
- A task requires deepeval-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what deepeval provides
