import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./cat-theme.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🐱 Fuku Neko - Personal Finance Manager",
  description: "ผู้ช่วยการเงินส่วนตัวที่น่ารัก ผ่าน LINE Bot + Web Dashboard 💖",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* LINE LIFF SDK */}
        <script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          defer
        ></script>
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
