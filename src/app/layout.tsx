import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Wallet",
  description: "Catatan keuangan pribadi",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
