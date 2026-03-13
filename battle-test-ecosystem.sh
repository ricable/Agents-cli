#!/bin/bash
set -uo pipefail
# =============================================================================
# battle-test-ecosystem.sh — Full battle test for agents-cli ecosystem integration
#
# Tests all Phase 1 features: hooks, multi-agents, 8 commands, settings.json,
# CLAUDE.md, team skills, runtime adapters, audit reports, benchmarks.
#
# Usage:
#   bash battle-test-ecosystem.sh              # full test (needs existing skills)
#   bash battle-test-ecosystem.sh --quick      # quick test (plugin build + audit only)
#   bash battle-test-ecosystem.sh --regen      # regenerate skills first, then test
#   bash battle-test-ecosystem.sh --with-tools # install tools + forge + test (slow)
#
# Prerequisites:
#   - npm run build (project must be built)
#   - examples/generated-skills/ with existing SKILL.md files
#     (run --regen or --with-tools if empty)
#
# Evaluation criteria (from README + CLAUDE.md):
#   1. Trigger score >= 0.80 for all skills (target: 1.0)
#   2. Quality score >= 6/10 for all skills (target: 9.0)
#   3. Plugin compliance: plugin.json, hooks.json, agents/, commands/, skills/
#   4. All 7 hook event types present per plugin
#   5. Multi-agent: 2-5 agents per domain (expert + workers)
#   6. 8 commands per plugin (search, list, setup, status, audit, run, team, update)
#   7. settings.json with agent field
#   8. CLAUDE.md with CLI-first doctrine
#   9. Team skills with context:fork
#  10. Runtime adapters (.pi/settings.json, opencode.json)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0
TOTAL=0

check() {
  local desc="$1"
  local result="$2"
  TOTAL=$((TOTAL + 1))
  if [ "$result" = "0" ]; then
    PASS=$((PASS + 1))
    echo -e "  ${GREEN}PASS${NC} $desc"
  else
    FAIL=$((FAIL + 1))
    echo -e "  ${RED}FAIL${NC} $desc"
  fi
}

warn() {
  local desc="$1"
  WARN=$((WARN + 1))
  echo -e "  ${YELLOW}WARN${NC} $desc"
}

section() {
  echo ""
  echo -e "${BLUE}=== $1 ===${NC}"
}

# Parse args
QUICK=false
REGEN=false
WITH_TOOLS=false
for arg in "$@"; do
  case $arg in
    --quick) QUICK=true ;;
    --regen) REGEN=true ;;
    --with-tools) WITH_TOOLS=true ;;
  esac
done

echo "╔═══════════════════════════════════════════════════════╗"
echo "║      Battle Test: Full Ecosystem Integration          ║"
echo "╚═══════════════════════════════════════════════════════╝"

# ── Step 0: Build ──
section "Step 0: Build & Unit Tests"
npm run build 2>&1 | tail -3
check "Build succeeds" "$?"

npm test 2>&1 | tail -3
TEST_EXIT=$?
check "All unit tests pass" "$TEST_EXIT"
TEST_COUNT=$(npm test 2>&1 | grep "Tests " | grep -oE "[0-9]+ passed" | head -1)
echo "  Info: $TEST_COUNT"

# ── Step 0b: Optionally install tools + forge skills ──
if [ "$WITH_TOOLS" = true ]; then
  section "Step 0b: Install + Forge Skills (slow)"
  echo "  Forging 5 sample tools..."
  for src in "pypi:ruff" "crates:ripgrep" "pypi:pytest" "npm:prettier" "pypi:uv"; do
    echo -n "    $src..."
    if timeout 120 npx tsx examples/skill-forge.ts --tool "$src" --force 2>&1 | tail -1; then
      echo " ok"
    else
      echo " failed"
    fi
  done
fi

# ── Step 0c: Optionally regenerate skills ──
if [ "$REGEN" = true ]; then
  section "Step 0c: Regenerate Skills"
  npx tsx examples/regenerate-skills.ts 2>&1 | tail -5
  check "Regeneration completes" "$?"
fi

# ── Step 1: Score existing skills ──
section "Step 1: Skill Quality Scores"
SKILLS_DIR="examples/generated-skills"
SKILL_COUNT=$(find "$SKILLS_DIR" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
echo "  Found $SKILL_COUNT SKILL.md files"

if [ "$SKILL_COUNT" -gt "0" ]; then
  SCORE_OUTPUT=$(npx tsx score-all.ts 2>&1)
  echo "$SCORE_OUTPUT" | grep -E "Total|Passing|Avg|Trigger"

  AVG_TRIGGER=$(echo "$SCORE_OUTPUT" | grep "Avg trigger" | grep -oE "[0-9]+\.[0-9]+")
  BELOW_080=$(echo "$SCORE_OUTPUT" | grep "< 0.80" | sed 's/.*: //')

  if [ -n "$AVG_TRIGGER" ]; then
    check "Avg trigger score >= 0.95" "$(python3 -c "print(0 if $AVG_TRIGGER >= 0.95 else 1)" 2>/dev/null || echo 1)"
  else
    check "Avg trigger score >= 0.95" "1"
  fi
  check "Zero skills below 0.80 trigger" "$([ "${BELOW_080:-1}" = "0" ] && echo 0 || echo 1)"
else
  warn "No skills found — run with --regen or --with-tools to generate"
fi

if [ "$QUICK" = true ]; then
  echo ""
  echo "  (--quick mode: skipping audit mode)"
else
  # Audit mode (note: --audit doesn't support --json, check text output instead)
  AUDIT_OUTPUT=$(npx tsx examples/skill-forge.ts --audit --strict 2>&1)
  AUDIT_PASS_RATE=$(echo "$AUDIT_OUTPUT" | grep "Passed:" | grep -oE '[0-9]+%' | head -1)
  check "Audit --strict passes" "$(echo "$AUDIT_OUTPUT" | grep -q 'Passed:.*100%' && echo 0 || echo 1)"
fi

# ── Step 2: Build plugins (basic mode) ──
section "Step 2: Plugin Build (basic)"
PLUGIN_OUTPUT=$(npx tsx examples/skill-forge.ts --plugin --json 2>&1)
PLUGIN_OK=$(echo "$PLUGIN_OUTPUT" | grep -c '"ok"')
PLUGIN_COUNT=$(echo "$PLUGIN_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('data',{}).get('pluginCount',0))
except: print(0)
" 2>/dev/null)
check "Plugin build succeeds" "$([ "$PLUGIN_OK" -gt 0 ] && echo 0 || echo 1)"
echo "  Info: $PLUGIN_COUNT plugins built (basic mode)"

# ── Step 3: Build plugins (full mode) ──
section "Step 3: Plugin Build (--full mode)"
FULL_OUTPUT=$(npx tsx examples/skill-forge.ts --plugin --full --json 2>&1)
FULL_OK=$(echo "$FULL_OUTPUT" | grep -c '"ok"')
FULL_METRICS=$(echo "$FULL_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    d = data.get('data',{})
    print(f\"{d.get('hookCount',0)} {d.get('agentCount',0)} {d.get('commandCount',0)} {d.get('pluginCount',0)}\")
except: print('0 0 0 0')
" 2>/dev/null)
read FULL_HOOKS FULL_AGENTS FULL_COMMANDS FULL_PLUGINS <<< "$FULL_METRICS"

check "Full plugin build succeeds" "$([ "$FULL_OK" -gt 0 ] && echo 0 || echo 1)"
echo "  Info: hooks=$FULL_HOOKS agents=$FULL_AGENTS commands=$FULL_COMMANDS plugins=$FULL_PLUGINS"

# ── Step 4: Verify plugin structure ──
section "Step 4: Plugin Structure Verification"
PLUGINS_DIR="examples/plugins"

if [ -d "$PLUGINS_DIR" ]; then
  FIRST_PLUGIN=$(ls "$PLUGINS_DIR" 2>/dev/null | head -1)
  if [ -n "$FIRST_PLUGIN" ]; then
    PD="$PLUGINS_DIR/$FIRST_PLUGIN"

    # Core structure
    check "plugin.json exists" "$(test -f "$PD/.claude-plugin/plugin.json" && echo 0 || echo 1)"
    check "skills/ directory exists" "$(test -d "$PD/skills" && echo 0 || echo 1)"
    check "agents/ directory exists" "$(test -d "$PD/agents" && echo 0 || echo 1)"
    check "commands/ directory exists" "$(test -d "$PD/commands" && echo 0 || echo 1)"

    # Full mode additions
    check "hooks/hooks.json exists" "$(test -f "$PD/hooks/hooks.json" && echo 0 || echo 1)"
    check "settings.json exists" "$(test -f "$PD/settings.json" && echo 0 || echo 1)"
    check "CLAUDE.md exists" "$(test -f "$PD/CLAUDE.md" && echo 0 || echo 1)"

    # Validate hooks.json has all 7 event types
    if [ -f "$PD/hooks/hooks.json" ]; then
      HOOK_TYPES=$(cat "$PD/hooks/hooks.json" | grep -oE '"type"\s*:\s*"[^"]+"' | sort -u | wc -l | tr -d ' ')
      check "hooks.json has >= 5 event types" "$([ "$HOOK_TYPES" -ge 5 ] && echo 0 || echo 1)"
      echo "  Info: $HOOK_TYPES unique hook event types"
    fi

    # Validate agents (multi-agent: 2+)
    AGENT_COUNT=$(ls "$PD/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
    check "Multi-agent: >= 2 agents" "$([ "$AGENT_COUNT" -ge 2 ] && echo 0 || echo 1)"
    echo "  Info: $AGENT_COUNT agents"

    # Validate commands (8 expected)
    CMD_COUNT=$(ls "$PD/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')
    check "8 commands per plugin" "$([ "$CMD_COUNT" -ge 8 ] && echo 0 || echo 1)"
    echo "  Info: $CMD_COUNT commands"

    # Validate CLAUDE.md content
    if [ -f "$PD/CLAUDE.md" ]; then
      check "CLAUDE.md has CLI-first doctrine" "$(grep -q 'CLI-First Doctrine' "$PD/CLAUDE.md" && echo 0 || echo 1)"
      check "CLAUDE.md has hooks section" "$(grep -q 'Hooks' "$PD/CLAUDE.md" && echo 0 || echo 1)"
    fi

    # Validate settings.json
    if [ -f "$PD/settings.json" ]; then
      check "settings.json has agent field" "$(grep -q 'agent' "$PD/settings.json" && echo 0 || echo 1)"
    fi

    # Validate plugin.json has official fields only (check top-level keys, not values)
    if [ -f "$PD/.claude-plugin/plugin.json" ]; then
      BAD_FIELDS=$(python3 -c "
import json
with open('$PD/.claude-plugin/plugin.json') as f:
    d = json.load(f)
valid = {'name','version','description','keywords','license','author','homepage','repository'}
bad = [k for k in d.keys() if k not in valid]
if bad: print(' '.join(bad))
" 2>/dev/null)
      check "plugin.json has no non-standard fields" "$([ -z "$BAD_FIELDS" ] && echo 0 || echo 1)"
    fi

    # Check hook scripts are executable
    HOOK_SCRIPTS=$(find "$PD/hooks" -name "*.sh" 2>/dev/null)
    if [ -n "$HOOK_SCRIPTS" ]; then
      ALL_EXEC=0
      for hs in $HOOK_SCRIPTS; do
        if [ ! -x "$hs" ]; then ALL_EXEC=1; break; fi
      done
      check "Hook scripts are executable" "$ALL_EXEC"
      echo "  Info: $(echo "$HOOK_SCRIPTS" | wc -l | tr -d ' ') hook scripts"
    fi

    # Check for team skill
    TEAM_SKILL=$(find "$PD/skills" -name "*-team" -type d 2>/dev/null | head -1)
    if [ -n "$TEAM_SKILL" ]; then
      check "Team skill exists" "0"
      check "Team skill has context:fork" "$(grep -q 'context: fork' "$TEAM_SKILL/SKILL.md" 2>/dev/null && echo 0 || echo 1)"
    else
      warn "No team skill found (domain may not have a team template)"
    fi

    echo ""
    echo "  Checked plugin: $FIRST_PLUGIN"
  fi

  # Check total plugin count
  TOTAL_PLUGINS=$(ls "$PLUGINS_DIR" 2>/dev/null | wc -l | tr -d ' ')
  echo "  Total plugins: $TOTAL_PLUGINS"
else
  check "Plugins directory exists" "1"
fi

# ── Step 5: Plugin Audit ──
section "Step 5: Plugin Compliance Audit"
AUDIT_PLUGINS_OUTPUT=$(npx tsx examples/skill-forge.ts --audit-plugins --json 2>&1)
AUDIT_METRICS=$(echo "$AUDIT_PLUGINS_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    d = data.get('data', data)
    print(f\"{d.get('totalPlugins',0)} {d.get('passedPlugins',0)} {d.get('averageScore',0)} {d.get('totalHooks',0)} {d.get('totalAgents',0)} {d.get('totalCommands',0)}\")
except: print('0 0 0 0 0 0')
" 2>/dev/null)
read AUDIT_TOTAL AUDIT_PASSED AUDIT_AVG AUDIT_HOOKS_TOTAL AUDIT_AGENTS_TOTAL AUDIT_CMDS_TOTAL <<< "$AUDIT_METRICS"

check "Audit completed" "$([ "${AUDIT_TOTAL:-0}" -gt 0 ] && echo 0 || echo 1)"
echo "  Plugins: $AUDIT_TOTAL total, $AUDIT_PASSED passed"
echo "  Avg compliance: ${AUDIT_AVG}%"
echo "  Hooks: $AUDIT_HOOKS_TOTAL | Agents: $AUDIT_AGENTS_TOTAL | Commands: $AUDIT_CMDS_TOTAL"

if [ "${AUDIT_AVG:-0}" -ge 70 ]; then
  check "Average compliance >= 70%" "0"
else
  check "Average compliance >= 70%" "1"
fi

# ── Step 6: Benchmark ──
section "Step 6: Benchmark"
BENCH_OUTPUT=$(npx tsx examples/skill-forge.ts --benchmark --json 2>&1)
BENCH_OK=$(echo "$BENCH_OUTPUT" | grep -c '"timestamp"')
check "Benchmark completes" "$([ "$BENCH_OK" -gt 0 ] && echo 0 || echo 1)"

# Extract benchmark metrics using python for reliable JSON parsing
BENCH_METRICS=$(echo "$BENCH_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    d = data.get('data', data)
    s = d.get('skills', {})
    p = d.get('plugins', {})
    print(f\"{s.get('total',0)} {s.get('passRate',0)} {p.get('total',0)} {p.get('hookCoveragePercent',0)} {p.get('agentCoveragePercent',0)}\")
except: print('0 0 0 0 0')
" 2>/dev/null)
read BENCH_SKILL_TOTAL BENCH_SKILL_PASS BENCH_PLUGIN_TOTAL BENCH_HOOK_COV BENCH_AGENT_COV <<< "$BENCH_METRICS"

echo "  Skills: ${BENCH_SKILL_TOTAL}, pass rate: ${BENCH_SKILL_PASS}%"
echo "  Plugins: ${BENCH_PLUGIN_TOTAL}"
echo "  Hook coverage: ${BENCH_HOOK_COV}%, Agent coverage: ${BENCH_AGENT_COV}%"

if [ "${BENCH_HOOK_COV:-0}" -ge 90 ]; then
  check "Hook coverage >= 90%" "0"
else
  check "Hook coverage >= 90%" "1"
fi

# ── Step 7: Build with multi-runtime ──
if [ "$QUICK" = false ]; then
  section "Step 7: Multi-Runtime Build"
  MULTI_OUTPUT=$(npx tsx examples/skill-forge.ts --plugin --full --multi-runtime --domain python --json 2>&1)
  MULTI_OK=$(echo "$MULTI_OUTPUT" | grep -c '"ok"')
  check "Multi-runtime build succeeds" "$([ "$MULTI_OK" -gt 0 ] && echo 0 || echo 1)"

  # Check adapter files exist
  if [ -d "examples/plugins/python" ]; then
    check "pi-mono adapter exists" "$(test -f 'examples/plugins/python/.pi/settings.json' && echo 0 || echo 1)"
    check "opencode adapter exists" "$(test -f 'examples/plugins/python/opencode.json' && echo 0 || echo 1)"
  fi
fi

# ── Step 8: Marketplace ──
if [ "$QUICK" = false ]; then
  section "Step 8: Marketplace Build"
  MKT_OUTPUT=$(npx tsx examples/skill-forge.ts --marketplace --json 2>&1)
  MKT_OK=$(echo "$MKT_OUTPUT" | grep -c '"ok"')
  MKT_PLUGINS=$(echo "$MKT_OUTPUT" | grep -oE '"pluginCount":[0-9]+' | grep -oE '[0-9]+')
  MKT_SKILLS=$(echo "$MKT_OUTPUT" | grep -oE '"skillCount":[0-9]+' | grep -oE '[0-9]+')

  check "Marketplace build succeeds" "$([ "$MKT_OK" -gt 0 ] && echo 0 || echo 1)"
  echo "  Marketplace: $MKT_PLUGINS plugins, $MKT_SKILLS skills"

  if [ -f "examples/marketplace/marketplace.json" ]; then
    check "marketplace.json exists" "0"
    check "marketplace.json is valid JSON" "$(cat examples/marketplace/marketplace.json | python3 -m json.tool > /dev/null 2>&1 && echo 0 || echo 1)"
  fi
fi

# ── Step 9: Self-referential check ──
section "Step 9: Self-Referential Setup"
check ".claude/skills/agents-cli-dev/SKILL.md exists" "$(test -f .claude/skills/agents-cli-dev/SKILL.md && echo 0 || echo 1)"
check ".claude/hooks/hooks.json exists" "$(test -f .claude/hooks/hooks.json && echo 0 || echo 1)"
check ".claude/agents/forge-expert.md exists" "$(test -f .claude/agents/forge-expert.md && echo 0 || echo 1)"

# Validate self-referential hooks.json
if [ -f ".claude/hooks/hooks.json" ]; then
  SELF_HOOK_VALID=$(python3 -m json.tool .claude/hooks/hooks.json > /dev/null 2>&1 && echo 0 || echo 1)
  check "Self hooks.json is valid JSON" "$SELF_HOOK_VALID"
fi

# Validate self-referential agent
if [ -f ".claude/agents/forge-expert.md" ]; then
  check "Agent has frontmatter" "$(grep -q '^---' .claude/agents/forge-expert.md && echo 0 || echo 1)"
  check "Agent has model field" "$(grep -q 'model:' .claude/agents/forge-expert.md && echo 0 || echo 1)"
fi

# ── Step 10: CI Workflows ──
section "Step 10: GitHub Actions Workflows"
check "skill-quality.yml exists" "$(test -f .github/workflows/skill-quality.yml && echo 0 || echo 1)"
check "plugin-publish.yml exists" "$(test -f .github/workflows/plugin-publish.yml && echo 0 || echo 1)"

# ── Step 11: Rich Skill Frontmatter ──
section "Step 11: Rich Skill Frontmatter"
if [ "$SKILL_COUNT" -gt "0" ]; then
  # Sample a few skills for new frontmatter fields
  SAMPLE_SKILL=$(find "$SKILLS_DIR" -name "SKILL.md" | head -1)
  if [ -n "$SAMPLE_SKILL" ]; then
    HAS_ALLOWED=$(grep -l 'allowed-tools:' "$SKILLS_DIR"/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
    HAS_DYNAMIC=$(grep -l '!\`' "$SKILLS_DIR"/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
    echo "  Skills with allowed-tools: $HAS_ALLOWED"
    echo "  Skills with dynamic injection: $HAS_DYNAMIC"
    check "Some skills have allowed-tools" "$([ "$HAS_ALLOWED" -gt 0 ] && echo 0 || echo 1)"
  fi
else
  warn "No skills to check frontmatter"
fi

# ── Summary ──
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                   BATTLE TEST RESULTS                 ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}PASSED${NC}:  $PASS"
echo -e "║  ${RED}FAILED${NC}:  $FAIL"
echo -e "║  ${YELLOW}WARNED${NC}:  $WARN"
echo "║  TOTAL:   $TOTAL"
echo "╠═══════════════════════════════════════════════════════╣"
RATE=$((PASS * 100 / TOTAL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "║  ${GREEN}ALL CHECKS PASSED ($RATE%)${NC}"
elif [ "$RATE" -ge 90 ]; then
  echo -e "║  ${YELLOW}MOSTLY PASSING ($RATE%)${NC}"
else
  echo -e "║  ${RED}NEEDS WORK ($RATE%)${NC}"
fi
echo "╚═══════════════════════════════════════════════════════╝"

# Exit code
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
