"use client";

import { useFormStatus } from "react-dom";
import { removeTransaction } from "@/app/actions";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Hapus transaksi"
      title="Hapus"
      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
    </button>
  );
}

export function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={removeTransaction}
      onSubmit={(e) => {
        if (!confirm("Hapus transaksi ini?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button />
    </form>
  );
}
