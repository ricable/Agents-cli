---
name: Fooocus
version: 0.0.0
description: "CLI tool: Fooocus. Use this skill whenever the user works with Fooocus or tasks related to cli tool: fooocus — even if they don't mention "Fooocus" by name."
ingredients:
  - lllyasviel/Fooocus
tags:
  - cli
---

# Fooocus

CLI tool: Fooocus

## Overview

Fooocus provides cli tool: fooocus. Agents benefit from Fooocus because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add lllyasviel/Fooocus

# Or clone from GitHub
git clone https://github.com/lllyasviel/Fooocus.git
```

## Usage

```bash
# Show help and available options
Fooocus --help

# Check version
Fooocus --version
```

Refer to the project documentation for detailed usage:
- https://github.com/lllyasviel/Fooocus

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add lllyasviel/Fooocus

# 2. Verify installation
agents-cli run Fooocus -- --version

# 3. Explore capabilities
agents-cli schema Fooocus --json
```

### Piping with other tools

```bash
# Chain Fooocus output with jq for structured processing
agents-cli run Fooocus -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Fooocus -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Fooocus -- --help --json

# Introspect full command schema
agents-cli schema Fooocus --json

# Dry-run before executing (safe exploration)
agents-cli run Fooocus -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Fooocus --json
```

## When to Use This Tool

Use `Fooocus` when:
- Your task involves cli tool: fooocus
- A task requires Fooocus-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Fooocus provides
