"use server";

import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db, withDbRetry } from "@/db";
import { appointments, users } from "@/db/schema";
import { sendAppointmentStatusEmail, sendAppointmentCancelledEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signIn, auth, unstable_update } from "@/lib/auth";
import {
  homePathForRole,
  resolveRoleForEmail,
  type UserRole,
} from "@/lib/roles";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import {
  appointmentEnd,
  buildStartsAt,
  isIntervalTaken,
  isValidDuration,
  parseTimeToMinutes,
} from "@/lib/slots";
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

export async function getCurrentUserProfile() {
  const session = await requireSession();
  return withDbRetry(async () => {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        availabilityStatus: users.availabilityStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    return user ?? null;
  });
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();

  const newPasswordRaw = String(formData.get("newPassword") ?? "");
  const currentPasswordRaw = String(formData.get("currentPassword") ?? "");

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    currentPassword: currentPasswordRaw || undefined,
    newPassword: newPasswordRaw || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  if (newPasswordRaw && newPasswordRaw.length < 8) {
    return {
      ok: false,
      error: "New password must be at least 8 characters.",
    };
  }

  if (newPasswordRaw && !currentPasswordRaw) {
    return {
      ok: false,
      error: "Enter your current password to set a new one.",
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  const email = parsed.data.email.toLowerCase();

  if (email !== user.email) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (taken) {
      return { ok: false, error: "That email is already in use." };
    }
  }

  const updates: {
    name: string;
    email: string;
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    email,
  };

  if (newPasswordRaw) {
    const valid = await verifyPassword(
      currentPasswordRaw,
      user.passwordHash,
    );
    if (!valid) {
      return { ok: false, error: "Current password is incorrect." };
    }
    updates.passwordHash = await hashPassword(newPasswordRaw);
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  await unstable_update({
    user: {
      name: updates.name,
      email: updates.email,
    },
  });

  redirect("/profile?updated=1");
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
  durationMinutes: z.coerce.number().int(),
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
    durationMinutes: formData.get("durationMinutes"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!isValidDuration(parsed.data.durationMinutes)) {
    return {
      ok: false,
      error: "Choose a meeting length of 15, 30, 45, or 60 minutes.",
    };
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

  const minutes = parseTimeToMinutes(parsed.data.time);
  if (minutes === null) {
    return {
      ok: false,
      error: "Choose a start time in 15-minute steps between 8:00 AM and 5:00 PM.",
    };
  }

  const durationMinutes = parsed.data.durationMinutes;
  const startsAt = buildStartsAt(parsed.data.date, minutes);
  const endsAt = appointmentEnd(startsAt, durationMinutes);

  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Invalid date or time." };
  }
  if (startsAt.getTime() < Date.now()) {
    return { ok: false, error: "Choose a future date and time." };
  }

  const dayStart = new Date(`${parsed.data.date}T00:00:00`);
  const dayEnd = new Date(`${parsed.data.date}T23:59:59.999`);

  const occupied = await db
    .select({
      startsAt: appointments.startsAt,
      durationMinutes: appointments.durationMinutes,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.lecturerId, lecturer.id),
        inArray(appointments.status, ["pending", "accepted"]),
        gte(appointments.startsAt, dayStart),
        lte(appointments.startsAt, dayEnd),
      ),
    );

  if (isIntervalTaken(startsAt, durationMinutes, occupied)) {
    return {
      ok: false,
      error:
        "That time overlaps an existing booking for this lecturer. Choose another slot.",
    };
  }

  // Guard: meeting must end by 5pm
  const endMinutes =
    endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();
  if (endMinutes > 17 * 60) {
    return {
      ok: false,
      error: "Meetings must finish by 5:00 PM.",
    };
  }

  try {
    await db.insert(appointments).values({
      studentId: session.user.id,
      lecturerId: lecturer.id,
      startsAt,
      durationMinutes,
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
        error:
          "That time overlaps an existing booking for this lecturer. Choose another slot.",
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

const cancelReasonSchema = z
  .string()
  .trim()
  .min(3, "Please give a short reason for cancelling.")
  .max(500, "Reason must be 500 characters or fewer.");

export async function cancelAppointment(
  appointmentId: string,
  cancellationReason: string,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsedReason = cancelReasonSchema.safeParse(cancellationReason);
  if (!parsedReason.success) {
    return {
      ok: false,
      error: parsedReason.error.issues[0]?.message ?? "Invalid reason.",
    };
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

  if (!row) return { ok: false, error: "Appointment not found." };

  const isStudentOwner =
    session.user.role === "student" &&
    row.appointment.studentId === session.user.id;
  const isLecturerOwner =
    (session.user.role === "lecturer" || session.user.role === "admin") &&
    (session.user.role === "admin" ||
      row.appointment.lecturerId === session.user.id);

  if (!isStudentOwner && !isLecturerOwner) {
    return { ok: false, error: "Not authorized to cancel this appointment." };
  }

  if (
    row.appointment.status !== "pending" &&
    row.appointment.status !== "accepted"
  ) {
    return {
      ok: false,
      error: "Only pending or accepted appointments can be cancelled.",
    };
  }

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancellationReason: parsedReason.data,
      cancelledByUserId: session.user.id,
      updatedAt: sql`now()`,
    })
    .where(eq(appointments.id, appointmentId));

  const cancelledByStudent = isStudentOwner;
  const emailResult = cancelledByStudent
    ? await sendAppointmentCancelledEmail({
        to: row.lecturer.email,
        recipientName: row.lecturer.name,
        otherPartyName: row.student.name,
        startsAt: row.appointment.startsAt,
        cancellationReason: parsedReason.data,
        cancelledByLabel: "the student",
      })
    : await sendAppointmentCancelledEmail({
        to: row.student.email,
        recipientName: row.student.name,
        otherPartyName: row.lecturer.name,
        startsAt: row.appointment.startsAt,
        cancellationReason: parsedReason.data,
        cancelledByLabel: "the lecturer",
      });

  if (!emailResult.ok) {
    return {
      ok: true,
      emailWarning: "Appointment cancelled; email could not be sent.",
    };
  }

  return { ok: true };
}

export async function getAvailableLecturers() {
  return withDbRetry(() =>
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "lecturer"),
          eq(users.availabilityStatus, "available"),
        ),
      )
      .orderBy(users.name),
  );
}

export async function getAvailableLecturerById(lecturerId: string) {
  return withDbRetry(async () => {
    const [lecturer] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          eq(users.id, lecturerId),
          eq(users.role, "lecturer"),
          eq(users.availabilityStatus, "available"),
        ),
      )
      .limit(1);
    return lecturer ?? null;
  });
}

export async function getStudentAppointments(studentId: string) {
  return withDbRetry(() =>
    db
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        reason: appointments.reason,
        status: appointments.status,
        cancellationReason: appointments.cancellationReason,
        cancelledByUserId: appointments.cancelledByUserId,
        lecturerName: users.name,
        lecturerEmail: users.email,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.lecturerId, users.id))
      .where(eq(appointments.studentId, studentId))
      .orderBy(desc(appointments.startsAt)),
  );
}

export async function getStudentRequestSummary(studentId: string) {
  return withDbRetry(async () => {
    const [row] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending')::int`,
        accepted: sql<number>`count(*) filter (where ${appointments.status} = 'accepted')::int`,
        declined: sql<number>`count(*) filter (where ${appointments.status} = 'declined')::int`,
        cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')::int`,
      })
      .from(appointments)
      .where(eq(appointments.studentId, studentId));

    return {
      pending: row?.pending ?? 0,
      accepted: row?.accepted ?? 0,
      declined: row?.declined ?? 0,
      cancelled: row?.cancelled ?? 0,
    };
  });
}

export async function getPendingForLecturer(lecturerId: string) {
  return withDbRetry(() => {
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
  });
}

export async function getLecturerAppointments(lecturerId: string) {
  return withDbRetry(() => {
    const student = alias(users, "student");
    return db
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        reason: appointments.reason,
        status: appointments.status,
        cancellationReason: appointments.cancellationReason,
        cancelledByUserId: appointments.cancelledByUserId,
        studentName: student.name,
        studentEmail: student.email,
      })
      .from(appointments)
      .innerJoin(student, eq(appointments.studentId, student.id))
      .where(eq(appointments.lecturerId, lecturerId))
      .orderBy(desc(appointments.startsAt));
  });
}

/** Pending + accepted intervals that block new bookings for this lecturer. */
export async function getLecturerOccupiedSlots(
  lecturerId: string,
  from: Date,
  to: Date,
) {
  return withDbRetry(() =>
    db
      .select({
        startsAt: appointments.startsAt,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.lecturerId, lecturerId),
          inArray(appointments.status, ["pending", "accepted"]),
          gte(appointments.startsAt, from),
          lte(appointments.startsAt, to),
        ),
      )
      .orderBy(appointments.startsAt),
  );
}

export async function getStudentCalendarAppointments(
  studentId: string,
  from: Date,
  to: Date,
) {
  return withDbRetry(() =>
    db
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        durationMinutes: appointments.durationMinutes,
        reason: appointments.reason,
        status: appointments.status,
        otherPartyName: users.name,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.lecturerId, users.id))
      .where(
        and(
          eq(appointments.studentId, studentId),
          inArray(appointments.status, ["pending", "accepted", "cancelled", "declined"]),
          gte(appointments.startsAt, from),
          lte(appointments.startsAt, to),
        ),
      )
      .orderBy(appointments.startsAt),
  );
}

export async function getLecturerCalendarAppointments(
  lecturerId: string,
  from: Date,
  to: Date,
) {
  return withDbRetry(() => {
    const student = alias(users, "student");
    return db
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        durationMinutes: appointments.durationMinutes,
        reason: appointments.reason,
        status: appointments.status,
        otherPartyName: student.name,
      })
      .from(appointments)
      .innerJoin(student, eq(appointments.studentId, student.id))
      .where(
        and(
          eq(appointments.lecturerId, lecturerId),
          inArray(appointments.status, [
            "pending",
            "accepted",
            "cancelled",
            "declined",
          ]),
          gte(appointments.startsAt, from),
          lte(appointments.startsAt, to),
        ),
      )
      .orderBy(appointments.startsAt);
  });
}

export async function getLecturerRequestSummary(lecturerId: string) {
  return withDbRetry(async () => {
    const [row] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending')::int`,
        accepted: sql<number>`count(*) filter (where ${appointments.status} = 'accepted')::int`,
        declined: sql<number>`count(*) filter (where ${appointments.status} = 'declined')::int`,
        cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')::int`,
      })
      .from(appointments)
      .where(eq(appointments.lecturerId, lecturerId));

    return {
      pending: row?.pending ?? 0,
      accepted: row?.accepted ?? 0,
      declined: row?.declined ?? 0,
      cancelled: row?.cancelled ?? 0,
    };
  });
}

export async function getLecturerAvailability(userId: string) {
  return withDbRetry(async () => {
    const [user] = await db
      .select({ availabilityStatus: users.availabilityStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user?.availabilityStatus ?? "unavailable";
  });
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
      cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')::int`,
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
