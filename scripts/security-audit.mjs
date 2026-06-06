import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const issues = [];

const trackedFiles = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8"
})
  .split("\n")
  .filter(Boolean);

const blockedTrackedFiles = [/^\.env$/, /^\.env\.(?!example$)/, /(^|\/)id_rsa$/, /(^|\/).*\.pem$/];

for (const file of trackedFiles) {
  if (blockedTrackedFiles.some((pattern) => pattern.test(file))) {
    issues.push(`${file}: sensitive file must not be tracked by Git.`);
  }
}

const bannedLiterals = [
  "tiger_dev_password",
  "changeme",
  "change_me",
  "your-secret-key",
  "your-api-key",
  "sk-",
  "AKIA"
];

const secretAssignmentPattern =
  /(?:API_KEY|SECRET|TOKEN|PASSWORD|WEBHOOK_SECRET|AUTH_SECRET|ADMIN_API_KEY)\s*[:=]\s*["']?([A-Za-z0-9_./+=:@-]{8,})["']?/;

const allowedPlaceholderValues = new Set([
  "development",
  "production",
  "dry-run",
  "qwen3.6-plus",
  "qwen3.7-max",
  "tiger_ai_saas",
  "replace_with_random_password",
  "replace_with_random_secret",
  "replace_with_random_admin_key"
]);

const allowedFilesForEmptySecrets = new Set([".env.example", "AGENTS.md"]);
const allowedFilesForBannedLiterals = new Set(["scripts/security-audit.mjs", "scripts/check-env.mjs"]);

for (const file of trackedFiles) {
  if (file === "package-lock.json") continue;

  const absolute = join(root, file);
  if (!existsSync(absolute)) continue;

  const content = readFileSync(absolute, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const literal of bannedLiterals) {
      if (!allowedFilesForBannedLiterals.has(file) && line.includes(literal)) {
        issues.push(`${file}:${lineNumber}: banned secret-like literal "${literal}" found.`);
      }
    }

    if (/["']5432:5432["']|["']6379:6379["']/.test(line)) {
      issues.push(`${file}:${lineNumber}: database/cache port is exposed on all interfaces.`);
    }

    if (/["']3000:3000["']/.test(line)) {
      issues.push(`${file}:${lineNumber}: web port should be bound explicitly, e.g. 127.0.0.1:3000.`);
    }

    const secretMatch = line.match(secretAssignmentPattern);
    if (!secretMatch) return;

    const value = secretMatch[1];
    if (allowedPlaceholderValues.has(value)) return;
    if (allowedFilesForEmptySecrets.has(file) && line.trim().endsWith("=")) return;
    if (line.includes("${") || line.includes("<") || line.includes("process.env")) return;

    issues.push(`${file}:${lineNumber}: possible committed secret value. Use an empty placeholder instead.`);
  });
}

const dockerCompose = join(root, "docker-compose.yml");
if (existsSync(dockerCompose)) {
  const content = readFileSync(dockerCompose, "utf8");
  for (const required of ["POSTGRES_PASSWORD: ${POSTGRES_PASSWORD", "127.0.0.1"]) {
    if (!content.includes(required)) {
      issues.push(`docker-compose.yml: missing expected safe Docker setting "${required}".`);
    }
  }
}

if (issues.length) {
  console.error("Security audit failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Security audit passed.");
