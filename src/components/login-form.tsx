"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    login,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <input
        type="password"
        name="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
