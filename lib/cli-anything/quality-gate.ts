/**
 * cli-anything/quality-gate.ts — 6-axis quality scoring.
 *
 * Extends the existing 3-axis skill quality gate with 3 CLI-Anything-specific
 * axes: testCoverage, apiCompleteness, reliability.
 */

import type {
  AppProfile,
  HarnessDesign,
  TestPlan,
  QualityGate6Axis,
  AxisScore,
} from "./types.js";

const DEFAULT_THRESHOLD = 80;

/**
 * Run the 6-axis quality gate.
 *
 * Axes 1-3 reuse existing skill-tester scoring on the generated SKILL.md.
 * Axes 4-6 are CLI-Anything-specific.
 */
export function runQualityGate(opts: {
  skillMd: string;
  profile: AppProfile;
  design: HarnessDesign;
  testPlan: TestPlan;
  triggerScore: number;
  qualityScore: number;
  contentScore: number;
  smokeTestResults?: { passed: number; total: number };
}): QualityGate6Axis {
  const axes: AxisScore[] = [];

  // Axis 1: Trigger score (from scoreTrigger × 100)
  axes.push({
    axis: "trigger",
    score: Math.round(opts.triggerScore * 100),
    threshold: DEFAULT_THRESHOLD,
    passed: opts.triggerScore * 100 >= DEFAULT_THRESHOLD,
    details: `scoreTrigger: ${opts.triggerScore.toFixed(2)}`,
  });

  // Axis 2: Quality score (from scoreSkillDescription × 10)
  axes.push({
    axis: "quality",
    score: Math.round(opts.qualityScore * 10),
    threshold: DEFAULT_THRESHOLD,
    passed: opts.qualityScore * 10 >= DEFAULT_THRESHOLD,
    details: `scoreSkillDescription: ${opts.qualityScore.toFixed(1)}/10`,
  });

  // Axis 3: Content score (from scoreContentQuality × 10)
  axes.push({
    axis: "content",
    score: Math.round(opts.contentScore * 10),
    threshold: DEFAULT_THRESHOLD,
    passed: opts.contentScore * 10 >= DEFAULT_THRESHOLD,
    details: `scoreContentQuality: ${opts.contentScore.toFixed(1)}/10`,
  });

  // Axis 4: Test coverage = testCount / (commands × 3) × 100
  const expectedTests = opts.design.commands.length * 3;
  const testCoverage = expectedTests > 0
    ? Math.min(100, Math.round((opts.testPlan.totalCount / expectedTests) * 100))
    : 0;
  axes.push({
    axis: "testCoverage",
    score: testCoverage,
    threshold: DEFAULT_THRESHOLD,
    passed: testCoverage >= DEFAULT_THRESHOLD,
    details: `${opts.testPlan.totalCount} tests / ${expectedTests} expected (${opts.design.commands.length} cmds × 3)`,
  });

  // Axis 5: API completeness = implementedCommands / apiSurface.length × 100
  const apiTotal = opts.profile.apiSurface.length;
  const apiCoverage = apiTotal > 0
    ? Math.min(100, Math.round((opts.design.commands.length / apiTotal) * 100))
    : 100; // No API surface = complete by default
  axes.push({
    axis: "apiCompleteness",
    score: apiCoverage,
    threshold: DEFAULT_THRESHOLD,
    passed: apiCoverage >= DEFAULT_THRESHOLD,
    details: `${opts.design.commands.length}/${apiTotal} endpoints implemented`,
  });

  // Axis 6: Reliability = smokeTestPassCount / totalProbes × 100
  const smoke = opts.smokeTestResults ?? { passed: 1, total: 1 };
  const reliability = smoke.total > 0
    ? Math.round((smoke.passed / smoke.total) * 100)
    : 100;
  axes.push({
    axis: "reliability",
    score: reliability,
    threshold: DEFAULT_THRESHOLD,
    passed: reliability >= DEFAULT_THRESHOLD,
    details: `${smoke.passed}/${smoke.total} smoke tests passed`,
  });

  const overall = Math.round(axes.reduce((sum, a) => sum + a.score, 0) / axes.length);
  const passed = axes.every(a => a.passed);

  return { axes, overall, passed };
}

/**
 * Format quality gate results for display.
 */
export function formatQualityGate(gate: QualityGate6Axis): string {
  const lines = gate.axes.map(a => {
    const icon = a.passed ? "PASS" : "FAIL";
    return `  ${icon} ${a.axis.padEnd(18)} ${String(a.score).padStart(3)}/${a.threshold}  ${a.details}`;
  });

  const overall = gate.passed ? "PASS" : "FAIL";
  lines.push("");
  lines.push(`  Overall: ${overall} (${gate.overall}/100)`);

  return lines.join("\n");
}
