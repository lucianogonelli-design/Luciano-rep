import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doctor CRM - Gestão de Consultório",
  description:
    "Sistema de CRM para gestão de consultórios médicos com agendamentos, prontuários, conversas e inteligência artificial.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
