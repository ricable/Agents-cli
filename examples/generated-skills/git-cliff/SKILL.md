---
name: git-cliff
version: 0.0.0
description: "CLI tool: git-cliff. Use this skill whenever the user works with git-cliff or tasks related to cli tool: git-cliff — even if they don't mention "git-cliff" by name."
ingredients:
  - orhun/git-cliff
tags:
  - cli
---

# git-cliff

CLI tool: git-cliff

## Overview

git-cliff provides cli tool: git-cliff. Agents benefit from git-cliff because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add orhun/git-cliff

# Or clone from GitHub
git clone https://github.com/orhun/git-cliff.git
```

## Usage

```bash
# Show help and available options
git-cliff --help

# Check version
git-cliff --version
```

Refer to the project documentation for detailed usage:
- https://github.com/orhun/git-cliff

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add orhun/git-cliff

# 2. Verify installation
agents-cli run git-cliff -- --version

# 3. Explore capabilities
agents-cli schema git-cliff --json
```

### Piping with other tools

```bash
# Chain git-cliff output with jq for structured processing
agents-cli run git-cliff -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run git-cliff -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run git-cliff -- --help --json

# Introspect full command schema
agents-cli schema git-cliff --json

# Dry-run before executing (safe exploration)
agents-cli run git-cliff -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe git-cliff --json
```

## When to Use This Tool

Use `git-cliff` when:
- Your task involves cli tool: git-cliff
- A task requires git-cliff-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what git-cliff provides
