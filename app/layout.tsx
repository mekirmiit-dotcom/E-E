import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "İş Takibi — Emin & Emre",
  description: "Kişisel iş ve görev takip uygulaması",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#6366f1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/3 w-80 h-80 bg-emerald-200/15 rounded-full blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  )
}
