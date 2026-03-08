---
name: datasets
version: 0.0.0
description: "CLI tool: datasets. Use this skill whenever the user works with datasets or tasks related to cli tool: datasets — even if they don't mention "datasets" by name."
ingredients:
  - huggingface/datasets
tags:
  - cli
---

# datasets

CLI tool: datasets

## Overview

datasets provides cli tool: datasets. Agents benefit from datasets because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/datasets

# Or clone from GitHub
git clone https://github.com/huggingface/datasets.git
```

## Usage

```bash
# Show help and available options
datasets --help

# Check version
datasets --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/datasets

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/datasets

# 2. Verify installation
agents-cli run datasets -- --version

# 3. Explore capabilities
agents-cli schema datasets --json
```

### Piping with other tools

```bash
# Chain datasets output with jq for structured processing
agents-cli run datasets -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run datasets -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run datasets -- --help --json

# Introspect full command schema
agents-cli schema datasets --json

# Dry-run before executing (safe exploration)
agents-cli run datasets -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe datasets --json
```

## When to Use This Tool

Use `datasets` when:
- Your task involves cli tool: datasets
- A task requires datasets-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what datasets provides
