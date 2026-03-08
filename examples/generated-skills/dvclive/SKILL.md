---
name: dvclive
version: 0.0.0
description: "CLI tool: dvclive. Use this skill whenever the user works with dvclive or tasks related to cli tool: dvclive — even if they don't mention "dvclive" by name."
ingredients:
  - iterative/dvclive
tags:
  - cli
---

# dvclive

CLI tool: dvclive

## Overview

dvclive provides cli tool: dvclive. Agents benefit from dvclive because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add iterative/dvclive

# Or clone from GitHub
git clone https://github.com/iterative/dvclive.git
```

## Usage

```bash
# Show help and available options
dvclive --help

# Check version
dvclive --version
```

Refer to the project documentation for detailed usage:
- https://github.com/iterative/dvclive

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add iterative/dvclive

# 2. Verify installation
agents-cli run dvclive -- --version

# 3. Explore capabilities
agents-cli schema dvclive --json
```

### Piping with other tools

```bash
# Chain dvclive output with jq for structured processing
agents-cli run dvclive -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run dvclive -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run dvclive -- --help --json

# Introspect full command schema
agents-cli schema dvclive --json

# Dry-run before executing (safe exploration)
agents-cli run dvclive -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe dvclive --json
```

## When to Use This Tool

Use `dvclive` when:
- Your task involves cli tool: dvclive
- A task requires dvclive-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what dvclive provides
