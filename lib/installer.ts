import type {
  ToolInstaller,
  ToolSource,
  InstallOptions,
  InstallResult,
  SourceFormat,
} from "./types.js";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { createWriteStream, mkdirSync, existsSync, readdirSync, statSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

/** Download a file following redirects, return saved path */
function downloadFile(url: string, dest: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith("https") ? httpsGet : httpGet;
    getter(url, { headers: { "User-Agent": "agents-cli/0.1.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
        return;
      }
      const stream = createWriteStream(dest);
      res.pipe(stream);
      stream.on("finish", () => { stream.close(); resolve(dest); });
      stream.on("error", reject);
      res.on("error", reject);
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

/** Install from GitHub tarball */
async function installFromGithub(
  source: ToolSource,
  dest: string,
): Promise<InstallResult> {
  const start = Date.now();

  // Parse owner/repo
  const match = /([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/.exec(source.uri);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Cannot parse GitHub owner/repo from: ${source.uri}`);
  }
  const owner = match[1];
  const repo = match[2];
  const ref = source.ref ?? "main";

  // Download tarball
  const tmpFile = join(tmpdir(), `agents-cli-${randomBytes(6).toString("hex")}.tar.gz`);
  const tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${ref}.tar.gz`;

  await downloadFile(tarballUrl, tmpFile);

  // Extract to dest
  mkdirSync(dest, { recursive: true });
  execSync(`tar -xzf "${tmpFile}" --strip-components=1 -C "${dest}"`, { stdio: "pipe" });

  // Clean up tarball
  try { execSync(`rm -f "${tmpFile}"`, { stdio: "pipe" }); } catch { /* ignore */ }

  // Find binaries
  const binaries = findBinaries(dest);
  makeExecutable(binaries);

  // Check for package.json and install deps
  const pkgJson = join(dest, "package.json");
  if (existsSync(pkgJson)) {
    try {
      execSync("npm install --production --ignore-scripts 2>/dev/null || true", {
        cwd: dest,
        stdio: "pipe",
        timeout: 60000,
      });
    } catch { /* best effort */ }
  }

  // Check for requirements.txt and install deps
  const reqTxt = join(dest, "requirements.txt");
  if (existsSync(reqTxt)) {
    try {
      execSync(`pip install -r requirements.txt --target "${join(dest, ".venv")}" 2>/dev/null || true`, {
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

  // Use npm pack to download and extract
  try {
    execSync(
      `npm pack "${pkg}" --pack-destination "${tmpdir()}" 2>/dev/null`,
      { stdio: "pipe", timeout: 60000 },
    );
  } catch {
    throw new Error(`Failed to download npm package: ${pkg}`);
  }

  // Find the tarball that was created
  const safeName = pkg.replace(/^@/, "").replace(/\//, "-");
  const tmpFiles = readdirSync(tmpdir()).filter(
    (f) => f.startsWith(safeName) && f.endsWith(".tgz"),
  );
  const tarball = tmpFiles.sort().pop();
  if (!tarball) {
    throw new Error(`npm pack did not produce a tarball for: ${pkg}`);
  }

  const tarPath = join(tmpdir(), tarball);
  execSync(`tar -xzf "${tarPath}" --strip-components=1 -C "${dest}"`, { stdio: "pipe" });
  try { execSync(`rm -f "${tarPath}"`, { stdio: "pipe" }); } catch { /* ignore */ }

  // Install production deps
  const pkgJson = join(dest, "package.json");
  if (existsSync(pkgJson)) {
    try {
      execSync("npm install --production --ignore-scripts 2>/dev/null || true", {
        cwd: dest,
        stdio: "pipe",
        timeout: 60000,
      });
    } catch { /* best effort */ }
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
  execSync(`cp -r "${srcPath}/." "${dest}/" 2>/dev/null || cp -r "${srcPath}" "${dest}/"`, { stdio: "pipe" });

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
      return ["github", "npm", "tarball", "local"].includes(format);
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
