"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "@/db";
import { appointments, users } from "@/db/schema";
import { signIn, auth } from "@/lib/auth";
import { sendAppointmentStatusEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import {
  homePathForRole,
  resolveRoleForEmail,
  type UserRole,
} from "@/lib/roles";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import type { ActionResult } from "@/lib/types";

export type { ActionResult };

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function registerUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const role = resolveRoleForEmail(email);
  const passwordHash = await hashPassword(parsed.data.password);

  await db.insert(users).values({
    email,
    name: parsed.data.name,
    passwordHash,
    role,
    availabilityStatus: role === "lecturer" ? "unavailable" : "unavailable",
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: homePathForRole(role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Account created but sign-in failed. Try logging in." };
    }
    throw error;
  }

  return { ok: true };
}

export async function loginUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: homePathForRole((user?.role as UserRole) ?? "student"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    throw error;
  }

  return { ok: true };
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function toggleAvailability(): Promise<ActionResult> {
  const session = await requireSession();
  if (session.user.role !== "lecturer" && session.user.role !== "admin") {
    return { ok: false, error: "Only lecturers can change availability." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return { ok: false, error: "User not found." };

  const next =
    user.availabilityStatus === "available" ? "unavailable" : "available";

  await db
    .update(users)
    .set({ availabilityStatus: next })
    .where(eq(users.id, user.id));

  return { ok: true };
}

const requestSchema = z.object({
  lecturerId: z.string().uuid(),
  date: z.string().min(1),
  time: z.string().min(1),
  reason: z.string().trim().min(5, "Please provide a short reason."),
});

export async function createAppointmentRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  if (session.user.role !== "student" && session.user.role !== "admin") {
    return { ok: false, error: "Only students can request appointments." };
  }

  const parsed = requestSchema.safeParse({
    lecturerId: formData.get("lecturerId"),
    date: formData.get("date"),
    time: formData.get("time"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [lecturer] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, parsed.data.lecturerId),
        eq(users.role, "lecturer"),
        eq(users.availabilityStatus, "available"),
      ),
    )
    .limit(1);

  if (!lecturer) {
    return {
      ok: false,
      error: "That lecturer is not currently accepting appointments.",
    };
  }

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Invalid date or time." };
  }
  if (startsAt.getTime() < Date.now()) {
    return { ok: false, error: "Choose a future date and time." };
  }

  try {
    await db.insert(appointments).values({
      studentId: session.user.id,
      lecturerId: lecturer.id,
      startsAt,
      reason: parsed.data.reason,
      status: "pending",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("appointments_lecturer_starts_at_uidx") ||
      message.includes("unique") ||
      message.includes("duplicate")
    ) {
      return {
        ok: false,
        error: "That time slot is already requested. Choose another time.",
      };
    }
    throw error;
  }

  redirect("/student/requests");
}

export async function respondToAppointment(
  appointmentId: string,
  status: "accepted" | "declined",
): Promise<ActionResult> {
  const session = await requireSession();
  if (session.user.role !== "lecturer" && session.user.role !== "admin") {
    return { ok: false, error: "Not authorized." };
  }

  const lecturerAlias = alias(users, "lecturer");
  const studentAlias = alias(users, "student");

  const [row] = await db
    .select({
      appointment: appointments,
      student: studentAlias,
      lecturer: lecturerAlias,
    })
    .from(appointments)
    .innerJoin(studentAlias, eq(appointments.studentId, studentAlias.id))
    .innerJoin(lecturerAlias, eq(appointments.lecturerId, lecturerAlias.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row) return { ok: false, error: "Request not found." };

  if (
    session.user.role === "lecturer" &&
    row.appointment.lecturerId !== session.user.id
  ) {
    return { ok: false, error: "You can only manage your own requests." };
  }

  if (row.appointment.status !== "pending") {
    return { ok: false, error: "This request was already handled." };
  }

  await db
    .update(appointments)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(appointments.id, appointmentId));

  const emailResult = await sendAppointmentStatusEmail({
    to: row.student.email,
    studentName: row.student.name,
    lecturerName: row.lecturer.name,
    startsAt: row.appointment.startsAt,
    status,
  });

  if (!emailResult.ok) {
    return {
      ok: true,
      emailWarning: "Status updated; email could not be sent.",
    };
  }

  return { ok: true };
}

export async function getAvailableLecturers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(
      and(eq(users.role, "lecturer"), eq(users.availabilityStatus, "available")),
    )
    .orderBy(users.name);
}

export async function getStudentAppointments(studentId: string) {
  return db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      reason: appointments.reason,
      status: appointments.status,
      lecturerName: users.name,
      lecturerEmail: users.email,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.lecturerId, users.id))
    .where(eq(appointments.studentId, studentId))
    .orderBy(desc(appointments.startsAt));
}

export async function getPendingForLecturer(lecturerId: string) {
  const student = alias(users, "student");
  return db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      reason: appointments.reason,
      status: appointments.status,
      studentName: student.name,
      studentEmail: student.email,
    })
    .from(appointments)
    .innerJoin(student, eq(appointments.studentId, student.id))
    .where(
      and(
        eq(appointments.lecturerId, lecturerId),
        eq(appointments.status, "pending"),
      ),
    )
    .orderBy(appointments.startsAt);
}

export async function getLecturerAvailability(userId: string) {
  const [user] = await db
    .select({ availabilityStatus: users.availabilityStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.availabilityStatus ?? "unavailable";
}

export async function getAdminStats() {
  const [userCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      students: sql<number>`count(*) filter (where ${users.role} = 'student')::int`,
      lecturers: sql<number>`count(*) filter (where ${users.role} = 'lecturer')::int`,
    })
    .from(users);

  const [apptCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending')::int`,
      accepted: sql<number>`count(*) filter (where ${appointments.status} = 'accepted')::int`,
      declined: sql<number>`count(*) filter (where ${appointments.status} = 'declined')::int`,
    })
    .from(appointments);

  const recent = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      startsAt: appointments.startsAt,
      reason: appointments.reason,
    })
    .from(appointments)
    .orderBy(desc(appointments.createdAt))
    .limit(10);

  return { userCounts, apptCounts, recent };
}
