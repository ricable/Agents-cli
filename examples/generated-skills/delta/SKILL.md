---
name: delta
version: 0.0.0
description: "A syntax-highlighting pager for git, diff, grep, and blame output. Use this skill whenever the user works with delta or tasks related to a syntax-highlighting pager for git, diff, grep, and blame output — even if they don't mention "delta" by name."
ingredients:
  - dandavison/delta
tags:
  - color-themes
  - delta
  - diff
  - git
  - git-delta
  - pager
  - rust
  - syntax-highlighter
  - cli
# homepage: https://dandavison.github.io/delta/
# license: MIT
---

# delta

A syntax-highlighting pager for git, diff, grep, and blame output

**Source**: https://dandavison.github.io/delta/

## Overview

delta provides a syntax-highlighting pager for git, diff, grep, and blame output. Agents benefit from delta because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add dandavison/delta

# Or clone from GitHub
git clone https://github.com/dandavison/delta.git
```

## Usage

```bash
# Show help and available options
delta --help

# Check version
delta --version
```

Refer to the project documentation for detailed usage:
- https://dandavison.github.io/delta/

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add dandavison/delta

# 2. Verify installation
agents-cli run delta -- --version

# 3. Explore capabilities
agents-cli schema delta --json
```

### Piping with other tools

```bash
# Chain delta output with jq for structured processing
agents-cli run delta -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run delta -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run delta -- --help --json

# Introspect full command schema
agents-cli schema delta --json

# Dry-run before executing (safe exploration)
agents-cli run delta -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe delta --json
```

## When to Use This Tool

Use `delta` when:
- Your task involves a syntax-highlighting pager for git, diff, grep, and blame output
- A task requires delta-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what delta provides
