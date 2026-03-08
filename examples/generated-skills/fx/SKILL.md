---
name: fx
version: 0.0.0
description: "Terminal JSON viewer & processor. Use this skill whenever the user works with fx or tasks related to terminal json viewer & processor — even if they don't mention "fx" by name."
ingredients:
  - antonmedv/fx
tags:
  - cli
  - command-line
  - json
  - tui
# homepage: https://fx.wtf
# license: MIT
---

# fx

Terminal JSON viewer & processor

**Source**: https://fx.wtf

## Overview

fx provides terminal json viewer & processor. Agents benefit from fx because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add antonmedv/fx

# Or clone from GitHub
git clone https://github.com/antonmedv/fx.git
```

## Usage

```bash
# Show help and available options
fx --help

# Check version
fx --version
```

Refer to the project documentation for detailed usage:
- https://fx.wtf

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add antonmedv/fx

# 2. Verify installation
agents-cli run fx -- --version

# 3. Explore capabilities
agents-cli schema fx --json
```

### Piping with other tools

```bash
# Chain fx output with jq for structured processing
agents-cli run fx -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fx -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fx -- --help --json

# Introspect full command schema
agents-cli schema fx --json

# Dry-run before executing (safe exploration)
agents-cli run fx -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fx --json
```

## When to Use This Tool

Use `fx` when:
- Your task involves terminal json viewer & processor
- A task requires fx-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fx provides
