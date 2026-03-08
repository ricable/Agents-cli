---
name: dspy
version: 0.0.0
description: "CLI tool: dspy. Use this skill whenever the user works with dspy or tasks related to cli tool: dspy — even if they don't mention "dspy" by name."
ingredients:
  - stanfordnlp/dspy
tags:
  - cli
---

# dspy

CLI tool: dspy

## Overview

dspy provides cli tool: dspy. Agents benefit from dspy because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add stanfordnlp/dspy

# Or clone from GitHub
git clone https://github.com/stanfordnlp/dspy.git
```

## Usage

```bash
# Show help and available options
dspy --help

# Check version
dspy --version
```

Refer to the project documentation for detailed usage:
- https://github.com/stanfordnlp/dspy

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add stanfordnlp/dspy

# 2. Verify installation
agents-cli run dspy -- --version

# 3. Explore capabilities
agents-cli schema dspy --json
```

### Piping with other tools

```bash
# Chain dspy output with jq for structured processing
agents-cli run dspy -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run dspy -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run dspy -- --help --json

# Introspect full command schema
agents-cli schema dspy --json

# Dry-run before executing (safe exploration)
agents-cli run dspy -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe dspy --json
```

## When to Use This Tool

Use `dspy` when:
- Your task involves cli tool: dspy
- A task requires dspy-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what dspy provides
