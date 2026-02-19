import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@abacus/parser", "@abacus/ui"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
