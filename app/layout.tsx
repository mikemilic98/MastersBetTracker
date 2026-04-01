import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masters Bet Tracker",
  description: "Friends pool leaderboard for The Masters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
