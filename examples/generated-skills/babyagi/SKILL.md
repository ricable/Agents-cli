---
name: babyagi
version: 0.0.0
description: "CLI tool: babyagi. Use this skill whenever the user works with babyagi or tasks related to cli tool: babyagi — even if they don't mention "babyagi" by name."
ingredients:
  - yoheinakajima/babyagi
tags:
  - cli
---

# babyagi

CLI tool: babyagi

## Overview

babyagi provides cli tool: babyagi. Agents benefit from babyagi because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add yoheinakajima/babyagi

# Or clone from GitHub
git clone https://github.com/yoheinakajima/babyagi.git
```

## Usage

```bash
# Show help and available options
babyagi --help

# Check version
babyagi --version
```

Refer to the project documentation for detailed usage:
- https://github.com/yoheinakajima/babyagi

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add yoheinakajima/babyagi

# 2. Verify installation
agents-cli run babyagi -- --version

# 3. Explore capabilities
agents-cli schema babyagi --json
```

### Piping with other tools

```bash
# Chain babyagi output with jq for structured processing
agents-cli run babyagi -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run babyagi -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run babyagi -- --help --json

# Introspect full command schema
agents-cli schema babyagi --json

# Dry-run before executing (safe exploration)
agents-cli run babyagi -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe babyagi --json
```

## When to Use This Tool

Use `babyagi` when:
- Your task involves cli tool: babyagi
- A task requires babyagi-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what babyagi provides
