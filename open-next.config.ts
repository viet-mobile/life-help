import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({});
config.buildCommand = "node scripts/think/gen-extra-index.mjs && npx next build --webpack";

export default config;
