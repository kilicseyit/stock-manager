import type { Metadata } from "next";
import { Geist } from "next/font/google";
import TRPCProvider from "@/components/providers/TRPCProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "StockManager — Depo Yönetim Sistemi",
  description: "Warehouse Management System — Depo operasyonlarını yöneten full-stack uygulama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

