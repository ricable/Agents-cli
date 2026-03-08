---
name: guidance
version: 0.0.0
description: "CLI tool: guidance. Use this skill whenever the user works with guidance or tasks related to cli tool: guidance — even if they don't mention "guidance" by name."
ingredients:
  - guidance-ai/guidance
tags:
  - cli
---

# guidance

CLI tool: guidance

## Overview

guidance provides cli tool: guidance. Agents benefit from guidance because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add guidance-ai/guidance

# Or clone from GitHub
git clone https://github.com/guidance-ai/guidance.git
```

## Usage

```bash
# Show help and available options
guidance --help

# Check version
guidance --version
```

Refer to the project documentation for detailed usage:
- https://github.com/guidance-ai/guidance

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add guidance-ai/guidance

# 2. Verify installation
agents-cli run guidance -- --version

# 3. Explore capabilities
agents-cli schema guidance --json
```

### Piping with other tools

```bash
# Chain guidance output with jq for structured processing
agents-cli run guidance -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run guidance -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run guidance -- --help --json

# Introspect full command schema
agents-cli schema guidance --json

# Dry-run before executing (safe exploration)
agents-cli run guidance -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe guidance --json
```

## When to Use This Tool

Use `guidance` when:
- Your task involves cli tool: guidance
- A task requires guidance-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what guidance provides
