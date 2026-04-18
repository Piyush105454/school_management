import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/SessionProvider";

export const metadata: Metadata = {
  title: "SchoolFlow | Modern School Management",
  description: "Advanced school management platform built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
