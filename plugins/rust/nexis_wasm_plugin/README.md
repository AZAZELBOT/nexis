# nexis_wasm_plugin

Rust helper crate for building Nexis runtime-loaded WASM room plugins.

This crate gives plugin authors:

- a `RoomPlugin` trait with lifecycle hooks
- a `PluginOutput` type for returning state and optional events
- an `export_plugin!` macro that exports the host ABI functions

## Install

```toml
[dependencies]
nexis_wasm_plugin = "0.1.5"
serde_json = "1"
```

## Minimal Plugin

```rust
use nexis_wasm_plugin::{export_plugin, PluginOutput, RoomPlugin};
use serde_json::{json, Value};

#[derive(Default)]
struct CounterPlugin;

impl RoomPlugin for CounterPlugin {
    fn initial_state(&self) -> Value {
        json!({ "counter": 0 })
    }

    fn on_message(&self, state: &Value, input: &Value) -> PluginOutput {
        if input.get("type").and_then(Value::as_str) == Some("inc") {
            let by = input
                .get("data")
                .and_then(|data| data.get("by"))
                .and_then(Value::as_i64)
                .unwrap_or(1);
            let current = state.get("counter").and_then(Value::as_i64).unwrap_or(0);
            let next = current + by;
            return PluginOutput::state_with_event(
                json!({ "counter": next }),
                json!({ "type": "counter.updated", "data": { "counter": next } }),
            );
        }

        PluginOutput::state(state.clone())
    }
}

export_plugin!(CounterPlugin);
```

## Build for Nexis Runtime

```bash
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
```

Use the generated `.wasm` in `NEXIS_WASM_ROOM_PLUGINS`.

## Compatibility

`nexis_wasm_plugin` follows Nexis `0.x` compatibility policy: APIs can evolve between minor releases.
Pin and test before upgrading.
