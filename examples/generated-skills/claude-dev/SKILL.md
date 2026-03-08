---
name: claude-dev
version: 3.71.0
description: "CLI tool: claude-dev. Use this skill whenever the user works with claude-dev or tasks related to cli tool: claude-dev — even if they don't mention "claude-dev" by name."
ingredients:
  - saoudrizwan/claude-dev
tags:
  - cli
---

# claude-dev

CLI tool: claude-dev

## Overview

claude-dev provides cli tool: claude-dev. Agents benefit from claude-dev because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add saoudrizwan/claude-dev

# Or clone from GitHub
git clone https://github.com/saoudrizwan/claude-dev.git
```

## Usage

```bash
# Show help and available options
claude-dev --help

# Check version
claude-dev --version
```

Refer to the project documentation for detailed usage:
- https://github.com/saoudrizwan/claude-dev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add saoudrizwan/claude-dev

# 2. Verify installation
agents-cli run claude-dev -- --version

# 3. Explore capabilities
agents-cli schema claude-dev --json
```

### Piping with other tools

```bash
# Chain claude-dev output with jq for structured processing
agents-cli run claude-dev -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run claude-dev -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run claude-dev -- --help --json

# Introspect full command schema
agents-cli schema claude-dev --json

# Dry-run before executing (safe exploration)
agents-cli run claude-dev -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe claude-dev --json
```

## When to Use This Tool

Use `claude-dev` when:
- Your task involves cli tool: claude-dev
- A task requires claude-dev-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what claude-dev provides
