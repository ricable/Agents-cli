---
name: fiddler-auditor
version: 0.0.0
description: "CLI tool: fiddler-auditor. Use this skill when working with fiddler-auditor-related tasks."
ingredients:
  - fiddler-labs/fiddler-auditor
tags:
  - cli
---

# fiddler-auditor

CLI tool: fiddler-auditor

## Usage

```bash
# Show help
fiddler-auditor --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fiddler-auditor -- --help --json

# Introspect command schema
agents-cli schema fiddler-auditor --json

# Dry-run before executing
agents-cli run fiddler-auditor -- <args> --dry-run
```
