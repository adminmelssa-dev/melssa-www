import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

interface Violation {
  file: string;
  importPath: string;
  message: string;
}

const sourceRoots = ["src/app", "src/components", "src/lib", "src/modules"];
const importPattern = /import(?:[\s\S]*?\sfrom\s)?["']([^"']+)["']/g;

const violations: Violation[] = [];

for (const root of sourceRoots) {
  await scan(root);
}

if (violations.length > 0) {
  console.error("Architecture boundary violations found:\n");
  for (const violation of violations) {
    console.error(
      `- ${violation.file}\n  ${violation.message}\n  import: ${violation.importPath}`,
    );
  }
  process.exit(1);
}

console.log("Architecture boundaries look clean.");

async function scan(directory: string): Promise<void> {
  let entries: Dirent<string>[];

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }

    if (!isTypeScriptSource(path)) {
      continue;
    }

    await checkFile(path);
  }
}

async function checkFile(path: string): Promise<void> {
  const content = await readFile(path, "utf8");
  const file = relative(process.cwd(), path);
  const imports = Array.from(content.matchAll(importPattern), (match) => match[1]);
  const isClientFile = startsWithClientDirective(content);

  for (const importPath of imports) {
    if (importPath.startsWith("@/server/db") && !canImportDatabase(file)) {
      violations.push({
        file,
        importPath,
        message:
          "Database imports belong in src/server, module queries, module actions, or module server helpers.",
      });
    }

    if (
      isClientFile &&
      (importPath.startsWith("@/server/") ||
        importPath.includes("/server/") ||
        isModuleQueriesImport(file, importPath))
    ) {
      violations.push({
        file,
        importPath,
        message:
          "Client components must not import server-only modules or module query files.",
      });
    }
  }
}

function isTypeScriptSource(path: string): boolean {
  return path.endsWith(".ts") || path.endsWith(".tsx");
}

function canImportDatabase(file: string): boolean {
  const normalized = file.split(sep).join("/");

  if (!normalized.startsWith("src/modules/")) {
    return false;
  }

  return (
    normalized.includes("/actions/") ||
    normalized.endsWith("/actions.ts") ||
    normalized.includes("/server/") ||
    normalized.endsWith("/queries.ts")
  );
}

function startsWithClientDirective(content: string): boolean {
  return /^["']use client["']\s*;?(?:\r?\n|$)/.test(
    stripLeadingWhitespaceAndComments(content),
  );
}

function stripLeadingWhitespaceAndComments(content: string): string {
  let remaining = content.replace(/^\uFEFF/, "");

  while (true) {
    remaining = remaining.trimStart();

    if (remaining.startsWith("//")) {
      const nextLineIndex = remaining.indexOf("\n");
      if (nextLineIndex === -1) return "";
      remaining = remaining.slice(nextLineIndex + 1);
      continue;
    }

    if (remaining.startsWith("/*")) {
      const commentEndIndex = remaining.indexOf("*/");
      if (commentEndIndex === -1) return "";
      remaining = remaining.slice(commentEndIndex + 2);
      continue;
    }

    return remaining;
  }
}

function isModuleQueriesImport(file: string, importPath: string): boolean {
  const resolved = resolveImportPath(file, importPath);
  if (!resolved.startsWith("src/modules/")) {
    return false;
  }

  return (
    resolved.endsWith("/queries") ||
    resolved.endsWith("/queries.ts") ||
    resolved.endsWith("/queries.tsx")
  );
}

function resolveImportPath(file: string, importPath: string): string {
  if (importPath.startsWith("@/")) {
    return normalizeToPosix(join("src", importPath.slice(2)));
  }

  if (importPath.startsWith(".")) {
    return normalizeToPosix(normalize(join(dirname(file), importPath)));
  }

  return importPath;
}

function normalizeToPosix(path: string): string {
  return path.split(sep).join("/");
}
