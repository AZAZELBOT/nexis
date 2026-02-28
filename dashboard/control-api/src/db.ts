import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { and, desc, eq, sql as dsql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate as drizzleMigrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import type { ControlStore } from "./store";
import { projectKeys, projects } from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/nexis";

export const sql = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
});

export const db = drizzle(sql, {
  schema: {
    projects,
    projectKeys,
  },
});

function normalizeScopes(value: unknown): string[] {
  if (Array.isArray(value)) {
    const scopes = value.filter(
      (scope): scope is string => typeof scope === "string" && scope.length > 0,
    );
    return scopes.length > 0 ? scopes : ["token:mint"];
  }
  return ["token:mint"];
}

function resolveMigrationsFolder(): string {
  const fromEnv = process.env.NEXIS_MIGRATIONS_DIR;
  if (fromEnv) {
    return fromEnv;
  }

  const candidates = [
    resolve(process.cwd(), "drizzle"),
    resolve(dirname(process.execPath), "drizzle"),
  ];

  for (const folder of candidates) {
    if (existsSync(resolve(folder, "meta", "_journal.json"))) {
      return folder;
    }
  }

  throw new Error(
    `Can't find migrations folder. Looked for meta/_journal.json in: ${candidates.join(", ")}. Set NEXIS_MIGRATIONS_DIR to override.`,
  );
}

export async function migrate(): Promise<void> {
  await drizzleMigrate(db, { migrationsFolder: resolveMigrationsFolder() });
}

export async function ensureBetterAuthTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auth_session (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT NULL,
      user_agent TEXT NULL,
      user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS auth_session_user_id_idx ON auth_session(user_id);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auth_account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
      access_token TEXT NULL,
      refresh_token TEXT NULL,
      id_token TEXT NULL,
      access_token_expires_at TIMESTAMPTZ NULL,
      refresh_token_expires_at TIMESTAMPTZ NULL,
      scope TEXT NULL,
      password TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT auth_account_provider_account_unique UNIQUE (provider_id, account_id)
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS auth_account_user_id_idx ON auth_account(user_id);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auth_verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx ON auth_verification(identifier);
  `;
}

export async function seedDemoData(
  projectId: string,
  projectName: string,
  keyId: string,
  keyName: string,
  secret: string,
): Promise<void> {
  await db
    .insert(projects)
    .values({
      id: projectId,
      name: projectName,
    })
    .onConflictDoNothing({ target: projects.id });

  await db
    .insert(projectKeys)
    .values({
      id: keyId,
      projectId,
      name: keyName,
      secret,
      scopes: ["token:mint"],
      rotatedFrom: null,
    })
    .onConflictDoNothing({ target: projectKeys.id });
}

export function createPostgresStore(): ControlStore {
  return {
    async createProject(id, name) {
      const [project] = await db
        .insert(projects)
        .values({ id, name })
        .returning();
      return {
        id: project.id,
        name: project.name,
        created_at: project.createdAt,
      };
    },

    async listProjects() {
      const rows = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));
      return rows.map((project) => ({
        id: project.id,
        name: project.name,
        created_at: project.createdAt,
      }));
    },

    async projectExists(projectId) {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      return Boolean(project);
    },

    async createProjectKey(id, projectId, name, secret, scopes, rotatedFrom) {
      const [key] = await db
        .insert(projectKeys)
        .values({
          id,
          projectId,
          name,
          secret,
          scopes,
          rotatedFrom,
        })
        .returning();

      return {
        id: key.id,
        project_id: key.projectId,
        name: key.name,
        secret: key.secret,
        scopes: normalizeScopes(key.scopes),
        revoked_at: key.revokedAt,
        rotated_from: key.rotatedFrom,
        created_at: key.createdAt,
      };
    },

    async listProjectKeys(projectId) {
      const keys = await db
        .select()
        .from(projectKeys)
        .where(eq(projectKeys.projectId, projectId))
        .orderBy(desc(projectKeys.createdAt));

      return keys.map((key) => ({
        id: key.id,
        project_id: key.projectId,
        name: key.name,
        scopes: normalizeScopes(key.scopes),
        revoked_at: key.revokedAt,
        rotated_from: key.rotatedFrom,
        created_at: key.createdAt,
      }));
    },

    async keyExists(projectId, keyId) {
      const [projectKey] = await db
        .select({ id: projectKeys.id })
        .from(projectKeys)
        .where(
          and(eq(projectKeys.id, keyId), eq(projectKeys.projectId, projectId)),
        )
        .limit(1);
      return Boolean(projectKey);
    },

    async getProjectKey(projectId, keyId) {
      const [projectKey] = await db
        .select()
        .from(projectKeys)
        .where(
          and(eq(projectKeys.id, keyId), eq(projectKeys.projectId, projectId)),
        )
        .limit(1);
      if (!projectKey) {
        return null;
      }

      return {
        id: projectKey.id,
        project_id: projectKey.projectId,
        name: projectKey.name,
        secret: projectKey.secret,
        scopes: normalizeScopes(projectKey.scopes),
        revoked_at: projectKey.revokedAt,
        rotated_from: projectKey.rotatedFrom,
        created_at: projectKey.createdAt,
      };
    },

    async revokeProjectKey(projectId, keyId, revokedAt) {
      const [projectKey] = await db
        .update(projectKeys)
        .set({
          revokedAt: dsql`COALESCE(${projectKeys.revokedAt}, ${revokedAt}::timestamptz)`,
        })
        .where(
          and(eq(projectKeys.id, keyId), eq(projectKeys.projectId, projectId)),
        )
        .returning();

      if (!projectKey) {
        return null;
      }

      return {
        id: projectKey.id,
        project_id: projectKey.projectId,
        name: projectKey.name,
        scopes: normalizeScopes(projectKey.scopes),
        revoked_at: projectKey.revokedAt,
        rotated_from: projectKey.rotatedFrom,
        created_at: projectKey.createdAt,
      };
    },
  };
}
