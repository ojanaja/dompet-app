import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dompet - AI Finance Assistant",
  description: "Asisten perencana keuangan personal berbasis AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
