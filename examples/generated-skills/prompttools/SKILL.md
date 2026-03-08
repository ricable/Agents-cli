---
name: prompttools
version: 0.0.0
description: "CLI tool: prompttools. Use this skill whenever the user works with prompttools or tasks related to cli tool: prompttools — even if they don't mention "prompttools" by name."
ingredients:
  - hegelai/prompttools
tags:
  - cli
---

# prompttools

CLI tool: prompttools

## Overview

prompttools provides cli tool: prompttools. Agents benefit from prompttools because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add hegelai/prompttools

# Or clone from GitHub
git clone https://github.com/hegelai/prompttools.git
```

## Usage

```bash
# Show help and available options
prompttools --help

# Check version
prompttools --version
```

Refer to the project documentation for detailed usage:
- https://github.com/hegelai/prompttools

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add hegelai/prompttools

# 2. Verify installation
agents-cli run prompttools -- --version

# 3. Explore capabilities
agents-cli schema prompttools --json
```

### Piping with other tools

```bash
# Chain prompttools output with jq for structured processing
agents-cli run prompttools -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run prompttools -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run prompttools -- --help --json

# Introspect full command schema
agents-cli schema prompttools --json

# Dry-run before executing (safe exploration)
agents-cli run prompttools -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe prompttools --json
```

## When to Use This Tool

Use `prompttools` when:
- Your task involves cli tool: prompttools
- A task requires prompttools-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what prompttools provides
