import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MuslimEEN - Muslim Economic Empowerment Network",
  description: "MuslimEEN - Muslim Economic Empowerment Network. An invitation-only professional network for the Muslim community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#059669" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" type="image/png" href="/favicon.png?v=2" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
