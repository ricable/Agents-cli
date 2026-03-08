---
name: chroma
version: 0.0.0
description: "CLI tool: chroma. Use this skill whenever the user works with chroma or tasks related to cli tool: chroma — even if they don't mention "chroma" by name."
ingredients:
  - chroma-core/chroma
tags:
  - cli
---

# chroma

CLI tool: chroma

## Overview

chroma provides cli tool: chroma. Agents benefit from chroma because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add chroma-core/chroma

# Or clone from GitHub
git clone https://github.com/chroma-core/chroma.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
Chroma Server is running at port localhost:8000
Chroma Coordinator is running at port localhost
Test is running in single region mode
/Users/cedric/.agents-cli/tools/chroma/package/bin/cluster-test.sh: line 18: --help: command not found
```

## Usage

```bash
# Show help and available options
chroma --help

# Check version
chroma --version
```

Refer to the project documentation for detailed usage:
- https://github.com/chroma-core/chroma

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add chroma-core/chroma

# 2. Verify installation
agents-cli run chroma -- --version

# 3. Explore capabilities
agents-cli schema chroma --json
```

### Piping with other tools

```bash
# Chain chroma output with jq for structured processing
agents-cli run chroma -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run chroma -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run chroma -- --help --json

# Introspect full command schema
agents-cli schema chroma --json

# Dry-run before executing (safe exploration)
agents-cli run chroma -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe chroma --json
```

## When to Use This Tool

Use `chroma` when:
- Your task involves cli tool: chroma
- A task requires chroma-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what chroma provides
