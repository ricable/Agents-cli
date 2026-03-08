---
name: cml
version: 0.20.6
description: "CLI tool: cml. Use this skill whenever the user works with cml or tasks related to cli tool: cml — even if they don't mention "cml" by name."
ingredients:
  - iterative/cml
tags:
  - cli
---

# cml

CLI tool: cml

## Overview

cml provides cli tool: cml. Agents benefit from cml because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add iterative/cml

# Or clone from GitHub
git clone https://github.com/iterative/cml.git
```

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--log` | — | Logging verbosity |
| `--driver` | — | Git provider where the repository is hosted |
| `--repo` | — | Repository URL or slug |
| `--driver-token` | — |  |
| `--help` | — | Show help                                   [boolean] |
| `--version` | — | Show version number                                       [boolean] |

## Help Reference

The following is the tool's built-in help output for reference:

```
cml.js <command>

Commands:
  cml.js check              Manage CI checks
  cml.js comment            Manage comments
  cml.js pr <glob path...>  Manage pull requests
  cml.js runner             Manage self-hosted (cloud & on-premise) CI runners
  cml.js workflow           Manage CI workflows
  cml.js ci                 Prepare Git repository for CML operations

Global Options:
  --log                    Logging verbosity
          [string] [choices: "error", "warn", "info", "debug"] [default: "info"]
  --driver                 Git provider where the repository is hosted
    [string] [choices: "github", "gitlab", "bitbucket"] [default: infer from the
                                                                    environment]
  --repo                   Repository URL or slug
                                  [string] [default: infer from the environment]
  --driver-token, --token  CI driver personal/project access token (PAT)
                                  [string] [default: infer from the environment]
  --help                   Show help                                   [boolean]

Options:
  --version  Show version number                                       [boolean]
```

## Usage

```bash
# Show help and available options
cml --help

# Check version
cml --version
```

Refer to the project documentation for detailed usage:
- https://github.com/iterative/cml

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add iterative/cml

# 2. Verify installation
agents-cli run cml -- --version

# 3. Explore capabilities
agents-cli schema cml --json
```

### Piping with other tools

```bash
# Chain cml output with jq for structured processing
agents-cli run cml -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run cml -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run cml -- --help --json

# Introspect full command schema
agents-cli schema cml --json

# Dry-run before executing (safe exploration)
agents-cli run cml -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe cml --json
```

## When to Use This Tool

Use `cml` when:
- Your task involves cli tool: cml
- A task requires cml-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what cml provides
