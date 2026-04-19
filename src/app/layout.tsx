import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinity PS - Main PS Lebih Mudah, Booking Dari Aplikasi",
  description: "Landing page Infinity PS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
