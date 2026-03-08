---
name: bun
version: 1.3.11
description: "CLI tool: bun. Use this skill whenever the user works with bun or tasks related to cli tool: bun — even if they don't mention "bun" by name."
ingredients:
  - oven-sh/bun
tags:
  - cli
---

# bun

CLI tool: bun

## Overview

bun provides cli tool: bun. Agents benefit from bun because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add oven-sh/bun

# Or clone from GitHub
git clone https://github.com/oven-sh/bun.git
```

## Usage

```bash
# Show help and available options
bun --help

# Check version
bun --version
```

Refer to the project documentation for detailed usage:
- https://github.com/oven-sh/bun

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add oven-sh/bun

# 2. Verify installation
agents-cli run bun -- --version

# 3. Explore capabilities
agents-cli schema bun --json
```

### Piping with other tools

```bash
# Chain bun output with jq for structured processing
agents-cli run bun -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bun -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bun -- --help --json

# Introspect full command schema
agents-cli schema bun --json

# Dry-run before executing (safe exploration)
agents-cli run bun -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bun --json
```

## When to Use This Tool

Use `bun` when:
- Your task involves cli tool: bun
- A task requires bun-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bun provides
