---
name: grype
version: 0.0.0
description: "CLI tool: grype. Use this skill whenever the user works with grype or tasks related to cli tool: grype — even if they don't mention "grype" by name."
ingredients:
  - anchore/grype
tags:
  - cli
---

# grype

CLI tool: grype

## Overview

grype provides cli tool: grype. Agents benefit from grype because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add anchore/grype

# Or clone from GitHub
git clone https://github.com/anchore/grype.git
```

## Usage

```bash
# Show help and available options
grype --help

# Check version
grype --version
```

Refer to the project documentation for detailed usage:
- https://github.com/anchore/grype

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add anchore/grype

# 2. Verify installation
agents-cli run grype -- --version

# 3. Explore capabilities
agents-cli schema grype --json
```

### Piping with other tools

```bash
# Chain grype output with jq for structured processing
agents-cli run grype -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run grype -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run grype -- --help --json

# Introspect full command schema
agents-cli schema grype --json

# Dry-run before executing (safe exploration)
agents-cli run grype -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe grype --json
```

## When to Use This Tool

Use `grype` when:
- Your task involves cli tool: grype
- A task requires grype-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what grype provides
