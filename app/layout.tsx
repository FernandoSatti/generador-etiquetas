// app/layout.tsx
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { GeistMono } from "geist/font/mono"
import { Roboto } from "next/font/google"
import "./globals.css"

// Clave: usá --font-sans (Tailwind v4 apunta a esta variable)
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Etiquetas Alfonsa",
  description: "crea etiqueta de precios",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${roboto.variable} ${GeistMono.variable}`}>
      {/* Roboto global + 500 por defecto */}
      <body className="font-sans font-bold antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
