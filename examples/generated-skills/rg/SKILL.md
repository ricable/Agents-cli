---
name: ripgrep
version: 0.0.0
description: "ripgrep recursively searches directories for a regex pattern while respecting your gitignore. Use this skill whenever the user works with ripgrep or tasks related to ripgrep recursively searches directories for a regex pattern while respecting your gitignore — even if they don't mention "ripgrep" by name."
ingredients:
  - BurntSushi/ripgrep
tags:
  - cli
  - command-line
  - command-line-tool
  - gitignore
  - grep
  - recursively-search
  - regex
  - ripgrep
  - rust
  - search
# homepage: https://github.com/BurntSushi/ripgrep
# license: Unlicense
---

# ripgrep

ripgrep recursively searches directories for a regex pattern while respecting your gitignore

**Source**: https://github.com/BurntSushi/ripgrep

## Overview

ripgrep provides ripgrep recursively searches directories for a regex pattern while respecting your gitignore. Agents benefit from ripgrep because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add BurntSushi/ripgrep

# Or clone from GitHub
git clone https://github.com/BurntSushi/ripgrep.git
```

## Usage

```bash
# Show help and available options
ripgrep --help

# Check version
ripgrep --version
```

Refer to the project documentation for detailed usage:
- https://github.com/BurntSushi/ripgrep

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add BurntSushi/ripgrep

# 2. Verify installation
agents-cli run ripgrep -- --version

# 3. Explore capabilities
agents-cli schema ripgrep --json
```

### Piping with other tools

```bash
# Chain ripgrep output with jq for structured processing
agents-cli run ripgrep -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ripgrep -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ripgrep -- --help --json

# Introspect full command schema
agents-cli schema ripgrep --json

# Dry-run before executing (safe exploration)
agents-cli run ripgrep -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ripgrep --json
```

## When to Use This Tool

Use `ripgrep` when:
- Your task involves ripgrep recursively searches directories for a regex pattern while respecting your gitignore
- A task requires ripgrep-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ripgrep provides
