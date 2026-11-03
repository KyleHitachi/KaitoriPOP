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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&display=swap"
        />
      </head>
      <body className="antialiased">
        <TypekitLoader />
        {children}
      </body>
    </html>
  );
}
