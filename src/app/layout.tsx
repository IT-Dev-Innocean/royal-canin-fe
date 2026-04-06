import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/footer/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Royal Canin Vet Symposium 2026",
  description:
    "Pendaftaran Royal Canin Vet Symposium 2026 — nutrisi kesehatan khusus untuk kucing & anjing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans`}
        suppressHydrationWarning
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
