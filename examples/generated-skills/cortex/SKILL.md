---
name: cortex.cpp
version: 0.0.0
description: "CLI tool: cortex.cpp. Use this skill whenever the user works with cortex.cpp or tasks related to cli tool: cortex.cpp — even if they don't mention "cortex.cpp" by name."
ingredients:
  - janhq/cortex.cpp
tags:
  - cli
---

# cortex.cpp

CLI tool: cortex.cpp

## Overview

cortex.cpp provides cli tool: cortex.cpp. Agents benefit from cortex.cpp because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add janhq/cortex.cpp

# Or clone from GitHub
git clone https://github.com/janhq/cortex.cpp.git
```

## Usage

```bash
# Show help and available options
cortex.cpp --help

# Check version
cortex.cpp --version
```

Refer to the project documentation for detailed usage:
- https://github.com/janhq/cortex.cpp

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add janhq/cortex.cpp

# 2. Verify installation
agents-cli run cortex.cpp -- --version

# 3. Explore capabilities
agents-cli schema cortex.cpp --json
```

### Piping with other tools

```bash
# Chain cortex.cpp output with jq for structured processing
agents-cli run cortex.cpp -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run cortex.cpp -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run cortex.cpp -- --help --json

# Introspect full command schema
agents-cli schema cortex.cpp --json

# Dry-run before executing (safe exploration)
agents-cli run cortex.cpp -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe cortex.cpp --json
```

## When to Use This Tool

Use `cortex.cpp` when:
- Your task involves cli tool: cortex.cpp
- A task requires cortex.cpp-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what cortex.cpp provides
