---
name: xsv
version: 0.0.0
description: "A fast CSV command line toolkit written in Rust.. Use this skill when working with xsv-related tasks."
ingredients:
  - BurntSushi/xsv
tags:
  - cli
  - command-line
  - csv
  - rust
# homepage: https://github.com/BurntSushi/xsv
# license: Unlicense
---

# xsv

A fast CSV command line toolkit written in Rust.

**Source**: https://github.com/BurntSushi/xsv

## Usage

```bash
# Show help
xsv --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run xsv -- --help --json

# Introspect command schema
agents-cli schema xsv --json

# Dry-run before executing
agents-cli run xsv -- <args> --dry-run
```
