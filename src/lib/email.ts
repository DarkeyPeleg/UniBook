import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type StatusEmailInput = {
  to: string;
  studentName: string;
  lecturerName: string;
  startsAt: Date;
  status: "accepted" | "declined";
};

export async function sendAppointmentStatusEmail(
  input: StatusEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping email notification");
    return { ok: true };
  }

  const when = input.startsAt.toLocaleString("en-GH", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const subject =
    input.status === "accepted"
      ? `Appointment Accepted — ${input.lecturerName}`
      : `Appointment Declined — ${input.lecturerName}`;

  const statusLabel =
    input.status === "accepted" ? "Accepted" : "Declined";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "UniBook <onboarding@resend.dev>",
      to: input.to,
      subject,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #222;">
          <div style="background:#003366;color:#fff;padding:12px 16px;font-weight:700;">
            UniBook
          </div>
          <div style="padding:16px;">
            <p>Hello ${escapeHtml(input.studentName)},</p>
            <p>
              Your appointment request with
              <strong>${escapeHtml(input.lecturerName)}</strong>
              for <strong>${escapeHtml(when)}</strong>
              was <strong>${statusLabel}</strong>.
            </p>
            <p style="color:#5C6B7A;font-size:14px;">
              Sign in to UniBook to view your request history.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend exception", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email failed",
    };
  }
}

type CancelEmailInput = {
  to: string;
  recipientName: string;
  otherPartyName: string;
  startsAt: Date;
  cancellationReason: string;
  cancelledByLabel: string;
};

export async function sendAppointmentCancelledEmail(
  input: CancelEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping email notification");
    return { ok: true };
  }

  const when = input.startsAt.toLocaleString("en-GH", {
    dateStyle: "full",
    timeStyle: "short",
  });

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "UniBook <onboarding@resend.dev>",
      to: input.to,
      subject: `Appointment Cancelled — ${input.otherPartyName}`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #222;">
          <div style="background:#003366;color:#fff;padding:12px 16px;font-weight:700;">
            UniBook
          </div>
          <div style="padding:16px;">
            <p>Hello ${escapeHtml(input.recipientName)},</p>
            <p>
              Your appointment with
              <strong>${escapeHtml(input.otherPartyName)}</strong>
              for <strong>${escapeHtml(when)}</strong>
              was <strong>cancelled</strong> by ${escapeHtml(input.cancelledByLabel)}.
            </p>
            <p>
              <strong>Reason:</strong>
              ${escapeHtml(input.cancellationReason)}
            </p>
            <p style="color:#5C6B7A;font-size:14px;">
              Sign in to UniBook to view your request history.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend exception", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email failed",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
