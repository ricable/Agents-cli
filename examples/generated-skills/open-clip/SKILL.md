---
name: open_clip
version: 0.0.0
description: "CLI tool: open_clip. Use this skill whenever the user works with open_clip or tasks related to cli tool: open_clip — even if they don't mention "open_clip" by name."
ingredients:
  - mlfoundations/open_clip
tags:
  - cli
---

# open_clip

CLI tool: open_clip

## Overview

open_clip provides cli tool: open_clip. Agents benefit from open_clip because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mlfoundations/open_clip

# Or clone from GitHub
git clone https://github.com/mlfoundations/open_clip.git
```

## Usage

```bash
# Show help and available options
open_clip --help

# Check version
open_clip --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mlfoundations/open_clip

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mlfoundations/open_clip

# 2. Verify installation
agents-cli run open_clip -- --version

# 3. Explore capabilities
agents-cli schema open_clip --json
```

### Piping with other tools

```bash
# Chain open_clip output with jq for structured processing
agents-cli run open_clip -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run open_clip -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run open_clip -- --help --json

# Introspect full command schema
agents-cli schema open_clip --json

# Dry-run before executing (safe exploration)
agents-cli run open_clip -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe open_clip --json
```

## When to Use This Tool

Use `open_clip` when:
- Your task involves cli tool: open_clip
- A task requires open_clip-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what open_clip provides
