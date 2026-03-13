/**
 * cli-anything/refine.ts — Gap analysis + iterative improvement.
 *
 * Analyzes an existing harness for:
 * - API coverage gaps (missing endpoints)
 * - Test coverage gaps (missing test categories)
 * - Documentation gaps (missing sections)
 * - Output schema issues (non-conformant JSON)
 * - Reliability issues (smoke test failures)
 */

import type {
  AppProfile,
  HarnessDesign,
  TestPlan,
  DocBundle,
  GapAnalysis,
} from "./types.js";

/**
 * Analyze gaps in an existing harness.
 */
export function analyzeGaps(opts: {
  profile: AppProfile;
  design: HarnessDesign;
  testPlan: TestPlan;
  docs: DocBundle;
}): GapAnalysis {
  const { profile, design, testPlan, docs } = opts;

  // API coverage
  const implementedEndpoints = new Set(design.commands.map(c => c.name));
  const allEndpoints = profile.apiSurface.map(e => e.name.replace(/_/g, "-"));
  const missingApi = allEndpoints.filter(e => !implementedEndpoints.has(e));

  // Test coverage
  const testedCommands = new Set(testPlan.tests.map(t => {
    const parts = t.name.replace("test_", "").replace("_json_schema", "").replace("_bad_args", "").replace("_runs", "");
    return parts;
  }));
  const missingTests = design.commands
    .map(c => c.name.replace(/-/g, "_"))
    .filter(c => !testedCommands.has(c));

  // Doc gaps
  const docGaps: string[] = [];
  if (!docs.readme.includes("## Quick Start")) docGaps.push("Missing Quick Start section");
  if (!docs.readme.includes("## Testing")) docGaps.push("Missing Testing section");
  if (!docs.references["references/commands.md"]) docGaps.push("Missing command reference");
  if (!docs.references["references/examples.md"]) docGaps.push("Missing examples");

  // Output schema issues
  const outputSchemaIssues: string[] = [];
  // Check if all commands mention --json support
  const jsonCommands = design.commands.filter(c => c.returnSchema && "ok" in c.returnSchema);
  if (jsonCommands.length < design.commands.length) {
    outputSchemaIssues.push(`${design.commands.length - jsonCommands.length} commands missing JSON schema`);
  }

  // Reliability issues
  const reliabilityIssues: string[] = [];
  if (!profile.installed) {
    reliabilityIssues.push(`${profile.displayName} not installed — integration tests will skip`);
  }

  // Overall score
  const apiScore = allEndpoints.length > 0 ? (1 - missingApi.length / allEndpoints.length) * 100 : 100;
  const testScore = design.commands.length > 0 ? (1 - missingTests.length / design.commands.length) * 100 : 100;
  const docScore = Math.max(0, 100 - docGaps.length * 25);
  const overallScore = Math.round((apiScore + testScore + docScore) / 3);

  return {
    apiCoverage: {
      covered: allEndpoints.length - missingApi.length,
      total: allEndpoints.length,
      missing: missingApi,
    },
    testCoverage: {
      covered: design.commands.length - missingTests.length,
      total: design.commands.length,
      missing: missingTests,
    },
    docGaps,
    outputSchemaIssues,
    reliabilityIssues,
    overallScore,
  };
}

/**
 * Format gap analysis for console output.
 */
export function formatGapAnalysis(gaps: GapAnalysis): string {
  const lines: string[] = [];

  lines.push(`  API Coverage:  ${gaps.apiCoverage.covered}/${gaps.apiCoverage.total}`);
  if (gaps.apiCoverage.missing.length > 0) {
    lines.push(`    Missing: ${gaps.apiCoverage.missing.slice(0, 5).join(", ")}${gaps.apiCoverage.missing.length > 5 ? ` (+${gaps.apiCoverage.missing.length - 5} more)` : ""}`);
  }

  lines.push(`  Test Coverage: ${gaps.testCoverage.covered}/${gaps.testCoverage.total}`);
  if (gaps.testCoverage.missing.length > 0) {
    lines.push(`    Missing: ${gaps.testCoverage.missing.slice(0, 5).join(", ")}${gaps.testCoverage.missing.length > 5 ? ` (+${gaps.testCoverage.missing.length - 5} more)` : ""}`);
  }

  if (gaps.docGaps.length > 0) {
    lines.push(`  Doc Gaps:      ${gaps.docGaps.join(", ")}`);
  }

  if (gaps.outputSchemaIssues.length > 0) {
    lines.push(`  Schema Issues: ${gaps.outputSchemaIssues.join(", ")}`);
  }

  if (gaps.reliabilityIssues.length > 0) {
    lines.push(`  Reliability:   ${gaps.reliabilityIssues.join(", ")}`);
  }

  lines.push(`  Overall Score: ${gaps.overallScore}/100`);

  return lines.join("\n");
}
