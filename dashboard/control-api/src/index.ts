import { createControlApiApp } from "./app";
import { initializeBetterAuth } from "./better_auth";
import {
  createPostgresStore,
  ensureBetterAuthTables,
  migrate,
  seedDemoData,
} from "./db";

const port = Number(process.env.PORT ?? 3000);
const demoProjectId = process.env.NEXIS_DEMO_PROJECT_ID ?? "demo-project";
const demoProjectName = process.env.NEXIS_DEMO_PROJECT_NAME ?? "demo";
const demoKeyId = process.env.NEXIS_DEMO_KEY_ID ?? "demo-key";
const demoKeyName = process.env.NEXIS_DEMO_KEY_NAME ?? "demo-default";
const demoSecret = process.env.NEXIS_DEMO_PROJECT_SECRET ?? "demo-secret";
const masterSecret =
  process.env.NEXIS_MASTER_SECRET ?? "nexis-dev-master-secret";
const internalToken =
  process.env.NEXIS_INTERNAL_TOKEN ?? "nexis-dev-internal-token";
const allowedOrigins = (process.env.NEXIS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

if (!process.env.NEXIS_MASTER_SECRET) {
  console.warn(
    "[nexis] WARNING: NEXIS_MASTER_SECRET is not set. Using insecure dev default. Set this env var before deploying to production.",
  );
}
if (!process.env.NEXIS_INTERNAL_TOKEN) {
  console.warn(
    "[nexis] WARNING: NEXIS_INTERNAL_TOKEN is not set. Using insecure dev default. Set this env var before deploying to production.",
  );
}
if (!process.env.NEXIS_DEMO_PROJECT_SECRET) {
  console.warn(
    "[nexis] WARNING: NEXIS_DEMO_PROJECT_SECRET is not set. Using insecure dev default. Set this env var before deploying to production.",
  );
}

await migrate();
await ensureBetterAuthTables();

const auth = await initializeBetterAuth({
  trustedOrigins:
    allowedOrigins.length > 0
      ? allowedOrigins
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:8080",
        ],
  internalToken: internalToken.trim() || null,
});

await seedDemoData(
  demoProjectId,
  demoProjectName,
  demoKeyId,
  demoKeyName,
  demoSecret,
);

const app = createControlApiApp(createPostgresStore(), {
  allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : undefined,
  demoProjectId,
  demoSecret,
  masterSecret,
  internalToken,
  auth,
});

app.listen(port);
console.log(`control-api listening on :${port}`);
