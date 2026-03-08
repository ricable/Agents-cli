---
name: optimum-quanto
version: 0.0.0
description: "CLI tool: optimum-quanto. Use this skill whenever the user works with optimum-quanto or tasks related to cli tool: optimum-quanto — even if they don't mention "optimum-quanto" by name."
ingredients:
  - huggingface/optimum-quanto
tags:
  - cli
---

# optimum-quanto

CLI tool: optimum-quanto

## Overview

optimum-quanto provides cli tool: optimum-quanto. Agents benefit from optimum-quanto because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/optimum-quanto

# Or clone from GitHub
git clone https://github.com/huggingface/optimum-quanto.git
```

## Usage

```bash
# Show help and available options
optimum-quanto --help

# Check version
optimum-quanto --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/optimum-quanto

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/optimum-quanto

# 2. Verify installation
agents-cli run optimum-quanto -- --version

# 3. Explore capabilities
agents-cli schema optimum-quanto --json
```

### Piping with other tools

```bash
# Chain optimum-quanto output with jq for structured processing
agents-cli run optimum-quanto -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run optimum-quanto -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run optimum-quanto -- --help --json

# Introspect full command schema
agents-cli schema optimum-quanto --json

# Dry-run before executing (safe exploration)
agents-cli run optimum-quanto -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe optimum-quanto --json
```

## When to Use This Tool

Use `optimum-quanto` when:
- Your task involves cli tool: optimum-quanto
- A task requires optimum-quanto-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what optimum-quanto provides
