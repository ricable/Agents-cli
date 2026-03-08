---
name: yq
version: 0.0.0
description: "yq is a portable command-line YAML, JSON, XML, CSV, TOML, HCL  and properties processor. Use this skill when working with yq-related tasks."
ingredients:
  - mikefarah/yq
tags:
  - bash
  - cli
  - csv
  - devops-tools
  - golang
  - hcl
  - json
  - portable
  - properties
  - splat
  - terraform
  - toml
  - xml
  - yaml
  - yaml-processor
# homepage: https://mikefarah.gitbook.io/yq/
# license: MIT
---

# yq

yq is a portable command-line YAML, JSON, XML, CSV, TOML, HCL  and properties processor

**Source**: https://mikefarah.gitbook.io/yq/

## Usage

```bash
# Show help
yq --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run yq -- --help --json

# Introspect command schema
agents-cli schema yq --json

# Dry-run before executing
agents-cli run yq -- <args> --dry-run
```
