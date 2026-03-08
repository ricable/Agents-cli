---
name: exllamav2
version: 0.0.0
description: "A fast inference library for running LLMs locally on modern consumer-class GPUs. Use this skill whenever the user works with exllamav2 or tasks related to a fast inference library for running llms locally on modern consumer-class gpus — even if they don't mention "exllamav2" by name."
ingredients:
  - turboderp-org/exllamav2
tags:
  - cli
# homepage: https://github.com/turboderp-org/exllamav2
# license: MIT
---

# exllamav2

A fast inference library for running LLMs locally on modern consumer-class GPUs

**Source**: https://github.com/turboderp-org/exllamav2

## Overview

exllamav2 provides a fast inference library for running llms locally on modern consumer-class gpus. Agents benefit from exllamav2 because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add turboderp-org/exllamav2

# Or clone from GitHub
git clone https://github.com/turboderp-org/exllamav2.git
```

## Usage

```bash
# Show help and available options
exllamav2 --help

# Check version
exllamav2 --version
```

Refer to the project documentation for detailed usage:
- https://github.com/turboderp-org/exllamav2

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add turboderp-org/exllamav2

# 2. Verify installation
agents-cli run exllamav2 -- --version

# 3. Explore capabilities
agents-cli schema exllamav2 --json
```

### Piping with other tools

```bash
# Chain exllamav2 output with jq for structured processing
agents-cli run exllamav2 -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run exllamav2 -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run exllamav2 -- --help --json

# Introspect full command schema
agents-cli schema exllamav2 --json

# Dry-run before executing (safe exploration)
agents-cli run exllamav2 -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe exllamav2 --json
```

## When to Use This Tool

Use `exllamav2` when:
- Your task involves a fast inference library for running llms locally on modern consumer-class gpus
- A task requires exllamav2-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what exllamav2 provides
