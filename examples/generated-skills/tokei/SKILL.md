---
name: tokei
version: 0.0.0
description: "Count your code, quickly.. Use this skill whenever the user works with tokei or tasks related to count your code, quickly — even if they don't mention "tokei" by name."
ingredients:
  - XAMPPRocky/tokei
tags:
  - badge
  - cli
  - cloc
  - code
  - command-line-tool
  - linux
  - macos
  - rust
  - sloc
  - statistics
  - tokei
  - windows
# homepage: https://github.com/XAMPPRocky/tokei
# license: NOASSERTION
---

# tokei

Count your code, quickly.

**Source**: https://github.com/XAMPPRocky/tokei

## Overview

tokei provides count your code, quickly. Agents benefit from tokei because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add XAMPPRocky/tokei

# Or clone from GitHub
git clone https://github.com/XAMPPRocky/tokei.git
```

## Usage

```bash
# Show help and available options
tokei --help

# Check version
tokei --version
```

Refer to the project documentation for detailed usage:
- https://github.com/XAMPPRocky/tokei

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add XAMPPRocky/tokei

# 2. Verify installation
agents-cli run tokei -- --version

# 3. Explore capabilities
agents-cli schema tokei --json
```

### Piping with other tools

```bash
# Chain tokei output with jq for structured processing
agents-cli run tokei -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tokei -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tokei -- --help --json

# Introspect full command schema
agents-cli schema tokei --json

# Dry-run before executing (safe exploration)
agents-cli run tokei -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tokei --json
```

## When to Use This Tool

Use `tokei` when:
- Your task involves count your code, quickly
- A task requires tokei-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tokei provides
