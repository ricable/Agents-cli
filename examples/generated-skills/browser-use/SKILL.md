---
name: browser-use
version: 0.0.0
description: "🌐 Make websites accessible for AI agents. Automate tasks online with ease.. Use this skill whenever the user works with browser-use or tasks related to 🌐 make websites accessible for ai agents. automate tasks online with ease — even if they don't mention "browser-use" by name."
ingredients:
  - browser-use/browser-use
tags:
  - ai-agents
  - ai-tools
  - browser-automation
  - browser-use
  - llm
  - playwright
  - python
  - cli
# homepage: https://browser-use.com
# license: MIT
---

# browser-use

🌐 Make websites accessible for AI agents. Automate tasks online with ease.

**Source**: https://browser-use.com

## Overview

browser-use provides 🌐 make websites accessible for ai agents. automate tasks online with ease. Agents benefit from browser-use because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add browser-use/browser-use

# Or clone from GitHub
git clone https://github.com/browser-use/browser-use.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
Unknown option: --help
Usage: /Users/cedric/.agents-cli/tools/browser-use/package/bin/lint.sh [--fail-fast] [--quick] [--staged]
```

## Usage

```bash
# Show help and available options
browser-use --help

# Check version
browser-use --version
```

Refer to the project documentation for detailed usage:
- https://browser-use.com

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add browser-use/browser-use

# 2. Verify installation
agents-cli run browser-use -- --version

# 3. Explore capabilities
agents-cli schema browser-use --json
```

### Piping with other tools

```bash
# Chain browser-use output with jq for structured processing
agents-cli run browser-use -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run browser-use -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run browser-use -- --help --json

# Introspect full command schema
agents-cli schema browser-use --json

# Dry-run before executing (safe exploration)
agents-cli run browser-use -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe browser-use --json
```

## When to Use This Tool

Use `browser-use` when:
- Your task involves 🌐 make websites accessible for ai agents. automate tasks online with ease
- A task requires browser-use-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what browser-use provides
