---
name: julep
version: 0.0.0
description: "CLI tool: julep. Use this skill whenever the user works with julep or tasks related to cli tool: julep — even if they don't mention "julep" by name."
ingredients:
  - julep-ai/julep
tags:
  - cli
---

# julep

CLI tool: julep

## Overview

julep provides cli tool: julep. Agents benefit from julep because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add julep-ai/julep

# Or clone from GitHub
git clone https://github.com/julep-ai/julep.git
```

## Usage

```bash
# Show help and available options
julep --help

# Check version
julep --version
```

Refer to the project documentation for detailed usage:
- https://github.com/julep-ai/julep

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add julep-ai/julep

# 2. Verify installation
agents-cli run julep -- --version

# 3. Explore capabilities
agents-cli schema julep --json
```

### Piping with other tools

```bash
# Chain julep output with jq for structured processing
agents-cli run julep -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run julep -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run julep -- --help --json

# Introspect full command schema
agents-cli schema julep --json

# Dry-run before executing (safe exploration)
agents-cli run julep -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe julep --json
```

## When to Use This Tool

Use `julep` when:
- Your task involves cli tool: julep
- A task requires julep-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what julep provides
