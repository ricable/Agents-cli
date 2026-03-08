---
name: zenml
version: 0.0.0
description: "CLI tool: zenml. Use this skill whenever the user works with zenml or tasks related to cli tool: zenml — even if they don't mention "zenml" by name."
ingredients:
  - zenml-io/zenml
tags:
  - cli
---

# zenml

CLI tool: zenml

## Overview

zenml provides cli tool: zenml. Agents benefit from zenml because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add zenml-io/zenml

# Or clone from GitHub
git clone https://github.com/zenml-io/zenml.git
```

## Usage

```bash
# Show help and available options
zenml --help

# Check version
zenml --version
```

Refer to the project documentation for detailed usage:
- https://github.com/zenml-io/zenml

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add zenml-io/zenml

# 2. Verify installation
agents-cli run zenml -- --version

# 3. Explore capabilities
agents-cli schema zenml --json
```

### Piping with other tools

```bash
# Chain zenml output with jq for structured processing
agents-cli run zenml -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run zenml -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run zenml -- --help --json

# Introspect full command schema
agents-cli schema zenml --json

# Dry-run before executing (safe exploration)
agents-cli run zenml -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe zenml --json
```

## When to Use This Tool

Use `zenml` when:
- Your task involves cli tool: zenml
- A task requires zenml-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what zenml provides
