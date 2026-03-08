---
name: fx
version: 0.0.0
description: "Terminal JSON viewer & processor. Use this skill when working with fx-related tasks."
ingredients:
  - antonmedv/fx
tags:
  - cli
  - command-line
  - json
  - tui
# homepage: https://fx.wtf
# license: MIT
---

# fx

Terminal JSON viewer & processor

**Source**: https://fx.wtf

## Usage

```bash
# Show help
fx --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fx -- --help --json

# Introspect command schema
agents-cli schema fx --json

# Dry-run before executing
agents-cli run fx -- <args> --dry-run
```
