---
name: fairscale
version: 0.0.0
description: "CLI tool: fairscale. Use this skill whenever the user works with fairscale or tasks related to cli tool: fairscale — even if they don't mention "fairscale" by name."
ingredients:
  - facebookresearch/fairscale
tags:
  - cli
---

# fairscale

CLI tool: fairscale

## Overview

fairscale provides cli tool: fairscale. Agents benefit from fairscale because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/fairscale

# Or clone from GitHub
git clone https://github.com/facebookresearch/fairscale.git
```

## Usage

```bash
# Show help and available options
fairscale --help

# Check version
fairscale --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/fairscale

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/fairscale

# 2. Verify installation
agents-cli run fairscale -- --version

# 3. Explore capabilities
agents-cli schema fairscale --json
```

### Piping with other tools

```bash
# Chain fairscale output with jq for structured processing
agents-cli run fairscale -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fairscale -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fairscale -- --help --json

# Introspect full command schema
agents-cli schema fairscale --json

# Dry-run before executing (safe exploration)
agents-cli run fairscale -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fairscale --json
```

## When to Use This Tool

Use `fairscale` when:
- Your task involves cli tool: fairscale
- A task requires fairscale-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fairscale provides
