# NEXIS

Nexis is an open-source, engine-agnostic multiplayer backend platform with:

- a Rust data plane for realtime gameplay traffic
- a Bun + Elysia control plane for project/key/token management
- a TypeScript SDK for browser/runtime clients

Gameplay traffic goes directly to the data plane and never through the control plane.

## Core Docs

- [Quickstart](QUICKSTART.md)
- [Protocol](PROTOCOL.md)
- [Architecture](ARCHITECTURE.md)
- [WASM Plugins](WASM_PLUGINS.md)
- [Load Testing](LOAD_TESTING.md)

## Source

- GitHub: <https://github.com/TriForMine/nexis>
