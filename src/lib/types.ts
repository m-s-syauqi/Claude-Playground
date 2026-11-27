export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number; // rupiah, bilangan bulat
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
};

export const CATEGORIES: Record<TxType, string[]> = {
  expense: [
    "Makan & Minum",
    "Transportasi",
    "Belanja",
    "Tagihan",
    "Hiburan",
    "Kesehatan",
    "Pendidikan",
    "Lainnya",
  ],
  income: ["Gaji", "Bonus", "Usaha", "Investasi", "Hadiah", "Lainnya"],
};
