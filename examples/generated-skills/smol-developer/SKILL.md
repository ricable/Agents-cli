---
name: developer
version: 0.0.0
description: "CLI tool: developer. Use this skill whenever the user works with developer or tasks related to cli tool: developer — even if they don't mention "developer" by name."
ingredients:
  - smol-ai/developer
tags:
  - cli
---

# developer

CLI tool: developer

## Overview

developer provides cli tool: developer. Agents benefit from developer because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add smol-ai/developer

# Or clone from GitHub
git clone https://github.com/smol-ai/developer.git
```

## Usage

```bash
# Show help and available options
developer --help

# Check version
developer --version
```

Refer to the project documentation for detailed usage:
- https://github.com/smol-ai/developer

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add smol-ai/developer

# 2. Verify installation
agents-cli run developer -- --version

# 3. Explore capabilities
agents-cli schema developer --json
```

### Piping with other tools

```bash
# Chain developer output with jq for structured processing
agents-cli run developer -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run developer -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run developer -- --help --json

# Introspect full command schema
agents-cli schema developer --json

# Dry-run before executing (safe exploration)
agents-cli run developer -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe developer --json
```

## When to Use This Tool

Use `developer` when:
- Your task involves cli tool: developer
- A task requires developer-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what developer provides
