import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

if (!process.env.TURSO_DATABASE_URL) throw new Error("Missing TURSO_DATABASE_URL");
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);