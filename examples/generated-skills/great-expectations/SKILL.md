---
name: great_expectations
version: 0.0.0
description: "CLI tool: great_expectations. Use this skill whenever the user works with great_expectations or tasks related to cli tool: great_expectations — even if they don't mention "great_expectations" by name."
ingredients:
  - great-expectations/great_expectations
tags:
  - cli
---

# great_expectations

CLI tool: great_expectations

## Overview

great_expectations provides cli tool: great_expectations. Agents benefit from great_expectations because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add great-expectations/great_expectations

# Or clone from GitHub
git clone https://github.com/great-expectations/great_expectations.git
```

## Usage

```bash
# Show help and available options
great_expectations --help

# Check version
great_expectations --version
```

Refer to the project documentation for detailed usage:
- https://github.com/great-expectations/great_expectations

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add great-expectations/great_expectations

# 2. Verify installation
agents-cli run great_expectations -- --version

# 3. Explore capabilities
agents-cli schema great_expectations --json
```

### Piping with other tools

```bash
# Chain great_expectations output with jq for structured processing
agents-cli run great_expectations -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run great_expectations -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run great_expectations -- --help --json

# Introspect full command schema
agents-cli schema great_expectations --json

# Dry-run before executing (safe exploration)
agents-cli run great_expectations -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe great_expectations --json
```

## When to Use This Tool

Use `great_expectations` when:
- Your task involves cli tool: great_expectations
- A task requires great_expectations-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what great_expectations provides
