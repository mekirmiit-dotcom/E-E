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
      <body className="min-h-screen bg-background antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-[120px] -translate-y-1/3" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100/25 rounded-full blur-[120px] translate-y-1/3" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  )
}
