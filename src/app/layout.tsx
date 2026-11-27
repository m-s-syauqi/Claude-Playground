import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Wallet",
  description: "Akun dan catatan keuangan pribadi",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "My Wallet",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  viewportFit: "cover",
};

// Apply "Sembunyikan angka" before first paint.
const hideScript = `try{if(localStorage.getItem("mw-hide")==="1")document.documentElement.classList.add("hide-amt")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: hideScript }} />
      </head>
      <body className="font-sans">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-50 shadow-xl shadow-slate-900/5">
          {children}
        </div>
      </body>
    </html>
  );
}
