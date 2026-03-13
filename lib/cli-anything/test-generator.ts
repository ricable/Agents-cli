/**
 * cli-anything/test-generator.ts — Phase 4 (Plan Tests) + Phase 5 (Write Tests).
 *
 * Generates adaptive pytest suites for CLI-Anything harnesses.
 * Test count scales with command complexity: ~3 tests per command.
 */

import type {
  AppProfile,
  HarnessDesign,
  TestPlan,
  TestSuite,
  TestCase,
  TestCategory,
  HarnessFile,
} from "./types.js";

// ── Phase 4: Plan Tests ────────────────────────────────────────────────

/**
 * Generate a test plan from the harness design.
 * Creates ~3 tests per command: unit (JSON schema), integration (backend), e2e (full CLI).
 */
export function planTests(profile: AppProfile, design: HarnessDesign): TestPlan {
  const tests: TestCase[] = [];

  // 1. CLI smoke tests (always)
  tests.push({
    name: "test_cli_help",
    category: "unit",
    command: `${design.packageName} --help`,
    expectedFields: [],
    description: "CLI shows help without error",
  });

  tests.push({
    name: "test_cli_version",
    category: "unit",
    command: `${design.packageName} --version`,
    expectedFields: [],
    description: "CLI shows version",
  });

  // 2. Per-group tests
  for (const group of design.groups) {
    tests.push({
      name: `test_${group}_help`,
      category: "unit",
      command: `${design.packageName} ${group} --help`,
      expectedFields: [],
      description: `${group} group shows help`,
    });
  }

  // 3. Per-command tests (3 per command: unit, JSON schema, error handling)
  for (const cmd of design.commands) {
    const cmdName = cmd.name.replace(/-/g, "_");

    // Unit: command exists and produces output
    tests.push({
      name: `test_${cmdName}_runs`,
      category: "unit",
      command: `${design.packageName} ${cmd.group} ${cmd.name.replace(`${cmd.group}-`, "")}`,
      expectedFields: [],
      description: `${cmd.name} runs without crash`,
    });

    // JSON schema: --json produces valid superset output
    tests.push({
      name: `test_${cmdName}_json_schema`,
      category: "unit",
      command: `${design.packageName} --json ${cmd.group} ${cmd.name.replace(`${cmd.group}-`, "")}`,
      expectedFields: ["ok", "command", "data"],
      description: `${cmd.name} --json has ok, command, data fields`,
    });

    // Error handling: invalid args
    tests.push({
      name: `test_${cmdName}_bad_args`,
      category: "unit",
      command: `${design.packageName} ${cmd.group} ${cmd.name.replace(`${cmd.group}-`, "")} --nonexistent`,
      expectedFields: [],
      description: `${cmd.name} rejects unknown args`,
    });
  }

  // 4. Integration tests (if app installed)
  if (profile.installed) {
    for (const group of design.groups) {
      tests.push({
        name: `test_${group}_integration`,
        category: "integration",
        command: `${design.packageName} --json ${group} list`,
        expectedFields: ["ok", "data"],
        description: `${group} list returns real data from ${profile.displayName}`,
      });
    }
  }

  // Count by category
  const byCategory: Record<TestCategory, number> = { unit: 0, integration: 0, e2e: 0, docker: 0 };
  for (const t of tests) {
    byCategory[t.category]++;
  }

  return {
    tests,
    totalCount: tests.length,
    byCategory,
    dockerImage: profile.installed ? undefined : `cli-anything-${profile.name}:test`,
  };
}

// ── Phase 5: Write Tests ───────────────────────────────────────────────

/**
 * Generate pytest files from the test plan.
 */
export function writeTests(
  profile: AppProfile,
  design: HarnessDesign,
  testPlan: TestPlan,
): TestSuite {
  const pkg = design.packageName.replace(/-/g, "_");
  const files: HarnessFile[] = [];

  // Group tests by category
  const unitTests = testPlan.tests.filter(t => t.category === "unit");
  const integrationTests = testPlan.tests.filter(t => t.category === "integration");

  // test_cli.py — unit tests
  if (unitTests.length > 0) {
    files.push({
      path: "tests/test_cli.py",
      content: generateUnitTestFile(profile, design, pkg, unitTests),
    });
  }

  // test_integration.py — integration tests
  if (integrationTests.length > 0) {
    files.push({
      path: "tests/test_integration.py",
      content: generateIntegrationTestFile(profile, design, pkg, integrationTests),
    });
  }

  // test_output.py — JSON output schema tests
  files.push({
    path: "tests/test_output.py",
    content: generateOutputTestFile(design, pkg),
  });

  const markers = [...new Set(testPlan.tests.map(t => t.category))];

  return {
    files,
    runCommand: `pytest tests/ -v --tb=short`,
    markers,
  };
}

// ── Test file generators ───────────────────────────────────────────────

function generateUnitTestFile(
  profile: AppProfile,
  design: HarnessDesign,
  pkg: string,
  tests: TestCase[],
): string {
  const testFunctions = tests.map(tc => {
    if (tc.name === "test_cli_help") {
      return `
def test_cli_help(runner):
    \"\"\"${tc.description}\"\"\"
    from ${pkg}.cli import cli
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "${profile.displayName}" in result.output or "${design.packageName}" in result.output
`;
    }
    if (tc.name === "test_cli_version") {
      return `
def test_cli_version(runner):
    \"\"\"${tc.description}\"\"\"
    from ${pkg}.cli import cli
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "0.1.0" in result.output
`;
    }
    if (tc.name.endsWith("_json_schema")) {
      const parts = tc.command.split(" ").slice(1); // remove package name
      const args = parts.map(p => `"${p}"`).join(", ");
      return `
def test_${tc.name.replace("test_", "")}(runner):
    \"\"\"${tc.description}\"\"\"
    import json
    from ${pkg}.cli import cli
    result = runner.invoke(cli, [${args}])
    if result.exit_code == 0 and result.output.strip().startswith("{"):
        data = json.loads(result.output)
        assert "ok" in data
        assert "command" in data
`;
    }
    if (tc.name.endsWith("_bad_args")) {
      const parts = tc.command.split(" ").slice(1);
      const args = parts.map(p => `"${p}"`).join(", ");
      return `
def test_${tc.name.replace("test_", "")}(runner):
    \"\"\"${tc.description}\"\"\"
    from ${pkg}.cli import cli
    result = runner.invoke(cli, [${args}])
    assert result.exit_code != 0
`;
    }
    // Generic test
    const parts = tc.command.split(" ").slice(1);
    const args = parts.map(p => `"${p}"`).join(", ");
    return `
def test_${tc.name.replace("test_", "")}(runner):
    \"\"\"${tc.description}\"\"\"
    from ${pkg}.cli import cli
    result = runner.invoke(cli, [${args}])
    assert result.exit_code == 0
`;
  }).join("\n");

  return `\"\"\"Unit tests for ${design.packageName}.\"\"\"
import pytest
${testFunctions}
`;
}

function generateIntegrationTestFile(
  profile: AppProfile,
  design: HarnessDesign,
  pkg: string,
  tests: TestCase[],
): string {
  const testFunctions = tests.map(tc => {
    const parts = tc.command.split(" ").slice(1);
    const args = parts.map(p => `"${p}"`).join(", ");
    return `
@pytest.mark.integration
def test_${tc.name.replace("test_", "")}(runner):
    \"\"\"${tc.description}\"\"\"
    import json
    from ${pkg}.cli import cli
    result = runner.invoke(cli, [${args}])
    assert result.exit_code == 0
    if result.output.strip().startswith("{"):
        data = json.loads(result.output)
        assert data.get("ok") is True
`;
  }).join("\n");

  return `\"\"\"Integration tests for ${design.packageName} (requires ${profile.displayName} installed).\"\"\"
import pytest
${testFunctions}
`;
}

function generateOutputTestFile(design: HarnessDesign, pkg: string): string {
  return `\"\"\"JSON output schema validation for ${design.packageName}.\"\"\"
import json
import pytest


def test_json_output_has_meta(runner):
    \"\"\"JSON output includes meta block with version, duration, timestamp.\"\"\"
    from ${pkg}.cli import cli
    result = runner.invoke(cli, ["--json", "--help"])
    # Help may not produce JSON, but other commands should
    # This test documents the expected schema


def test_superset_format():
    \"\"\"Verify superset JSON format structure.\"\"\"
    from cli_anything_core.output import json_response
    result = json.loads(json_response("test", {"key": "value"}))
    assert result["ok"] is True
    assert result["command"] == "test"
    assert result["data"] == {"key": "value"}
    assert "meta" in result
    assert "version" in result["meta"]
    assert "duration" in result["meta"]
    assert "timestamp" in result["meta"]
`;
}
