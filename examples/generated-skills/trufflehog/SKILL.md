---
name: trufflehog
version: 0.0.0
description: "CLI tool: trufflehog. Use this skill whenever the user works with trufflehog or tasks related to cli tool: trufflehog — even if they don't mention "trufflehog" by name."
ingredients:
  - trufflesecurity/trufflehog
tags:
  - cli
---

# trufflehog

CLI tool: trufflehog

## Overview

trufflehog provides cli tool: trufflehog. Agents benefit from trufflehog because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add trufflesecurity/trufflehog

# Or clone from GitHub
git clone https://github.com/trufflesecurity/trufflehog.git
```

## Usage

```bash
# Show help and available options
trufflehog --help

# Check version
trufflehog --version
```

Refer to the project documentation for detailed usage:
- https://github.com/trufflesecurity/trufflehog

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add trufflesecurity/trufflehog

# 2. Verify installation
agents-cli run trufflehog -- --version

# 3. Explore capabilities
agents-cli schema trufflehog --json
```

### Piping with other tools

```bash
# Chain trufflehog output with jq for structured processing
agents-cli run trufflehog -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run trufflehog -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run trufflehog -- --help --json

# Introspect full command schema
agents-cli schema trufflehog --json

# Dry-run before executing (safe exploration)
agents-cli run trufflehog -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe trufflehog --json
```

## When to Use This Tool

Use `trufflehog` when:
- Your task involves cli tool: trufflehog
- A task requires trufflehog-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what trufflehog provides
