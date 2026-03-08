---
name: trivy
version: 0.0.0
description: "CLI tool: trivy. Use this skill whenever the user works with trivy or tasks related to cli tool: trivy — even if they don't mention "trivy" by name."
ingredients:
  - aquasecurity/trivy
tags:
  - cli
---

# trivy

CLI tool: trivy

## Overview

trivy provides cli tool: trivy. Agents benefit from trivy because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add aquasecurity/trivy

# Or clone from GitHub
git clone https://github.com/aquasecurity/trivy.git
```

## Usage

```bash
# Show help and available options
trivy --help

# Check version
trivy --version
```

Refer to the project documentation for detailed usage:
- https://github.com/aquasecurity/trivy

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add aquasecurity/trivy

# 2. Verify installation
agents-cli run trivy -- --version

# 3. Explore capabilities
agents-cli schema trivy --json
```

### Piping with other tools

```bash
# Chain trivy output with jq for structured processing
agents-cli run trivy -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run trivy -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run trivy -- --help --json

# Introspect full command schema
agents-cli schema trivy --json

# Dry-run before executing (safe exploration)
agents-cli run trivy -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe trivy --json
```

## When to Use This Tool

Use `trivy` when:
- Your task involves cli tool: trivy
- A task requires trivy-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what trivy provides
