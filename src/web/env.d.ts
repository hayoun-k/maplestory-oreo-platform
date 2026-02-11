/// <reference types="astro/client" />

/**
 * Interface for environment variables available via import.meta.env
 */
interface ImportMetaEnv {
  readonly DISCORD_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Define the Cloudflare runtime environment for Astro's SSR mode.
 * This maps to the bindings defined in your root wrangler.jsonc.
 */
declare namespace App {
  interface Locals {
    runtime: {
      env: {
        /**
         * The Cloudflare KV namespace for guild member data.
         * Used to sync data between the Discord bot and the Web roster.
         */
        MEMBERS_KV: import("@cloudflare/workers-types").KVNamespace;
        
        /**
         * Discord Public Key for interaction verification.
         */
        DISCORD_PUBLIC_KEY: string;
      };
      cf: import("@cloudflare/workers-types").IncomingRequestCfProperties;
      ctx: {
        waitUntil: (promise: Promise<any>) => void;
        passThroughOnException: () => void;
      };
    };
  }
}