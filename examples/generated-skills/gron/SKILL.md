---
name: gron
version: 0.0.0
description: "Make JSON greppable!. Use this skill when working with gron-related tasks."
ingredients:
  - tomnomnom/gron
tags:
  - cli
  - json
# homepage: https://github.com/tomnomnom/gron
# license: MIT
---

# gron

Make JSON greppable!

**Source**: https://github.com/tomnomnom/gron

## Usage

```bash
# Show help
gron --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gron -- --help --json

# Introspect command schema
agents-cli schema gron --json

# Dry-run before executing
agents-cli run gron -- <args> --dry-run
```
