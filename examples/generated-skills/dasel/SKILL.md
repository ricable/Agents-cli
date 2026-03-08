---
name: dasel
version: 0.0.0
description: "Select, put and delete data from JSON, TOML, YAML, XML, INI, HCL and CSV files with a single tool. Also available as a go mod.. Use this skill when working with dasel-related tasks."
ingredients:
  - TomWright/dasel
tags:
  - cli
  - config
  - configuration
  - data-processing
  - data-structures
  - data-wrangling
  - devops-tools
  - go
  - golang
  - hcl2
  - json
  - json-processing
  - parser
  - query
  - selector
  - toml
  - update
  - xml
  - yaml
  - yaml-processor
# homepage: https://daseldocs.tomwright.me
# license: MIT
---

# dasel

Select, put and delete data from JSON, TOML, YAML, XML, INI, HCL and CSV files with a single tool. Also available as a go mod.

**Source**: https://daseldocs.tomwright.me

## Usage

```bash
# Show help
dasel --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run dasel -- --help --json

# Introspect command schema
agents-cli schema dasel --json

# Dry-run before executing
agents-cli run dasel -- <args> --dry-run
```
