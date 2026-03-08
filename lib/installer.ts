import type {
  ToolInstaller,
  ToolSource,
  InstallOptions,
  InstallResult,
  SourceFormat,
} from "./types.js";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { createWriteStream, mkdirSync, existsSync, readdirSync, statSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { unlinkSync } from "node:fs";
import { isPrivateUrl, parseGithubOwnerRepo } from "./resolver.js";
import { readPkgJson, walkPackageDirs } from "./pkg-utils.js";
import type { PkgInfo } from "./pkg-utils.js";

const MAX_REDIRECTS = 10;
const MAX_DOWNLOAD_SIZE = 500 * 1024 * 1024; // 500MB for tarballs

/** Download a file following redirects, with SSRF and size protection */
function downloadFile(url: string, dest: string, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`Too many redirects (>${MAX_REDIRECTS}) downloading ${url}`));
      return;
    }
    if (isPrivateUrl(url)) {
      reject(new Error(`Refusing to download from private/internal URL: ${url}`));
      return;
    }
    const getter = url.startsWith("https") ? httpsGet : httpGet;
    getter(url, { headers: { "User-Agent": "agents-cli/0.1.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
          reject(new Error(`Refusing non-HTTP redirect to: ${redirectUrl}`));
          return;
        }
        downloadFile(redirectUrl, dest, redirectCount + 1).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
        return;
      }
      // Check Content-Length if available (NaN-safe)
      const contentLength = parseInt(res.headers["content-length"] ?? "", 10);
      if (!isNaN(contentLength) && contentLength > MAX_DOWNLOAD_SIZE) {
        res.destroy();
        reject(new Error(`Download too large (${contentLength} bytes, max ${MAX_DOWNLOAD_SIZE})`));
        return;
      }
      let received = 0;
      let settled = false;
      const stream = createWriteStream(dest);
      res.on("data", (chunk: Buffer) => {
        if (settled) return;
        received += chunk.length;
        if (received > MAX_DOWNLOAD_SIZE) {
          settled = true;
          res.destroy();
          stream.destroy();
          reject(new Error(`Download exceeded size limit (${MAX_DOWNLOAD_SIZE} bytes)`));
          return;
        }
      });
      res.pipe(stream);
      stream.on("finish", () => { if (!settled) { stream.close(); resolve(dest); } });
      stream.on("error", (err) => { if (!settled) { settled = true; reject(err); } });
      res.on("error", (err) => { if (!settled) { settled = true; reject(err); } });
    }).on("error", reject);
  });
}

/** Find executables in a directory (bin/ or package root) */
function findBinaries(dir: string): string[] {
  const bins: string[] = [];
  const binDir = join(dir, "bin");
  const searchDirs = existsSync(binDir) ? [binDir, dir] : [dir];

  for (const d of searchDirs) {
    if (!existsSync(d)) continue;
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      try {
        const st = statSync(full);
        if (st.isFile()) {
          // Check if it looks like a script or binary
          if (st.mode & 0o111 || /\.(js|ts|py|sh|rb)$/.test(entry) || !entry.includes(".")) {
            if (!/\.(md|txt|json|yaml|yml|lock|map|d\.ts)$/.test(entry)) {
              bins.push(full);
            }
          }
        }
      } catch {
        // skip unreadable
      }
    }
  }
  return bins;
}

/** Make files executable */
function makeExecutable(paths: string[]): void {
  for (const p of paths) {
    try { chmodSync(p, 0o755); } catch { /* ignore */ }
  }
}

/** Output directories that indicate a build already completed */
const BUILD_OUTPUT_DIRS = ["dist", "build", "out"];

/** Try to build a package directory if it has a build script and no output yet */
function tryBuildPkg(pkg: PkgInfo, timeout = 120000): boolean {
  if (!pkg.scripts?.build) return false;

  // Check if build output already exists
  const hasOutput = BUILD_OUTPUT_DIRS.some((d) => {
    const p = join(pkg.dir, d);
    try { return readdirSync(p).length > 0; } catch { return false; }
  });
  if (hasOutput) return false;

  // Install all deps (including devDependencies) for the build
  try {
    execFileSync("npm", ["install", "--ignore-scripts"], {
      cwd: pkg.dir,
      stdio: "pipe",
      timeout,
    });
  } catch {
    return false;
  }

  // Run the build script
  try {
    execFileSync("npm", ["run", "build"], {
      cwd: pkg.dir,
      stdio: "pipe",
      timeout,
    });
    return true;
  } catch {
    return false;
  }
}

/** Check if a project needs a build step and run it — supports monorepos */
function detectAndBuild(dest: string, timeout = 120000): boolean {
  // Try the root package first
  const rootPkg = readPkgJson(dest);
  if (rootPkg && tryBuildPkg(rootPkg, timeout)) return true;

  // Only scan nested packages if root didn't build (monorepo case)
  let built = false;
  walkPackageDirs(dest, (pkg) => {
    if (pkg.bin || pkg.scripts?.build) {
      if (tryBuildPkg(pkg, timeout)) {
        built = true;
      }
    }
  });

  return built;
}

/** Install from GitHub tarball */
async function installFromGithub(
  source: ToolSource,
  dest: string,
): Promise<InstallResult> {
  const start = Date.now();

  // Parse owner/repo using shared parser
  const parsed = parseGithubOwnerRepo(source.uri);
  if (!parsed) {
    throw new Error(`Cannot parse GitHub owner/repo from: ${source.uri}`);
  }
  const { owner, repo } = parsed;
  const ref = source.ref ?? "main";

  // Download tarball
  const tmpFile = join(tmpdir(), `agents-cli-${randomBytes(6).toString("hex")}.tar.gz`);
  const tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${ref}.tar.gz`;

  await downloadFile(tarballUrl, tmpFile);

  // Extract to dest
  mkdirSync(dest, { recursive: true });
  execFileSync("tar", ["-xzf", tmpFile, "--strip-components=1", "-C", dest], { stdio: "pipe" });

  // Clean up tarball
  try { unlinkSync(tmpFile); } catch { /* ignore */ }

  // Find binaries
  const binaries = findBinaries(dest);
  makeExecutable(binaries);

  // Check for package.json — detect if build is needed, otherwise just install production deps
  const pkgJson = join(dest, "package.json");
  if (existsSync(pkgJson)) {
    const didBuild = detectAndBuild(dest);
    if (!didBuild) {
      // No build needed or build failed — just install production deps
      try {
        execFileSync("npm", ["install", "--production", "--ignore-scripts"], {
          cwd: dest,
          stdio: "pipe",
          timeout: 60000,
        });
      } catch { /* best effort */ }
    }
  }

  // Check for requirements.txt and install deps
  const reqTxt = join(dest, "requirements.txt");
  if (existsSync(reqTxt)) {
    try {
      execFileSync("pip", ["install", "-r", "requirements.txt", "--target", join(dest, ".venv")], {
        cwd: dest,
        stdio: "pipe",
        timeout: 60000,
      });
    } catch { /* best effort */ }
  }

  return {
    installPath: dest,
    binaries,
    duration: Date.now() - start,
  };
}

/** Install from npm registry */
async function installFromNpm(
  source: ToolSource,
  dest: string,
): Promise<InstallResult> {
  const start = Date.now();
  const pkg = source.uri;

  mkdirSync(dest, { recursive: true });

  // Use a unique temporary directory for npm pack to prevent TOCTOU races
  const packDir = join(tmpdir(), `agents-cli-pack-${randomBytes(8).toString("hex")}`);
  mkdirSync(packDir, { recursive: true });

  try {
    // Use npm pack to download tarball into isolated directory
    execFileSync("npm", ["pack", pkg, "--pack-destination", packDir], {
      stdio: "pipe",
      timeout: 60000,
    });

    // Find the tarball in our isolated directory
    const tmpFiles = readdirSync(packDir).filter((f) => f.endsWith(".tgz"));
    const tarball = tmpFiles[0];
    if (!tarball) {
      throw new Error(`npm pack did not produce a tarball for: ${pkg}`);
    }

    const tarPath = join(packDir, tarball);
    execFileSync("tar", ["-xzf", tarPath, "--strip-components=1", "-C", dest], { stdio: "pipe" });
  } catch (err) {
    if (err instanceof Error && err.message.includes("npm pack")) throw err;
    throw new Error(`Failed to download npm package: ${pkg}`);
  } finally {
    // Clean up the isolated pack directory
    try { rmSync(packDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  // Install deps — detect if build is needed, otherwise just production deps
  const pkgJson = join(dest, "package.json");
  if (existsSync(pkgJson)) {
    const didBuild = detectAndBuild(dest);
    if (!didBuild) {
      try {
        execFileSync("npm", ["install", "--production", "--ignore-scripts"], {
          cwd: dest,
          stdio: "pipe",
          timeout: 60000,
        });
      } catch { /* best effort */ }
    }
  }

  const binaries = findBinaries(dest);
  makeExecutable(binaries);

  return {
    installPath: dest,
    binaries,
    duration: Date.now() - start,
  };
}

/** Install from local path (symlink/copy) */
async function installFromLocal(
  source: ToolSource,
  dest: string,
): Promise<InstallResult> {
  const start = Date.now();
  const srcPath = source.uri.replace(/^~/, process.env.HOME ?? "~");

  if (!existsSync(srcPath)) {
    throw new Error(`Local path does not exist: ${srcPath}`);
  }

  mkdirSync(dest, { recursive: true });
  try {
    execFileSync("cp", ["-r", `${srcPath}/.`, `${dest}/`], { stdio: "pipe" });
  } catch {
    execFileSync("cp", ["-r", srcPath, `${dest}/`], { stdio: "pipe" });
  }

  const binaries = findBinaries(dest);
  makeExecutable(binaries);

  return {
    installPath: dest,
    binaries,
    duration: Date.now() - start,
  };
}

/** Create an installer instance */
export function createInstaller(): ToolInstaller {
  return {
    supports(format: SourceFormat): boolean {
      return ["github", "npm", "local"].includes(format);
    },

    async install(
      source: ToolSource,
      dest: string,
      _options?: InstallOptions,
    ): Promise<InstallResult> {
      switch (source.format) {
        case "github":
          return installFromGithub(source, dest);
        case "npm":
          return installFromNpm(source, dest);
        case "local":
          return installFromLocal(source, dest);
        default:
          throw new Error(`Unsupported install format: ${source.format}`);
      }
    },
  };
}
