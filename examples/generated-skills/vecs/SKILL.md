---
name: vecs
version: 0.0.0
description: "CLI tool: vecs. Use this skill whenever the user works with vecs or tasks related to cli tool: vecs — even if they don't mention "vecs" by name."
ingredients:
  - supabase/vecs
tags:
  - cli
---

# vecs

CLI tool: vecs

## Overview

vecs provides cli tool: vecs. Agents benefit from vecs because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add supabase/vecs

# Or clone from GitHub
git clone https://github.com/supabase/vecs.git
```

## Usage

```bash
# Show help and available options
vecs --help

# Check version
vecs --version
```

Refer to the project documentation for detailed usage:
- https://github.com/supabase/vecs

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add supabase/vecs

# 2. Verify installation
agents-cli run vecs -- --version

# 3. Explore capabilities
agents-cli schema vecs --json
```

### Piping with other tools

```bash
# Chain vecs output with jq for structured processing
agents-cli run vecs -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run vecs -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run vecs -- --help --json

# Introspect full command schema
agents-cli schema vecs --json

# Dry-run before executing (safe exploration)
agents-cli run vecs -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe vecs --json
```

## When to Use This Tool

Use `vecs` when:
- Your task involves cli tool: vecs
- A task requires vecs-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what vecs provides
