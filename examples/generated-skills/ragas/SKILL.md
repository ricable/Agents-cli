---
name: ragas
version: 0.0.0
description: "CLI tool: ragas. Use this skill whenever the user works with ragas or tasks related to cli tool: ragas — even if they don't mention "ragas" by name."
ingredients:
  - explodinggradients/ragas
tags:
  - cli
---

# ragas

CLI tool: ragas

## Overview

ragas provides cli tool: ragas. Agents benefit from ragas because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add explodinggradients/ragas

# Or clone from GitHub
git clone https://github.com/explodinggradients/ragas.git
```

## Usage

```bash
# Show help and available options
ragas --help

# Check version
ragas --version
```

Refer to the project documentation for detailed usage:
- https://github.com/explodinggradients/ragas

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add explodinggradients/ragas

# 2. Verify installation
agents-cli run ragas -- --version

# 3. Explore capabilities
agents-cli schema ragas --json
```

### Piping with other tools

```bash
# Chain ragas output with jq for structured processing
agents-cli run ragas -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ragas -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ragas -- --help --json

# Introspect full command schema
agents-cli schema ragas --json

# Dry-run before executing (safe exploration)
agents-cli run ragas -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ragas --json
```

## When to Use This Tool

Use `ragas` when:
- Your task involves cli tool: ragas
- A task requires ragas-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ragas provides
