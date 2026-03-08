---
name: openllmetry
version: 0.0.0
description: "CLI tool: openllmetry. Use this skill whenever the user works with openllmetry or tasks related to cli tool: openllmetry — even if they don't mention "openllmetry" by name."
ingredients:
  - traceloop/openllmetry
tags:
  - cli
---

# openllmetry

CLI tool: openllmetry

## Overview

openllmetry provides cli tool: openllmetry. Agents benefit from openllmetry because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add traceloop/openllmetry

# Or clone from GitHub
git clone https://github.com/traceloop/openllmetry.git
```

## Usage

```bash
# Show help and available options
openllmetry --help

# Check version
openllmetry --version
```

Refer to the project documentation for detailed usage:
- https://github.com/traceloop/openllmetry

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add traceloop/openllmetry

# 2. Verify installation
agents-cli run openllmetry -- --version

# 3. Explore capabilities
agents-cli schema openllmetry --json
```

### Piping with other tools

```bash
# Chain openllmetry output with jq for structured processing
agents-cli run openllmetry -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run openllmetry -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run openllmetry -- --help --json

# Introspect full command schema
agents-cli schema openllmetry --json

# Dry-run before executing (safe exploration)
agents-cli run openllmetry -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe openllmetry --json
```

## When to Use This Tool

Use `openllmetry` when:
- Your task involves cli tool: openllmetry
- A task requires openllmetry-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what openllmetry provides
