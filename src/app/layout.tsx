import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Uma família só, com figuras tabulares para os relógios não tremerem.
const inter = Inter({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard Divulgação",
  description: "Painel de agendamento e divulgação de matérias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
      style={{ ["--font-plex-mono" as string]: "var(--font-plex-sans)" }}
    >
      <body className="bg-canvas text-tinta flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
