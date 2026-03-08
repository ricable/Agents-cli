---
name: gorilla
version: 0.0.0
description: "CLI tool: gorilla. Use this skill whenever the user works with gorilla or tasks related to cli tool: gorilla — even if they don't mention "gorilla" by name."
ingredients:
  - ShishirPatil/gorilla
tags:
  - cli
---

# gorilla

CLI tool: gorilla

## Overview

gorilla provides cli tool: gorilla. Agents benefit from gorilla because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ShishirPatil/gorilla

# Or clone from GitHub
git clone https://github.com/ShishirPatil/gorilla.git
```

## Usage

```bash
# Show help and available options
gorilla --help

# Check version
gorilla --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ShishirPatil/gorilla

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ShishirPatil/gorilla

# 2. Verify installation
agents-cli run gorilla -- --version

# 3. Explore capabilities
agents-cli schema gorilla --json
```

### Piping with other tools

```bash
# Chain gorilla output with jq for structured processing
agents-cli run gorilla -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gorilla -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gorilla -- --help --json

# Introspect full command schema
agents-cli schema gorilla --json

# Dry-run before executing (safe exploration)
agents-cli run gorilla -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gorilla --json
```

## When to Use This Tool

Use `gorilla` when:
- Your task involves cli tool: gorilla
- A task requires gorilla-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gorilla provides
