import type { Metadata } from "next";
import TypekitLoader from "@/components/TypekitLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCG 買取表ジェネレーター",
  description: "Create TCG buylist images from Excel and CSV files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased">
        <TypekitLoader />
        {children}
      </body>
    </html>
  );
}
