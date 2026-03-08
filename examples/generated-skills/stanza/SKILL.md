---
name: stanza
version: 0.0.0
description: "CLI tool: stanza. Use this skill whenever the user works with stanza or tasks related to cli tool: stanza — even if they don't mention "stanza" by name."
ingredients:
  - stanfordnlp/stanza
tags:
  - cli
---

# stanza

CLI tool: stanza

## Overview

stanza provides cli tool: stanza. Agents benefit from stanza because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add stanfordnlp/stanza

# Or clone from GitHub
git clone https://github.com/stanfordnlp/stanza.git
```

## Usage

```bash
# Show help and available options
stanza --help

# Check version
stanza --version
```

Refer to the project documentation for detailed usage:
- https://github.com/stanfordnlp/stanza

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add stanfordnlp/stanza

# 2. Verify installation
agents-cli run stanza -- --version

# 3. Explore capabilities
agents-cli schema stanza --json
```

### Piping with other tools

```bash
# Chain stanza output with jq for structured processing
agents-cli run stanza -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run stanza -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run stanza -- --help --json

# Introspect full command schema
agents-cli schema stanza --json

# Dry-run before executing (safe exploration)
agents-cli run stanza -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe stanza --json
```

## When to Use This Tool

Use `stanza` when:
- Your task involves cli tool: stanza
- A task requires stanza-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what stanza provides
