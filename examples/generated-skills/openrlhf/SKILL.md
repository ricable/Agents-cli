---
name: OpenRLHF
version: 0.0.0
description: "CLI tool: OpenRLHF. Use this skill whenever the user works with OpenRLHF or tasks related to cli tool: openrlhf — even if they don't mention "OpenRLHF" by name."
ingredients:
  - OpenRLHF/OpenRLHF
tags:
  - cli
---

# OpenRLHF

CLI tool: OpenRLHF

## Overview

OpenRLHF provides cli tool: openrlhf. Agents benefit from OpenRLHF because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add OpenRLHF/OpenRLHF

# Or clone from GitHub
git clone https://github.com/OpenRLHF/OpenRLHF.git
```

## Usage

```bash
# Show help and available options
OpenRLHF --help

# Check version
OpenRLHF --version
```

Refer to the project documentation for detailed usage:
- https://github.com/OpenRLHF/OpenRLHF

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add OpenRLHF/OpenRLHF

# 2. Verify installation
agents-cli run OpenRLHF -- --version

# 3. Explore capabilities
agents-cli schema OpenRLHF --json
```

### Piping with other tools

```bash
# Chain OpenRLHF output with jq for structured processing
agents-cli run OpenRLHF -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run OpenRLHF -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run OpenRLHF -- --help --json

# Introspect full command schema
agents-cli schema OpenRLHF --json

# Dry-run before executing (safe exploration)
agents-cli run OpenRLHF -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe OpenRLHF --json
```

## When to Use This Tool

Use `OpenRLHF` when:
- Your task involves cli tool: openrlhf
- A task requires OpenRLHF-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what OpenRLHF provides
