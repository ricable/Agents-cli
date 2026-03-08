---
name: nannyml
version: 0.0.0
description: "CLI tool: nannyml. Use this skill whenever the user works with nannyml or tasks related to cli tool: nannyml — even if they don't mention "nannyml" by name."
ingredients:
  - NannyML/nannyml
tags:
  - cli
---

# nannyml

CLI tool: nannyml

## Overview

nannyml provides cli tool: nannyml. Agents benefit from nannyml because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add NannyML/nannyml

# Or clone from GitHub
git clone https://github.com/NannyML/nannyml.git
```

## Usage

```bash
# Show help and available options
nannyml --help

# Check version
nannyml --version
```

Refer to the project documentation for detailed usage:
- https://github.com/NannyML/nannyml

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add NannyML/nannyml

# 2. Verify installation
agents-cli run nannyml -- --version

# 3. Explore capabilities
agents-cli schema nannyml --json
```

### Piping with other tools

```bash
# Chain nannyml output with jq for structured processing
agents-cli run nannyml -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run nannyml -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run nannyml -- --help --json

# Introspect full command schema
agents-cli schema nannyml --json

# Dry-run before executing (safe exploration)
agents-cli run nannyml -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe nannyml --json
```

## When to Use This Tool

Use `nannyml` when:
- Your task involves cli tool: nannyml
- A task requires nannyml-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what nannyml provides
