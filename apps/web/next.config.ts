import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@abacus/parser", "@abacus/ui"],
};

export default nextConfig;
