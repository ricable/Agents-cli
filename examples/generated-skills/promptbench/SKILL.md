---
name: promptbench
version: 0.0.0
description: "CLI tool: promptbench. Use this skill whenever the user works with promptbench or tasks related to cli tool: promptbench — even if they don't mention "promptbench" by name."
ingredients:
  - microsoft/promptbench
tags:
  - cli
---

# promptbench

CLI tool: promptbench

## Overview

promptbench provides cli tool: promptbench. Agents benefit from promptbench because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/promptbench

# Or clone from GitHub
git clone https://github.com/microsoft/promptbench.git
```

## Usage

```bash
# Show help and available options
promptbench --help

# Check version
promptbench --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/promptbench

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/promptbench

# 2. Verify installation
agents-cli run promptbench -- --version

# 3. Explore capabilities
agents-cli schema promptbench --json
```

### Piping with other tools

```bash
# Chain promptbench output with jq for structured processing
agents-cli run promptbench -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run promptbench -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run promptbench -- --help --json

# Introspect full command schema
agents-cli schema promptbench --json

# Dry-run before executing (safe exploration)
agents-cli run promptbench -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe promptbench --json
```

## When to Use This Tool

Use `promptbench` when:
- Your task involves cli tool: promptbench
- A task requires promptbench-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what promptbench provides
