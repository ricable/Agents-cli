---
name: watchexec
version: 0.0.0
description: "CLI tool: watchexec. Use this skill whenever the user works with watchexec or tasks related to cli tool: watchexec — even if they don't mention "watchexec" by name."
ingredients:
  - watchexec/watchexec
tags:
  - cli
---

# watchexec

CLI tool: watchexec

## Overview

watchexec provides cli tool: watchexec. Agents benefit from watchexec because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add watchexec/watchexec

# Or clone from GitHub
git clone https://github.com/watchexec/watchexec.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
/Users/cedric/.agents-cli/tools/watchexec/package/bin/completions: line 2: completions/bash: No such file or directory
/Users/cedric/.agents-cli/tools/watchexec/package/bin/completions: line 3: completions/elvish: No such file or directory
/Users/cedric/.agents-cli/tools/watchexec/package/bin/completions: line 4: completions/fish: No such file or directory
/Users/cedric/.agents-cli/tools/watchexec/package/bin/completions: line 5: completions/nu: No such file or directory
/Users/cedric/.agents-cli/tools/watchexec/package/bin/completions: line 6: completions/powershell: No such file or directory
/Users/cedric/.agents-cli/tools/watchexec/package/bin/completions: line 7: completions/zsh: No such file or directory
```

## Usage

```bash
# Show help and available options
watchexec --help

# Check version
watchexec --version
```

Refer to the project documentation for detailed usage:
- https://github.com/watchexec/watchexec

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add watchexec/watchexec

# 2. Verify installation
agents-cli run watchexec -- --version

# 3. Explore capabilities
agents-cli schema watchexec --json
```

### Piping with other tools

```bash
# Chain watchexec output with jq for structured processing
agents-cli run watchexec -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run watchexec -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run watchexec -- --help --json

# Introspect full command schema
agents-cli schema watchexec --json

# Dry-run before executing (safe exploration)
agents-cli run watchexec -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe watchexec --json
```

## When to Use This Tool

Use `watchexec` when:
- Your task involves cli tool: watchexec
- A task requires watchexec-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what watchexec provides
