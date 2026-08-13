import "dotenv/config";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const DEMO_PASSWORD = "password123";

const demos = [
  {
    email: "student@test.com",
    name: "Demo Student",
    role: "student",
    availability: "unavailable",
  },
  {
    email: "lecturer@test.com",
    name: "Demo Lecturer",
    role: "lecturer",
    availability: "available",
  },
  {
    email: "admin@test.com",
    name: "Demo Admin",
    role: "admin",
    availability: "unavailable",
  },
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of demos) {
    await sql`
      INSERT INTO users (email, name, password_hash, role, availability_status)
      VALUES (${user.email}, ${user.name}, ${passwordHash}, ${user.role}, ${user.availability})
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        availability_status = EXCLUDED.availability_status
    `;
    console.log(`✓ ${user.role}: ${user.email}`);
  }

  console.log(`\nPassword for all demo accounts: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
