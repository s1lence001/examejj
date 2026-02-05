import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exame Faixa Azul - Jiu-Jitsu",
  description: "Sistema de acompanhamento para exame de graduação de faixa azul",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
