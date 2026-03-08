---
name: semantic-router
version: 0.0.0
description: "CLI tool: semantic-router. Use this skill whenever the user works with semantic-router or tasks related to cli tool: semantic-router — even if they don't mention "semantic-router" by name."
ingredients:
  - aurelio-labs/semantic-router
tags:
  - cli
---

# semantic-router

CLI tool: semantic-router

## Overview

semantic-router provides cli tool: semantic-router. Agents benefit from semantic-router because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add aurelio-labs/semantic-router

# Or clone from GitHub
git clone https://github.com/aurelio-labs/semantic-router.git
```

## Usage

```bash
# Show help and available options
semantic-router --help

# Check version
semantic-router --version
```

Refer to the project documentation for detailed usage:
- https://github.com/aurelio-labs/semantic-router

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add aurelio-labs/semantic-router

# 2. Verify installation
agents-cli run semantic-router -- --version

# 3. Explore capabilities
agents-cli schema semantic-router --json
```

### Piping with other tools

```bash
# Chain semantic-router output with jq for structured processing
agents-cli run semantic-router -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run semantic-router -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run semantic-router -- --help --json

# Introspect full command schema
agents-cli schema semantic-router --json

# Dry-run before executing (safe exploration)
agents-cli run semantic-router -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe semantic-router --json
```

## When to Use This Tool

Use `semantic-router` when:
- Your task involves cli tool: semantic-router
- A task requires semantic-router-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what semantic-router provides
