"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { addTransaction, type FormState } from "@/app/actions";
import { CATEGORIES, type TxType } from "@/lib/types";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";

function groupDigits(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function TransactionForm({ defaultDate }: { defaultDate: string }) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const noteRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await addTransaction(prev, formData);
      if (result.ok) {
        // Keep type, category and date for quick repeated entries.
        setAmount("");
        if (noteRef.current) noteRef.current.value = "";
      }
      return result;
    },
    {},
  );

  return (
    <form
      onSubmit={(e) => {
        // Submit manually so React does not reset the form on errors.
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(["expense", "income"] as const).map((t) => (
          <label
            key={t}
            className={`cursor-pointer rounded-md py-2 text-center text-sm font-medium transition ${
              type === t
                ? t === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="sr-only"
            />
            {t === "expense" ? "Pengeluaran" : "Pemasukan"}
          </label>
        ))}
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block text-sm text-slate-600">
          Jumlah
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            Rp
          </span>
          <input
            id="amount"
            name="amount"
            inputMode="numeric"
            required
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(groupDigits(e.target.value))}
            className={`${input} pl-10 text-lg font-semibold`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="category"
            className="mb-1 block text-sm text-slate-600"
          >
            Kategori
          </label>
          <select
            id="category"
            name="category"
            key={type}
            defaultValue={CATEGORIES[type][0]}
            className={input}
          >
            {CATEGORIES[type].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-sm text-slate-600">
            Tanggal
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={input}
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm text-slate-600">
          Catatan <span className="text-slate-400">(opsional)</span>
        </label>
        <input
          ref={noteRef}
          id="note"
          name="note"
          maxLength={200}
          placeholder="mis. Makan siang"
          className={input}
        />
      </div>

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
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
