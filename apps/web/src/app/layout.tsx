import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Abacus — Claude Code Token Usage",
  description: "Local-first dashboard for Claude Code token usage analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-3">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
