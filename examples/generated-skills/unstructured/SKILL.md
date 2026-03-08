---
name: unstructured
version: 0.0.0
description: "CLI tool: unstructured. Use this skill whenever the user works with unstructured or tasks related to cli tool: unstructured — even if they don't mention "unstructured" by name."
ingredients:
  - Unstructured-IO/unstructured
tags:
  - cli
---

# unstructured

CLI tool: unstructured

## Overview

unstructured provides cli tool: unstructured. Agents benefit from unstructured because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Unstructured-IO/unstructured

# Or clone from GitHub
git clone https://github.com/Unstructured-IO/unstructured.git
```

## Usage

```bash
# Show help and available options
unstructured --help

# Check version
unstructured --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Unstructured-IO/unstructured

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Unstructured-IO/unstructured

# 2. Verify installation
agents-cli run unstructured -- --version

# 3. Explore capabilities
agents-cli schema unstructured --json
```

### Piping with other tools

```bash
# Chain unstructured output with jq for structured processing
agents-cli run unstructured -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run unstructured -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run unstructured -- --help --json

# Introspect full command schema
agents-cli schema unstructured --json

# Dry-run before executing (safe exploration)
agents-cli run unstructured -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe unstructured --json
```

## When to Use This Tool

Use `unstructured` when:
- Your task involves cli tool: unstructured
- A task requires unstructured-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what unstructured provides
