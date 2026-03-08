---
name: mosec
version: 0.0.0
description: "CLI tool: mosec. Use this skill whenever the user works with mosec or tasks related to cli tool: mosec — even if they don't mention "mosec" by name."
ingredients:
  - mosecorg/mosec
tags:
  - cli
---

# mosec

CLI tool: mosec

## Overview

mosec provides cli tool: mosec. Agents benefit from mosec because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mosecorg/mosec

# Or clone from GitHub
git clone https://github.com/mosecorg/mosec.git
```

## Usage

```bash
# Show help and available options
mosec --help

# Check version
mosec --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mosecorg/mosec

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mosecorg/mosec

# 2. Verify installation
agents-cli run mosec -- --version

# 3. Explore capabilities
agents-cli schema mosec --json
```

### Piping with other tools

```bash
# Chain mosec output with jq for structured processing
agents-cli run mosec -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mosec -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mosec -- --help --json

# Introspect full command schema
agents-cli schema mosec --json

# Dry-run before executing (safe exploration)
agents-cli run mosec -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mosec --json
```

## When to Use This Tool

Use `mosec` when:
- Your task involves cli tool: mosec
- A task requires mosec-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mosec provides
