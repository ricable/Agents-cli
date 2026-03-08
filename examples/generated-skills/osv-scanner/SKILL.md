---
name: osv-scanner
version: 0.0.0
description: "CLI tool: osv-scanner. Use this skill whenever the user works with osv-scanner or tasks related to cli tool: osv-scanner — even if they don't mention "osv-scanner" by name."
ingredients:
  - google/osv-scanner
tags:
  - cli
---

# osv-scanner

CLI tool: osv-scanner

## Overview

osv-scanner provides cli tool: osv-scanner. Agents benefit from osv-scanner because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add google/osv-scanner

# Or clone from GitHub
git clone https://github.com/google/osv-scanner.git
```

## Usage

```bash
# Show help and available options
osv-scanner --help

# Check version
osv-scanner --version
```

Refer to the project documentation for detailed usage:
- https://github.com/google/osv-scanner

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add google/osv-scanner

# 2. Verify installation
agents-cli run osv-scanner -- --version

# 3. Explore capabilities
agents-cli schema osv-scanner --json
```

### Piping with other tools

```bash
# Chain osv-scanner output with jq for structured processing
agents-cli run osv-scanner -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run osv-scanner -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run osv-scanner -- --help --json

# Introspect full command schema
agents-cli schema osv-scanner --json

# Dry-run before executing (safe exploration)
agents-cli run osv-scanner -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe osv-scanner --json
```

## When to Use This Tool

Use `osv-scanner` when:
- Your task involves cli tool: osv-scanner
- A task requires osv-scanner-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what osv-scanner provides
