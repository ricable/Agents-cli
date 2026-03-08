---
name: eza
version: 0.23.4
description: "Modern file lister with git integration and tree view. Use this skill whenever the user needs to list directory contents, show file trees, view file sizes and permissions, or browse directory structures — even if they say 'ls' or 'list files' or 'show directory'."
ingredients:
  - eza-community/eza
tags:
  - ls
  - files
  - tree
  - cli
  - directory
---

# eza

A modern, maintained replacement for `ls` with sensible defaults, git integration, tree view, icons, and colour-coded output. Written in Rust, ships as a single binary.

**Source**: https://github.com/eza-community/eza

---

## Display Modes

eza supports several output layouts. Pick the one that fits the task.

| Flag | Mode | When to use |
|------|------|-------------|
| *(none)* | Grid | Default — compact columns, like `ls` |
| `-1` / `--oneline` | One-per-line | Piping into other commands, counting files |
| `-l` / `--long` | Long | Permissions, owner, size, date — like `ls -l` |
| `-G` / `--grid` | Grid (explicit) | Force grid even when piped |
| `-T` / `--tree` | Tree | Recursive directory tree with indentation |
| `-R` / `--recurse` | Flat recurse | Recurse into dirs without tree drawing |

### Examples

```bash
# Quick look at the current directory
eza

# One file per line (great for scripting)
eza -1

# Long listing with all metadata
eza -l

# Long listing including hidden (dot) files
eza -la

# Full long listing — equivalent to the above
eza --long --all

# Recursive tree view
eza -T

# Recurse into subdirectories without tree lines
eza -R
```

---

## Sorting

Control file order with `-s` / `--sort` and modifiers.

| Sort field | Description |
|------------|-------------|
| `name` | Alphabetical (default) |
| `Name` | Alphabetical, case-sensitive uppercase first |
| `size` | Largest first |
| `modified` | Most recently modified first |
| `created` | Most recently created first |
| `accessed` | Most recently accessed first |
| `extension` | Group by file extension |
| `type` | Directories, files, links, etc. |
| `none` | Filesystem order (fastest) |

### Modifiers

| Flag | Effect |
|------|--------|
| `-r` / `--reverse` | Reverse whatever sort is active |
| `--group-directories-first` | Pin directories to the top |

### Examples

```bash
# Largest files first
eza -l -s size

# Oldest modified first (reverse of newest-first)
eza -l -s modified -r

# Group by extension, directories on top
eza -l -s extension --group-directories-first

# Most recently created files
eza -l -s created

# Directories first, then alphabetical (common default)
eza -l --group-directories-first
```

---

## Filtering

Narrow down what eza shows.

| Flag | Effect |
|------|--------|
| `-d` / `--list-dirs` | Show directory entries themselves, not their contents |
| `-D` / `--only-dirs` | Only show directories |
| `-f` / `--only-files` | Only show files |
| `--git-ignore` | Respect `.gitignore` rules |
| `-I GLOB` / `--ignore-glob=GLOB` | Hide files matching a glob pattern |
| `-a` / `--all` | Show hidden files (dotfiles) |
| `-A` / `--almost-all` | Show hidden files except `.` and `..` |

### Examples

```bash
# Only directories
eza -D

# Only files (skip directories)
eza -f

# Hide node_modules and .git
eza --ignore-glob="node_modules|.git"

# Respect .gitignore (skip untracked build artifacts)
eza --git-ignore

# Show everything including dotfiles
eza -a

# Combine: only files, skip gitignored, long view
eza -lf --git-ignore
```

---

## Tree View

`-T` / `--tree` renders a recursive directory tree. Control depth with `-L` / `--level`.

### Examples

```bash
# Full recursive tree from current directory
eza -T

# Tree limited to 2 levels deep
eza -T -L 2

# Tree limited to 3 levels, long format, with icons
eza -T -L 3 -l --icons

# Tree of only directories (skip files)
eza -TD

# Tree respecting .gitignore (clean view of source)
eza -T --git-ignore

# Tree of a specific path
eza -T -L 2 /path/to/project

# Tree with file sizes — find heavy directories
eza -T -L 2 -l -s size
```

---

## Long View Details

When using `-l`, these flags control what metadata columns appear.

| Flag | Effect |
|------|--------|
| `-b` / `--binary` | Show sizes in binary units (KiB, MiB, GiB) |
| `-B` / `--bytes` | Show sizes as raw byte counts |
| `--git` | Show per-file git status column (staged/modified) |
| `-h` / `--header` | Print a header row above columns |
| `--no-permissions` | Hide the permissions column |
| `--no-filesize` | Hide the file-size column |
| `--no-user` | Hide the user/owner column |
| `--no-time` | Hide the timestamp column |
| `--changed` | Use changed (ctime) timestamp instead of modified |
| `--created` | Show creation (birth) timestamp |
| `--accessed` | Show last-access timestamp |
| `-@` / `--extended` | Show extended attributes and ACLs |

### Examples

```bash
# Long view with header row
eza -lh

# Long view with binary sizes (KiB, MiB)
eza -lb

# Long view with exact byte counts
eza -lB

# Long view with git status per file
eza -l --git

# Full-detail listing: header, git, binary sizes, all files
eza -labh --git

# Show creation timestamps instead of modified
eza -l --created

# Minimal long view — just name, size, and date
eza -l --no-permissions --no-user
```

---

## Icons and Colors

| Flag | Effect |
|------|--------|
| `--icons` | Show filetype icons (requires a Nerd Font) |
| `--icons=always` | Force icons even when piped |
| `--icons=never` | Disable icons |
| `--color=always` | Force colour output (for piping to `less -R`) |
| `--color=never` | Disable colour (for scripting) |
| `--color=auto` | Colour only when output is a terminal (default) |
| `--colour-scale` | Gradient colouring for file sizes (small=green, large=red) |
| `--colour-scale-mode=fixed` | Fixed colour thresholds for sizes |
| `--colour-scale-mode=gradient` | Smooth gradient (default when enabled) |

### Examples

```bash
# Icons + long view (pretty terminal output)
eza -l --icons

# Force colour when piping to less
eza -l --color=always | less -R

# Size gradient — large files visually stand out
eza -l --colour-scale

# Clean output for scripting — no icons, no colour
eza -1 --color=never --icons=never
```

---

## Git Integration

`--git` adds a two-character status column to long view showing staged and unstaged state for each file, matching git's status codes.

| Code | Meaning |
|------|---------|
| `N` | New (untracked) |
| `M` | Modified |
| `D` | Deleted |
| `R` | Renamed |
| `T` | Type change |
| `-` | Unchanged |
| `.` | Not applicable |

The first character is the **staged** (index) status; the second is the **unstaged** (working tree) status.

### Examples

```bash
# Show git status for every file
eza -l --git

# Git status + hidden files + header
eza -lah --git

# Git status in a tree
eza -T --git

# Quick view of modified files in a repo
eza -l --git | grep -E "^.M|M."

# Combine with .gitignore filtering for a clean view
eza -l --git --git-ignore
```

---

## Timestamps

Control which timestamp is shown and how it is formatted.

| Flag | Effect |
|------|--------|
| `--time-style=default` | e.g. `14 Mar 12:30` |
| `--time-style=iso` | ISO 8601 date only: `2026-03-14` |
| `--time-style=long-iso` | ISO 8601 with time: `2026-03-14 12:30` |
| `--time-style=full-iso` | Full precision: `2026-03-14 12:30:45.123456789 +0000` |
| `--time-style=relative` | Human-relative: `2 hours ago`, `3 days ago` |
| `--changed` | Show ctime (metadata change) instead of mtime |
| `--created` | Show birth/creation time |
| `--accessed` | Show last access time |

### Examples

```bash
# ISO dates (sort-friendly)
eza -l --time-style=iso

# Full-precision timestamps for debugging
eza -l --time-style=full-iso

# Relative timestamps — quickly see recency
eza -l --time-style=relative

# Show creation time with relative format
eza -l --created --time-style=relative
```

---

## Common Recipes

Ready-to-use commands for frequent tasks.

```bash
# Pretty listing — the everyday default
eza -la --icons --git --group-directories-first

# Find the 10 largest files in current directory
eza -l -s size -r | head -10

# Find the 10 largest files recursively
eza -rl -s size -r | head -10

# Show what changed recently (last-modified, newest first)
eza -l -s modified

# Recently created files
eza -l --created -s created

# Directory overview — only folders, tree, 2 levels
eza -TD -L 2 --icons

# Source-code tree — skip build artifacts
eza -T --git-ignore --icons -L 3

# Export file list for scripting (one per line, no colour)
eza -1 --color=never

# Disk-usage overview — sizes in tree view
eza -T -l -L 2 -s size --colour-scale

# Project overview with git status
eza -la --git --icons --group-directories-first --git-ignore -T -L 2
```

---

## Agent Workflows

These patterns map natural-language requests to eza commands.

| User says | Command |
|-----------|---------|
| "list files" | `eza -la --icons` |
| "show directory tree" | `eza -T -L 3 --icons` |
| "find largest files" | `eza -l -s size -r` |
| "show git status of files" | `eza -l --git` |
| "what files changed recently?" | `eza -l -s modified --time-style=relative` |
| "show only directories" | `eza -D` |
| "show hidden files" | `eza -a` |
| "list files without build artifacts" | `eza --git-ignore` |
| "give me a clean file list for a script" | `eza -1 --color=never --icons=never` |
| "overview of this project" | `eza -la --git --icons --group-directories-first --git-ignore -T -L 2` |
| "how big are these files?" | `eza -l -b --colour-scale` |
| "show file permissions" | `eza -l` |
| "show extended attributes" | `eza -l@` |
| "recursive listing" | `eza -R` or `eza -T` |

### Choosing between `-T` (tree) and `-R` (recurse)

- Use `-T` when the user wants a **visual hierarchy** (tree lines).
- Use `-R` when the user wants a **flat recursive list** without tree drawing (easier to pipe/grep).

### Composing flags

eza flags compose freely. Stack them:

```bash
# Everything: long + all + icons + git + dirs-first + tree 2 levels
eza -la --icons --git --group-directories-first -T -L 2
```

### Performance notes

- `--git` scans the git index — fast on most repos, slower on very large monorepos.
- `--git-ignore` avoids listing ignored files, which can **speed up** large trees.
- `-T` without `-L` recurses the entire tree. Always set `-L` on large directories.
- `-s none` skips sorting for the fastest possible listing.

---

## Environment Variables

| Variable | Effect |
|----------|--------|
| `EZA_COLORS` | Override file-type colours (same syntax as `LS_COLORS`) |
| `EZA_ICON_SPACING` | Number of spaces between icon and filename (default 1) |
| `NO_COLOR` | When set, disables all colour output |
| `COLUMNS` | Override terminal width for grid layout |

---

## Aliases

Recommended shell aliases to drop into `.zshrc` / `.bashrc`:

```bash
alias ls='eza'
alias ll='eza -la --icons --git --group-directories-first'
alias lt='eza -T -L 3 --icons'
alias la='eza -a'
alias l='eza -1'
```
