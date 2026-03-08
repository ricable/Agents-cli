---
name: osv-scanner
version: 0.0.0
description: "CLI tool: osv-scanner. Use this skill when working with osv-scanner-related tasks."
ingredients:
  - google/osv-scanner
tags:
  - cli
---

# osv-scanner

CLI tool: osv-scanner

## Usage

```bash
# Show help
osv-scanner --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run osv-scanner -- --help --json

# Introspect command schema
agents-cli schema osv-scanner --json

# Dry-run before executing
agents-cli run osv-scanner -- <args> --dry-run
```
