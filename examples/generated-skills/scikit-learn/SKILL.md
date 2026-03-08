---
name: scikit-learn
version: 0.0.0
description: "CLI tool: scikit-learn. Use this skill whenever the user works with scikit-learn or tasks related to cli tool: scikit-learn — even if they don't mention "scikit-learn" by name."
ingredients:
  - scikit-learn/scikit-learn
tags:
  - cli
---

# scikit-learn

CLI tool: scikit-learn

## Overview

scikit-learn provides cli tool: scikit-learn. Agents benefit from scikit-learn because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add scikit-learn/scikit-learn

# Or clone from GitHub
git clone https://github.com/scikit-learn/scikit-learn.git
```

## Usage

```bash
# Show help and available options
scikit-learn --help

# Check version
scikit-learn --version
```

Refer to the project documentation for detailed usage:
- https://github.com/scikit-learn/scikit-learn

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add scikit-learn/scikit-learn

# 2. Verify installation
agents-cli run scikit-learn -- --version

# 3. Explore capabilities
agents-cli schema scikit-learn --json
```

### Piping with other tools

```bash
# Chain scikit-learn output with jq for structured processing
agents-cli run scikit-learn -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run scikit-learn -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run scikit-learn -- --help --json

# Introspect full command schema
agents-cli schema scikit-learn --json

# Dry-run before executing (safe exploration)
agents-cli run scikit-learn -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe scikit-learn --json
```

## When to Use This Tool

Use `scikit-learn` when:
- Your task involves cli tool: scikit-learn
- A task requires scikit-learn-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what scikit-learn provides
