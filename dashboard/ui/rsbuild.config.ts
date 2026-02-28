import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const controlApiUrl = process.env.CONTROL_API_URL ?? "http://localhost:3000";
const runtimeAdminUrl =
  process.env.RUNTIME_ADMIN_URL ?? "http://localhost:9100";
const internalToken = process.env.NEXIS_INTERNAL_TOKEN?.trim() ?? "";

export default defineConfig({
  plugins: [pluginReact()],
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  source: {
    entry: {
      index: "./src/main.tsx",
    },
  },
  html: {
    title: "Nexis Dashboard",
    meta: {
      description:
        "Nexis control plane dashboard for projects, keys, tokens, and observability.",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: controlApiUrl,
        changeOrigin: true,
        pathRewrite: {
          "^/api": "",
        },
      },
      "/rt": {
        target: runtimeAdminUrl,
        changeOrigin: true,
        pathRewrite: {
          "^/rt": "",
        },
        ...(internalToken
          ? {
              headers: {
                "x-nexis-internal-token": internalToken,
              },
            }
          : {}),
      },
    },
  },
});
