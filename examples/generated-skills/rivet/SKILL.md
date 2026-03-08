---
name: rivet
version: 0.0.0
description: "CLI tool: rivet. Use this skill whenever the user works with rivet or tasks related to cli tool: rivet — even if they don't mention "rivet" by name."
ingredients:
  - Ironclad/rivet
tags:
  - cli
---

# rivet

CLI tool: rivet

## Overview

rivet provides cli tool: rivet. Agents benefit from rivet because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Ironclad/rivet

# Or clone from GitHub
git clone https://github.com/Ironclad/rivet.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
/Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs:34473
    throw firstError;
    ^

Error: Package subpath './bin/eslint.js' is not defined by "exports" in /Users/cedric/.agents-cli/tools/rivet/package/.yarn/__virtual__/eslint-virtual-4b08b34d99/0/cache/eslint-npm-9.20.1-5c3419cdfc-b1d870135c.zip/node_modules/eslint/package.json imported from /Users/cedric/.agents-cli/tools/rivet/package/
Require stack:
- /Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs
    at require$$0.Module._resolveFilename (/Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs:34472:13)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function.<anonymous> (node:internal/modules/cjs/loader:1192:37)
    at require$$0.Module._load (/Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs:34363:31)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/Users/cedric/.agents-cli/tools/rivet/package/.yarn/sdks/eslint/bin/eslint.js:32:38)

Node.js v22.22.1
```

## Usage

```bash
# Show help and available options
rivet --help

# Check version
rivet --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Ironclad/rivet

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Ironclad/rivet

# 2. Verify installation
agents-cli run rivet -- --version

# 3. Explore capabilities
agents-cli schema rivet --json
```

### Piping with other tools

```bash
# Chain rivet output with jq for structured processing
agents-cli run rivet -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run rivet -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run rivet -- --help --json

# Introspect full command schema
agents-cli schema rivet --json

# Dry-run before executing (safe exploration)
agents-cli run rivet -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe rivet --json
```

## When to Use This Tool

Use `rivet` when:
- Your task involves cli tool: rivet
- A task requires rivet-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what rivet provides
