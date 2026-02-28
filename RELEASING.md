# Releasing Nexis

This document defines the release process for Nexis.

## Versioning

- Current line: `0.x` (pre-1.0).
- Use `v0.1.0` for first public release.
- Patch (`0.1.x`): bug fixes only.
- Minor (`0.x.0`): may include breaking changes, must include migration notes.

## Release Checklist

1. Confirm branch is up to date and clean.
2. Ensure versions are aligned:
   - `server/Cargo.toml` workspace version
   - `sdks/ts/package.json`
   - `dashboard/control-api/package.json`
   - `plugins/rust/nexis_wasm_plugin/Cargo.toml`
3. Update `CHANGELOG.md`.
4. Run quality gates:
   - `cargo test --manifest-path server/Cargo.toml`
   - `bun test` in `sdks/ts`
   - `bunx tsc -p tsconfig.json --noEmit` in `sdks/ts`
   - `bun test` in `dashboard/control-api`
   - `bunx tsc --noEmit` in `dashboard/control-api`
   - `bun run build` in `docs-site`
   - `cargo publish --dry-run --manifest-path plugins/rust/nexis_wasm_plugin/Cargo.toml`
5. Validate stack (locally or CI compose-smoke):
   - `docker compose -f infra/docker-compose.yml up -d --build --wait`
   - `bun infra/smoke.ts`
6. Commit release metadata changes.
7. Tag release:
   - `git tag v0.1.0`
   - `git push origin v0.1.0`
8. Create GitHub release from tag with changelog highlights.

## Automated Release Workflow

Workflow: `.github/workflows/release.yml`

On push to `main` it:

1. validates server + SDK + control API tests/typechecks
2. builds and pushes Docker images with:
   - `:next`
   - `:sha-<commit>`
3. publishes npm prerelease under `next` dist-tag:
   - version format: `<base>-next.<run_number>.<run_attempt>`

On tag push (`v*`) it:

1. validates server + SDK + control API tests/typechecks
2. builds and pushes Docker images to GHCR:
   - `ghcr.io/<owner>/rust-server:<tag>`
   - `ghcr.io/<owner>/control-api:<tag>`
   - `ghcr.io/<owner>/dashboard-ui:<tag>`
   - `ghcr.io/<owner>/web-demo:<tag>`
   - plus `:latest`
3. publishes `@triformine/nexis-sdk` to npm
4. publishes `nexis_wasm_plugin` to crates.io

## crates.io Publish (`nexis_wasm_plugin`)

`release.yml` publishes this crate automatically on tag pushes (`v*`) using
crates.io trusted publishing (OIDC).

One-time setup on crates.io:

1. Open crate settings for `nexis_wasm_plugin`.
2. Add trusted publisher:
   - Provider: `GitHub Actions`
   - Organization/user: `TriForMine`
   - Repository: `nexis`
   - Workflow filename: `release.yml`
3. Save configuration.

Manual fallback:

1. Run dry-run:
   - `cargo publish --dry-run --manifest-path plugins/rust/nexis_wasm_plugin/Cargo.toml`
2. Publish:
   - `cargo publish --manifest-path plugins/rust/nexis_wasm_plugin/Cargo.toml`
3. Verify:
   - <https://crates.io/crates/nexis_wasm_plugin>
   - <https://docs.rs/nexis_wasm_plugin>

## npm Trusted Publishing (OIDC)

`release.yml` uses npm trusted publishing (OIDC), so no `NPM_TOKEN` is required.

npm package trusted publisher configuration must match:

- Provider: `GitHub Actions`
- Organization/user: `TriForMine`
- Repository: `nexis`
- Workflow filename: `release.yml`

Workflow requirements already set:

- `permissions.id-token: write`
- Node `24` for npm CLI compatibility

## Hotfix Process

1. Branch from latest release tag.
2. Apply minimal fix + tests.
3. Bump patch version (`0.1.x`).
4. Update changelog.
5. Tag and release.
