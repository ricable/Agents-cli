---
name: unsloth
version: 0.0.0
description: "CLI tool: unsloth. Use this skill whenever the user works with unsloth or tasks related to cli tool: unsloth — even if they don't mention "unsloth" by name."
ingredients:
  - unslothai/unsloth
tags:
  - cli
---

# unsloth

CLI tool: unsloth

## Overview

unsloth provides cli tool: unsloth. Agents benefit from unsloth because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add unslothai/unsloth

# Or clone from GitHub
git clone https://github.com/unslothai/unsloth.git
```

## Usage

```bash
# Show help and available options
unsloth --help

# Check version
unsloth --version
```

Refer to the project documentation for detailed usage:
- https://github.com/unslothai/unsloth

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add unslothai/unsloth

# 2. Verify installation
agents-cli run unsloth -- --version

# 3. Explore capabilities
agents-cli schema unsloth --json
```

### Piping with other tools

```bash
# Chain unsloth output with jq for structured processing
agents-cli run unsloth -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run unsloth -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run unsloth -- --help --json

# Introspect full command schema
agents-cli schema unsloth --json

# Dry-run before executing (safe exploration)
agents-cli run unsloth -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe unsloth --json
```

## When to Use This Tool

Use `unsloth` when:
- Your task involves cli tool: unsloth
- A task requires unsloth-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what unsloth provides
