---
name: bisheng
version: 0.0.0
description: "CLI tool: bisheng. Use this skill whenever the user works with bisheng or tasks related to cli tool: bisheng — even if they don't mention "bisheng" by name."
ingredients:
  - dataelement/bisheng
tags:
  - cli
---

# bisheng

CLI tool: bisheng

## Overview

bisheng provides cli tool: bisheng. Agents benefit from bisheng because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add dataelement/bisheng

# Or clone from GitHub
git clone https://github.com/dataelement/bisheng.git
```

## Usage

```bash
# Show help and available options
bisheng --help

# Check version
bisheng --version
```

Refer to the project documentation for detailed usage:
- https://github.com/dataelement/bisheng

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add dataelement/bisheng

# 2. Verify installation
agents-cli run bisheng -- --version

# 3. Explore capabilities
agents-cli schema bisheng --json
```

### Piping with other tools

```bash
# Chain bisheng output with jq for structured processing
agents-cli run bisheng -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bisheng -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bisheng -- --help --json

# Introspect full command schema
agents-cli schema bisheng --json

# Dry-run before executing (safe exploration)
agents-cli run bisheng -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bisheng --json
```

## When to Use This Tool

Use `bisheng` when:
- Your task involves cli tool: bisheng
- A task requires bisheng-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bisheng provides
