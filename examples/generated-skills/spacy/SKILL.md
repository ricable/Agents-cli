---
name: spaCy
version: 0.0.0
description: "CLI tool: spaCy. Use this skill whenever the user works with spaCy or tasks related to cli tool: spacy — even if they don't mention "spaCy" by name."
ingredients:
  - explosion/spaCy
tags:
  - cli
---

# spaCy

CLI tool: spaCy

## Overview

spaCy provides cli tool: spacy. Agents benefit from spaCy because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add explosion/spaCy

# Or clone from GitHub
git clone https://github.com/explosion/spaCy.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
grep: spacy/about.py: No such file or directory
```

## Usage

```bash
# Show help and available options
spaCy --help

# Check version
spaCy --version
```

Refer to the project documentation for detailed usage:
- https://github.com/explosion/spaCy

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add explosion/spaCy

# 2. Verify installation
agents-cli run spaCy -- --version

# 3. Explore capabilities
agents-cli schema spaCy --json
```

### Piping with other tools

```bash
# Chain spaCy output with jq for structured processing
agents-cli run spaCy -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run spaCy -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run spaCy -- --help --json

# Introspect full command schema
agents-cli schema spaCy --json

# Dry-run before executing (safe exploration)
agents-cli run spaCy -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe spaCy --json
```

## When to Use This Tool

Use `spaCy` when:
- Your task involves cli tool: spacy
- A task requires spaCy-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what spaCy provides
