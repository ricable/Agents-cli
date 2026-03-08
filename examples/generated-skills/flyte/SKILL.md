---
name: flyte
version: 0.0.0
description: "CLI tool: flyte. Use this skill whenever the user works with flyte or tasks related to cli tool: flyte — even if they don't mention "flyte" by name."
ingredients:
  - flyteorg/flyte
tags:
  - cli
---

# flyte

CLI tool: flyte

## Overview

flyte provides cli tool: flyte. Agents benefit from flyte because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add flyteorg/flyte

# Or clone from GitHub
git clone https://github.com/flyteorg/flyte.git
```

## Usage

```bash
# Show help and available options
flyte --help

# Check version
flyte --version
```

Refer to the project documentation for detailed usage:
- https://github.com/flyteorg/flyte

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add flyteorg/flyte

# 2. Verify installation
agents-cli run flyte -- --version

# 3. Explore capabilities
agents-cli schema flyte --json
```

### Piping with other tools

```bash
# Chain flyte output with jq for structured processing
agents-cli run flyte -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run flyte -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run flyte -- --help --json

# Introspect full command schema
agents-cli schema flyte --json

# Dry-run before executing (safe exploration)
agents-cli run flyte -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe flyte --json
```

## When to Use This Tool

Use `flyte` when:
- Your task involves cli tool: flyte
- A task requires flyte-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what flyte provides
