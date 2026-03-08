---
name: @tavily/core
version: 0.7.2
description: "Official JavaScript library for Tavily.. Use this skill whenever the user works with @tavily/core or tasks related to official javascript library for tavily — even if they don't mention "@tavily/core" by name."
ingredients:
  - @tavily/core
tags:
  - search
  - crawl
  - extract
  - agent
  - ai
  - tavily
  - cli
# homepage: https://tavily.com
# license: MIT
---

# @tavily/core

Official JavaScript library for Tavily.

**Source**: https://tavily.com

## Overview

@tavily/core provides official javascript library for tavily. Agents benefit from @tavily/core because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @tavily/core

# Or install directly via npm
npm install -g @tavily/core
```

## Usage

```bash
# Show help and available options
@tavily/core --help

# Check version
@tavily/core --version
```

Refer to the project documentation for detailed usage:
- https://tavily.com

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @tavily/core

# 2. Verify installation
agents-cli run @tavily/core -- --version

# 3. Explore capabilities
agents-cli schema @tavily/core --json
```

### Piping with other tools

```bash
# Chain @tavily/core output with jq for structured processing
agents-cli run @tavily/core -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @tavily/core -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @tavily/core -- --help --json

# Introspect full command schema
agents-cli schema @tavily/core --json

# Dry-run before executing (safe exploration)
agents-cli run @tavily/core -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @tavily/core --json
```

## When to Use This Tool

Use `@tavily/core` when:
- Your task involves official javascript library for tavily
- A task requires @tavily/core-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @tavily/core provides
