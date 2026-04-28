import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Product metadata — slug is substituted by ANANTA's codegen before deploy.
  env: {
    ANANTA_PRODUCT_SLUG: process.env.ANANTA_PRODUCT_SLUG ?? "unknown",
    ANANTA_BILLING_MODE: process.env.ANANTA_BILLING_MODE ?? "test",
  },
};

export default config;
