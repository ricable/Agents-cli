---
name: optimum
version: 0.0.0
description: "CLI tool: optimum. Use this skill whenever the user works with optimum or tasks related to cli tool: optimum — even if they don't mention "optimum" by name."
ingredients:
  - huggingface/optimum
tags:
  - cli
---

# optimum

CLI tool: optimum

## Overview

optimum provides cli tool: optimum. Agents benefit from optimum because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/optimum

# Or clone from GitHub
git clone https://github.com/huggingface/optimum.git
```

## Usage

```bash
# Show help and available options
optimum --help

# Check version
optimum --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/optimum

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/optimum

# 2. Verify installation
agents-cli run optimum -- --version

# 3. Explore capabilities
agents-cli schema optimum --json
```

### Piping with other tools

```bash
# Chain optimum output with jq for structured processing
agents-cli run optimum -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run optimum -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run optimum -- --help --json

# Introspect full command schema
agents-cli schema optimum --json

# Dry-run before executing (safe exploration)
agents-cli run optimum -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe optimum --json
```

## When to Use This Tool

Use `optimum` when:
- Your task involves cli tool: optimum
- A task requires optimum-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what optimum provides
