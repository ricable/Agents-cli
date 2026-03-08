---
name: fd
version: 10.3.0
description: "Fast file finder — a modern alternative to 'find'. Use this skill whenever the user needs to find files by name, extension, type, or pattern, locate specific files in a directory tree, list files matching criteria, or search for files — even if they say 'find' or 'locate' instead of 'fd'."
ingredients:
  - sharkdp/fd
tags:
  - find
  - files
  - search
  - cli
  - filesystem
---

# fd — Fast File Finder

`fd` is a fast, user-friendly alternative to `find`. It searches your directory tree for files and directories matching a pattern. Use `fd` any time the user says "find files", "locate", "list files matching", "search for files", or similar.

## Installation

```bash
brew install fd            # macOS
sudo apt install fd-find   # Debian/Ubuntu (binary is `fdfind` — alias fd=fdfind)
cargo install fd-find      # Cargo
```

## Quick Reference

```
fd [OPTIONS] [PATTERN] [PATH...]
```

| Flag | Purpose |
|------|---------|
| `-e EXT` | Filter by extension |
| `-g GLOB` | Glob-based search (instead of regex) |
| `-t TYPE` | Filter by type: `f` file, `d` dir, `l` symlink, `x` executable, `e` empty |
| `-d N` | Max directory depth |
| `-H` | Include hidden files |
| `-I` | Don't respect `.gitignore` |
| `-u` | Unrestricted (hidden + no-ignore); `-uu` also searches binary files |
| `-x CMD` | Execute command per result (parallel) |
| `-X CMD` | Execute command once with all results (batch) |
| `-E PAT` | Exclude pattern |
| `-S SIZE` | Filter by size (`+10m`, `-1k`) |
| `--changed-within` | Modified within duration (`1d`, `2h`) or since date |
| `--changed-before` | Modified before duration or date |
| `-0` | Null-separated output |
| `-a` | Show absolute paths |
| `-l` | Long listing (like `ls -l`) |
| `-p` | Match against full path |
| `-s` | Case-sensitive search |
| `-j N` | Number of threads |

---

## 1. Basic File Finding

### By name (regex is default)

```bash
fd config                  # files containing "config" in the name
fd -s Config               # case-sensitive
fd '^test'                 # files starting with "test"
fd '_spec$'                # files ending with "_spec"
fd '^package\.json$'       # exact filename match
```

### By extension (`-e`)

```bash
fd -e ts                   # all TypeScript files
fd -e ts -e tsx            # multiple extensions
fd -e sh -e bash -e zsh   # all shell scripts
```

### By glob pattern (`-g`)

```bash
fd -g '*.test.ts'          # glob instead of regex
fd -g 'index.*'            # all index files
fd -g 'src/**/*.tsx'       # glob with directory pattern
fd -g '.*' -H              # all dotfiles
```

### Regex patterns (default mode)

```bash
fd 'v\d+\.\d+\.\d+'       # version-like names (v1.2.3)
fd '[0-9a-f]{8}-[0-9a-f]{4}'  # UUIDs
fd '(test|spec)\.'         # test or spec with any extension
fd 'log\.\d+'              # numbered log files
```

---

## 2. Type Filtering (`-t`)

```bash
fd -t f config             # only files
fd -t d test               # only directories
fd -t l                    # only symlinks
fd -t x                    # only executables
fd -t d '^src$'            # directories named "src"
fd -t x -e sh              # executable shell scripts
fd -t f -t e               # empty files
fd -t d -t e               # empty directories
```

---

## 3. Depth Control

```bash
fd -d 2 -e ts              # max depth of 2 levels
fd -d 1                    # only current directory
fd --min-depth 2 -e py     # skip top-level matches
fd --min-depth 3 -d 3      # exact depth: 3 levels deep
fd -d 1 -t d packages/     # shallow scan of a monorepo
```

---

## 4. Hidden and Ignored Files

By default, `fd` respects `.gitignore` and skips hidden files/dirs.

```bash
fd -H '.env'               # include hidden files (dotfiles)
fd -I node_modules         # ignore .gitignore rules
fd -u '.DS_Store'          # unrestricted: hidden + no-ignore
fd -uu pattern             # also search binary files
fd -H -d 1 '^\.' ~        # all dotfiles in home directory
fd -I -e log               # find gitignored log files
```

---

## 5. Execution (`-x`, `-X`)

### Per-result parallel execution (`-x`)

Placeholders: `{}` full path, `{/}` filename, `{//}` parent dir, `{.}` path without ext, `{/.}` filename without ext.

```bash
fd -e tmp -x rm {}                    # delete all .tmp files
fd -e png -x convert {} {.}.jpg       # convert png to jpg (parallel)
fd -e ts -x wc -l {}                  # print file sizes
fd -e bak -x mv {} /tmp/trash/        # move .bak files to trash
fd -e sh -x chmod +x {}               # chmod all shell scripts
fd -e js -x prettier --write {}       # format each JS file
```

### Batch execution (`-X`)

`-X` collects all results and runs the command once:

```bash
fd -e py -X vim                       # open all Python files in vim
fd -e ts -X wc -l                     # count total lines across all TS files
fd -e log -X tar czf logs.tar.gz      # archive all log files
fd -e go -X git add                   # stage all Go files
```

### Null-separated output (`-0`)

```bash
fd -0 -e mp3 | xargs -0 du -h        # safe piping for filenames with spaces
fd -0 -e tmp | xargs -0 rm            # delete files with special characters
```

---

## 6. Size and Time Filtering

### Size filtering (`-S`)

Units: `b` (bytes), `k` (kilobytes), `m` (megabytes), `g` (gigabytes).

```bash
fd -S +10m                 # files larger than 10MB
fd -S -1k                  # files smaller than 1KB
fd -e log -S +100m         # large log files
fd -e png -e jpg -S +5m    # large images
fd -t e -t f               # empty files (0 bytes)
```

### Time filtering

```bash
fd --changed-within 1d                # modified in last 24 hours
fd --changed-within 2h                # modified in last 2 hours
fd --changed-before 7d                # modified more than 7 days ago
fd -e ts --changed-within 1d          # recently modified TypeScript
fd -e log --changed-before 30d        # old log files
fd --changed-within 2026-01-01        # changed since a specific date
fd -S +1m --changed-within 7d         # large + recent files
```

---

## 7. Exclusion (`-E` / `--exclude`)

```bash
fd -e ts -E node_modules                              # exclude node_modules
fd -e py -E __pycache__ -E .venv -E .mypy_cache       # exclude multiple dirs
fd -E '*.min.js'                                       # exclude by glob
fd -e ts -E '*test*' -E '*spec*'                       # exclude test files
fd -e go -E vendor -E build -E dist                    # exclude vendor/build
fd -e ts -E '*.d.ts' -E '*.generated.*' -E node_modules  # source only
```

---

## 8. Integration Patterns

### With `xargs`

```bash
fd -0 -e ts | xargs -0 -P4 eslint           # parallel linting
fd -e tmp --changed-before 30d -0 | xargs -0 rm -f  # delete old temp files
fd -e rs -0 | xargs -0 wc -l | tail -1      # total lines in all Rust files
```

### With `rg` (ripgrep)

```bash
fd -e ts | xargs rg 'TODO'                  # find TODOs in TypeScript
fd -g '*.config.*' -0 | xargs -0 rg 'apiKey'  # search config files
fd -e py --changed-within 1d -0 | xargs -0 rg 'import requests'
fd -g '*.test.*' -0 | xargs -0 rg '\.skip\('  # find skipped tests
```

### With `fzf`

```bash
fd -t f | fzf                                # interactive file finder
fd -t f | fzf | xargs code                   # open selected file in editor
fd -t f -e ts | fzf --preview 'bat --color=always {}'  # preview while selecting
fd -e tmp | fzf -m | xargs rm               # multi-select files to delete
```

### With other tools

```bash
fd -e md -d 1 -X bat                        # pretty-print with bat
fd -t f -d 1 -x file {}                     # check file types
fd -e mp4 -X du -sh                         # disk usage of matched files
fd -e rs -0 | xargs -0 zip source.zip       # zip all matching files
```

---

## 9. Agent Workflows

### Find all test files in a project

```bash
fd -g '*.{test,spec}.{ts,tsx,js,jsx}'       # JS/TS tests
fd -g 'test_*.py'                            # Python tests
fd -g '*_test.go'                            # Go tests
fd -e rs -x grep -l '#\[test\]' {}          # Rust tests
fd -t d -g 'test*'                           # all test directories
```

### Find large files (for cleanup)

```bash
fd -t f -S +1m -X ls -lhS                   # large files sorted by size
fd -S +10m -e log -e csv -e json            # large data files
```

### Find recently modified files

```bash
fd --changed-within 1h -t f                  # changed in last hour
fd --changed-within 1d -e ts -e tsx          # today's TypeScript changes
fd --changed-within 1d -E node_modules -E dist -E .next -E build
```

### Find all files of a type

```bash
fd -e ts -E '*.d.ts' -E '*.test.ts' -E '*.spec.ts' -E node_modules
fd -g '*.{json,yaml,yml,toml,ini,conf}' -d 2   # all config files
fd -g 'Dockerfile*' -g 'docker-compose*'         # Docker files
fd -g '.github' -g '.gitlab-ci*' -g 'Jenkinsfile' -d 2  # CI/CD configs
```

### Project structure exploration

```bash
fd -t d -d 2                                 # project layout (dirs, 2 levels)
fd -g 'package.json' -d 3                    # monorepo detection
fd -g '{main,index,app}.{ts,js,py,go,rs}' -d 3  # entry points
fd -d 1 -g '*.config.*'                      # root config files
fd -d 1 -g '.*rc' -H                         # root dotfiles
```

### Cleanup workflows

```bash
fd -H -g '.DS_Store' -x rm {}               # remove all .DS_Store
fd -t e -t d -x rmdir {}                    # remove empty directories
fd -t d -g '__pycache__' -x rm -rf {}       # remove __pycache__
fd -t d -g '{dist,build,.next,target,out}' -d 2 -x rm -rf {}
```

---

## 10. Output and Performance

```bash
fd -a -e ts                # absolute paths
fd -l -e py                # long listing (permissions, size, date)
fd -0 -e rs                # null-separated (safe piping)
fd -c never -e ts          # strip ANSI colors
fd -e ts -x echo {/}       # filenames only (no path)
fd -e ts --base-directory src/   # relative paths from specific root
fd -e ts | wc -l           # count matching files
fd -j 1 pattern            # single-threaded (slow I/O)
fd -j 8 pattern            # 8 threads
fd --one-file-system -e log /    # don't cross mount points
fd -d 3 -e ts src/         # limit depth for speed
fd -g '*.test.ts'          # prefer -g over regex for simple patterns
```

---

## Common Gotchas

1. **`fd` uses regex by default, not globs.** Use `-g` for glob patterns.
   ```bash
   fd '*.ts'     # WRONG: regex interprets * differently
   fd -g '*.ts'  # CORRECT: glob mode
   fd '\.ts$'    # CORRECT: regex mode
   ```

2. **Hidden files are excluded by default.** Use `-H` to include them.
   ```bash
   fd '.env'     # won't find .env files
   fd -H '.env'  # will find them
   ```

3. **`.gitignore` rules are respected by default.** Use `-I` to ignore them.

4. **On Debian/Ubuntu, the binary is `fdfind`.** Alias it: `alias fd=fdfind`

5. **Patterns match the filename, not the full path.** Use `-p` for full path matching:
   ```bash
   fd -p 'src/.*test'  # matches against full path
   ```
