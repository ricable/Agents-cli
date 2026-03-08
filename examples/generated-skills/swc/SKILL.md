---
name: swc
version: 1.5.30-nightly-20240614.2
description: "CLI tool: swc. Use this skill when working with swc-related tasks."
ingredients:
  - swc-project/swc
tags:
  - cli
---

# swc

CLI tool: swc

## Usage

```bash
# Show help
swc --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run swc -- --help --json

# Introspect command schema
agents-cli schema swc --json

# Dry-run before executing
agents-cli run swc -- <args> --dry-run
```
