---
name: docling
version: 0.0.0
description: "CLI tool: docling. Use this skill whenever the user works with docling or tasks related to cli tool: docling — even if they don't mention "docling" by name."
ingredients:
  - docling-project/docling
tags:
  - cli
---

# docling

CLI tool: docling

## Overview

docling provides cli tool: docling. Agents benefit from docling because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add docling-project/docling

# Or clone from GitHub
git clone https://github.com/docling-project/docling.git
```

## Usage

```bash
# Show help and available options
docling --help

# Check version
docling --version
```

Refer to the project documentation for detailed usage:
- https://github.com/docling-project/docling

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add docling-project/docling

# 2. Verify installation
agents-cli run docling -- --version

# 3. Explore capabilities
agents-cli schema docling --json
```

### Piping with other tools

```bash
# Chain docling output with jq for structured processing
agents-cli run docling -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run docling -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run docling -- --help --json

# Introspect full command schema
agents-cli schema docling --json

# Dry-run before executing (safe exploration)
agents-cli run docling -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe docling --json
```

## When to Use This Tool

Use `docling` when:
- Your task involves cli tool: docling
- A task requires docling-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what docling provides
