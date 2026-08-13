import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
  "cancelled",
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
    cancellationReason: text("cancellation_reason"),
    cancelledByUserId: uuid("cancelled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Only active bookings occupy a slot; declined/cancelled free it for rebooking.
    uniqueIndex("appointments_lecturer_starts_at_uidx")
      .on(table.lecturerId, table.startsAt)
      .where(sql`status IN ('pending', 'accepted')`),
  ],
);

export type User = typeof users.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
