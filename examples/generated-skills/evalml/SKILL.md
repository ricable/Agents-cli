---
name: evalml
version: 0.0.0
description: "CLI tool: evalml. Use this skill whenever the user works with evalml or tasks related to cli tool: evalml — even if they don't mention "evalml" by name."
ingredients:
  - alteryx/evalml
tags:
  - cli
---

# evalml

CLI tool: evalml

## Overview

evalml provides cli tool: evalml. Agents benefit from evalml because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add alteryx/evalml

# Or clone from GitHub
git clone https://github.com/alteryx/evalml.git
```

## Usage

```bash
# Show help and available options
evalml --help

# Check version
evalml --version
```

Refer to the project documentation for detailed usage:
- https://github.com/alteryx/evalml

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add alteryx/evalml

# 2. Verify installation
agents-cli run evalml -- --version

# 3. Explore capabilities
agents-cli schema evalml --json
```

### Piping with other tools

```bash
# Chain evalml output with jq for structured processing
agents-cli run evalml -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run evalml -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run evalml -- --help --json

# Introspect full command schema
agents-cli schema evalml --json

# Dry-run before executing (safe exploration)
agents-cli run evalml -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe evalml --json
```

## When to Use This Tool

Use `evalml` when:
- Your task involves cli tool: evalml
- A task requires evalml-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what evalml provides
