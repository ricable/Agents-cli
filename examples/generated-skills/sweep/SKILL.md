---
name: sweep
version: 0.0.0
description: "Sweep: AI coding assistant for JetBrains. Use this skill whenever the user works with sweep or tasks related to sweep: ai coding assistant for jetbrains — even if they don't mention "sweep" by name."
ingredients:
  - sweepai/sweep
tags:
  - ai
  - ai-developer
  - ai-softwar
  - ai-software
  - code-assistant
  - code-search
  - developer-tools
  - github-app
  - gpt-4
  - cli
# homepage: https://sweep.dev
# license: NOASSERTION
---

# sweep

Sweep: AI coding assistant for JetBrains

**Source**: https://sweep.dev

## Overview

sweep provides sweep: ai coding assistant for jetbrains. Agents benefit from sweep because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add sweepai/sweep

# Or clone from GitHub
git clone https://github.com/sweepai/sweep.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
No old docker runs to remove
Found open port: 8081
Running test on https://github.com/wwzeng1/landing-page/issues/114
Waiting for server to start...
........failed to connect to the docker API at unix:///Users/cedric/.docker/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /Users/cedric/.docker/run/docker.sock: connect: no such file or directory
failed to connect to the docker API at unix:///Users/cedric/.docker/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /Users/cedric/.docker/run/docker.sock: connect: no such file or directory
/Users/cedric/.agents-cli/tools/sweep/package/bin/deploy.sh: line 29: cd: /Users/cedric/sweep: No such file or directory
ERROR: failed to connect to the docker API at unix:///Users/cedric/.docker/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /Users/cedric/.docker/run/docker.sock: connect: no such file or directory
failed to connect to the docker API at unix:///Users/cedric/.docker/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /Users/cedric/.docker/run/docker.sock: connect: no such file or directory
failed to connect to the docker API at unix:///Users/cedric/.docker/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /Users/cedric/.docker/run/docker.sock: connect: no such file or directory
```

## Usage

```bash
# Show help and available options
sweep --help

# Check version
sweep --version
```

Refer to the project documentation for detailed usage:
- https://sweep.dev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add sweepai/sweep

# 2. Verify installation
agents-cli run sweep -- --version

# 3. Explore capabilities
agents-cli schema sweep --json
```

### Piping with other tools

```bash
# Chain sweep output with jq for structured processing
agents-cli run sweep -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run sweep -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run sweep -- --help --json

# Introspect full command schema
agents-cli schema sweep --json

# Dry-run before executing (safe exploration)
agents-cli run sweep -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe sweep --json
```

## When to Use This Tool

Use `sweep` when:
- Your task involves sweep: ai coding assistant for jetbrains
- A task requires sweep-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what sweep provides
