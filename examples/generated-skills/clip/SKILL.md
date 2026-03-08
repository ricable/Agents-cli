---
name: CLIP
version: 0.0.0
description: "CLI tool: CLIP. Use this skill whenever the user works with CLIP or tasks related to cli tool: clip — even if they don't mention "CLIP" by name."
ingredients:
  - openai/CLIP
tags:
  - cli
---

# CLIP

CLI tool: CLIP

## Overview

CLIP provides cli tool: clip. Agents benefit from CLIP because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add openai/CLIP

# Or clone from GitHub
git clone https://github.com/openai/CLIP.git
```

## Usage

```bash
# Show help and available options
CLIP --help

# Check version
CLIP --version
```

Refer to the project documentation for detailed usage:
- https://github.com/openai/CLIP

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add openai/CLIP

# 2. Verify installation
agents-cli run CLIP -- --version

# 3. Explore capabilities
agents-cli schema CLIP --json
```

### Piping with other tools

```bash
# Chain CLIP output with jq for structured processing
agents-cli run CLIP -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run CLIP -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run CLIP -- --help --json

# Introspect full command schema
agents-cli schema CLIP --json

# Dry-run before executing (safe exploration)
agents-cli run CLIP -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe CLIP --json
```

## When to Use This Tool

Use `CLIP` when:
- Your task involves cli tool: clip
- A task requires CLIP-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what CLIP provides
