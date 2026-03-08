---
name: gron
version: 0.0.0
description: "Make JSON greppable!. Use this skill whenever the user works with gron or tasks related to make json greppable! — even if they don't mention "gron" by name."
ingredients:
  - tomnomnom/gron
tags:
  - cli
  - json
# homepage: https://github.com/tomnomnom/gron
# license: MIT
---

# gron

Make JSON greppable!

**Source**: https://github.com/tomnomnom/gron

## Overview

gron provides make json greppable!. Agents benefit from gron because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add tomnomnom/gron

# Or clone from GitHub
git clone https://github.com/tomnomnom/gron.git
```

## Usage

```bash
# Show help and available options
gron --help

# Check version
gron --version
```

Refer to the project documentation for detailed usage:
- https://github.com/tomnomnom/gron

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add tomnomnom/gron

# 2. Verify installation
agents-cli run gron -- --version

# 3. Explore capabilities
agents-cli schema gron --json
```

### Piping with other tools

```bash
# Chain gron output with jq for structured processing
agents-cli run gron -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gron -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gron -- --help --json

# Introspect full command schema
agents-cli schema gron --json

# Dry-run before executing (safe exploration)
agents-cli run gron -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gron --json
```

## When to Use This Tool

Use `gron` when:
- Your task involves make json greppable!
- A task requires gron-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gron provides
