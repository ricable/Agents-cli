---
name: git-github-workflow
version: 1.0.0
description: "Complete Git and GitHub workflow using git and gh CLI. Use this skill whenever the user needs to create branches, make commits, create pull requests, review PRs, manage issues, check CI status, release software, or do any git/GitHub operation — even if they just say 'push my changes' or 'make a PR' or 'check if CI passed' or 'tag a release'."
ingredients:
  - cli/cli
tags:
  - workflow
  - git
  - github
  - pull-request
  - ci-cd
  - release
---

# Git & GitHub Workflow

Complete workflow skill for git and GitHub CLI (`gh`). Covers the full lifecycle from branching to releasing. Every section is a step-by-step recipe agents can follow directly.

**Prerequisites:** `git` installed, `gh` installed and authenticated (`gh auth login`).

## 1. Feature Branch Workflow

Create a branch, make changes, commit, push, and open a PR — the most common development flow.

### Start a new feature

```bash
# 1. Make sure you're on the latest main
git checkout main
git pull origin main

# 2. Create a feature branch with a descriptive name
git checkout -b feat/add-user-search

# 3. Make your changes, then stage specific files (never use `git add .` blindly)
git add src/search.ts src/api/users.ts

# 4. Commit with a clear message explaining WHY, not just WHAT
git commit -m "feat: add user search endpoint

Enables searching users by name and email. The /api/users/search
endpoint accepts query params and returns paginated results.

Closes #42"

# 5. Push the branch and set upstream tracking
git push -u origin feat/add-user-search

# 6. Create a pull request (see Section 2 for details)
gh pr create --title "Add user search endpoint" --body "Implements #42. Adds a search endpoint with pagination support."
```

**Why feature branches?** They isolate work so `main` always stays deployable. Each branch maps to one PR, making review focused.

### Multiple commits on a feature branch

```bash
# Stage and commit incrementally as you work
git add src/search.ts
git commit -m "feat: implement search query builder"

git add src/api/users.ts tests/search.test.ts
git commit -m "feat: add search API route and tests"

# Push all commits at once
git push
```

## 2. Create and Manage Pull Requests

### Create a PR

```bash
# Basic PR — opens in the current branch against default base
gh pr create --title "Add user search" --body "Implements user search with pagination."

# PR against a specific base branch
gh pr create --base develop --title "Add user search" --body "..."

# PR with reviewers and labels
gh pr create \
  --title "Add user search" \
  --body "Implements user search with pagination. Closes #42." \
  --reviewer alice,bob \
  --label "feature,needs-review"

# Draft PR — signals work in progress
gh pr create --draft --title "WIP: user search" --body "Not ready for review yet."

# PR with a multi-line body using heredoc
gh pr create --title "Add user search" --body "$(cat <<'EOF'
## Summary
- Adds `/api/users/search` endpoint
- Supports name and email query params
- Returns paginated results (default 20 per page)

## Test plan
- [ ] Unit tests pass: `npm test`
- [ ] Manual test with curl
EOF
)"
```

### Manage an existing PR

```bash
# Add reviewers to an existing PR
gh pr edit 123 --add-reviewer alice,bob

# Add labels
gh pr edit 123 --add-label "bug,priority:high"

# Change the title
gh pr edit 123 --title "Fix: user search returns duplicates"

# Mark a draft PR as ready for review
gh pr ready 123

# View PR details
gh pr view 123

# View PR in the browser
gh pr view 123 --web
```

### Merge a PR

```bash
# Merge commit (default) — preserves full history
gh pr merge 123 --merge

# Squash merge — combine all commits into one clean commit
gh pr merge 123 --squash

# Rebase merge — replay commits on top of base, no merge commit
gh pr merge 123 --rebase

# Auto-merge when CI passes
gh pr merge 123 --auto --squash

# Delete the branch after merging (recommended)
gh pr merge 123 --squash --delete-branch
```

**When to use which merge strategy:**
- `--squash` for feature branches with messy commit history — produces one clean commit.
- `--merge` when individual commits are meaningful and well-structured.
- `--rebase` for a linear history without merge commits.

## 3. Code Review Workflow

### List and find PRs

```bash
# List open PRs
gh pr list

# List PRs assigned to you for review
gh pr list --search "review-requested:@me"

# List PRs by a specific author
gh pr list --author alice

# List PRs with a label
gh pr list --label "needs-review"

# List merged PRs from the last week
gh pr list --state merged --search "merged:>2025-01-01"
```

### Review a PR

```bash
# View the diff
gh pr diff 123

# View the diff in a specific file
gh pr diff 123 -- src/search.ts

# Check CI status before reviewing
gh pr checks 123

# Approve a PR
gh pr review 123 --approve

# Approve with a comment
gh pr review 123 --approve --body "Looks good! Clean implementation."

# Request changes
gh pr review 123 --request-changes --body "The search query needs SQL injection protection. See inline comments."

# Add a general comment (not an approval or rejection)
gh pr review 123 --comment --body "A few questions about the pagination approach."

# Add an inline comment on a specific line
gh pr comment 123 --body "Consider using a parameterized query here to prevent injection."
```

### Check CI status

```bash
# View all checks on the current PR
gh pr checks

# View checks for a specific PR
gh pr checks 123

# Wait for checks to complete (blocks until done)
gh pr checks 123 --watch
```

## 4. Issue Management

### Create issues

```bash
# Simple issue
gh issue create --title "Search returns duplicates" --body "When searching by partial name, duplicate results appear."

# Issue with labels and assignees
gh issue create \
  --title "Search returns duplicates" \
  --body "Steps to reproduce: ..." \
  --label "bug,search" \
  --assignee "@me"

# Issue with a body from heredoc
gh issue create --title "Add email search" --body "$(cat <<'EOF'
## Description
Users should be able to search by email address.

## Acceptance criteria
- [ ] Search by exact email
- [ ] Search by domain (e.g., `@company.com`)
- [ ] Results are paginated
EOF
)"
```

### Link issues to PRs

```bash
# Close an issue via commit message (use any of these keywords)
git commit -m "fix: deduplicate search results

Closes #42"
# Keywords: Closes, Fixes, Resolves (case-insensitive)

# Close an issue via PR body
gh pr create --title "Fix duplicate search" --body "Fixes #42"

# Reference an issue without closing it
git commit -m "refactor: optimize search query

Related to #42"
```

### Search and manage issues

```bash
# List open issues
gh issue list

# List issues assigned to you
gh issue list --assignee "@me"

# Search issues by keyword
gh issue list --search "search duplicates"

# List issues with a specific label
gh issue list --label "bug"

# Close an issue
gh issue close 42

# Close with a comment
gh issue close 42 --comment "Fixed in PR #55."

# Reopen an issue
gh issue reopen 42

# Add labels to an issue
gh issue edit 42 --add-label "priority:high"

# View issue details
gh issue view 42
```

## 5. Release Workflow

### Create a release

```bash
# 1. Make sure main is up to date
git checkout main
git pull origin main

# 2. Create an annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: initial stable release"

# 3. Push the tag
git push origin v1.0.0

# 4. Create a GitHub release from the tag
gh release create v1.0.0 --title "v1.0.0" --notes "Initial stable release."

# Auto-generate release notes from merged PRs and commits
gh release create v1.0.0 --generate-notes

# Create a release with custom notes AND auto-generated changelog
gh release create v1.0.0 --generate-notes --notes "## Highlights
- User search feature
- Performance improvements"

# Create a pre-release (beta, rc, etc.)
gh release create v2.0.0-beta.1 --prerelease --title "v2.0.0 Beta 1" --generate-notes

# Create a draft release (not visible to users until published)
gh release create v1.1.0 --draft --generate-notes
```

### Upload assets to a release

```bash
# Upload build artifacts
gh release upload v1.0.0 dist/app-linux-amd64 dist/app-darwin-amd64

# Upload with custom labels
gh release upload v1.0.0 dist/app.zip#"Application (zip)" dist/app.tar.gz#"Application (tar.gz)"
```

### Manage releases

```bash
# List releases
gh release list

# View a specific release
gh release view v1.0.0

# Delete a release (keeps the git tag)
gh release delete v1.0.0

# Delete the tag too
gh release delete v1.0.0 --cleanup-tag

# Edit release notes
gh release edit v1.0.0 --notes "Updated release notes."
```

## 6. CI/CD Monitoring

### View workflow runs

```bash
# List recent workflow runs
gh run list

# List runs for a specific workflow
gh run list --workflow ci.yml

# List only failed runs
gh run list --status failure

# List runs on a specific branch
gh run list --branch main
```

### Inspect a run

```bash
# View details of a specific run
gh run view 12345

# View logs for a failed run
gh run view 12345 --log-failed

# View full logs
gh run view 12345 --log

# Watch a running workflow in real time
gh run watch 12345

# Watch the latest run on the current branch
gh run watch
```

### Re-run workflows

```bash
# Re-run all jobs in a failed workflow
gh run rerun 12345

# Re-run only the failed jobs (faster)
gh run rerun 12345 --failed

# Trigger a workflow manually (workflow_dispatch)
gh workflow run ci.yml

# Trigger with inputs
gh workflow run deploy.yml -f environment=staging -f version=v1.0.0
```

### List and manage workflows

```bash
# List all workflows
gh workflow list

# View a specific workflow
gh workflow view ci.yml

# Disable a workflow
gh workflow disable ci.yml

# Enable a workflow
gh workflow enable ci.yml
```

## 7. Repository Management

### Clone and fork

```bash
# Clone a repository
gh repo clone owner/repo

# Clone and cd into it
gh repo clone owner/repo && cd repo

# Fork a repository (creates fork under your account)
gh repo fork owner/repo

# Fork and clone in one step
gh repo fork owner/repo --clone
```

### Sync a fork

```bash
# Sync your fork's default branch with upstream
gh repo sync owner/my-fork

# Sync from within the fork's local clone
gh repo sync --branch main
```

### Create a repository

```bash
# Create a new public repo
gh repo create my-project --public --description "My new project"

# Create from an existing local directory
cd my-project
git init
gh repo create --source . --public --push

# Create a private repo with a README
gh repo create my-project --private --add-readme
```

### Manage secrets and variables

```bash
# Set a repository secret (for GitHub Actions)
gh secret set API_KEY --body "sk-abc123"

# Set a secret from a file
gh secret set DEPLOY_KEY < deploy_key.pem

# List secrets
gh secret list

# Delete a secret
gh secret delete API_KEY

# Set a repository variable
gh variable set ENVIRONMENT --body "production"

# List variables
gh variable list
```

## 8. Structured Output for Agents

Use `--json` and `--jq` to get machine-readable output. This is critical for agents that need to parse results programmatically.

### PR queries

```bash
# List PRs as JSON with specific fields
gh pr list --json number,title,state,author,createdAt

# Get just PR numbers and titles
gh pr list --json number,title --jq '.[] | "\(.number): \(.title)"'

# Get the URL of the most recent PR
gh pr list --json url --jq '.[0].url'

# Check if a specific PR is mergeable
gh pr view 123 --json mergeable --jq '.mergeable'

# Get the CI status of a PR
gh pr view 123 --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.status) \(.conclusion)"'
```

### Issue queries

```bash
# List issues as JSON
gh issue list --json number,title,labels,assignees

# Get issues with a specific label
gh issue list --label "bug" --json number,title --jq '.[] | "#\(.number) \(.title)"'

# Count open issues by label
gh issue list --json labels --jq '[.[].labels[].name] | group_by(.) | map({label: .[0], count: length}) | sort_by(.count) | reverse'
```

### Using `gh api` for custom queries

```bash
# Get repository info
gh api repos/owner/repo --jq '.stargazers_count'

# Get PR comments
gh api repos/owner/repo/pulls/123/comments --jq '.[] | "\(.user.login): \(.body)"'

# Get PR review comments (inline code comments)
gh api repos/owner/repo/pulls/123/reviews --jq '.[] | "\(.user.login) \(.state): \(.body)"'

# List repository collaborators
gh api repos/owner/repo/collaborators --jq '.[].login'

# Get the latest release version
gh api repos/owner/repo/releases/latest --jq '.tag_name'

# Paginate through all issues (handles pagination automatically)
gh api --paginate repos/owner/repo/issues --jq '.[].title'

# GraphQL query for more complex data
gh api graphql -f query='
  query {
    repository(owner: "owner", name: "repo") {
      pullRequests(first: 5, states: OPEN) {
        nodes { number title additions deletions }
      }
    }
  }
' --jq '.data.repository.pullRequests.nodes[] | "#\(.number) \(.title) (+\(.additions)/-\(.deletions))"'
```

## 9. Danger Zone (with Safeguards)

These operations are destructive. Always confirm with the user before executing them.

### Force push

```bash
# Force push — OVERWRITES remote history. Only use on YOUR feature branch, NEVER on main/master.
# WHY: After an interactive rebase or amend on a branch only you work on.
git push --force-with-lease origin feat/my-branch
```

**Use `--force-with-lease` instead of `--force`.** It refuses to push if someone else has pushed to the branch since your last fetch, preventing you from overwriting their work.

**NEVER force push to `main` or `master`.** This rewrites shared history and can cause data loss for the entire team. If you must, warn the user explicitly and get confirmation.

### Branch deletion

```bash
# Delete a local branch (safe — refuses if unmerged)
git branch -d feat/old-branch

# Delete a local branch (force — even if unmerged, DESTRUCTIVE)
git branch -D feat/old-branch

# Delete a remote branch
git push origin --delete feat/old-branch
```

**When to delete branches:** After a PR is merged. Most teams delete feature branches post-merge to keep the branch list clean. `gh pr merge --delete-branch` does this automatically.

### Close PR without merging

```bash
# Close a PR — the changes are NOT merged
gh pr close 123

# Close with a comment explaining why
gh pr close 123 --comment "Superseded by #130 which takes a different approach."
```

### Discard local changes

```bash
# Discard changes to a specific file (DESTRUCTIVE — cannot be undone)
git checkout -- src/file.ts

# Discard ALL unstaged changes (DESTRUCTIVE)
git checkout -- .

# Reset staged changes (keeps the file modifications, just unstages)
git reset HEAD src/file.ts

# Hard reset to match remote (DESTRUCTIVE — loses all local commits and changes)
git reset --hard origin/main
```

**Always prefer targeted operations** (`git checkout -- specific-file.ts`) over blanket resets. Ask the user before running any destructive command.

## 10. Common Git Operations

### Stash

Temporarily shelve changes to work on something else.

```bash
# Stash current changes
git stash

# Stash with a description (recommended — easier to find later)
git stash push -m "WIP: search pagination"

# Stash including untracked files
git stash push -u -m "WIP: includes new files"

# List stashes
git stash list

# Apply the most recent stash (keeps it in the stash list)
git stash apply

# Apply and remove from stash list
git stash pop

# Apply a specific stash
git stash apply stash@{2}

# Drop a specific stash
git stash drop stash@{0}
```

### Rebase

Replay commits on top of another branch. Use to keep a feature branch up to date with main.

```bash
# Rebase current branch onto main (replays your commits on top of latest main)
git fetch origin
git rebase origin/main

# If conflicts arise during rebase:
# 1. Fix the conflicts in the files
# 2. Stage the resolved files
git add src/conflicted-file.ts
# 3. Continue the rebase
git rebase --continue
# Or abort if you want to undo the rebase entirely
git rebase --abort
```

**Why rebase instead of merge?** Rebase produces a linear history without merge commits, making `git log` cleaner. Use it on feature branches before merging. Never rebase commits that have been pushed to a shared branch.

### Cherry-pick

Apply a specific commit from another branch.

```bash
# Apply a single commit to the current branch
git cherry-pick abc1234

# Cherry-pick without committing (stage the changes only)
git cherry-pick --no-commit abc1234

# Cherry-pick a range of commits
git cherry-pick abc1234..def5678
```

**When to cherry-pick:** Hotfixing — apply a bug fix from a feature branch directly to main without merging the entire branch.

### Bisect

Binary search through commits to find which one introduced a bug.

```bash
# Start bisecting
git bisect start

# Mark the current commit as bad (has the bug)
git bisect bad

# Mark a known good commit (before the bug existed)
git bisect good v1.0.0

# Git checks out a middle commit. Test it, then mark:
git bisect good   # if this commit doesn't have the bug
git bisect bad    # if this commit has the bug

# Repeat until git identifies the first bad commit.

# When done, reset to your original branch
git bisect reset
```

### Blame and log

```bash
# Show who last modified each line in a file
git blame src/search.ts

# Blame a specific line range
git blame -L 10,20 src/search.ts

# Log with a compact one-line format
git log --oneline -20

# Log with graph visualization
git log --oneline --graph --all -20

# Log commits that changed a specific file
git log --oneline -- src/search.ts

# Log commits by a specific author
git log --oneline --author="alice"

# Search commit messages
git log --oneline --grep="fix.*search"

# Show what changed in each commit (patch format)
git log -p -3

# Show stats (files changed, insertions, deletions)
git log --stat -5

# Find commits that added or removed a specific string
git log -S "searchUsers" --oneline
```

### Diff

```bash
# Show unstaged changes
git diff

# Show staged changes (what will be committed)
git diff --staged

# Diff between two branches
git diff main..feat/search

# Diff with stats only (summary of changes)
git diff --stat main..feat/search

# Diff a specific file
git diff main..feat/search -- src/search.ts
```
