import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // BASE_PATH is injected by actions/configure-pages during CI.
  // Locally it is empty so the dev server works unchanged.
  basePath: process.env.BASE_PATH ?? "",
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
