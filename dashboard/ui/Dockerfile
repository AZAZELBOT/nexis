FROM oven/bun:1.3.10 AS build
WORKDIR /app
COPY dashboard/ui/package.json ./package.json
COPY dashboard/ui/bun.lock ./bun.lock
COPY dashboard/ui/tsconfig.json ./tsconfig.json
COPY dashboard/ui/rsbuild.config.ts ./rsbuild.config.ts
COPY dashboard/ui/postcss.config.cjs ./postcss.config.cjs
COPY dashboard/ui/tailwind.config.ts ./tailwind.config.ts
COPY dashboard/ui/index.html ./index.html
COPY dashboard/ui/src ./src
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.3.10
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/server.ts ./src/server.ts
EXPOSE 5173
CMD ["bun", "src/server.ts"]
