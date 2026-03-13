/**
 * Tests for companion mode: analyzeProject() and mapToTools().
 */

import { describe, it, expect } from "vitest";
import { analyzeProject } from "../lib/companion/analyzer.js";
import { mapToTools } from "../lib/companion/mapper.js";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(".");

// ── analyzeProject ─────────────────────────────────────────────────────

describe("analyzeProject", () => {
  it("detects single-language Python project", () => {
    const profile = analyzeProject("Python FastAPI backend");
    expect(profile.primaryLanguage).toBe("python");
    expect(profile.techs.some(t => t.name === "fastapi")).toBe(true);
    expect(profile.techs.some(t => t.layer === "framework")).toBe(true);
    expect(profile.complexity).toBe("minimal");
  });

  it("detects multi-stack project", () => {
    const profile = analyzeProject("FastAPI + React + PostgreSQL + AWS");
    expect(profile.primaryLanguage).toBe("python");
    expect(profile.techs.some(t => t.name === "fastapi")).toBe(true);
    expect(profile.techs.some(t => t.name === "react")).toBe(true);
    expect(profile.techs.some(t => t.name === "postgresql")).toBe(true);
    expect(profile.techs.some(t => t.name === "aws")).toBe(true);
    // 4 techs across framework, database, infra layers
    expect(["standard", "complex"]).toContain(profile.complexity);
  });

  it("detects minimal Rust project", () => {
    const profile = analyzeProject("Rust CLI tool");
    expect(profile.primaryLanguage).toBe("rust");
    expect(profile.complexity).toBe("minimal");
  });

  it("detects enterprise-level project", () => {
    const profile = analyzeProject(
      "Java Spring Boot + Kafka + Kubernetes + Prometheus + PostgreSQL + GitHub Actions",
    );
    expect(profile.primaryLanguage).toBe("java");
    expect(profile.techs.some(t => t.name === "kafka")).toBe(true);
    expect(profile.techs.some(t => t.name === "kubernetes")).toBe(true);
    expect(profile.techs.some(t => t.name === "prometheus")).toBe(true);
    expect(profile.complexity).toBe("enterprise");
  });

  it("handles ambiguous 'go' keyword gracefully", () => {
    // "go" is too short and ambiguous — "golang" should match explicitly
    const profile = analyzeProject("Golang REST API");
    expect(profile.primaryLanguage).toBe("golang");
  });

  it("handles unknown tech gracefully", () => {
    const profile = analyzeProject("FoobarLang with BarBaz framework");
    expect(profile.techs.length).toBe(0);
    expect(profile.primaryLanguage).toBeNull();
    expect(profile.complexity).toBe("minimal");
  });

  it("handles empty description", () => {
    const profile = analyzeProject("");
    expect(profile.techs.length).toBe(0);
    expect(profile.primaryLanguage).toBeNull();
    expect(profile.complexity).toBe("minimal");
  });

  it("deduplicates variant detections (postgres/postgresql)", () => {
    const profile = analyzeProject("PostgreSQL database with Postgres extensions");
    const pgTechs = profile.techs.filter(t => t.name === "postgresql");
    expect(pgTechs.length).toBe(1);
  });

  it("infers language from framework when not explicit", () => {
    const profile = analyzeProject("Django REST API with Redis cache");
    expect(profile.primaryLanguage).toBe("python");
  });

  it("detects CI/CD layer", () => {
    const profile = analyzeProject("Node.js app with GitHub Actions CI/CD");
    expect(profile.techs.some(t => t.layer === "cicd")).toBe(true);
  });

  it("detects monitoring layer", () => {
    const profile = analyzeProject("Service with Prometheus and Grafana monitoring");
    expect(profile.techs.some(t => t.name === "prometheus")).toBe(true);
    expect(profile.techs.some(t => t.name === "grafana")).toBe(true);
  });
});

// ── mapToTools ──────────────────────────────────────────────────────────

describe("mapToTools", () => {
  it("maps Python project to Python tools", () => {
    const profile = analyzeProject("Python FastAPI backend");
    const plan = mapToTools(profile, PROJECT_ROOT);

    expect(plan.recommendations.length).toBeGreaterThan(0);
    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("uv");
    expect(names).toContain("ruff");
  });

  it("maps TypeScript project to TS tools", () => {
    const profile = analyzeProject("TypeScript Express API");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("tsc");
    expect(names).toContain("biome");
  });

  it("includes universal tools", () => {
    const profile = analyzeProject("Python CLI tool");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("rg");
    expect(names).toContain("jq");
  });

  it("essential tools come first in ordering", () => {
    const profile = analyzeProject("Python FastAPI + PostgreSQL + AWS");
    const plan = mapToTools(profile, PROJECT_ROOT);

    // First tools should be essential
    const firstFew = plan.recommendations.slice(0, 3);
    expect(firstFew.every(r => r.priority === "essential")).toBe(true);
  });

  it("deduplicates tools from multiple triggers", () => {
    // Prisma could be triggered by both database and framework paths
    const profile = analyzeProject("Next.js + PostgreSQL + Prisma");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const prismaDupes = plan.recommendations.filter(r => r.name === "prisma");
    expect(prismaDupes.length).toBeLessThanOrEqual(1);
  });

  it("includes DB tools for database projects", () => {
    const profile = analyzeProject("PostgreSQL backend with Redis cache");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("pgcli");
  });

  it("includes infra tools for cloud projects", () => {
    const profile = analyzeProject("AWS deployment with Docker and Kubernetes");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("aws");
    expect(names).toContain("docker");
    expect(names).toContain("kubectl");
  });

  it("summary counts are correct", () => {
    const profile = analyzeProject("Python FastAPI + PostgreSQL");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const { essential, recommended, optional, total } = plan.summary;
    expect(essential + recommended + optional).toBe(total);
    expect(total).toBe(plan.recommendations.length);
  });

  it("handles empty tech stack", () => {
    const profile = analyzeProject("some random project");
    const plan = mapToTools(profile, PROJECT_ROOT);

    // Should still have universal tools
    expect(plan.recommendations.length).toBeGreaterThan(0);
    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("rg");
  });

  it("includes CI/CD tools when detected", () => {
    const profile = analyzeProject("Node.js with GitHub Actions");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("gh");
  });

  it("maps Rust project to Rust tools", () => {
    const profile = analyzeProject("Rust CLI tool with AWS deployment");
    const plan = mapToTools(profile, PROJECT_ROOT);

    const names = plan.recommendations.map(r => r.name);
    expect(names).toContain("cargo-watch");
    expect(names).toContain("aws");
  });
});
