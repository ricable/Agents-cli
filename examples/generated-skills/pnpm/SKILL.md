---
name: pnpm
version: 0.0.0
description: "CLI tool: pnpm. Use this skill whenever the user works with pnpm or tasks related to cli tool: pnpm — even if they don't mention "pnpm" by name."
ingredients:
  - pnpm/pnpm
tags:
  - cli
---

# pnpm

CLI tool: pnpm

## Overview

pnpm provides cli tool: pnpm. Agents benefit from pnpm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pnpm/pnpm

# Or clone from GitHub
git clone https://github.com/pnpm/pnpm.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/cedric/.agents-cli/tools/pnpm/package/pnpm/dist/pnpm.mjs' imported from /Users/cedric/.agents-cli/tools/pnpm/package/pnpm/bin/pnpm.mjs
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    at moduleResolve (node:internal/modules/esm/resolve:861:10)
    at defaultResolve (node:internal/modules/esm/resolve:985:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:731:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:708:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:310:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:182:49) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///Users/cedric/.agents-cli/tools/pnpm/package/pnpm/dist/pnpm.mjs'
}

Node.js v22.22.1
```

## Usage

```bash
# Show help and available options
pnpm --help

# Check version
pnpm --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pnpm/pnpm

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pnpm/pnpm

# 2. Verify installation
agents-cli run pnpm -- --version

# 3. Explore capabilities
agents-cli schema pnpm --json
```

### Piping with other tools

```bash
# Chain pnpm output with jq for structured processing
agents-cli run pnpm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pnpm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pnpm -- --help --json

# Introspect full command schema
agents-cli schema pnpm --json

# Dry-run before executing (safe exploration)
agents-cli run pnpm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pnpm --json
```

## When to Use This Tool

Use `pnpm` when:
- Your task involves cli tool: pnpm
- A task requires pnpm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pnpm provides
