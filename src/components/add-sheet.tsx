"use client";

import { useRef } from "react";
import { PlusIcon } from "./icons";
import { TransactionForm } from "./transaction-form";

export function AddTransactionSheet({ defaultDate }: { defaultDate: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-md justify-end px-5">
        <button
          type="button"
          onClick={() => ref.current?.showModal()}
          aria-label="Tambah transaksi"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 active:scale-95"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      </div>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close();
        }}
        className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-slate-900/40 sm:mx-auto sm:max-w-md"
      >
        <div className="mx-auto max-w-md rounded-t-3xl bg-white px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Tambah transaksi</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-full px-3 py-1 text-sm text-slate-500 active:bg-slate-100"
            >
              Tutup
            </button>
          </div>
          <TransactionForm defaultDate={defaultDate} onSaved={() => ref.current?.close()} />
        </div>
      </dialog>
    </>
  );
}
