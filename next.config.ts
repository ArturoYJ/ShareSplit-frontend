import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generates a self-contained output for Docker deployment (node server.js)
  output: "standalone",
};

export default nextConfig;