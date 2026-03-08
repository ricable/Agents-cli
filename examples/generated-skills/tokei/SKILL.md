---
name: tokei
version: 0.0.0
description: "Count your code, quickly.. Use this skill when working with tokei-related tasks."
ingredients:
  - XAMPPRocky/tokei
tags:
  - badge
  - cli
  - cloc
  - code
  - command-line-tool
  - linux
  - macos
  - rust
  - sloc
  - statistics
  - tokei
  - windows
# homepage: https://github.com/XAMPPRocky/tokei
# license: NOASSERTION
---

# tokei

Count your code, quickly.

**Source**: https://github.com/XAMPPRocky/tokei

## Usage

```bash
# Show help
tokei --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tokei -- --help --json

# Introspect command schema
agents-cli schema tokei --json

# Dry-run before executing
agents-cli run tokei -- <args> --dry-run
```
