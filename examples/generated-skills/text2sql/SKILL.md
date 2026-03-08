---
name: Awesome-Text2SQL
version: 0.0.0
description: "CLI tool: Awesome-Text2SQL. Use this skill whenever the user works with Awesome-Text2SQL or tasks related to cli tool: awesome-text2sql — even if they don't mention "Awesome-Text2SQL" by name."
ingredients:
  - eosphoros-ai/Awesome-Text2SQL
tags:
  - cli
---

# Awesome-Text2SQL

CLI tool: Awesome-Text2SQL

## Overview

Awesome-Text2SQL provides cli tool: awesome-text2sql. Agents benefit from Awesome-Text2SQL because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add eosphoros-ai/Awesome-Text2SQL

# Or clone from GitHub
git clone https://github.com/eosphoros-ai/Awesome-Text2SQL.git
```

## Usage

```bash
# Show help and available options
Awesome-Text2SQL --help

# Check version
Awesome-Text2SQL --version
```

Refer to the project documentation for detailed usage:
- https://github.com/eosphoros-ai/Awesome-Text2SQL

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add eosphoros-ai/Awesome-Text2SQL

# 2. Verify installation
agents-cli run Awesome-Text2SQL -- --version

# 3. Explore capabilities
agents-cli schema Awesome-Text2SQL --json
```

### Piping with other tools

```bash
# Chain Awesome-Text2SQL output with jq for structured processing
agents-cli run Awesome-Text2SQL -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Awesome-Text2SQL -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Awesome-Text2SQL -- --help --json

# Introspect full command schema
agents-cli schema Awesome-Text2SQL --json

# Dry-run before executing (safe exploration)
agents-cli run Awesome-Text2SQL -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Awesome-Text2SQL --json
```

## When to Use This Tool

Use `Awesome-Text2SQL` when:
- Your task involves cli tool: awesome-text2sql
- A task requires Awesome-Text2SQL-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Awesome-Text2SQL provides
