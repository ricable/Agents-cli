---
name: tree
version: 0.0.0
description: "Tree for Unix/LInux. Use this skill whenever the user works with tree or tasks related to tree for unix/linux — even if they don't mention "tree" by name."
ingredients:
  - Old-Man-Programmer/tree
tags:
  - cli
# homepage: https://github.com/Old-Man-Programmer/tree
# license: GPL-2.0
---

# tree

Tree for Unix/LInux

**Source**: https://github.com/Old-Man-Programmer/tree

## Overview

tree provides tree for unix/linux. Agents benefit from tree because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Old-Man-Programmer/tree

# Or clone from GitHub
git clone https://github.com/Old-Man-Programmer/tree.git
```

## Usage

```bash
# Show help and available options
tree --help

# Check version
tree --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Old-Man-Programmer/tree

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Old-Man-Programmer/tree

# 2. Verify installation
agents-cli run tree -- --version

# 3. Explore capabilities
agents-cli schema tree --json
```

### Piping with other tools

```bash
# Chain tree output with jq for structured processing
agents-cli run tree -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tree -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tree -- --help --json

# Introspect full command schema
agents-cli schema tree --json

# Dry-run before executing (safe exploration)
agents-cli run tree -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tree --json
```

## When to Use This Tool

Use `tree` when:
- Your task involves tree for unix/linux
- A task requires tree-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tree provides
