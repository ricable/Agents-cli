---
name: trl
version: 0.0.0
description: "CLI tool: trl. Use this skill whenever the user works with trl or tasks related to cli tool: trl — even if they don't mention "trl" by name."
ingredients:
  - huggingface/trl
tags:
  - cli
---

# trl

CLI tool: trl

## Overview

trl provides cli tool: trl. Agents benefit from trl because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/trl

# Or clone from GitHub
git clone https://github.com/huggingface/trl.git
```

## Usage

```bash
# Show help and available options
trl --help

# Check version
trl --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/trl

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/trl

# 2. Verify installation
agents-cli run trl -- --version

# 3. Explore capabilities
agents-cli schema trl --json
```

### Piping with other tools

```bash
# Chain trl output with jq for structured processing
agents-cli run trl -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run trl -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run trl -- --help --json

# Introspect full command schema
agents-cli schema trl --json

# Dry-run before executing (safe exploration)
agents-cli run trl -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe trl --json
```

## When to Use This Tool

Use `trl` when:
- Your task involves cli tool: trl
- A task requires trl-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what trl provides
