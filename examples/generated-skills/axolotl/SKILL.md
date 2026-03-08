---
name: axolotl
version: 0.0.0
description: "CLI tool: axolotl. Use this skill whenever the user works with axolotl or tasks related to cli tool: axolotl — even if they don't mention "axolotl" by name."
ingredients:
  - axolotl-ai-cloud/axolotl
tags:
  - cli
---

# axolotl

CLI tool: axolotl

## Overview

axolotl provides cli tool: axolotl. Agents benefit from axolotl because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add axolotl-ai-cloud/axolotl

# Or clone from GitHub
git clone https://github.com/axolotl-ai-cloud/axolotl.git
```

## Usage

```bash
# Show help and available options
axolotl --help

# Check version
axolotl --version
```

Refer to the project documentation for detailed usage:
- https://github.com/axolotl-ai-cloud/axolotl

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add axolotl-ai-cloud/axolotl

# 2. Verify installation
agents-cli run axolotl -- --version

# 3. Explore capabilities
agents-cli schema axolotl --json
```

### Piping with other tools

```bash
# Chain axolotl output with jq for structured processing
agents-cli run axolotl -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run axolotl -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run axolotl -- --help --json

# Introspect full command schema
agents-cli schema axolotl --json

# Dry-run before executing (safe exploration)
agents-cli run axolotl -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe axolotl --json
```

## When to Use This Tool

Use `axolotl` when:
- Your task involves cli tool: axolotl
- A task requires axolotl-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what axolotl provides
