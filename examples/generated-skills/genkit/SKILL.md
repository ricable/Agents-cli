---
name: genkit
version: 0.0.0
description: "CLI tool: genkit. Use this skill whenever the user works with genkit or tasks related to cli tool: genkit — even if they don't mention "genkit" by name."
ingredients:
  - firebase/genkit
tags:
  - cli
---

# genkit

CLI tool: genkit

## Overview

genkit provides cli tool: genkit. Agents benefit from genkit because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add firebase/genkit

# Or clone from GitHub
git clone https://github.com/firebase/genkit.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
Installing addlicense...
go: downloading github.com/google/addlicense v1.2.0
go: downloading github.com/bmatcuk/doublestar/v4 v4.0.2
go: downloading golang.org/x/sync v0.0.0-20190911185100-cd5d95a43a6e
/Users/cedric/.agents-cli/tools/genkit/package/bin/add_license: line 37: /Users/cedric/go/bin/addlicense: No such file or directory
```

## Usage

```bash
# Show help and available options
genkit --help

# Check version
genkit --version
```

Refer to the project documentation for detailed usage:
- https://github.com/firebase/genkit

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add firebase/genkit

# 2. Verify installation
agents-cli run genkit -- --version

# 3. Explore capabilities
agents-cli schema genkit --json
```

### Piping with other tools

```bash
# Chain genkit output with jq for structured processing
agents-cli run genkit -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run genkit -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run genkit -- --help --json

# Introspect full command schema
agents-cli schema genkit --json

# Dry-run before executing (safe exploration)
agents-cli run genkit -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe genkit --json
```

## When to Use This Tool

Use `genkit` when:
- Your task involves cli tool: genkit
- A task requires genkit-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what genkit provides
