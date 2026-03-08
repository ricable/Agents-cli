---
name: instructor-js
version: 1.7.0
description: "CLI tool: instructor-js. Use this skill whenever the user works with instructor-js or tasks related to cli tool: instructor-js — even if they don't mention "instructor-js" by name."
ingredients:
  - instructor-ai/instructor-js
tags:
  - cli
---

# instructor-js

CLI tool: instructor-js

## Overview

instructor-js provides cli tool: instructor-js. Agents benefit from instructor-js because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add instructor-ai/instructor-js

# Or clone from GitHub
git clone https://github.com/instructor-ai/instructor-js.git
```

## Usage

```bash
# Show help and available options
instructor-js --help

# Check version
instructor-js --version
```

Refer to the project documentation for detailed usage:
- https://github.com/instructor-ai/instructor-js

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add instructor-ai/instructor-js

# 2. Verify installation
agents-cli run instructor-js -- --version

# 3. Explore capabilities
agents-cli schema instructor-js --json
```

### Piping with other tools

```bash
# Chain instructor-js output with jq for structured processing
agents-cli run instructor-js -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run instructor-js -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run instructor-js -- --help --json

# Introspect full command schema
agents-cli schema instructor-js --json

# Dry-run before executing (safe exploration)
agents-cli run instructor-js -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe instructor-js --json
```

## When to Use This Tool

Use `instructor-js` when:
- Your task involves cli tool: instructor-js
- A task requires instructor-js-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what instructor-js provides
