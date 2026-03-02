import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bekin novi posao",
  description: "Job scraper for marketing and PR positions across Serbia, remote, and Europe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">
            Bekin novi posao
          </a>
          <div className="flex gap-4">
            <a href="/" className="text-gray-600 hover:text-gray-900">
              Jobs
            </a>
            <a href="/settings" className="text-gray-600 hover:text-gray-900">
              Settings
            </a>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
