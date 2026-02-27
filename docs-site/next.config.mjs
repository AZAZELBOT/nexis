import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();
const isProduction = process.env.NODE_ENV === "production";
const basePath = isProduction ? "/nexis" : "";

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  reactStrictMode: true,
  serverExternalPackages: ["typescript", "twoslash"],
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default withMDX(config);
