import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowNest",
  description: "A personal knowledge base app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
