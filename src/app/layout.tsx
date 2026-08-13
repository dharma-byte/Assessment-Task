import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
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
  title: "TeamGraph — Expert Finder & Code-Owner Router",
  description:
    "Find the right person for the job by walking your org's skill, project, and collaboration graph.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-(--color-page-plane) text-(--color-text-primary)">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-(--color-border) px-6 py-6 text-center text-xs text-(--color-text-muted)">
          TeamGraph — a take-home project backed by CognoDB.
        </footer>
      </body>
    </html>
  );
}
