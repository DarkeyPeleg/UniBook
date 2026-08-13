"use client";

type Props = {
  action: () => Promise<void>;
};

export function SignOutButton({ action }: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Sign out of UniBook?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="min-h-10 cursor-pointer rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        style={{ color: "#ffffff" }}
      >
        Sign out
      </button>
    </form>
  );
}
