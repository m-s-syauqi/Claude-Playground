import { formatRupiah } from "@/lib/format";

/** A rupiah amount that blurs when "Sembunyikan angka" is on. */
export function Amount({
  value,
  signed = false,
  className = "",
}: {
  value: number;
  signed?: boolean;
  className?: string;
}) {
  const text = formatRupiah(Math.abs(value));
  const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  return (
    <span className={`amt tabular-nums ${className}`}>
      {sign}
      {text}
    </span>
  );
}
