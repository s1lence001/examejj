import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ExamDataProvider } from "@/hooks/useExamData";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <ExamDataProvider>
            {children}
          </ExamDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
