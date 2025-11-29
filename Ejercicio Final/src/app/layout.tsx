
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Ejercicio 13 - Chatbot + AI Tools",
  description: "Chatbot, Book Advisor y Todo Manager con AI SDK",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="app-body">
        <div className="app-shell">
          <header className="app-header">
            <h1>🤖 Ejercicio 13 – AI Chat Suite</h1>
            <nav className="app-nav">
              <a href="/">Inicio</a>
              <a href="/chat">Chatbot</a>
              <a href="/book-advisor">AI Book Advisor</a>
              <a href="/todo-manager">AI Todo Manager</a>
            </nav>
          </header>
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
