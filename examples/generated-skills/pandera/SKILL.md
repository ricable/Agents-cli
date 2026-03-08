---
name: pandera
version: 0.0.0
description: "CLI tool: pandera. Use this skill whenever the user works with pandera or tasks related to cli tool: pandera — even if they don't mention "pandera" by name."
ingredients:
  - unionai-oss/pandera
tags:
  - cli
---

# pandera

CLI tool: pandera

## Overview

pandera provides cli tool: pandera. Agents benefit from pandera because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add unionai-oss/pandera

# Or clone from GitHub
git clone https://github.com/unionai-oss/pandera.git
```

## Usage

```bash
# Show help and available options
pandera --help

# Check version
pandera --version
```

Refer to the project documentation for detailed usage:
- https://github.com/unionai-oss/pandera

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add unionai-oss/pandera

# 2. Verify installation
agents-cli run pandera -- --version

# 3. Explore capabilities
agents-cli schema pandera --json
```

### Piping with other tools

```bash
# Chain pandera output with jq for structured processing
agents-cli run pandera -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pandera -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pandera -- --help --json

# Introspect full command schema
agents-cli schema pandera --json

# Dry-run before executing (safe exploration)
agents-cli run pandera -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pandera --json
```

## When to Use This Tool

Use `pandera` when:
- Your task involves cli tool: pandera
- A task requires pandera-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pandera provides
