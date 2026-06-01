import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pearl.AI",
  description: "Pearl.AI — AI portfolio intelligence for companies and investors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
