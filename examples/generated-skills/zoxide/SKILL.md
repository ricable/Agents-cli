---
name: zoxide
version: 0.9.8
description: "Smarter directory navigation using frecency ranking. Use this skill whenever the user needs to quickly navigate to directories, find project folders, or jump between commonly-used paths — even if they say 'cd' or 'go to directory' or 'navigate to'."
ingredients:
  - ajeetdsouza/zoxide
tags:
  - navigation
  - cd
  - directory
  - cli
  - frecency
---

# zoxide

A smarter `cd` command that learns your habits. zoxide tracks which directories
you visit most frequently and most recently, then uses a **frecency** algorithm
to jump you to the right place with minimal keystrokes.

**Source**: https://github.com/ajeetdsouza/zoxide

---

## How Frecency Ranking Works

zoxide scores every directory in its database using a **frecency** algorithm
that combines two signals:

| Signal        | What it measures                        |
|---------------|-----------------------------------------|
| **Frequency** | How many times you have visited the dir |
| **Recency**   | How recently you last visited it        |

Directories you visit often AND recently get the highest scores. Old entries
decay over time. When the database exceeds `_ZO_MAXAGE` entries (default 10000),
the lowest-scored entries are pruned automatically.

This means zoxide gets better the more you use it — no manual bookmarking,
no aliases, no configuration required.

---

## 1. Navigation

### `z <query>` — Fuzzy Jump

The core command. Matches `<query>` against your directory history and `cd`s
to the highest-ranked result.

```bash
# Jump to a directory matching "proj"
z proj

# Multiple keywords narrow the match (all must appear in order)
z dev api        # matches /home/user/dev/my-api
z usr loc bin    # matches /usr/local/bin

# Jump to the highest-ranked subdirectory of current dir
z .

# Exact subdirectory (bypasses frecency, acts like plain cd)
z ./src
z /etc/nginx

# Jump to home
z
```

**Matching rules:**
- Keywords are matched as substrings of path components, left-to-right
- `z foo bar` matches any path containing a component matching `foo` followed
  by a later component matching `bar`
- If the last keyword is an exact match for a trailing path component, that
  path is strongly preferred
- Paths that don't exist on disk are automatically removed from results

### `zi` — Interactive Selection (requires fzf)

When you're not sure which match you want, `zi` opens an interactive fzf
picker with all matching directories ranked by score.

```bash
# Browse all tracked directories interactively
zi

# Pre-filter then pick interactively
zi proj

# Pre-filter with multiple keywords
zi dev react
```

The fzf interface shows the frecency score on the left and the path on the
right, sorted by score descending.

---

## 2. Database Management

zoxide stores its database in a simple plaintext file. You rarely need to touch
it directly, but these commands give you full control.

### `zoxide add <path...>`

Manually add or bump a directory in the database. Useful for seeding paths
you know you'll visit.

```bash
# Add a single directory
zoxide add /home/user/projects/my-app

# Add multiple directories at once
zoxide add ~/dev/frontend ~/dev/backend ~/dev/infra

# Add current directory (this happens automatically on every cd)
zoxide add .
```

### `zoxide remove <path...>`

Remove a directory from the database entirely. Useful for cleaning up
deleted or moved projects.

```bash
# Remove a specific path
zoxide remove /old/project/path

# Remove current directory
zoxide remove .

# Remove multiple paths
zoxide remove ~/tmp/scratch ~/old/experiments
```

### `zoxide edit`

Open the database in an interactive editor (uses `$EDITOR` or `$VISUAL`).
Each line contains a score and a path, separated by a space. You can manually
adjust scores, delete lines, or add new entries.

```bash
# Open database for manual editing
zoxide edit
```

The file format is simple:
```
10.5 /home/user/dev/project-a
 3.2 /home/user/documents
 0.8 /tmp/scratch
```

---

## 3. Querying the Database

Query commands let you inspect what zoxide knows without actually changing
directories. Essential for scripting and debugging.

### `zoxide query <keywords...>`

Print the best match for the given keywords to stdout (without navigating).

```bash
# Find the best match for "proj"
zoxide query proj
# Output: /home/user/dev/my-project

# Find the best match for multiple keywords
zoxide query dev api
# Output: /home/user/dev/my-api
```

### `zoxide query --list`

List all matches (not just the best one), sorted by score descending.

```bash
# List all directories matching "dev"
zoxide query --list dev
# Output:
#  45.6 /home/user/dev
#  23.1 /home/user/dev/frontend
#  12.4 /home/user/dev/backend

# List everything in the database
zoxide query --list
```

### `zoxide query -s` / `zoxide query --score`

Show the frecency score alongside each result.

```bash
# Show score for the top match
zoxide query -s proj
# Output: 42.7 /home/user/dev/my-project

# Combine with --list to see all scores
zoxide query --list -s
# Output:
# 128.3 /home/user/dev
#  45.6 /home/user/dev/frontend
#  23.1 /home/user/documents
#   0.8 /tmp/scratch

# Machine-friendly: combine with --list for scripting
zoxide query --list -s dev | head -5
```

### `zoxide query -i` — Interactive Query

Like `zi`, but prints the selected path instead of navigating to it.

```bash
# Pick interactively, print path
selected=$(zoxide query -i proj)
echo "You picked: $selected"
```

### `zoxide query --exclude <path>`

Exclude a specific directory from results. Useful when you want the
second-best match.

```bash
# Find best "dev" match that isn't the current directory
zoxide query --exclude "$(pwd)" dev

# Exclude a known directory to get alternatives
zoxide query --exclude /home/user/dev dev
```

---

## 4. Importing from Other Tools

Migrating from `z`, `autojump`, or `z.lua`? zoxide can import their databases.

### `zoxide import --from=z <path>`

```bash
# Import from z (default data file)
zoxide import --from=z ~/.z

# Import from autojump
zoxide import --from=autojump ~/.local/share/autojump/autojump.txt

# Import from z.lua
zoxide import --from=z ~/.zlua
```

After importing, all your old frecency data is preserved and merged into
zoxide's database. You can continue using zoxide immediately with your
full history.

---

## 5. Shell Initialization

zoxide needs a one-time shell hook to track your `cd` usage and provide the
`z` / `zi` commands.

### `zoxide init <shell>`

```bash
# Bash — add to ~/.bashrc
eval "$(zoxide init bash)"

# Zsh — add to ~/.zshrc
eval "$(zoxide init zsh)"

# Fish — add to ~/.config/fish/config.fish
zoxide init fish | source

# POSIX shells
eval "$(zoxide init posix --hook prompt)"
```

### `--cmd` — Custom command name

If you want a different command name instead of `z`:

```bash
# Use 'j' instead of 'z' (autojump muscle memory)
eval "$(zoxide init bash --cmd j)"
# Now use: j proj, ji

# Use 'cd' to completely replace built-in cd
eval "$(zoxide init bash --cmd cd)"
# Now 'cd proj' does frecency matching
# 'cd /absolute/path' still works normally
```

### `--hook` — When to record visits

Control when zoxide records directory visits: `prompt` (every prompt, default),
`pwd` (on directory changes only), or `none` (manual `zoxide add` only).

```bash
eval "$(zoxide init bash --hook prompt)"
```

---

## 6. Environment Variables

Configure zoxide behavior through environment variables. Set these before
the `eval "$(zoxide init ...)"` line in your shell config.

| Variable              | Default                          | Description                                                    |
|-----------------------|----------------------------------|----------------------------------------------------------------|
| `_ZO_DATA_DIR`        | Platform-specific data dir       | Directory where zoxide stores its database                     |
| `_ZO_ECHO`            | `0`                              | Print matched directory path after jumping (`1` to enable)     |
| `_ZO_EXCLUDE_DIRS`    | `$HOME`                          | Colon-separated list of directories to never track             |
| `_ZO_FZF_OPTS`        | (empty)                          | Custom fzf options for `zi` / interactive queries              |
| `_ZO_MAXAGE`          | `10000`                          | Maximum number of entries before aging/pruning                 |
| `_ZO_RESOLVE_SYMLINKS`| `0`                              | Resolve symlinks before storing paths (`1` to enable)          |

### Configuration examples

```bash
# Store database in a custom location (useful for syncing across machines)
export _ZO_DATA_DIR="$HOME/.local/share/zoxide"

# Exclude build directories and tmp from tracking
export _ZO_EXCLUDE_DIRS="$HOME:$HOME/node_modules:$HOME/.cache:/tmp"

# Prune more aggressively (keep fewer entries)
export _ZO_MAXAGE=5000

# Customize the fzf picker appearance
export _ZO_FZF_OPTS="--height 40% --reverse --border --preview 'ls -la {2..}'"

# Always echo the matched directory after jumping
export _ZO_ECHO=1

# Resolve symlinks to their real paths
export _ZO_RESOLVE_SYMLINKS=1
```

---

## 7. Practical Examples

### Quick navigation patterns

```bash
# You typed /home/user/dev/my-react-app many times. Now just:
z react

# Multiple projects with "api" in the name? Add more keywords:
z dev payments api    # -> /home/user/dev/payments-api
z dev users api       # -> /home/user/dev/users-api

# Navigate to the Nth most common directory
zi                    # opens fzf with full list

# Jump back to a recent directory
z -                   # like cd -, goes to previous directory
```

### Scripting with zoxide

```bash
# Get the path without navigating (for use in scripts)
PROJECT_DIR=$(zoxide query react)
echo "Building in $PROJECT_DIR"
cd "$PROJECT_DIR" && npm run build

# List top 10 most-visited directories
zoxide query --list -s | head -10

# Check if a directory is tracked
if zoxide query -s myproject > /dev/null 2>&1; then
  echo "Found in zoxide database"
fi

# Batch-add project directories
find ~/dev -maxdepth 2 -name "package.json" -exec dirname {} \; \
  | xargs zoxide add

# Clean up entries pointing to deleted directories
zoxide query --list | while read -r dir; do
  [ -d "$dir" ] || zoxide remove "$dir"
done
```

### Combining with other tools

```bash
# Open a project in VS Code using zoxide to find it
code "$(zoxide query myproject)"

# Git operations in another directory without leaving current one
git -C "$(zoxide query backend)" status
git -C "$(zoxide query api)" pull
```

---

## Agent Workflows

When an agent or LLM assistant needs to navigate the filesystem, zoxide
provides intelligent directory resolution without requiring full paths.

### "Navigate to project"

```bash
# Agent receives: "go to the react project"
# Step 1: Query zoxide for the best match
target=$(zoxide query react)
# Step 2: Verify the directory exists
if [ -d "$target" ]; then
  cd "$target"
  echo "Navigated to: $target"
else
  echo "No matching directory found for 'react'"
fi
```

### "Find directory"

```bash
# Agent receives: "where is the API project?"
# Use query with --list to show candidates
zoxide query --list -s api

# If multiple matches, present options
zoxide query --list api | head -5
```

### "Smart cd" — replacing cd in agent tools

```bash
# Instead of requiring exact paths, the agent can do:
navigate() {
  local target
  target=$(zoxide query "$@" 2>/dev/null)
  if [ -n "$target" ] && [ -d "$target" ]; then
    cd "$target" && pwd
  else
    # Fallback to regular cd if zoxide has no match
    cd "$@" && zoxide add "$(pwd)"
  fi
}

# Usage in agent context
navigate dev frontend
navigate ~/projects        # exact paths still work
navigate api               # frecency match
```

### Agent pre-flight: seed the database

If running in a fresh environment, seed zoxide with known project paths
so frecency works immediately:

```bash
# Seed common project directories
find /workspace -maxdepth 3 -name ".git" -type d -exec dirname {} \; \
  | xargs zoxide add

# Seed from a project manifest
cat projects.txt | xargs zoxide add

# Verify seeding worked
zoxide query --list -s | head -10
```

### Agent integration via agents-cli

```bash
# Run zoxide through agents-cli for structured output
agents-cli run zoxide -- query --list -s

# Check if zoxide is available
agents-cli describe zoxide

# Use in a skill chain: find directory, then operate on it
target=$(agents-cli run zoxide -- query backend 2>/dev/null)
agents-cli run git -- -C "$target" status
```

---

## Troubleshooting

| Problem                          | Solution                                                         |
|----------------------------------|------------------------------------------------------------------|
| `z` command not found            | Add `eval "$(zoxide init bash)"` to your shell config and reload |
| `zi` fails with "fzf not found"  | Install fzf: `brew install fzf` or `apt install fzf`            |
| Jump goes to wrong directory     | Run `zoxide query --list -s <term>` to see ranking, then `zoxide remove` bad entries |
| Database too large / slow        | Lower `_ZO_MAXAGE` (e.g., `export _ZO_MAXAGE=5000`)             |
| Symlinks resolved unexpectedly   | Check `_ZO_RESOLVE_SYMLINKS`; set to `0` to keep symlinks as-is |
| Home directory always matches    | Add `$HOME` to `_ZO_EXCLUDE_DIRS` (it's excluded by default)    |
| Entries not being recorded       | Check `--hook` setting; `prompt` is recommended for most shells  |
