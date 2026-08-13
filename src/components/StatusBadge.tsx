const styles: Record<string, string> = {
  pending: "bg-[#fff8e1] text-pending",
  accepted: "bg-[#e8f5e9] text-accepted",
  declined: "bg-[#ffebee] text-declined",
  cancelled: "bg-[#eceff1] text-cancelled",
  available: "bg-[#e8f5e9] text-available",
  unavailable: "bg-[#eceff1] text-unavailable",
  student: "bg-select text-navy",
  lecturer: "bg-select text-navy",
  admin: "bg-[#fff8e1] text-pending",
};

type Props = {
  status: keyof typeof styles | string;
  label?: string;
};

export function StatusBadge({ status, label }: Props) {
  const text =
    label ??
    status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-select text-ink"}`}
    >
      {text}
    </span>
  );
}
