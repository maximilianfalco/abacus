import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: resolve(__dirname, "../.."),
  transpilePackages: ["@abacus/parser", "@abacus/ui"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
