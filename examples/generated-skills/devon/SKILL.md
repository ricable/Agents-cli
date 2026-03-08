---
name: Devon
version: 0.0.0
description: "CLI tool: Devon. Use this skill whenever the user works with Devon or tasks related to cli tool: devon — even if they don't mention "Devon" by name."
ingredients:
  - entropy-research/Devon
tags:
  - cli
---

# Devon

CLI tool: Devon

## Overview

Devon provides cli tool: devon. Agents benefit from Devon because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add entropy-research/Devon

# Or clone from GitHub
git clone https://github.com/entropy-research/Devon.git
```

## Usage

```bash
# Show help and available options
Devon --help

# Check version
Devon --version
```

Refer to the project documentation for detailed usage:
- https://github.com/entropy-research/Devon

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add entropy-research/Devon

# 2. Verify installation
agents-cli run Devon -- --version

# 3. Explore capabilities
agents-cli schema Devon --json
```

### Piping with other tools

```bash
# Chain Devon output with jq for structured processing
agents-cli run Devon -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Devon -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Devon -- --help --json

# Introspect full command schema
agents-cli schema Devon --json

# Dry-run before executing (safe exploration)
agents-cli run Devon -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Devon --json
```

## When to Use This Tool

Use `Devon` when:
- Your task involves cli tool: devon
- A task requires Devon-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Devon provides
