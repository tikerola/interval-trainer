import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guitar Trainer",
  description: "Master the fretboard with interval exercises",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
