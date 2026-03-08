---
name: fiddler-auditor
version: 0.0.0
description: "CLI tool: fiddler-auditor. Use this skill whenever the user works with fiddler-auditor or tasks related to cli tool: fiddler-auditor — even if they don't mention "fiddler-auditor" by name."
ingredients:
  - fiddler-labs/fiddler-auditor
tags:
  - cli
---

# fiddler-auditor

CLI tool: fiddler-auditor

## Overview

fiddler-auditor provides cli tool: fiddler-auditor. Agents benefit from fiddler-auditor because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add fiddler-labs/fiddler-auditor

# Or clone from GitHub
git clone https://github.com/fiddler-labs/fiddler-auditor.git
```

## Usage

```bash
# Show help and available options
fiddler-auditor --help

# Check version
fiddler-auditor --version
```

Refer to the project documentation for detailed usage:
- https://github.com/fiddler-labs/fiddler-auditor

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add fiddler-labs/fiddler-auditor

# 2. Verify installation
agents-cli run fiddler-auditor -- --version

# 3. Explore capabilities
agents-cli schema fiddler-auditor --json
```

### Piping with other tools

```bash
# Chain fiddler-auditor output with jq for structured processing
agents-cli run fiddler-auditor -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fiddler-auditor -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fiddler-auditor -- --help --json

# Introspect full command schema
agents-cli schema fiddler-auditor --json

# Dry-run before executing (safe exploration)
agents-cli run fiddler-auditor -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fiddler-auditor --json
```

## When to Use This Tool

Use `fiddler-auditor` when:
- Your task involves cli tool: fiddler-auditor
- A task requires fiddler-auditor-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fiddler-auditor provides
