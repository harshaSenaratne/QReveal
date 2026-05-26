import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QReveal",
  description: "Privacy-first QR extraction from PNG and JPEG images.",
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
