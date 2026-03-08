---
name: flux
version: 0.0.0
description: "CLI tool: flux. Use this skill whenever the user works with flux or tasks related to cli tool: flux — even if they don't mention "flux" by name."
ingredients:
  - black-forest-labs/flux
tags:
  - cli
---

# flux

CLI tool: flux

## Overview

flux provides cli tool: flux. Agents benefit from flux because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add black-forest-labs/flux

# Or clone from GitHub
git clone https://github.com/black-forest-labs/flux.git
```

## Usage

```bash
# Show help and available options
flux --help

# Check version
flux --version
```

Refer to the project documentation for detailed usage:
- https://github.com/black-forest-labs/flux

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add black-forest-labs/flux

# 2. Verify installation
agents-cli run flux -- --version

# 3. Explore capabilities
agents-cli schema flux --json
```

### Piping with other tools

```bash
# Chain flux output with jq for structured processing
agents-cli run flux -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run flux -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run flux -- --help --json

# Introspect full command schema
agents-cli schema flux --json

# Dry-run before executing (safe exploration)
agents-cli run flux -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe flux --json
```

## When to Use This Tool

Use `flux` when:
- Your task involves cli tool: flux
- A task requires flux-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what flux provides
