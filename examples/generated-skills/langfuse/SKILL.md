---
name: langfuse
version: 3.156.0
description: "CLI tool: langfuse. Use this skill whenever the user works with langfuse or tasks related to cli tool: langfuse — even if they don't mention "langfuse" by name."
ingredients:
  - langfuse/langfuse
tags:
  - cli
---

# langfuse

CLI tool: langfuse

## Overview

langfuse provides cli tool: langfuse. Agents benefit from langfuse because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add langfuse/langfuse

# Or clone from GitHub
git clone https://github.com/langfuse/langfuse.git
```

## Usage

```bash
# Show help and available options
langfuse --help

# Check version
langfuse --version
```

Refer to the project documentation for detailed usage:
- https://github.com/langfuse/langfuse

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add langfuse/langfuse

# 2. Verify installation
agents-cli run langfuse -- --version

# 3. Explore capabilities
agents-cli schema langfuse --json
```

### Piping with other tools

```bash
# Chain langfuse output with jq for structured processing
agents-cli run langfuse -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run langfuse -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run langfuse -- --help --json

# Introspect full command schema
agents-cli schema langfuse --json

# Dry-run before executing (safe exploration)
agents-cli run langfuse -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe langfuse --json
```

## When to Use This Tool

Use `langfuse` when:
- Your task involves cli tool: langfuse
- A task requires langfuse-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what langfuse provides
