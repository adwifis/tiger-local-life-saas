import "dotenv/config";

const baseUrl = process.env.VERIFY_BASE_URL || process.env.APP_URL || "http://localhost:3000";

async function checkJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path} did not return JSON: ${text.slice(0, 160)}`);
  }
}

async function main() {
  const health = await checkJson("/api/health");
  const integrations = await checkJson("/api/integrations");
  const usage = await checkJson("/api/usage");

  console.log("Runtime verification passed.");
  console.log(
    JSON.stringify(
      {
        service: health.service,
        project: health.project,
        integrationCount: integrations.data?.length ?? 0,
        aiExecutionMode: usage.data?.aiExecutionMode ?? "unknown"
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
