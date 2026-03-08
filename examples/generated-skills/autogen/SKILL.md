---
name: autogen
version: 0.0.0
description: "CLI tool: autogen. Use this skill whenever the user works with autogen or tasks related to cli tool: autogen — even if they don't mention "autogen" by name."
ingredients:
  - microsoft/autogen
tags:
  - cli
---

# autogen

CLI tool: autogen

## Overview

autogen provides cli tool: autogen. Agents benefit from autogen because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/autogen

# Or clone from GitHub
git clone https://github.com/microsoft/autogen.git
```

## Usage

```bash
# Show help and available options
autogen --help

# Check version
autogen --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/autogen

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/autogen

# 2. Verify installation
agents-cli run autogen -- --version

# 3. Explore capabilities
agents-cli schema autogen --json
```

### Piping with other tools

```bash
# Chain autogen output with jq for structured processing
agents-cli run autogen -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run autogen -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run autogen -- --help --json

# Introspect full command schema
agents-cli schema autogen --json

# Dry-run before executing (safe exploration)
agents-cli run autogen -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe autogen --json
```

## When to Use This Tool

Use `autogen` when:
- Your task involves cli tool: autogen
- A task requires autogen-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what autogen provides
