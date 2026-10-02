import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Logo uploads go through a server action; the default 1 MB body limit is too small.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
};

export default nextConfig;
