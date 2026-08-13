import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url
    .replace(/([?&])channel_binding=require&?/g, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

const sql = neon(getDatabaseUrl(), {
  fetchOptions: {
    // Avoid hanging forever on flaky network to Neon
  },
});

export const db = drizzle({ client: sql, schema });

/** Retry transient Neon/network failures a few times. */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes("fetch failed") ||
        message.includes("ETIMEDOUT") ||
        message.includes("ECONNRESET") ||
        message.includes("Error connecting");
      if (!retryable || i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastError;
}
