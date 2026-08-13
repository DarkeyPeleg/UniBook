import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "lecturer",
  "admin",
]);

export const availabilityEnum = pgEnum("availability_status", [
  "available",
  "unavailable",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "accepted",
  "declined",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  availabilityStatus: availabilityEnum("availability_status")
    .notNull()
    .default("unavailable"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lecturerId: uuid("lecturer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("appointments_lecturer_starts_at_uidx").on(
      table.lecturerId,
      table.startsAt,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
