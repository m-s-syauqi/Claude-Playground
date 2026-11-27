"use client";

import { useActionState } from "react";
import { importNeraca, type FormState } from "@/app/actions";
import { pauseAutoLock } from "./auto-lock";

export function ImportForm({ hasData }: { hasData: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    importNeraca,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      <input
        type="file"
        name="file"
        accept=".js,.json,text/javascript,application/json"
        required
        onClick={pauseAutoLock}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
      />
      {state.error && (
        <p role="alert" className="text-sm text-rose-600">{state.error}</p>
      )}
      {state.ok && !state.error && (
        <p role="status" className="text-sm text-emerald-700">Data berhasil diimpor.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-emerald-600 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Mengimpor…" : hasData ? "Ganti data" : "Impor data"}
      </button>
    </form>
  );
}
