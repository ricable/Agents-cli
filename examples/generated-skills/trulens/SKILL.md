---
name: trulens
version: 0.0.0
description: "CLI tool: trulens. Use this skill whenever the user works with trulens or tasks related to cli tool: trulens — even if they don't mention "trulens" by name."
ingredients:
  - truera/trulens
tags:
  - cli
---

# trulens

CLI tool: trulens

## Overview

trulens provides cli tool: trulens. Agents benefit from trulens because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add truera/trulens

# Or clone from GitHub
git clone https://github.com/truera/trulens.git
```

## Usage

```bash
# Show help and available options
trulens --help

# Check version
trulens --version
```

Refer to the project documentation for detailed usage:
- https://github.com/truera/trulens

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add truera/trulens

# 2. Verify installation
agents-cli run trulens -- --version

# 3. Explore capabilities
agents-cli schema trulens --json
```

### Piping with other tools

```bash
# Chain trulens output with jq for structured processing
agents-cli run trulens -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run trulens -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run trulens -- --help --json

# Introspect full command schema
agents-cli schema trulens --json

# Dry-run before executing (safe exploration)
agents-cli run trulens -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe trulens --json
```

## When to Use This Tool

Use `trulens` when:
- Your task involves cli tool: trulens
- A task requires trulens-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what trulens provides
