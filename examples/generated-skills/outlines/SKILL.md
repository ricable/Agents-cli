---
name: outlines
version: 0.0.0
description: "CLI tool: outlines. Use this skill whenever the user works with outlines or tasks related to cli tool: outlines — even if they don't mention "outlines" by name."
ingredients:
  - dottxt-ai/outlines
tags:
  - cli
---

# outlines

CLI tool: outlines

## Overview

outlines provides cli tool: outlines. Agents benefit from outlines because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add dottxt-ai/outlines

# Or clone from GitHub
git clone https://github.com/dottxt-ai/outlines.git
```

## Usage

```bash
# Show help and available options
outlines --help

# Check version
outlines --version
```

Refer to the project documentation for detailed usage:
- https://github.com/dottxt-ai/outlines

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add dottxt-ai/outlines

# 2. Verify installation
agents-cli run outlines -- --version

# 3. Explore capabilities
agents-cli schema outlines --json
```

### Piping with other tools

```bash
# Chain outlines output with jq for structured processing
agents-cli run outlines -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run outlines -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run outlines -- --help --json

# Introspect full command schema
agents-cli schema outlines --json

# Dry-run before executing (safe exploration)
agents-cli run outlines -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe outlines --json
```

## When to Use This Tool

Use `outlines` when:
- Your task involves cli tool: outlines
- A task requires outlines-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what outlines provides
